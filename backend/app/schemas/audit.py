from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel

class AuditLogItem(BaseModel):
    id: int
    ts: datetime
    level: str
    event: str
    evidence_id: Optional[str] = None
    request_id: str
    ip: Optional[str] = None
    details: Optional[Any] = None

class AuditLogListResponse(BaseModel):
    items: List[AuditLogItem]

class ClientLogRequest(BaseModel):
    level: str = "error"
    event: str = "CLIENT_ERROR"
    message: str
    details: Optional[Any] = None
