from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, BigInteger, Text, DateTime
from app.db.session import Base

class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    evidence_id = Column(String(32), unique=True, index=True, nullable=False)
    case_code = Column(String(50), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True, default="")
    submitted_by = Column(String(100), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    sha256 = Column(String(64), index=True, nullable=False)
    storage_path = Column(String(500), nullable=True)
    status = Column(String(16), nullable=False, default="HASHED")  # HASHED, PENDING, CONFIRMED, FAILED
    tx_hash = Column(String(66), nullable=True, index=True)
    block_number = Column(BigInteger, nullable=True)
    block_timestamp = Column(DateTime, nullable=True)
    chain_id = Column(Integer, default=11155111, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
