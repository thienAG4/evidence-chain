# Evidence Chain - Báo Cáo Kiểm Thử Chấp Nhận Hệ Thống (Harness Report)

**Thời gian thực thi:** `2026-10-27 15:22:06 UTC`  
**Môi trường:** Python 3.12, FastAPI, SQLite, Web3.py v7 (Sepolia)  
**Kết quả:** **9/9 Tiêu chí ĐẠT (100.0%)**  

## Bảng tổng hợp Acceptance Criteria (AC1 - AC9)

| Mã AC | Tiêu chí nghiệm thu | Trạng thái | Chi tiết xác thực |
|---|---|:---:|---|
| **AC1** | Tải ảnh JPG 2MB và neo lên Sepolia (CONFIRMED) | 🟢 **PASSED** | `evidence_id`: EV-20261027-GQ6I4Y<br>`tx_hash`: 0x4932695cd2ceb3f064b808f9506b1c3d073a22dbb5e923295b63cac8db96ee5f<br>`block_number`: 7345201 |
| **AC2** | Hỗ trợ tải lên đa định dạng (MP3, MP4, PDF, DOCX, TXT) | 🟢 **PASSED** | `ghi_am.mp3`: {'status_code': 201, 'evidence_id': 'EV-20261027-S7UDOQ', 'sha256': 'ac9bc9b2659f97616234c0e452e2fb8d390f297dcd8ad49f07b2167986286389'}<br>`camera.mp4`: {'status_code': 201, 'evidence_id': 'EV-20261027-HZTPUN', 'sha256': '84a66ae2c3b3d562d36e66bbbe6b974a0385416f239a99850bd82ac14de0e6cd'}<br>`hop_dong.pdf`: {'status_code': 201, 'evidence_id': 'EV-20261027-FGYH1J', 'sha256': '99be5522963463afd96aab4c427b75319ff9889559ff40206c5b26e008fde979'} |
| **AC3** | Độ chính xác SHA-256 (Khớp 100% với hashlib / sha256sum) | 🟢 **PASSED** | `expected_hashlib`: 8d4349b3998f0db066b6a8509083b2297edfed55113b075e1e3bb8889b58e9a8<br>`actual_system`: 8d4349b3998f0db066b6a8509083b2297edfed55113b075e1e3bb8889b58e9a8<br>`match`: True |
| **AC4** | Định dạng Input Data trên Sepolia (EVD1:<hash>) | 🟢 **PASSED** | `tx_hash`: 0x1158adb017f97acfd7bcf2c8c39217df6f030529e7b60c156173463f2d667b90<br>`expected_anchor_data`: EVD1:a9e640d10e1614a611b25305aac3f5cd6a66239ae349eca44ce58ad775d83f64<br>`parsed_sha256`: a9e640d10e1614a611b25305aac3f5cd6a66239ae349eca44ce58ad775d83f64 |
| **AC5** | Xác minh tệp gốc nguyên vẹn -> VERIFIED (Khớp 100%) | 🟢 **PASSED** | `status`: VERIFIED<br>`match`: True<br>`computed_sha256`: bb108e2ef01bc539c13ba48159ce8c2fc70facb135b8dbb15a9ebd7dda6a05eb |
| **AC6** | Phát hiện tệp bị sửa 1 byte -> MISMATCH / NOT_FOUND | 🟢 **PASSED** | `tampered_without_id_status`: NOT_FOUND<br>`tampered_with_id_status`: MISMATCH<br>`match`: False |
| **AC7** | Phát hiện tệp trùng lặp (duplicate=true, HTTP 200) | 🟢 **PASSED** | `initial_evidence_id`: EV-20261027-EHJZV6<br>`duplicate_response_status`: 200<br>`duplicate_flag`: True |
| **AC8** | Bảo vệ & Xử lý lỗi (/api/health, chặn file rỗng & file .exe) | 🟢 **PASSED** | `health_status`: ok<br>`health_chain_id`: 11155111<br>`exe_rejection_code`: UNSUPPORTED_TYPE |
| **AC9** | Nhật ký kiểm toán truy vết (X-Request-ID & chuỗi sự kiện) | 🟢 **PASSED** | `request_id_in_header`: True<br>`captured_events`: ['RECEIPT_DOWNLOADED', 'TX_CONFIRMED', 'TX_SENT', 'HASH_COMPUTED', 'UPLOAD_RECEIVED']<br>`evidence_id`: EV-20261027-51SK1A |

## Chi tiết kỹ thuật từng bài kiểm tra

### AC1 - Tải ảnh JPG 2MB và neo lên Sepolia (CONFIRMED)
- **Trạng thái:** `PASSED`
```json
{
  "evidence_id": "EV-20261027-GQ6I4Y",
  "tx_hash": "0x4932695cd2ceb3f064b808f9506b1c3d073a22dbb5e923295b63cac8db96ee5f",
  "block_number": 7345201,
  "status": "CONFIRMED",
  "explorer_url": "https://sepolia.etherscan.io/tx/0x4932695cd2ceb3f064b808f9506b1c3d073a22dbb5e923295b63cac8db96ee5f"
}
```

