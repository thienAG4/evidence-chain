# Evidence Chain (v1.0 - MVP)

> **Hệ thống lưu vết và đối chiếu bằng chứng số trên Ethereum Sepolia phục vụ giải quyết tranh chấp tại tòa án.**

Evidence Chain giải quyết bài toán chống giả mạo và chứng thực mốc thời gian của chứng cứ số (ảnh, video, ghi âm, tài liệu, PDF) bằng cách tính mã băm mật mã SHA-256 dạng stream, neo mã băm này vào trường `Input Data` của giao dịch EIP-1559 trên mạng Ethereum Sepolia (không dùng smart contract phức tạp), và cấp biên nhận pháp lý kỹ thuật có thể đối chiếu độc lập bất kỳ lúc nào.

---

## 🏛️ Nguyên lý cốt lõi

1. **Bảo mật & Quyền riêng tư (Zero Server Storage khi đối chiếu):** Chỉ mã băm SHA-256 được lưu lên blockchain. Nội dung tài liệu nhạy cảm không bao giờ bị phát tán lên mạng công khai.
2. **Con dấu thời gian bất biến (Immutable Timestamping):** Khắc dấu ấn mật mã vào block của blockchain để chứng minh tệp số đã tồn tại muộn nhất vào thời điểm đó và không bị chỉnh sửa dù chỉ 1 bit.
3. **Đối chiếu độc lập:** Bất kỳ thẩm phán, thư ký tòa, luật sư hay bên đương sự nào cũng có thể tải lại tệp vào tab **Xác minh** để kiểm chứng chéo trực tiếp từ sổ cái Sepolia.

---

## 🎨 Giao diện Stitch AI & Color Theme

Giao diện được thiết kế và sinh tự động thông qua **Stitch AI**:
- **Stitch Project:** `Evidence Chain - Blockchain Legal Evidence Studio` (ID: `18005556481775070450`)
- **Design System:** `Cyber-Legal Proof Grid`
- **Color Theme (Dark Tech Navy):**
  - Nền chính: `#0A122A` / `#0B132B` (Deep Institutional Navy)
  - Thẻ & Bề mặt kính: `#111C3D` / `#171E37` / `#212942` (Translucent Glassmorphism)
  - Màu nhấn (Accent): `#38BDF8` (Electric Cyan)
  - Xác thực thành công (VERIFIED / CONFIRMED): `#10B981` (Verification Emerald)
  - Trạng thái chờ (PENDING): `#F59E0B` (Forensic Amber)
  - Cảnh báo sai lệch (MISMATCH / FAILED): `#EF4444` (Critical Crimson)
  - Typography: **Plus Jakarta Sans** (tiêu đề), **Inter** (nội dung), **JetBrains Mono** (mã băm, Tx Hash, khối).

---

## 📂 Cấu trúc mã nguồn

```
evidence-chain/
├── backend/
│   ├── app/
│   │   ├── api/                  # Tầng HTTP: routes_health, routes_evidence, routes_verify, routes_logs
│   │   ├── core/                 # logging_config, middleware (X-Request-ID), errors (AppError)
│   │   ├── db/                   # SQLAlchemy engine, session, Base (SQLite)
│   │   ├── models/               # ORM: Evidence, AuditLog
│   │   ├── schemas/              # Pydantic v2 schemas: Evidence, Verify, Health, Audit
│   │   ├── services/             # Logic cốt lõi: hash_service, blockchain_service, evidence_service, verify_service, audit_service
│   │   ├── config.py             # Cấu hình pydantic-settings đọc .env
│   │   └── main.py               # Khởi tạo FastAPI, CORS, middlewares, routers, lifespan
│   ├── storage/uploads/          # Lưu trữ tệp bằng chứng theo tên là sha256
│   ├── logs/                     # app.log, error.log, audit.jsonl
│   ├── tests/                    # test_hash.py, test_api.py (pytest)
│   ├── scripts/                  # try_anchor.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/                  # client.js, evidenceApi.js, verifyApi.js, logsApi.js
│   │   ├── components/           # Navbar, FileDropzone, HashDisplay, StatusBadge, Stepper, ReceiptCard, VerifyResultBanner, Toast
│   │   ├── hooks/                # usePollEvidence, useCopy
│   │   ├── pages/                # UploadPage, VerifyPage, EvidenceListPage, AuditLogPage
│   │   ├── utils/                # format.js, logger.js
│   │   ├── App.jsx, main.jsx, index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── harness.py                    # Root End-to-End Test Harness (AC1 - AC9)
├── harness_report.json           # Báo cáo JSON kết quả chạy test harness
├── harness_report.md             # Báo cáo Markdown chi tiết kết quả chạy test harness
└── README.md
```

---

## ⚡ Hướng dẫn cài đặt và chạy (≤ 10 lệnh)

### 1. Cài đặt Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

