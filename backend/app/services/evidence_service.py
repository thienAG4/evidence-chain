import os
import random
import string
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.config import get_settings
from app.core.errors import AppError
from app.db.session import SessionLocal
from app.models.evidence import Evidence
from app.services.hash_service import hash_upload
from app.services.blockchain_service import get_blockchain_service
from app.services.audit_service import get_audit_service
from app.schemas.evidence import EvidenceResponse, EvidenceListResponse, ReceiptResponse

log = logging.getLogger("evidence")

def generate_evidence_id() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    rand_chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"EV-{today}-{rand_chars}"

class EvidenceService:
    def __init__(self):
        self.settings = get_settings()
        self.bc = get_blockchain_service()
        self.audit = get_audit_service()

    def _to_response(self, ev: Evidence, duplicate: bool = False) -> EvidenceResponse:
        explorer_url = None
        if ev.tx_hash:
            explorer_url = f"{self.settings.EXPLORER_BASE_URL}/tx/{ev.tx_hash}"
        return EvidenceResponse(
            evidence_id=ev.evidence_id,
            duplicate=duplicate,
            status=ev.status,
            case_code=ev.case_code,
            title=ev.title,
            description=ev.description or "",
            submitted_by=ev.submitted_by,
            original_filename=ev.original_filename,
            mime_type=ev.mime_type,
            size_bytes=ev.size_bytes,
            sha256=ev.sha256,
            network="sepolia",
            chain_id=ev.chain_id,
            tx_hash=ev.tx_hash,
            block_number=ev.block_number,
            block_timestamp=ev.block_timestamp,
            explorer_url=explorer_url,
            error_message=ev.error_message,
            created_at=ev.created_at,
            confirmed_at=ev.confirmed_at
        )

    async def create_evidence(
        self,
        file: UploadFile,
        case_code: str,
        title: str,
        submitted_by: str,
        description: Optional[str],
        db: Session,
        background_tasks: BackgroundTasks,
        ip: Optional[str] = None
    ) -> Tuple[EvidenceResponse, int]:
        # 1. Validate Form Fields
        case_code = (case_code or "").strip()
        title = (title or "").strip()
        submitted_by = (submitted_by or "").strip()
        description = (description or "").strip()

        if not (3 <= len(case_code) <= 50):
            raise AppError("VALIDATION_ERROR", "Mã vụ việc phải từ 3 đến 50 ký tự.", 422)
        if not (3 <= len(title) <= 200):
            raise AppError("VALIDATION_ERROR", "Tiêu đề phải từ 3 đến 200 ký tự.", 422)
        if not (2 <= len(submitted_by) <= 100):
            raise AppError("VALIDATION_ERROR", "Người nộp phải từ 2 đến 100 ký tự.", 422)
        if len(description) > 1000:
            raise AppError("VALIDATION_ERROR", "Mô tả không được vượt quá 1000 ký tự.", 422)

        # 2. Validate Extension
        clean_filename = os.path.basename(file.filename or "unknown.dat")
        ext = clean_filename.rsplit(".", 1)[-1].lower() if "." in clean_filename else ""
        allowed_exts = [e.strip().lower() for e in self.settings.ALLOWED_EXTENSIONS.split(",")]
        if not ext or ext not in allowed_exts:
            raise AppError("UNSUPPORTED_TYPE", f"Loại tệp .{ext} không được hỗ trợ.", 415)

        evidence_id = generate_evidence_id()
        self.audit.log("UPLOAD_RECEIVED", evidence_id=evidence_id, details={"filename": clean_filename, "case_code": case_code}, ip=ip)

        # 3. Stream Hash
        max_bytes = self.settings.MAX_UPLOAD_MB * 1024 * 1024
        upload_dir = self.settings.STORAGE_DIR
        hash_res = await hash_upload(file, max_bytes=max_bytes, save_dir=upload_dir)
        sha256 = hash_res.sha256

        self.audit.log(
            "HASH_COMPUTED",
            evidence_id=evidence_id,
            details={
                "sha256": sha256,
                "size_bytes": hash_res.size_bytes,
                "elapsed_ms": hash_res.elapsed_ms,
                "filename": clean_filename
            },
            ip=ip
        )

        # 4. Check Duplicate CONFIRMED or PENDING
        existing = db.query(Evidence).filter(
            Evidence.sha256 == sha256,
            Evidence.status.in_(["CONFIRMED", "PENDING"])
        ).first()

        if existing:
            if hash_res.tmp_path and os.path.exists(hash_res.tmp_path):
                try:
                    os.remove(hash_res.tmp_path)
                except OSError:
                    pass
            self.audit.log(
                "DUPLICATE_DETECTED",
                evidence_id=existing.evidence_id,
                details={"existing_status": existing.status, "sha256": sha256},
                ip=ip
            )
            return self._to_response(existing, duplicate=True), 200

        # 5. Move file to permanent storage: storage/uploads/<sha256>
        final_storage_path = os.path.join(upload_dir, sha256)
        if hash_res.tmp_path and os.path.exists(hash_res.tmp_path):
            if os.path.exists(final_storage_path):
                os.remove(hash_res.tmp_path)
            else:
                os.replace(hash_res.tmp_path, final_storage_path)

        # 6. Create HASHED record
        ev = Evidence(
            evidence_id=evidence_id,
            case_code=case_code,
            title=title,
            description=description,
            submitted_by=submitted_by,
            original_filename=clean_filename,
            mime_type=file.content_type or "application/octet-stream",
            size_bytes=hash_res.size_bytes,
            sha256=sha256,
            storage_path=final_storage_path,
            status="HASHED",
            chain_id=self.settings.CHAIN_ID,
            created_at=datetime.now(timezone.utc)
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)

        # 7. Anchor to Sepolia
        try:
            anchor_res = self.bc.anchor_hash(sha256)
            ev.tx_hash = anchor_res["tx_hash"]
            ev.status = "PENDING"
            db.commit()
            db.refresh(ev)
            self.audit.log(
                "TX_SENT",
                evidence_id=evidence_id,
                details=anchor_res,
                ip=ip
            )
            # Schedule background confirmation
            background_tasks.add_task(self.confirm_in_background, evidence_id, ev.tx_hash)
        except Exception as e:
            ev.status = "FAILED"
            ev.error_message = str(e)
            db.commit()
            db.refresh(ev)
            self.audit.log(
                "TX_FAILED",
                evidence_id=evidence_id,
                level="ERROR",
                details={"error": str(e)},
                ip=ip
            )

        return self._to_response(ev, duplicate=False), 201

    def confirm_in_background(self, evidence_id: str, tx_hash: str):
        """Background worker with its own DB session to wait for blockchain receipt."""
        db = SessionLocal()
        try:
            ev = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
            if not ev or ev.status == "CONFIRMED":
                return

            res = self.bc.wait_confirmation(tx_hash)
            if res.get("ok"):
                ev.status = "CONFIRMED"
                ev.block_number = res.get("block_number")
                ts = res.get("block_timestamp")
                if ts:
                    ev.block_timestamp = datetime.fromtimestamp(ts, tz=timezone.utc)
                ev.confirmed_at = datetime.now(timezone.utc)
                ev.error_message = None
                db.commit()
                self.audit.log(
                    "TX_CONFIRMED",
                    evidence_id=evidence_id,
                    details={
                        "block_number": ev.block_number,
                        "block_timestamp": ev.block_timestamp.isoformat() if ev.block_timestamp else None
                    }
                )
            else:
                ev.status = "FAILED"
                ev.error_message = res.get("error", "Giao dịch không thành công.")
                db.commit()
                self.audit.log(
                    "TX_FAILED",
                    evidence_id=evidence_id,
                    level="ERROR",
                    details={"error": ev.error_message}
                )
        except Exception as e:
            log.exception("Background confirmation failed for %s", evidence_id)
        finally:
            db.close()

    def resume_pending(self):
        """Resume waiting for any PENDING records upon system startup."""
        db = SessionLocal()
        try:
            pending_items = db.query(Evidence).filter(
                Evidence.status == "PENDING",
                Evidence.tx_hash.isnot(None)
            ).all()
            log.info("Found %d pending evidence items to resume", len(pending_items))
            for item in pending_items:
                self.confirm_in_background(item.evidence_id, item.tx_hash)
        except Exception as e:
            log.warning("Could not resume pending evidence items: %s", e)
        finally:
            db.close()

    def get_evidence(self, evidence_id: str, db: Session) -> EvidenceResponse:
        ev = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
        if not ev:
            raise AppError("NOT_FOUND", f"Không tìm thấy bằng chứng {evidence_id}.", 404)
        return self._to_response(ev)

    def retry_evidence(
        self,
        evidence_id: str,
        db: Session,
        background_tasks: BackgroundTasks,
        ip: Optional[str] = None
    ) -> EvidenceResponse:
        ev = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
        if not ev:
            raise AppError("NOT_FOUND", f"Không tìm thấy bằng chứng {evidence_id}.", 404)
        if ev.status != "FAILED":
            raise AppError("INVALID_STATE", f"Chỉ có thể thử lại khi trạng thái là FAILED (hiện tại: {ev.status}).", 409)

        self.audit.log("RETRY_REQUESTED", evidence_id=evidence_id, ip=ip)
        try:
            anchor_res = self.bc.anchor_hash(ev.sha256)
            ev.tx_hash = anchor_res["tx_hash"]
            ev.status = "PENDING"
            ev.error_message = None
            db.commit()
            db.refresh(ev)
            self.audit.log("TX_SENT", evidence_id=evidence_id, details=anchor_res, ip=ip)
            background_tasks.add_task(self.confirm_in_background, evidence_id, ev.tx_hash)
        except Exception as e:
            ev.status = "FAILED"
            ev.error_message = str(e)
            db.commit()
            db.refresh(ev)
            self.audit.log("TX_FAILED", evidence_id=evidence_id, level="ERROR", details={"error": str(e)}, ip=ip)
            raise

        return self._to_response(ev)

    def list_evidences(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 10,
        case_code: Optional[str] = None,
        status: Optional[str] = None,
        q: Optional[str] = None
    ) -> EvidenceListResponse:
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        query = db.query(Evidence)

        if case_code:
            query = query.filter(Evidence.case_code.ilike(f"%{case_code}%"))
        if status:
            query = query.filter(Evidence.status == status.upper())
        if q:
            term = f"%{q.strip()}%"
            query = query.filter(
                or_(
                    Evidence.evidence_id.ilike(term),
                    Evidence.sha256.ilike(term),
                    Evidence.title.ilike(term),
                    Evidence.original_filename.ilike(term)
                )
            )

        total = query.count()
        items = query.order_by(desc(Evidence.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return EvidenceListResponse(
            items=[self._to_response(item) for item in items],
            page=page,
            page_size=page_size,
            total=total
        )

    def get_receipt_data(self, evidence_id: str, db: Session) -> dict:
        ev = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
        if not ev:
            raise AppError("NOT_FOUND", f"Không tìm thấy bằng chứng {evidence_id}.", 404)
        if ev.status != "CONFIRMED":
            raise AppError("INVALID_STATE", "Biên nhận chỉ khả dụng khi bằng chứng đã CONFIRMED.", 409)

        self.audit.log("RECEIPT_DOWNLOADED", evidence_id=evidence_id)
        
        block_ts_str = ev.block_timestamp.isoformat() + "Z" if ev.block_timestamp else datetime.now(timezone.utc).isoformat() + "Z"
        
        return {
            "schema": "evidence-chain-receipt/1.0",
            "evidence_id": ev.evidence_id,
            "case_code": ev.case_code,
            "title": ev.title,
            "submitted_by": ev.submitted_by,
            "file": {
                "name": ev.original_filename,
                "size_bytes": ev.size_bytes,
                "mime_type": ev.mime_type
            },
            "hash": {
                "algorithm": "SHA-256",
                "value": ev.sha256
            },
            "blockchain": {
                "network": "Ethereum Sepolia (testnet)",
                "chain_id": ev.chain_id,
                "tx_hash": ev.tx_hash,
                "block_number": ev.block_number,
                "block_timestamp_utc": block_ts_str,
                "anchor_data": f"EVD1:{ev.sha256}",
                "issuer_address": self.bc.address,
                "explorer_url": f"{self.settings.EXPLORER_BASE_URL}/tx/{ev.tx_hash}"
            },
            "how_to_verify": "Tải lại tệp ở tab Xác minh hoặc tự băm SHA-256 và so với anchor_data trên Etherscan.",
            "generated_at": datetime.now(timezone.utc).isoformat() + "Z"
        }

_evidence_service = None

def get_evidence_service() -> EvidenceService:
    global _evidence_service
    if _evidence_service is None:
        _evidence_service = EvidenceService()
    return _evidence_service
