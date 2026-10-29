# LNK HCNS – Hành chính & Nhân sự

Dựng lại 2 phân hệ **Hành chính** (`/hanh-chinh`) và **Nhân sự** (`/nhan-su`) của 5F template, giữ nguyên khung web, giao diện và chức năng.

Công nghệ: React 18 + Vite + TypeScript + Tailwind CSS v4, React Router, TanStack Query, react-hook-form + zod, framer-motion, recharts, lucide-react.

## Chạy thử

```bash
npm install
npm run dev
```

Build production: `npm run build` (kết quả trong `dist/`).

## Deploy lên Vercel

Import thư mục này vào Vercel (Framework: Vite). File `vercel.json` đã chuyển mọi đường dẫn về `index.html` để mở trực tiếp các link như `/nhan-su/ho-so-ung-vien` không bị 404.

## Dữ liệu

Dữ liệu mẫu nằm ở `src/data/*.json` (lấy nguyên từ bản gốc). Thêm/sửa/xóa được lưu trong localStorage của trình duyệt (khóa bắt đầu bằng `lnk-hcns:`), nên tải lại trang vẫn còn. Xóa các khóa đó để quay về dữ liệu mẫu.

## Cấu trúc

- `src/components/layout` – khung web: thanh bên, header (breadcrumb, đồng hồ, thông báo, menu người dùng), thanh điều hướng mobile.
- `src/components/ui`, `src/components/data` – bộ component dùng chung: Drawer, Select, bộ lọc, DataTable, ListToolbar...
- `src/config/modules.ts` – danh sách module con của 2 phân hệ (tên, icon, màu).
- `src/modules/registry.tsx` – module con đã dựng; module chưa có sẽ hiện trang "Sắp ra mắt".
- `src/modules/nhan-su/ung-vien` – Ứng viên (danh sách, thống kê, form, chi tiết, lịch phỏng vấn).
- `src/modules/hanh-chinh/tai-lieu` – Danh sách tài liệu (danh sách, ghim, form, chi tiết, phân quyền).
- `src/i18n/vi.json` – toàn bộ chuỗi tiếng Việt của bản gốc.

## Tiến độ

Đợt 1: khung web, 2 trang tổng, module **Ứng viên** và **Danh sách tài liệu**. Các module con còn lại sẽ làm theo từng nhóm ở các đợt sau.