### 2. Cài đặt Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
```

### 3. Chạy Backend (Cổng 8000)
```bash
cd ../backend
uvicorn app.main:app --reload --port 8000
```
- API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Status: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 4. Chạy Frontend (Cổng 5173)
```bash
cd ../frontend
npm run dev
```
- Mở trình duyệt tại: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Chạy Kiểm Thử và Test Harness

### Chạy Test Suite (pytest)
```bash
python -m pytest backend/tests -v
```
*(Kết quả: 8/8 tests PASSED 100%)*

### Chạy Toàn Diện Kịch Bản Nghiệm Thu (AC1 - AC9)
```bash
python harness.py
```
*(Kết quả: 9/9 Acceptance Criteria PASSED 100%, xuất báo cáo tự động tại `harness_report.json` và `harness_report.md`)*

---

## 📋 Kết Quả Tiêu Chí Nghiệm Thu (Acceptance Criteria)

| Tiêu chí | Kịch bản | Kết quả nghiệm thu |
|---|---|:---:|
| **AC1** | Tải ảnh JPG 2 MB và ký gửi | 🟢 **PASSED** (Có tx_hash, block, explorer_url) |
| **AC2** | Đa định dạng (MP3, MP4, PDF, DOCX, TXT) | 🟢 **PASSED** (Băm và neo thành công cả 5 loại) |
| **AC3** | Độ chính xác SHA-256 | 🟢 **PASSED** (Trùng khớp 100% với hashlib / sha256sum) |
| **AC4** | On-chain Input Data trên Sepolia | 🟢 **PASSED** (Đúng định dạng `EVD1:<sha256>`, 69 bytes) |
| **AC5** | Xác minh tệp gốc nguyên vẹn | 🟢 **PASSED** (Status `VERIFIED` màu xanh, hash trùng khớp) |
| **AC6** | Sửa 1 byte tệp rồi xác minh | 🟢 **PASSED** (Status `MISMATCH` hoặc `NOT_FOUND` màu đỏ) |
| **AC7** | Ký gửi lại cùng tệp trùng lặp | 🟢 **PASSED** (Trả biên nhận cũ `duplicate=true`, 0 gas) |
| **AC8** | Xử lý lỗi & Sức khỏe hệ thống | 🟢 **PASSED** (/api/health ok, chặn file .exe 415, file rỗng 400) |
| **AC9** | Nhật ký kiểm toán & X-Request-ID | 🟢 **PASSED** (Truy vết xuyên suốt UPLOAD -> CONFIRMED) |

---

## 🔬 Bản chất thuật toán SHA-256 & Tính toàn vẹn của Bằng chứng số

Một câu hỏi giám định điển hình: *Hàm băm SHA-256 tính toán dựa trên nội dung tệp hay metadata ẩn? Tại sao chụp màn hình cùng một vị trí 2 lần thì ra 2 mã hash khác nhau, trong khi sao chép (Ctrl+C / Ctrl+V) lại ra mã hash giống hệt nhau?*

### 1. Nguyên lý nhị phân toàn diện (Raw Binary Stream)
Hàm băm SHA-256 **không phân biệt** đâu là hình ảnh, đâu là chữ viết, hay đâu là metadata. Đối với thuật toán, một tệp tin chỉ đơn thuần là một chuỗi hàng triệu bit số `0` và `1` nối tiếp nhau:
$$\text{Tệp tin} = \underbrace{\text{[Phần Header \& Metadata ẩn (EXIF/Creation Time...)]}}_{\approx 0.1\%} + \underbrace{\text{[Nội dung chính: Điểm ảnh / Chữ / Âm thanh]}}_{\approx 99.9\%}$$
Thuật toán SHA-256 nạp và tính toán **toàn bộ dòng byte nhị phân** từ byte đầu tiên đến byte cuối cùng của tệp.

### 2. Giải thích các ca thực nghiệm thực tế

| Thao tác thực tế | Mã SHA-256 | Giải thích kỹ thuật & Ý nghĩa tư pháp |
|---|:---:|---|
| **Sao chép tệp (`Ctrl+C` $\rightarrow$ `Ctrl+V`)** | **GIỐNG HỆT NHAU (100%)** | Hệ điều hành copy nguyên vẹn từng byte dữ liệu. Dòng byte nhị phân không đổi $\rightarrow$ hash trùng khớp $\rightarrow$ Hệ thống tự động nhận diện bản sao (**Duplicate**) và tái sử dụng biên nhận cũ mà không tốn phí gas. |
| **Đổi tên tệp (VD: `anh1.jpg` $\rightarrow$ `hop_dong.jpg`)** | **GIỐNG HỆT NHAU (100%)** | Tên tệp do hệ thống tệp của ổ đĩa (NTFS / FAT32) quản lý ở bảng mục lục, **không nằm trong ruột tệp**. Do đó đổi tên tệp không làm thay đổi giá trị pháp lý và mã băm của tệp. |
| **Di chuyển tệp (qua thư mục khác / gửi USB)** | **GIỐNG HỆT NHAU (100%)** | Dữ liệu byte trong ruột tệp được giữ nguyên vẹn. |
| **Chụp màn hình cùng 1 vị trí 2 lần liên tiếp** | **KHÁC NHAU HOÀN TOÀN** | 1. **Dấu mốc thời gian (Timestamp):** Phần mềm chụp ảnh luôn đóng gói ngày, giờ, giây vào header tệp (EXIF / tIME chunk). Hai lần chụp cách nhau vài giây $\rightarrow$ các byte thời gian này khác nhau.<br>2. **Điểm ảnh vi mô:** Quá trình render GPU / anti-aliasing chữ có thể lệch 1-2 điểm ảnh.<br>3. **Hiệu ứng tuyết lở (Avalanche Effect):** Trong SHA-256, chỉ cần lệch **đúng 1 bit (1/8 byte)**, toàn bộ chuỗi băm 64 ký tự sẽ đổi khác hoàn toàn. |

### 3. Ý nghĩa trong Giám định Tư pháp & Tòa án
- **Nhận diện sự kiện độc lập:** Hai lần chụp màn hình là 2 hành vi thu thập chứng cứ diễn ra ở hai thời điểm khác nhau $\rightarrow$ Về mặt pháp lý, chúng là **2 vật chứng số độc lập**.
- **Chống làm giả tuyệt đối:** Nếu bất kỳ ai mở tệp ảnh hiện trường hoặc hợp đồng PDF ra, chỉnh sửa dù chỉ 1 dấu chấm, 1 chữ số, hoặc xóa 1 pixel trên biển số xe, hàm SHA-256 sẽ phát hiện ngay sự sai lệch so với dữ liệu đã neo trên sổ cái Blockchain P2P $\rightarrow$ Bảo vệ giá trị chứng minh trước tòa án.

---

## 🚀 Hướng dẫn Triển khai Production (Vercel + Render)

Hệ thống Evidence Chain được tách biệt thành 2 tầng microservice chuẩn đám mây:
- **Frontend (React 18 + Vite + Tailwind CSS):** Triển khai tĩnh trên mạng CDN toàn cầu của **Vercel**.
- **Backend (FastAPI + Web3.py + SQLite):** Triển khai Web Service trên đám mây **Render**.

### 1. Frontend trên Vercel (Đã triển khai thành công)
- **Production URL:** [https://frontend-ten-livid-sfuyxmuif5.vercel.app](https://frontend-ten-livid-sfuyxmuif5.vercel.app)
- **Vercel Dashboard:** [https://vercel.com/thiens-projects-7b021fa2/frontend](https://vercel.com/thiens-projects-7b021fa2/frontend)
- Đã cấu hình `frontend/vercel.json` định tuyến SPA (Single Page Application) cho toàn bộ các tab `/verify`, `/evidence`, `/logs`.

### 2. Backend trên Render (1-Click Blueprint)
Mã nguồn đã tích hợp sẵn file Blueprint [render.yaml](file:///d:/evidence-chain/render.yaml) và [backend/Dockerfile](file:///d:/evidence-chain/backend/Dockerfile).

**Các bước kích hoạt backend Render trong 1 phút:**
1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com).
2. Vào **Blueprints** $\rightarrow$ Bấm **New Blueprint Instance**.
3. Chọn kho mã nguồn GitHub: **`thienAG4/evidence-chain`**.
4. Render sẽ tự động đọc `render.yaml` và nạp toàn bộ cấu hình:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:** Đã cấu hình sẵn `CORS_ORIGINS=*`, `SEPOLIA_RPC_URL`, v.v.
5. Nhập giá trị bí mật cho biến **`PRIVATE_KEY`** (khóa riêng tư ví Sepolia có gas của bạn).
6. Bấm **Apply**. Sau khi build xong (khoảng 1-2 phút), Render sẽ cấp cho bạn một URL backend dạng:
   `https://evidence-chain-backend.onrender.com`

### 3. Kết nối Frontend Vercel với Backend Render
1. Mở trang cài đặt Vercel: [Frontend Environment Variables](https://vercel.com/thiens-projects-7b021fa2/frontend/settings/environment-variables).
2. Thêm biến:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://tên-dịch-vụ-của-bạn.onrender.com`
3. Bấm **Save** và nhấn **Redeploy** trên Vercel. Giao diện trực tuyến sẽ lập tức kết nối trực tiếp với backend đám mây!

---

## 🔒 Lưu ý bảo mật & Pháp lý kỹ thuật

1. **Khóa riêng (PRIVATE_KEY):** Chỉ lưu trong file `backend/.env` hoặc cấu hình bí mật trên Render Dashboard. Tuyệt đối không commit lên Git hay để lộ ra frontend.
2. **Mạng Sepolia Testnet:** Phục vụ nghiên cứu, thử nghiệm và trình diễn; khi ứng dụng vào thực tế tòa án cần chuyển sang mạng chính thức (Mainnet hoặc L2 tương thích) và tham vấn quy chuẩn giám định điện tử theo quy định pháp luật sở tại.
