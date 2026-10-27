import json
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.evidence_service import get_evidence_service
from app.schemas.evidence import EvidenceResponse, EvidenceListResponse

router = APIRouter(prefix="/evidence", tags=["Evidence"])

@router.post("", response_model=EvidenceResponse)
async def upload_and_anchor_evidence(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    case_code: str = Form(...),
    title: str = Form(...),
    submitted_by: str = Form(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    service = get_evidence_service()
    client_ip = request.client.host if request.client else None
    resp, status_code = await service.create_evidence(
        file=file,
        case_code=case_code,
        title=title,
        submitted_by=submitted_by,
        description=description,
        db=db,
        background_tasks=background_tasks,
        ip=client_ip
    )
    return JSONResponse(content=resp.model_dump(mode="json"), status_code=status_code)

@router.get("", response_model=EvidenceListResponse)
def list_evidences(
    page: int = 1,
    page_size: int = 10,
    case_code: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = get_evidence_service()
    return service.list_evidences(
        db=db,
        page=page,
        page_size=page_size,
        case_code=case_code,
        status=status,
        q=q
    )

@router.get("/{evidence_id}", response_model=EvidenceResponse)
def get_single_evidence(evidence_id: str, db: Session = Depends(get_db)):
    service = get_evidence_service()
    return service.get_evidence(evidence_id, db=db)

@router.get("/{evidence_id}/receipt")
def download_receipt(evidence_id: str, db: Session = Depends(get_db)):
    service = get_evidence_service()
    data = service.get_receipt_data(evidence_id, db=db)
    content = json.dumps(data, indent=2, ensure_ascii=False)
    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="receipt_{evidence_id}.json"'
        }
    )

@router.post("/{evidence_id}/retry", response_model=EvidenceResponse)
def retry_anchoring(
    evidence_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    service = get_evidence_service()
    client_ip = request.client.host if request.client else None
    return service.retry_evidence(
        evidence_id=evidence_id,
        db=db,
        background_tasks=background_tasks,
        ip=client_ip
    )
