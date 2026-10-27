import json
import logging
from datetime import datetime, timezone
from typing import Optional, Any
from app.config import get_settings
from app.core.logging_config import request_id_ctx, write_audit_jsonl
from app.db.session import SessionLocal
from app.models.audit_log import AuditLog

log = logging.getLogger("audit")

class AuditService:
    def __init__(self):
        self.settings = get_settings()

    def log(
        self,
        event: str,
        evidence_id: Optional[str] = None,
        level: str = "INFO",
        details: Optional[Any] = None,
        ip: Optional[str] = None
    ) -> None:
        rid = request_id_ctx.get()
        now = datetime.now(timezone.utc)
        record = {
            "ts": now.isoformat(),
            "level": level,
            "event": event,
            "evidence_id": evidence_id,
            "request_id": rid,
            "ip": ip,
            "details": details or {}
        }
        
        # 1. Write to audit.jsonl file
        try:
            write_audit_jsonl(self.settings.LOG_DIR, record)
        except Exception:
            log.exception("Failed to write to audit.jsonl")

        # 2. Write to DB table audit_logs
        try:
            db = SessionLocal()
            try:
                db_item = AuditLog(
                    ts=now,
                    level=level,
                    event=event,
                    evidence_id=evidence_id,
                    request_id=rid,
                    ip=ip,
                    details=json.dumps(details, ensure_ascii=False) if details else None
                )
                db.add(db_item)
                db.commit()
            finally:
                db.close()
        except Exception:
            log.exception("Failed to persist audit log to DB")

_audit_service = None

def get_audit_service() -> AuditService:
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditService()
    return _audit_service
