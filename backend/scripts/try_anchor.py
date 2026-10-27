import hashlib
from app.services.blockchain_service import get_blockchain_service

def main():
    svc = get_blockchain_service()
    print("Kết nối:", svc.check_connection())
    h = hashlib.sha256(b"hello evidence 2026").hexdigest()
    res = svc.anchor_hash(h)
    print("Đã gửi:", res)
    confirm = svc.wait_confirmation(res["tx_hash"])
    print("Xác nhận:", confirm)
    anchor = svc.read_anchor(res["tx_hash"])
    print("Đọc lại:", anchor)
    is_match = anchor["sha256"] == h if anchor else False
    print("Khớp?", is_match)

if __name__ == "__main__":
    main()
