import re
from datetime import datetime, timezone
from typing import Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.errors import AppError
from app.models.evidence import Evidence
from app.services.hash_service import hash_upload
from app.services.blockchain_service import get_blockchain_service
from app.services.audit_service import get_audit_service
from app.schemas.verify import VerifyResponse, VerifyEvidenceInfo

class VerifyService:
    def __init__(self):
        self.settings = get_settings()
        self.bc = get_blockchain_service()
        self.audit = get_audit_service()

    async def verify(
        self,
        file: UploadFile,
        evidence_id: Optional[str],
        tx_hash: Optional[str],
        db: Session,
        ip: Optional[str] = None
    ) -> VerifyResponse:
        evidence_id = evidence_id.strip() if evidence_id else None
        tx_hash = tx_hash.strip().lower() if tx_hash else None

        if tx_hash:
            if not re.match(r"^0x[a-f0-9]{64}$", tx_hash):
                raise AppError("INVALID_TX_HASH", "Mã giao dịch (tx_hash) không đúng định dạng 0x + 64 hex.", 422)

        # 1. Stream hash WITHOUT storing file
        max_bytes = self.settings.MAX_UPLOAD_MB * 1024 * 1024
        hash_res = await hash_upload(file, max_bytes=max_bytes, save_dir=None)
        computed_sha256 = hash_res.sha256

        self.audit.log(
            "VERIFY_REQUESTED",
            evidence_id=evidence_id,
            details={"computed_sha256": computed_sha256, "tx_hash": tx_hash},
            ip=ip
        )

        # 2. Locate target transaction hash
        ev = None
        if evidence_id:
            ev = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
            if not ev:
                # If specified evidence_id doesn't exist
                return self._result(
                    status="NOT_FOUND",
                    message=f"Không tìm thấy bằng chứng có mã {evidence_id}.",
                    computed_sha256=computed_sha256,
                    ip=ip
                )

        target_tx = tx_hash or (ev.tx_hash if ev else None)

        if not target_tx:
            # Tra cứu DB theo sha256 đã xác nhận
            ev = db.query(Evidence).filter(
                Evidence.sha256 == computed_sha256,
                Evidence.status.in_(["CONFIRMED", "PENDING"])
            ).first()
            if not ev:
                return self._result(
                    status="NOT_FOUND",
                    message="Không tìm thấy mã băm của tệp này trong hệ thống.",
                    computed_sha256=computed_sha256,
                    ip=ip
                )
            target_tx = ev.tx_hash

        # 3. Always read transaction directly from blockchain (Zero-trust database)
        anchor = self.bc.read_anchor(target_tx)
        if anchor is None:
            return self._result(
                status="NOT_FOUND",
                message="Không tìm thấy giao dịch neo bằng chứng trên blockchain.",
                computed_sha256=computed_sha256,
                ip=ip
            )

        onchain_sha256 = anchor.get("sha256")
        issuer_address = anchor.get("from")
        is_system_wallet = anchor.get("issuer_is_system_wallet", False)
        is_confirmed = anchor.get("confirmed", False)
        valid_format = anchor.get("valid_format", False)

        block_num = anchor.get("block_number") or (ev.block_number if ev else None)
        block_ts_raw = anchor.get("block_timestamp")
        block_ts = datetime.fromtimestamp(block_ts_raw, tz=timezone.utc) if block_ts_raw else (ev.block_timestamp if ev else None)

        evidence_info = VerifyEvidenceInfo(
            evidence_id=ev.evidence_id if ev else None,
            case_code=ev.case_code if ev else None,
            tx_hash=target_tx,
            block_number=block_num,
            block_timestamp=block_ts,
            issuer_address=issuer_address,
            issuer_is_system_wallet=is_system_wallet,
            explorer_url=f"{self.settings.EXPLORER_BASE_URL}/tx/{target_tx}"
        )

        if not valid_format or not is_system_wallet:
            return self._result(
                status="INVALID_ANCHOR",
                message="Giao dịch không hợp lệ: không do ví hệ thống phát hành hoặc sai định dạng dữ liệu EVD1.",
                computed_sha256=computed_sha256,
                onchain_sha256=onchain_sha256,
                match=False,
                evidence=evidence_info,
                ip=ip
            )

        if not is_confirmed:
            return self._result(
                status="PENDING",
                message="Giao dịch neo bằng chứng đang chờ xác nhận trên blockchain.",
                computed_sha256=computed_sha256,
                onchain_sha256=onchain_sha256,
                match=False,
                evidence=evidence_info,
                ip=ip
            )

        match = (computed_sha256 == onchain_sha256)
        status = "VERIFIED" if match else "MISMATCH"
        message = (
            "Khớp – tệp nguyên vẹn so với thời điểm ký gửi."
            if match else
            "Không khớp – mã băm của tệp khác với mã đã lưu trên blockchain."
        )

        return self._result(
            status=status,
            message=message,
            computed_sha256=computed_sha256,
            onchain_sha256=onchain_sha256,
            match=match,
            evidence=evidence_info,
            ip=ip
        )

    def _result(
        self,
        status: str,
        message: str,
        computed_sha256: str,
        onchain_sha256: Optional[str] = None,
        match: bool = False,
        evidence: Optional[VerifyEvidenceInfo] = None,
        ip: Optional[str] = None
    ) -> VerifyResponse:
        self.audit.log(
            "VERIFY_RESULT",
            evidence_id=evidence.evidence_id if evidence else None,
            details={
                "status": status,
                "computed_sha256": computed_sha256,
                "onchain_sha256": onchain_sha256,
                "match": match
            },
            ip=ip
        )
        return VerifyResponse(
            status=status,
            message=message,
            computed_sha256=computed_sha256,
            onchain_sha256=onchain_sha256,
            match=match,
            evidence=evidence,
            verified_at=datetime.now(timezone.utc)
        )

_verify_service = None

def get_verify_service() -> VerifyService:
    global _verify_service
    if _verify_service is None:
        _verify_service = VerifyService()
    return _verify_service
