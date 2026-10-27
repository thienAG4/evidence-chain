from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    evidence_id: str
    duplicate: bool = False
    status: str
    case_code: str
    title: str
    description: Optional[str] = ""
    submitted_by: str
    original_filename: str
    mime_type: str
    size_bytes: int
    sha256: str
    network: str = "sepolia"
    chain_id: int = 11155111
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    block_timestamp: Optional[datetime] = None
    explorer_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None

class EvidenceListResponse(BaseModel):
    items: List[EvidenceResponse]
    page: int
    page_size: int
    total: int

class ReceiptFileMeta(BaseModel):
    name: str
    size_bytes: int
    mime_type: str

class ReceiptHashMeta(BaseModel):
    algorithm: str = "SHA-256"
    value: str

class ReceiptBlockchainMeta(BaseModel):
    network: str
    chain_id: int
    tx_hash: str
    block_number: Optional[int]
    block_timestamp_utc: Optional[str]
    anchor_data: str
    issuer_address: str
    explorer_url: str

class ReceiptResponse(BaseModel):
    schema_version: str = "evidence-chain-receipt/1.0"
    evidence_id: str
    case_code: str
    title: str
    submitted_by: str
    file: ReceiptFileMeta
    hash: ReceiptHashMeta
    blockchain: ReceiptBlockchainMeta
    how_to_verify: str
    generated_at: str
