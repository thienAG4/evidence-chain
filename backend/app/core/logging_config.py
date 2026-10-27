import logging
import json
import os
import contextvars
from logging.handlers import RotatingFileHandler

request_id_ctx = contextvars.ContextVar("request_id", default="-")

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_ctx.get()
        return True

def setup_logging(log_dir: str = "./logs", level: str = "INFO") -> None:
    os.makedirs(log_dir, exist_ok=True)
    fmt = logging.Formatter(
        "%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"
    )
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers.clear()

    app_h = RotatingFileHandler(
        os.path.join(log_dir, "app.log"),
        maxBytes=5_000_000,
        backupCount=5,
        encoding="utf-8"
    )
    err_h = RotatingFileHandler(
        os.path.join(log_dir, "error.log"),
        maxBytes=5_000_000,
        backupCount=5,
        encoding="utf-8"
    )
    err_h.setLevel(logging.ERROR)
    con_h = logging.StreamHandler()

    for h in (app_h, err_h, con_h):
        h.setFormatter(fmt)
        h.addFilter(RequestIdFilter())
        root.addHandler(h)

def write_audit_jsonl(log_dir: str, record: dict) -> None:
    os.makedirs(log_dir, exist_ok=True)
    with open(os.path.join(log_dir, "audit.jsonl"), "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
