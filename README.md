# HOA_KHANG_THANH

Hệ thống Quản lý Phân phối Hoa Tươi Chuyên Nghiệp – **Hoa Khang Thành**.

## 🌟 Tính năng Nổi bật

- **Đơn hàng bán (Phân phối sỉ):**
  - Quản lý đơn hàng, gợi ý hoa thông minh, bảng kẻ kế toán liền mạch.
  - Tự động tính Thành tiền, Cước xe, Trừ hàng, Tổng tiền, Công nợ cũ lũy kế và Thanh toán theo dòng thời gian (Running Balance).
  - Báo cáo thống kê, biểu đồ doanh thu, top sản phẩm sinh lời và danh sách hoa bán theo ngày (xuất Excel).
  - **Lịch sử thao tác (Audit Log):** Tự động ghi lại hoạt động Thêm mới, Chỉnh sửa, Đổi trạng thái, Xóa đơn hàng của từng nhân viên kèm đối chiếu dữ liệu thay đổi (Diff) và bản chụp snapshot.
  - In phiếu xuất kho/giao hàng trực tiếp hoặc mở xem trước trên tab mới.
- **Đơn hàng Nhà cung cấp & OCR Ocr4AI:**
  - Lên đơn đặt hoa từ nhà vườn (Đà Lạt, Sa Pa, Côn Minh...).
  - **Quét hóa đơn bằng AI (OCR):** Tự động bóc tách hóa đơn viết tay/in ảnh thành bảng mặt hàng chỉ trong 300-600ms.
  - Bộ công cụ soi ảnh chuyên nghiệp: Thu phóng (Zoom in/out lên đến 400%), kéo rê (Pan) và mở Lightbox toàn màn hình.
- **Danh mục Hoa & Tên riêng:**
  - Tên hoa chuẩn và cột Tên riêng cho phép mỗi nhân viên/đối tác tự đặt tên gọi quen thuộc.
  - Cơ chế gợi ý thông minh, ngăn chặn trùng lặp tên hoa và tên riêng.
- **Quản lý Nhà phân phối (NPP) & Nhà cung cấp (NCC):**
  - Theo dõi công nợ cũ, phát sinh, thanh toán và công nợ hiện tại.
  - Theo dõi số ngày lên đơn gần nhất và cảnh báo NPP quá 3 ngày chưa nhập hàng.
  - Drawer chi tiết rút gọn xem lịch sử đơn hàng và bảng công nợ theo ngày.
- **Sổ Công nợ 2 chiều:**
  - Ghi theo ngày (tổng hợp đối soát theo ngày) và ghi theo đơn.
  - Phân tách rõ ràng Thu / Chi và tính toán công nợ còn theo cơ chế Running Balance.
- **Sổ Quỹ Thu Chi & Chi phí Cố định:**
  - Phiếu thu, phiếu chi, lọc nhanh Thu/Chi.
  - Phím tắt 1 chạm cho chi phí cố định (cơm trưa, xăng xe, cước vận chuyển...).
- **Báo cáo Tồn kho & Nhân sự:**
  - Tồn đầu kỳ, nhập, xuất, tồn cuối kỳ và cảnh báo tồn.
  - Danh sách nhân viên, phân quyền Admin/Member, đổi mật khẩu và đăng nhập/đăng xuất.
- **Kết nối Google Sheets 2 chiều (HOA_KHANG_THANH):**
  - Tự động chuẩn hóa 11 sheets tương ứng với 11 module.
  - Đồng bộ 1 chạm (Push lên Sheets / Pull về Web) và tính năng tự động đồng bộ (Auto-sync) ngầm.

---

## 🚀 Công nghệ Sử dụng

- **Frontend:** React 18, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons.
- **Quản lý trạng thái:** Zustand (với LocalStorage persistence).
- **Bộ công cụ & Thư viện:** Vite, Day.js, Sonner Toast, XLSX (Excel export), jsPDF.
- **Tích hợp:** Google Sheets API v4 (Service Account OAuth2 JWT), Ocr4AI API (OCR Engine).

---

## 🛠 Hướng dẫn Cài đặt & Chạy thử

```bash
# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển (Dev Server)
npm run dev

# Kiểm tra kiểu dữ liệu (TypeScript Check)
npm run typecheck

# Đóng gói sản phẩm (Production Build)
npm run build
```

---

## ⚙️ Cấu hình Môi trường (.env)

Sao chép file `.env.example` thành `.env` và điền các thông tin:

```env
# Google Spreadsheet
VITE_GOOGLE_SPREADSHEET_ID=1iFYENcKF-9y5y_cfsmSjZyfbITMl1aIYwYgPL6i9vnQ
VITE_GOOGLE_SPREADSHEET_URL=https://docs.google.com/spreadsheets/d/1iFYENcKF-9y5y_cfsmSjZyfbITMl1aIYwYgPL6i9vnQ/edit?gid=0#gid=0

# Google Service Account Credentials
GOOGLE_CLIENT_EMAIL=ca-nhan@h161-508101.iam.gserviceaccount.com
GOOGLE_PROJECT_ID=h161-508101
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
