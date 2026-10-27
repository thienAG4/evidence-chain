import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging_config import request_id_ctx

log = logging.getLogger("http")

class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request_id_ctx.set(rid)
        request.state.request_id = rid

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            log.exception("Unhandled error %s %s", request.method, request.url.path)
            raise
        
        ms = (time.perf_counter() - start) * 1000
        response.headers["X-Request-ID"] = rid
        log.info(
            "%s %s -> %s (%.1f ms)",
            request.method,
            request.url.path,
            response.status_code,
            ms
        )
        return response