### AC2 - Hỗ trợ tải lên đa định dạng (MP3, MP4, PDF, DOCX, TXT)
- **Trạng thái:** `PASSED`
```json
{
  "ghi_am.mp3": {
    "status_code": 201,
    "evidence_id": "EV-20261027-S7UDOQ",
    "sha256": "ac9bc9b2659f97616234c0e452e2fb8d390f297dcd8ad49f07b2167986286389"
  },
  "camera.mp4": {
    "status_code": 201,
    "evidence_id": "EV-20261027-HZTPUN",
    "sha256": "84a66ae2c3b3d562d36e66bbbe6b974a0385416f239a99850bd82ac14de0e6cd"
  },
  "hop_dong.pdf": {
    "status_code": 201,
    "evidence_id": "EV-20261027-FGYH1J",
    "sha256": "99be5522963463afd96aab4c427b75319ff9889559ff40206c5b26e008fde979"
  },
  "bien_ban.docx": {
    "status_code": 201,
    "evidence_id": "EV-20261027-CS62TG",
    "sha256": "cebd399548ecfb6fbe9e972c76adfef48f5c7c36ae204ad80ab5e4dbeb033fdf"
  },
  "nhat_ky.txt": {
    "status_code": 201,
    "evidence_id": "EV-20261027-PNGEJW",
    "sha256": "908bb7927e0f6583d1276aec4639741c8d4cb375101a3f39767c01b55676ce27"
  }
}
```

### AC3 - Độ chính xác SHA-256 (Khớp 100% với hashlib / sha256sum)
- **Trạng thái:** `PASSED`
```json
{
  "expected_hashlib": "8d4349b3998f0db066b6a8509083b2297edfed55113b075e1e3bb8889b58e9a8",
  "actual_system": "8d4349b3998f0db066b6a8509083b2297edfed55113b075e1e3bb8889b58e9a8",
  "match": true
}
```

### AC4 - Định dạng Input Data trên Sepolia (EVD1:<hash>)
- **Trạng thái:** `PASSED`
```json
{
  "tx_hash": "0x1158adb017f97acfd7bcf2c8c39217df6f030529e7b60c156173463f2d667b90",
  "expected_anchor_data": "EVD1:a9e640d10e1614a611b25305aac3f5cd6a66239ae349eca44ce58ad775d83f64",
  "parsed_sha256": "a9e640d10e1614a611b25305aac3f5cd6a66239ae349eca44ce58ad775d83f64",
  "valid_format": true,
  "issuer_is_system_wallet": true
}
```

### AC5 - Xác minh tệp gốc nguyên vẹn -> VERIFIED (Khớp 100%)
- **Trạng thái:** `PASSED`
```json
{
  "status": "VERIFIED",
  "match": true,
  "computed_sha256": "bb108e2ef01bc539c13ba48159ce8c2fc70facb135b8dbb15a9ebd7dda6a05eb",
  "onchain_sha256": "bb108e2ef01bc539c13ba48159ce8c2fc70facb135b8dbb15a9ebd7dda6a05eb",
  "message": "Khớp – tệp nguyên vẹn so với thời điểm ký gửi."
}
```

### AC6 - Phát hiện tệp bị sửa 1 byte -> MISMATCH / NOT_FOUND
- **Trạng thái:** `PASSED`
```json
{
  "tampered_without_id_status": "NOT_FOUND",
  "tampered_with_id_status": "MISMATCH",
  "match": false,
  "computed_hash": "1892426c9671b3464257a3adb884eafaa38a0a1c270ad11cffdf14a303ae7b91",
  "onchain_hash": "d226afdefe0a31b2b70bcea88ce24adb07d176c0f732678f1297616e80b816dd"
}
```

### AC7 - Phát hiện tệp trùng lặp (duplicate=true, HTTP 200)
- **Trạng thái:** `PASSED`
```json
{
  "initial_evidence_id": "EV-20261027-EHJZV6",
  "duplicate_response_status": 200,
  "duplicate_flag": true,
  "returned_evidence_id": "EV-20261027-EHJZV6"
}
```

### AC8 - Bảo vệ & Xử lý lỗi (/api/health, chặn file rỗng & file .exe)
- **Trạng thái:** `PASSED`
```json
{
  "health_status": "ok",
  "health_chain_id": 11155111,
  "exe_rejection_code": "UNSUPPORTED_TYPE",
  "empty_rejection_code": "EMPTY_FILE"
}
```

### AC9 - Nhật ký kiểm toán truy vết (X-Request-ID & chuỗi sự kiện)
- **Trạng thái:** `PASSED`
```json
{
  "request_id_in_header": true,
  "captured_events": [
    "RECEIPT_DOWNLOADED",
    "TX_CONFIRMED",
    "TX_SENT",
    "HASH_COMPUTED",
    "UPLOAD_RECEIVED"
  ],
  "evidence_id": "EV-20261027-51SK1A"
}
```
