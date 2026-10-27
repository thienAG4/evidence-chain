from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class VerifyEvidenceInfo(BaseModel):
    evidence_id: Optional[str] = None
    case_code: Optional[str] = None
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    block_timestamp: Optional[datetime] = None
    issuer_address: Optional[str] = None
    issuer_is_system_wallet: bool = False
    explorer_url: Optional[str] = None

class VerifyResponse(BaseModel):
    status: str  # VERIFIED | MISMATCH | NOT_FOUND | PENDING | INVALID_ANCHOR
    message: str
    computed_sha256: str
    onchain_sha256: Optional[str] = None
    match: bool = False
    evidence: Optional[VerifyEvidenceInfo] = None
    verified_at: datetime
