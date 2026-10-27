import hashlib
import os
import time
from dataclasses import dataclass
from typing import Optional
from fastapi import UploadFile
from app.core.errors import AppError

CHUNK = 1024 * 1024  # 1 MiB

@dataclass
class HashResult:
    sha256: str
    size_bytes: int
    tmp_path: Optional[str]
    elapsed_ms: int

async def hash_upload(
    file: UploadFile,
    max_bytes: int,
    save_dir: Optional[str] = None
) -> HashResult:
    """
    Stream hashing with SHA-256 in 1 MiB chunks.
    If save_dir is specified, streams simultaneously to a temporary .part file.
    """
    h = hashlib.sha256()
    size = 0
    t0 = time.perf_counter()
    tmp_path = None
    out = None

    if save_dir:
        os.makedirs(save_dir, exist_ok=True)
        tmp_path = os.path.join(save_dir, f"{os.urandom(8).hex()}.part")
        out = open(tmp_path, "wb")

    try:
        while True:
            chunk = await file.read(CHUNK)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                max_mb = max_bytes // (1024 * 1024)
                raise AppError(
                    "FILE_TOO_LARGE",
                    f"Tệp vượt quá giới hạn {max_mb} MB.",
                    413
                )
            h.update(chunk)
            if out:
                out.write(chunk)
    except Exception:
        if out:
            out.close()
            out = None
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        raise
    finally:
        if out:
            out.close()

    if size == 0:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        raise AppError("EMPTY_FILE", "Tệp rỗng (0 byte).", 400)

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    return HashResult(
        sha256=h.hexdigest().lower(),
        size_bytes=size,
        tmp_path=tmp_path,
        elapsed_ms=elapsed_ms
    )
