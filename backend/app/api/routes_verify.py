from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.verify_service import get_verify_service
from app.schemas.verify import VerifyResponse

router = APIRouter(prefix="/verify", tags=["Verification"])

@router.post("", response_model=VerifyResponse)
async def verify_evidence(
    request: Request,
    file: UploadFile = File(...),
    evidence_id: Optional[str] = Form(None),
    tx_hash: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    service = get_verify_service()
    client_ip = request.client.host if request.client else None
    return await service.verify(
        file=file,
        evidence_id=evidence_id,
        tx_hash=tx_hash,
        db=db,
        ip=client_ip
    )
