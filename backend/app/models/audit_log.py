from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ts = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    level = Column(String(10), default="INFO", nullable=False)  # INFO, WARNING, ERROR
    event = Column(String(40), index=True, nullable=False)
    evidence_id = Column(String(32), index=True, nullable=True)
    request_id = Column(String(40), index=True, nullable=False)
    ip = Column(String(45), nullable=True)
    details = Column(Text, nullable=True)  # JSON formatted string
