import json
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogListResponse, AuditLogItem, ClientLogRequest
from app.services.audit_service import get_audit_service

router = APIRouter(tags=["Logs"])

@router.get("/audit-logs", response_model=AuditLogListResponse)
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    event: Optional[str] = None,
    evidence_id: Optional[str] = None,
    level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if event:
        query = query.filter(AuditLog.event == event)
    if evidence_id:
        query = query.filter(AuditLog.evidence_id == evidence_id)
    if level:
        query = query.filter(AuditLog.level == level.upper())

    items = query.order_by(desc(AuditLog.ts)).limit(limit).all()

    result_items = []
    for item in items:
        details_obj = None
        if item.details:
            try:
                details_obj = json.loads(item.details)
            except Exception:
                details_obj = item.details
        result_items.append(
            AuditLogItem(
                id=item.id,
                ts=item.ts,
                level=item.level,
                event=item.event,
                evidence_id=item.evidence_id,
                request_id=item.request_id,
                ip=item.ip,
                details=details_obj
            )
        )
    return AuditLogListResponse(items=result_items)

@router.post("/logs/client", status_code=status.HTTP_204_NO_CONTENT)
def post_client_log(body: ClientLogRequest):
    audit = get_audit_service()
    audit.log(
        event=body.event or "CLIENT_ERROR",
        level=body.level.upper() if body.level else "ERROR",
        details={"message": body.message, "client_details": body.details}
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
