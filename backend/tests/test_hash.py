import io
import os
import asyncio
import hashlib
import pytest
from fastapi import UploadFile
from app.services.hash_service import hash_upload
from app.core.errors import AppError

def test_hash_abc_vector():
    # Known SHA-256 test vector for "abc"
    expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    file = UploadFile(filename="abc.txt", file=io.BytesIO(b"abc"))
    res = asyncio.run(hash_upload(file, max_bytes=10 * 1024 * 1024))
    assert res.sha256 == expected
    assert res.size_bytes == 3

def test_hash_empty_file_raises():
    file = UploadFile(filename="empty.txt", file=io.BytesIO(b""))
    with pytest.raises(AppError) as exc_info:
        asyncio.run(hash_upload(file, max_bytes=10 * 1024 * 1024))
    assert exc_info.value.code == "EMPTY_FILE"
    assert exc_info.value.status_code == 400

def test_hash_too_large_raises():
    data = b"X" * 1024
    file = UploadFile(filename="toolarge.txt", file=io.BytesIO(data))
    with pytest.raises(AppError) as exc_info:
        asyncio.run(hash_upload(file, max_bytes=512))
    assert exc_info.value.code == "FILE_TOO_LARGE"
    assert exc_info.value.status_code == 413

def test_hash_comparison_against_hashlib():
    data = os.urandom(5 * 1024 * 1024)  # 5 MB
    expected = hashlib.sha256(data).hexdigest()
    file = UploadFile(filename="random.bin", file=io.BytesIO(data))
    res = asyncio.run(hash_upload(file, max_bytes=10 * 1024 * 1024))
    assert res.sha256 == expected
    assert res.size_bytes == len(data)
