import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.core.logging_config import setup_logging, request_id_ctx
from app.core.middleware import RequestContextMiddleware
from app.core.errors import AppError
from app.db.session import init_db
from app.api import routes_health, routes_evidence, routes_verify, routes_logs
from app.services.evidence_service import get_evidence_service
from app.services.audit_service import get_audit_service

s = get_settings()
setup_logging(s.LOG_DIR, s.LOG_LEVEL)
log = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    log.info("Database initialized successfully.")
    audit = get_audit_service()
    audit.log("APP_STARTED", details={"version": "1.0.0"})
    
    # Resume any pending transactions
    evidence_svc = get_evidence_service()
    evidence_svc.resume_pending()
    yield

app = FastAPI(
    title="Evidence Chain API",
    description="Hệ thống lưu vết và đối chiếu bằng chứng số trên Ethereum Sepolia",
    version="1.0.0",
    lifespan=lifespan
)

# Global custom exception handler for AppError
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    rid = request_id_ctx.get()
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "request_id": rid
            }
        },
        headers={"X-Request-ID": rid}
    )

# Standard validation error handler
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    rid = request_id_ctx.get()
    errors_summary = "; ".join([f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()])
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"Dữ liệu gửi lên không hợp lệ: {errors_summary}",
                "request_id": rid
            }
        },
        headers={"X-Request-ID": rid}
    )

# Starlette HTTP error handler
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    rid = request_id_ctx.get()
    code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": exc.detail or "Lỗi HTTP",
                "request_id": rid
            }
        },
        headers={"X-Request-ID": rid}
    )

# Generic fallback error handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    rid = request_id_ctx.get()
    log.exception("Internal unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Đã xảy ra lỗi nội bộ hệ thống. Vui lòng liên hệ quản trị viên.",
                "request_id": rid
            }
        },
        headers={"X-Request-ID": rid}
    )

app.add_middleware(RequestContextMiddleware)

cors_origins = [origin.strip() for origin in s.CORS_ORIGINS.split(",") if origin.strip()]
is_wildcard = "*" in cors_origins or not cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app" if not is_wildcard else None,
    allow_credentials=False if is_wildcard else True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

# Include all API routers with prefix /api
for r in (routes_health, routes_evidence, routes_verify, routes_logs):
    app.include_router(r.router, prefix="/api")
