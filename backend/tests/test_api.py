import io
import time
from fastapi.testclient import TestClient

def test_health_endpoint(client: TestClient):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["ok", "degraded"]
    assert data["chain_id"] == 11155111
    assert "wallet_address" in data

def test_full_deposit_and_verify_cycle(client: TestClient):
    # 1. Deposit evidence
    test_content = b"Legal Evidence Document Content 2026"
    resp = client.post(
        "/api/evidence",
        data={
            "case_code": "TA-2026-0001",
            "title": "Bien ban giam dinh so 1",
            "submitted_by": "Giam Dinh Vien A",
            "description": "Chi tiet loi chuc"
        },
        files={"file": ("giam_dinh_1.pdf", io.BytesIO(test_content), "application/pdf")}
    )
    assert resp.status_code == 201
    evidence = resp.json()
    assert evidence["status"] in ["PENDING", "CONFIRMED"]
    evidence_id = evidence["evidence_id"]
    sha256 = evidence["sha256"]
    tx_hash = evidence["tx_hash"]
    assert tx_hash.startswith("0x")

    # Give background worker time to confirm
    time.sleep(1.2)

    # 2. Check single evidence status
    resp_get = client.get(f"/api/evidence/{evidence_id}")
    assert resp_get.status_code == 200
    assert resp_get.json()["status"] == "CONFIRMED"

    # 3. Test duplicate deposit
    resp_dup = client.post(
        "/api/evidence",
        data={
            "case_code": "TA-2026-0001",
            "title": "Bien ban giam dinh so 1 ban sao",
            "submitted_by": "Luat Su B",
            "description": ""
        },
        files={"file": ("giam_dinh_1_copy.pdf", io.BytesIO(test_content), "application/pdf")}
    )
    assert resp_dup.status_code == 200
    assert resp_dup.json()["duplicate"] is True
    assert resp_dup.json()["evidence_id"] == evidence_id

    # 4. Verify with exact same file -> VERIFIED
    resp_v1 = client.post(
        "/api/verify",
        files={"file": ("check_giam_dinh.pdf", io.BytesIO(test_content), "application/pdf")}
    )
    assert resp_v1.status_code == 200
    v1_data = resp_v1.json()
    assert v1_data["status"] == "VERIFIED"
    assert v1_data["match"] is True
    assert v1_data["computed_sha256"] == sha256
    assert v1_data["onchain_sha256"] == sha256

    # 5. Verify with modified file (1 byte flipped) -> NOT_FOUND or MISMATCH
    modified_content = bytearray(test_content)
    modified_content[0] ^= 0xFF
    resp_v2 = client.post(
        "/api/verify",
        files={"file": ("tampered.pdf", io.BytesIO(bytes(modified_content)), "application/pdf")}
    )
    assert resp_v2.status_code == 200
    assert resp_v2.json()["status"] == "NOT_FOUND"

    # 6. Verify with modified file AND evidence_id provided -> MISMATCH
    resp_v3 = client.post(
        "/api/verify",
        data={"evidence_id": evidence_id},
        files={"file": ("tampered.pdf", io.BytesIO(bytes(modified_content)), "application/pdf")}
    )
    assert resp_v3.status_code == 200
    assert resp_v3.json()["status"] == "MISMATCH"
    assert resp_v3.json()["match"] is False

    # 7. Download Receipt
    resp_receipt = client.get(f"/api/evidence/{evidence_id}/receipt")
    assert resp_receipt.status_code == 200
    receipt = resp_receipt.json()
    assert receipt["evidence_id"] == evidence_id
    assert receipt["hash"]["value"] == sha256
    assert receipt["blockchain"]["tx_hash"] == tx_hash

def test_unsupported_file_extension(client: TestClient):
    resp = client.post(
        "/api/evidence",
        data={
            "case_code": "TA-2026-9999",
            "title": "Virus Executable",
            "submitted_by": "Hacker",
            "description": ""
        },
        files={"file": ("malicious.exe", io.BytesIO(b"MZ..."), "application/octet-stream")}
    )
    assert resp.status_code == 415
    assert resp.json()["error"]["code"] == "UNSUPPORTED_TYPE"

def test_audit_logs_retrieval(client: TestClient):
    resp = client.get("/api/audit-logs?limit=50")
    assert resp.status_code == 200
    logs = resp.json()["items"]
    assert len(logs) > 0
    events = [l["event"] for l in logs]
    assert any("UPLOAD_RECEIVED" in e or "HASH_COMPUTED" in e or "APP_STARTED" in e for e in events)
