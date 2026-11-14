# NHẬT KÝ TẤT CẢ YÊU CẦU DỰ ÁN HOA KHANG THÀNH

> **Dự án:** Quản lý Phân phối Hoa Khang Thành  
> **Thời gian bắt đầu ghi nhận:** 22:13:17 - 25/10/2026 (Giờ Việt Nam GMT+7)  
> **Cập nhật gần nhất:** 23:59:00 - 06/11/2026  
> **Tổng số yêu cầu:** 51 yêu cầu  
> **Trạng thái:** Toàn bộ đã hoàn thành và được kiểm thử thành công (100%)

---

## I. BẢNG TỔNG HỢP THEO DÒNG THỜI GIAN

| STT | Thời gian (GMT+7) | Nội dung yêu cầu tóm tắt | Phân hệ (Module) | Trạng thái |
|:---:|:---:|:---|:---|:---:|
| **1** | 22:13:17 - 25/10/2026 | Tái cấu trúc toàn bộ: Chỉ giữ các module chuyên ngành (Đơn hàng, Danh sách hoa, NCC, NPP, Nhân viên, Tồn kho, Thu chi, Dashboard) | Hệ thống | Hoàn thành |
| **2** | 22:45:15 - 25/10/2026 | Module Đơn hàng chuyên biệt theo ảnh giao diện mẫu | Đơn hàng | Hoàn thành |
| **3** | 22:55:01 - 25/10/2026 | Đồng bộ giao diện dạng Drawer/Popup trượt bên phải có 3 kích thước: Rộng, Vừa, Nhỏ | Giao diện | Hoàn thành |
| **4** | 23:20:26 - 25/10/2026 | Sửa đơn hàng: Số PO đổi thành ID, bỏ kho nhận, thêm Thành tiền, Cước xe, Trừ hàng, Số lượng hoa, Gợi ý mặt hàng, Giá nhập, Giá bán, Lợi nhuận, Công nợ | Đơn hàng | Hoàn thành |
| **5** | 23:31:57 - 25/10/2026 | Chuyển danh sách mặt hàng hoa trong đơn thành dạng Bảng trực quan | Đơn hàng | Hoàn thành |
| **6** | 23:43:23 - 25/10/2026 | Bỏ ký hiệu tiền tệ ("đ", "₫"), bỏ đơn vị tính để giao diện thoáng gọn | Giao diện chung | Hoàn thành |
| **7** | 23:54:05 - 25/10/2026 | Ô nhập số tiền có dấu chấm phân cách hàng nghìn (.), thiết kế giao diện ERP khít gọn không khoảng hở thừa | Giao diện chung | Hoàn thành |
| **8** | 00:01:31 - 26/10/2026 | Định dạng ngày chuẩn `dd/mm/yyyy`, sửa lỗi hiển thị ô chọn hoa | Đơn hàng / Hoa | Hoàn thành |
| **9** | 00:16:51 - 26/10/2026 | Sửa lỗi ấn vào Chỉnh sửa đơn hàng bị trắng màn hình | Đơn hàng | Hoàn thành |
| **10** | 00:26:03 - 26/10/2026 | Sửa lỗi mất số lượng/giá khi chọn hoa; Thêm mới thì để trống hoa, số lượng, giá để người dùng tự nhập | Đơn hàng | Hoàn thành |
| **11** | 00:32:39 - 26/10/2026 | Danh sách hoa rút gọn: Chỉ giữ Mã hoa + Tên hoa + Tên riêng, ẩn các cột khác | Danh sách hoa | Hoàn thành |
| **12** | 00:33:27 - 26/10/2026 | View Web danh sách hoa không cần cột mặt hàng hoa | Danh sách hoa | Hoàn thành |
| **13** | 00:42:24 - 26/10/2026 | Gợi ý hoa: Ẩn giá vốn, ẩn ĐVT, hiện Tên riêng, giới hạn tối đa 10 gợi ý | Đơn hàng / Hoa | Hoàn thành |
| **14** | 00:47:42 - 26/10/2026 | Bổ sung popup gợi ý giá tự động khi gõ (gõ 5 gợi ý 5.000 / 50.000, gõ 34 gợi ý 34.000 / 340.000) | Đơn hàng / Nhập giá | Hoàn thành |
| **15** | 00:50:46 - 26/10/2026 | Danh sách hoa thêm 3 tab: "Tất cả", "Giá bán" (Hoa, SL, Giá bán, TT bán), "Giá nhập" (Hoa, SL, Giá bán, TT nhập) | Danh sách hoa | Hoàn thành |
| **16** | 00:59:02 - 26/10/2026 | Danh sách hoa bỏ cột Giá bán & Giá vốn ở tab Tất cả; Thêm cột Tên riêng cho phép mỗi người điền tên riêng | Danh sách hoa | Hoàn thành |
| **17** | 01:01:36 - 26/10/2026 | Danh sách NCC thêm 4 cột (Công nợ cũ, Tiền nhập hoa, Tiền trả NCC, Công nợ cuối); Danh sách NPP thêm 4 cột (Công nợ cũ, Tiền bán hoa, Tiền thu nợ, Công nợ cuối) | NCC & NPP | Hoàn thành |
| **18** | 01:04:22 - 26/10/2026 | Tạo mới phân hệ Công nợ (`/cong-no`) hiển thị đầy đủ công nợ theo ngày của NPP và NCC | Công nợ | Hoàn thành |
| **19** | 01:04:28 - 26/10/2026 | Bấm chi tiết NPP: Hiện đơn hàng mua lấy từ module Đơn hàng + Bảng công nợ theo ngày lấy từ module Công nợ | NPP | Hoàn thành |
| **20** | 01:05:39 - 26/10/2026 | Module Thu chi thêm nút bấm Chi phí cố định (bấm nhanh 1 chạm: Xăng xe 50.000, Cơm trưa 40.000...) | Thu chi | Hoàn thành |
| **21** | 01:08:35 - 26/10/2026 | Module Đơn hàng: Cảnh báo Chưa trả nợ theo nguyên tắc FIFO nếu khách có đơn quá 3 ngày chưa thanh toán xong | Đơn hàng / Công nợ | Hoàn thành |
| **22** | 01:09:59 - 26/10/2026 | Xuất toàn bộ danh sách các yêu cầu có đầy đủ mốc thời gian vào 1 file để xem lại | Tài liệu | Hoàn thành |
| **23** | 07:29:30 - 26/10/2026 | Tùy chỉnh cột: Căn lề dạng icon, xuống dòng dạng icon, kích thước pixel và ghim cột cố định tại tất cả các module | Tất cả module | Hoàn thành |
| **24** | 07:51:40 - 26/10/2026 | Báo cáo thống kê đơn hàng: Thêm danh sách hoa mua lọc theo ngày (tổng hợp loại hoa, chi tiết từng đơn, xuất Excel) | Đơn hàng / Thống kê | Hoàn thành |
| **25** | 07:57:25 - 26/10/2026 | Thêm module Đơn hàng NCC (nhập hoa từ nhà vườn) + Tính năng Đọc ảnh ra đơn (OCR nhận diện danh sách hoa và số lượng) | Đơn hàng NCC | Hoàn thành |
| **26** | 08:03:30 - 26/10/2026 | Danh sách hoa xóa hẳn giá; Tên riêng nhiều người đặt cách nhau dấu phẩy (,), tên hoa và tên riêng không được trùng nhau (kể cả chữ hoa chữ thường) | Danh sách hoa | Hoàn thành |
| **27** | 08:27:30 - 26/10/2026 | Popup gợi ý hoa trong đơn hàng: Bỏ cột giá tiền gợi ý, chuyển tên riêng xuống dòng dưới cạnh tồn kho | Đơn hàng & Đơn hàng NCC | Hoàn thành |
| **28** | 08:40:28 - 26/10/2026 | Danh sách nhân viên có mật khẩu để đăng nhập và đăng xuất | Nhân viên / Xác thực | Hoàn thành |
| **29** | 08:46:29 - 26/10/2026 | Thay đổi chi tiết thanh toán: Bỏ "Khách đã trả" thay bằng "Công nợ cũ", bỏ "Tình trạng nợ" thay bằng "Thanh toán" | Đơn hàng | Hoàn thành |
| **30** | 08:47:53 - 26/10/2026 | Tích hợp form `hoa_khang_thanh.html` làm phiếu in: Click vào mở phiếu in xem trước thay vì in đơn trực tiếp | Đơn hàng / In ấn | Hoàn thành |
| **31** | 09:20:51 - 26/10/2026 | Kiểm tra và làm sạch toàn bộ số liệu công nợ: Đưa toàn bộ công nợ và đơn hàng mẫu về 0/trắng để người dùng tự nhập từ đầu | Công nợ & Đơn hàng | Hoàn thành |
| **32** | 09:36:23 - 26/10/2026 | Đồng bộ và liên kết tự động 2 chiều giữa Đơn hàng và Công nợ (Lên đơn hàng tự động ghi nhận công nợ và cập nhật NPP / NCC) | Đơn hàng & Công nợ | Hoàn thành |
| **33** | 10:12:42 - 26/10/2026 | Công nợ: Thêm ghi theo ngày & ghi theo đơn, có Thu/Chi, Số tiền, Công nợ còn; Xóa bỏ các cột cũ (Công nợ cũ, Tiền bán, Tiền thu nợ, Công nợ cuối) | Công nợ | Hoàn thành |
| **34** | 10:36:55 - 26/10/2026 | Cơ chế "Ghi theo ngày" là Tổng hợp NPP / NCC theo ngày: Tự động gom nhóm toàn bộ đơn hàng & phát sinh trong ngày của đối tác thành 1 dòng đối soát tổng hợp | Công nợ | Hoàn thành |
| **35** | 10:58:12 - 26/10/2026 | Tách biệt hoàn toàn Thu và Chi riêng: Không gộp tiền thu nợ và tiền xuất bán nợ vào chung 1 dòng/1 số tiền; Bổ sung bộ lọc Thu/Chi nhanh | Công nợ | Hoàn thành |
| **36** | 11:12:00 - 26/10/2026 | Công nợ còn là cột ảo: Tính lũy kế số dư tự động theo ngày (Running Balance) từ lịch sử giao dịch; Thẻ KPI và tổng nợ đồng bộ chuẩn xác | Công nợ | Hoàn thành |
| **37** | 11:27:25 - 26/10/2026 | Điều chỉnh logic cảnh báo Chưa trả nợ: Đổi ngưỡng 4 ngày; Tổng tiền trả (gồm cả tiền thu nợ từ sổ công nợ) > nợ cũ sau 4 ngày thì coi như đã trả đủ (OK), không cảnh báo | Đơn hàng & Công nợ | Hoàn thành |
| **38** | 11:41:22 - 26/10/2026 | Sửa lỗi mờ tên nút in phiếu (chữ trắng trên nền trắng); Bổ sung nút bấm và tính năng mở phiếu in trực tiếp ra Tab mới trong trình duyệt | Đơn hàng / In ấn | Hoàn thành |
| **39** | 11:51:22 - 26/10/2026 | Bổ sung Báo cáo Lợi nhuận toàn diện: Thẻ KPI doanh số, giá vốn, lãi gộp & tỷ suất LN; Biểu đồ Top hoa sinh lời; Bảng phân tích lợi nhuận theo loại hoa và theo đơn hàng | Đơn hàng / Báo cáo | Hoàn thành |
| **40** | 13:22:15 - 26/10/2026 | Đổi cột Công nợ trên danh sách đơn hàng thành Công nợ cũ (`oldDebt` thay vì `debtAmount`) và bổ sung cột Thanh toán (`totalPayment`) | Đơn hàng | Hoàn thành |
| **41** | 13:30:28 - 26/10/2026 | Tối ưu bảng mặt hàng đơn hàng: Bỏ nút "Đổi hoa", mở rộng tên hoa thành 2 dòng (Tên hoa bên trên, Tên riêng + Tồn bên dưới), bỏ khung bao quanh chuyển thành ô kẻ khung kế toán liền mạch | Đơn hàng / Nhập liệu | Hoàn thành |
| **42** | 13:46:12 - 26/10/2026 | Cột Công nợ cũ & Thanh toán ở module Đơn hàng là CỘT ẢO đồng bộ Real-time: Tự động tính theo dòng thời gian lũy kế thực tế (Running Balance), hiển thị rõ trạng thái Dư nợ (`Dư: ...`) và khấu trừ thanh toán chuẩn xác | Đơn hàng & Công nợ | Hoàn thành |
| **43** | 14:18:00 - 26/10/2026 | Danh sách NPP: Thêm số ngày lên đơn gần nhất và cảnh báo quá 3 ngày chưa nhập thêm hoa (Cột bảng, Thẻ Mobile, Bộ lọc nhanh, Drawer chi tiết) | Nhà phân phối (NPP) | Hoàn thành |
| **44** | 14:29:15 - 26/10/2026 | Modal Chi tiết đơn hàng: Xóa bỏ nút "Thanh toán đủ" tránh nhầm lẫn và sai lệch sổ công nợ | Đơn hàng | Hoàn thành |
| **45** | 14:34:00 - 26/10/2026 | Drawer Chi tiết NPP: Bảng đơn hàng mua rút gọn chuẩn 4 cột (Ngày, Số lượng, Tổng tiền, Trạng thái) | Nhà phân phối (NPP) | Hoàn thành |
| **46** | 14:54:00 - 26/10/2026 | Sửa lỗi công nợ theo ngày ở Chi tiết NPP (Lũy kế liên tục từng dòng, khớp thẻ KPI) & Mở rộng chiều rộng Drawer/bảng thông thoáng | NPP & Công nợ | Hoàn thành |
| **47** | 14:25:00 - 29/10/2026 | Tích hợp API OCR Ocr4AI (`https://ocr.laychu.com/api-docs#models`): Engine OCR chuyên hóa đơn tiếng Việt siêu tốc (300-600ms), xuất bảng Markdown và bóc tách tự động vào Đơn hàng NCC | Đơn hàng NCC / OCR | Hoàn thành |
| **48** | 14:42:00 - 29/10/2026 | Căn lề phải Drawer Đọc ảnh ra đơn, mở rộng kích thước siêu thoáng (76rem / 90rem / Toàn màn hình) và tích hợp bộ công cụ phóng to thu nhỏ & kéo di chuyển ảnh (Zoom & Pan) | Đơn hàng NCC / OCR | Hoàn thành |
| **49** | 13:42:46 - 05/11/2026 | Bổ sung tab thứ 3 "Lịch sử thao tác" trong module Đơn hàng: Tự động ghi lại nhật ký Thêm mới, Chỉnh sửa, Xóa, Đổi trạng thái của từng nhân viên kèm đối chiếu dữ liệu thay đổi (Diff) và snapshot | Đơn hàng / Nhật ký | Hoàn thành |
| **50** | 14:52:20 - 05/11/2026 | Kết nối hệ thống Web với Google Sheets (`HOA_KHANG_THANH`) qua Google Service Account: Tự động thiết kế và tạo lập 11 sheets chuẩn kế toán cho từng module, tích hợp đồng bộ 2 chiều (Push/Pull) và Auto-sync | Toàn hệ thống / Google Sheets | Hoàn thành |
| **51** | 23:45:00 - 06/11/2026 | Tối ưu hóa & thống nhất cột Đối tác module Công nợ khớp với Google Sheets: Gộp cột Mã & Tên thành 1 cột "NPP / Khách hàng" (đối tác), loại bỏ ô viền rỗng khi không có mã, tự động hiển thị mã đối tác dưới dạng badge thông minh, đồng bộ hai chiều chính xác | Công nợ / Đối tác | Hoàn thành |

---

## II. CHI TIẾT NỘI DUNG TỪNG YÊU CẦU & KẾT QUẢ TRIỂN KHAI

### Yêu cầu 1: Tái cấu trúc toàn diện hệ thống quản lý hoa
- **Thời gian:** `22:13:17 - 25/10/2026`
- **Nguyên văn yêu cầu:**
  > *"xóa hết các modul đi . thêm modul mới là đơn hàng, danh sách hoa, danh sách ncc, danh sách npp, danh sách nhân viên, tồn kho, thu chi, dashboad nữa"*
- **Giải pháp & Triển khai:**
  - Dọn dẹp toàn bộ các module thừa từ khung ban đầu.
  - Tích hợp 8 module chuẩn chuyên biệt ngành hoa:
    1. Đơn hàng (`/don-hang`)
    2. Danh sách hoa (`/hoa`)
    3. Nhà phân phối / Khách hàng (`/npp`)
    4. Nhà cung cấp / Vườn hoa (`/ncc`)
    5. Nhân viên (`/nhan-vien`)
    6. Tồn kho (`/ton-kho`)
    7. Thu chi (`/thu-chi`)
    8. Tổng quan Dashboard (`/dashboard`)
  - File liên quan: [navigation.ts](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/config/navigation.ts), [App.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/App.tsx), [registry.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/registry.tsx).

---

### Yêu cầu 2: Giao diện Đơn hàng theo mẫu đính kèm
- **Thời gian:** `22:45:15 - 25/10/2026`
- **Nguyên văn yêu cầu:**
  > *"đơn hàng thì chỉ có đơn hàng thôi là đc. . giao diện sẽ kiểu như này"*
- **Giải pháp & Triển khai:**
  - Tối ưu module Đơn hàng thành trang chuyên nghiệp: Thanh công cụ tìm kiếm tức thì, bộ lọc trạng thái, bảng danh sách chuẩn và tab thống kê biểu đồ doanh thu.
  - File liên quan: [DonHangPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx).

---

### Yêu cầu 3: Đồng bộ giao diện Popup Drawer cạnh phải (Rộng - Vừa - Nhỏ)
- **Thời gian:** `22:55:01 - 25/10/2026`
- **Nguyên văn yêu cầu:**
  > *"các modul khác cũng thế. cũng có giao diện như đơn hàng. thêm , xem chi tiết, sửa, popop kiểu dạng bên phải có các kiểu rộng, vừa, nhỏ."*
- **Giải pháp & Triển khai:**
  - Xây dựng component [Drawer.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/components/ui/Drawer.tsx) trượt mượt mà từ cạnh phải màn hình.
  - Hỗ trợ 3 kích thước:
    - Nhỏ (`sm: max-w-md` - 448px)
    - Vừa (`md: max-w-xl` - 576px)
    - Rộng (`lg: max-w-3xl` - 768px / `xl: max-w-5xl` - 1024px)
  - Áp dụng đồng bộ cho Đơn hàng, Hoa, NPP, NCC, Thu chi, Nhân viên.

---

### Yêu cầu 4: Tái thiết kế cấu trúc dữ liệu và cột của Đơn hàng
- **Thời gian:** `23:20:26 - 25/10/2026`
- **Nguyên văn yêu cầu:**
  > *"modul đơn hàng sửa lại. 1 số po đổi thành id. 2 có ngày đặt là đc rồi. 2 nhà cung cấp đổi thành npp hoặc khách hàng lấy dữ liệu từ modul khách hàng. kho nhận bỏ đi. thêm các cột là thành tiền cước xe và trừ hàng. thành tiền là tổng tiền hàng mua sản phẩm . cước xe là điền thêm tiền. trừ hàng là khoản mk trừ cho khách hàng. thêm cột số lượng hoa nữa. xem chi tiết cho tôi mặt hàng cho tôi điền hiện gợi ý. cho tôi thêm cả giá nhập, giá bán, số lượng, thành tiền nhập, thành tiền bán, lợi nhuận nữa. phần tổng tiền thêm công nợ nữa,"*
- **Giải pháp & Triển khai:**
  - Cột bảng: Đổi "Số PO" $\rightarrow$ **ID đơn hàng**, giữ **Ngày đặt**, đổi "Nhà cung cấp" $\rightarrow$ **NPP / Khách hàng** (liên kết dữ liệu từ NPP), bỏ hẳn cột "Kho nhận".
  - Thêm các cột: **Số lượng hoa**, **Thành tiền** (tổng tiền hoa), **Cước xe** (+), **Trừ hàng** (-), **Tổng tiền** (= Thành tiền + Cước xe - Trừ hàng), **Công nợ** (còn nợ sau khi khách thanh toán).
  - Khối chi tiết mặt hàng hoa: Cho phép nhập gợi ý, hiển thị đủ **Giá nhập**, **Giá bán**, **Số lượng**, **Thành tiền nhập**, **Thành tiền bán**, **Lợi nhuận**.
  - File liên quan: [types/hoaKhangThanh.ts](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/types/hoaKhangThanh.ts), [DonHangFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx).

---

### Yêu cầu 5: Chuyển danh sách hoa trong đơn thành dạng Bảng
- **Thời gian:** `23:31:57 - 25/10/2026`
- **Nguyên văn yêu cầu:**
  > *"sao giao diện chán vậy. làm lại đi. danh sách mặt hàng làm thành dạng bảng đi. . sửa lại giao diện nhé /"*
- **Giải pháp & Triển khai:**
  - Bỏ bố cục danh thiếp thẻ rời rạc, thiết kế lại toàn bộ danh sách mặt hàng dạng **Bảng dữ liệu (Table Layout)** với header cố định, canh chỉnh số thẳng hàng, hiển thị rõ ràng từng dòng.
  - File liên quan: [DonHangFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx), [DonHangDetailModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx).

---

### Yêu cầu 6: Bỏ ký hiệu tiền tệ ("đ", "₫") và bỏ Đơn vị tính
- **Thời gian:** `23:43:23 - 25/10/2026`
- **Nguyên văn yêu cầu:**
  > *"bỏ đ sau giá tiền đi, k cần đơn vị tính. nhìn vẫn rối mắt và khó chịu"*
- **Giải pháp & Triển khai:**
  - Xóa triệt để tất cả các ký tự `₫`, `đ`, `VND` trên toàn bộ dự án.
  - Bỏ hiển thị đơn vị tính (bó, cành, kg...) trong đơn hàng và gợi ý hoa, trả lại giao diện tối giản, tập trung vào số liệu thực tế.
  - File liên quan: [format.ts](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/lib/format.ts), toàn bộ các module.

---

### Yêu cầu 7: Số tiền có dấu chấm phân cách hàng nghìn (.), giao diện ERP khít gọn
- **Thời gian:** `23:54:05 - 25/10/2026`
- **Nguyên văn yêu cầu:**
  > *"số nhập có cả . để biết điền số nào chứ. vẫn có các khoảng hở nhỉ. khít kịt đi."*
- **Giải pháp & Triển khai:**
  - Tạo component chuyên biệt tự động chèn dấu chấm phân cách hàng nghìn ngay khi người dùng đang gõ (ví dụ: gõ `50000` hiển thị ngay `50.000`).
  - Thiết kế CSS dạng compact table: padding thu gọn, các ô dữ liệu khít sát theo đúng chuẩn phần mềm ERP kế toán thực chiến.
  - File liên quan: [DonHangFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx).

---

### Yêu cầu 8: Định dạng ngày `dd/mm/yyyy`, sửa hiển thị ô chọn hoa
- **Thời gian:** `00:01:31 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"ngày để định dạng dd/mm/yyyy. mặt hàng hoa k nhìn thấy gi luôn"*
- **Giải pháp & Triển khai:**
  - Định dạng hiển thị ngày thống nhất toàn hệ thống: `dd/mm/yyyy` (26/10/2026).
  - Tạo component [DateInputVN](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx#L312) cho phép gõ ngày trực tiếp định dạng Việt Nam kèm lịch chọn.
  - Khắc phục ô tìm kiếm chọn mặt hàng hoa: căn toạ độ fixed nổi lên trên, chữ đậm tương phản cao giúp nhìn rõ ràng trên cả giao diện sáng/tối.

---

### Yêu cầu 9: Khắc phục lỗi mở Chỉnh sửa đơn hàng bị trắng màn hình
- **Thời gian:** `00:16:51 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"tôi ấn vào sửa thì trắng tinh vậy"*
- **Giải pháp & Triển khai:**
  - Xử lý triệt để nguyên nhân crash do dữ liệu `orderToEdit.items` cũ chứa trường rỗng hoặc không khớp ID phân phối.
  - Bổ sung kiểm tra an toàn (safe mapping), fallback mặc định và bộ bắt lỗi bảo vệ (Error Boundary).
  - File liên quan: [DonHangFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx#L490).

---

### Yêu cầu 10: Giữ nguyên số lượng & giá; Để trống dòng thêm mới để tự nhập
- **Thời gian:** `00:26:03 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"hiện hoa lại mất số lượng và giá rồi. xem lại đi . thêm mới thì để trống ô nhập hoa và số lượng và giá . tôi tự nhập."*
- **Giải pháp & Triển khai:**
  - Sửa logic chọn hoa: Khi chọn hoa từ popup gợi ý, chỉ cập nhật tên hoa, mã hoa và giá vốn tham chiếu, **giữ nguyên giá trị số lượng và giá bán** nếu người dùng đã nhập trước đó.
  - Khi bấm "Thêm dòng mặt hàng", hàng mới khởi tạo hoàn toàn trống (`flowerName: ''`, `quantity: 0`, `unitPrice: 0`, `costPrice: 0`) để người dùng hoàn toàn chủ động nhập.
  - File liên quan: [DonHangFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx#L640).

---

### Yêu cầu 11: Rút gọn danh sách hoa (Mã hoa + Tên hoa + Tên riêng)
- **Thời gian:** `00:32:39 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"danh sách hoa thì để mã hoa +tên hoa + tiên riêng các cột khác k cần"*
- **Giải pháp & Triển khai:**
  - Lược bỏ các cột màu sắc, quy cách, xuất xứ, hình ảnh không cần thiết trong danh sách hoa chính.
  - Tập trung vào bộ 3 thông tin cốt lõi: **Mã hoa**, **Tên hoa**, **Tên riêng** (tên gọi nội bộ/biệt danh).
  - File liên quan: [HoaPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaPage.tsx).

---

### Yêu cầu 12: View Web không cần cột Mặt hàng hoa
- **Thời gian:** `00:33:27 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"view web k cần mặt hàng hoa"*
- **Giải pháp & Triển khai:**
  - Tối ưu bảng hiển thị danh sách: Ẩn cột gom gộp mặt hàng hoa trên màn hình máy tính để bảng thông thoáng, dễ nhìn.
  - File liên quan: [HoaPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaPage.tsx).

---

### Yêu cầu 13: Gợi ý chọn hoa: Ẩn giá vốn, ẩn ĐVT, hiện tên riêng, giới hạn 10 gợi ý
- **Thời gian:** `00:42:24 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"gợi ý hoa k hiện giá vốn, k hiện dvt , hiện tên riêng đi. hiện 10 gợi ý thôi."*
- **Giải pháp & Triển khai:**
  - Cấu trúc lại popup gợi ý khi gõ tên hoa:
    - Loại bỏ hiển thị giá vốn.
    - Loại bỏ đơn vị tính.
    - Hiển thị nổi bật: **Tên hoa** kèm huy hiệu **Tên riêng**.
    - Sử dụng `.slice(0, 10)` để giới hạn hiển thị tối đa **10 gợi ý khớp nhất**.
  - File liên quan: [DonHangFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx#L615).

---

### Yêu cầu 14: Gợi ý nhanh giá nhập và giá bán theo cấp số nghìn
- **Thời gian:** `00:47:42 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"có hiện gợi ý ở giá nhập và giá bán đc k . ví dụ tôi điền 5 sẽ hiện gợi ý là 5000 50000. tôi điền 34 điền 34000 và 340000."*
- **Giải pháp & Triển khai:**
  - Xây dựng component [PriceInputWithSuggestions](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx#L70):
    - Khi người dùng gõ số: Tự động tính toán các cấp số nhân $\times 1.000$, $\times 10.000$, $\times 100.000$.
    - Ví dụ gõ `5`: Hiện bảng chọn nhanh `5.000`, `50.000`, `500.000`.
    - Ví dụ gõ `34`: Hiện bảng chọn nhanh `34.000`, `340.000`.
    - Hỗ trợ cả phím mũi tên Lên/Xuống + Enter hoặc Click chuột để chọn ngay không cần gõ nhiều số 0.

---

### Yêu cầu 15: Danh sách hoa thêm 3 tab (Tất cả, Giá bán, Giá nhập)
- **Thời gian:** `00:50:46 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"dach sách hoa thêm tôi 3 tap là tất cả, giá bán , giá nhập. tap giá bán thì hiện cột hoa , số lượng, giá bán , tt bán, tap giá nhập thì hiện các cột hoa , số lượng, giá bán , tt nhập . tap tất cả hiện full cột"*
- **Giải pháp & Triển khai:**
  - Bổ sung 3 tab chuyên sâu tại [HoaPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaPage.tsx):
    1. **Tab "Tất cả":** Hiển thị danh sách đầy đủ.
    2. **Tab "Giá bán":** Hiển thị các cột: Hoa, Số lượng, Giá bán, TT bán (Thành tiền bán).
    3. **Tab "Giá nhập":** Hiển thị các cột: Hoa, Số lượng, Giá nhập, TT nhập (Thành tiền nhập).
  - Tự động thay đổi bộ cột hiển thị khi chuyển tab.

---

### Yêu cầu 16: Bỏ Giá bán & Giá vốn ở tab Tất cả; Thêm cột Tên riêng tự điền
- **Thời gian:** `00:59:02 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"danh sách hoa sao vẫn còn giá bán và giá vốn này. xóa đi . thêm cột tên riêng , để mối người điền 1 tên vào."*
- **Giải pháp & Triển khai:**
  - Xóa bỏ cột Giá bán và Giá vốn trong tab "Tất cả" của Danh sách hoa.
  - Thêm cột **Tên riêng** có khả năng điền/chỉnh sửa trực tiếp (inline edit) hoặc cập nhật qua Drawer chi tiết hoa để mỗi nhân viên có thể gán tên riêng cho từng mặt hàng.
  - File liên quan: [HoaPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaPage.tsx).

---

### Yêu cầu 17: Bổ sung 4 cột công nợ cho Danh sách NCC và Danh sách NPP
- **Thời gian:** `01:01:36 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"danh sách ncc thêm cho tôi công nợ cũ, tiền nhập hoa , tiền trả ncc công nợ cuối. và danh sách npp thêm cho tôi công nợ cũ , tiền bán hoa, tiền thu nợ, công nợ cuối"*
- **Giải pháp & Triển khai:**
  - **Module Danh sách NCC ([NCCPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/ncc/NCCPage.tsx)):**
    - Thêm 4 cột: `Công nợ cũ`, `Tiền nhập hoa`, `Tiền trả NCC`, `Công nợ cuối` ($= \text{Cũ} + \text{Nhập} - \text{Đã trả}$).
  - **Module Danh sách NPP ([NPPPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPPage.tsx)):**
    - Thêm 4 cột: `Công nợ cũ`, `Tiền bán hoa`, `Tiền thu nợ`, `Công nợ cuối` ($= \text{Cũ} + \text{Bán} - \text{Đã thu}$).
  - Tính toán tự động và đồng bộ với sổ quỹ thu chi.

---

### Yêu cầu 18: Tạo phân hệ Công nợ (`/cong-no`) theo ngày cho NPP và NCC
- **Thời gian:** `01:04:22 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"thêm modul công nợ hiện đầy đủ công nợ theo ngày của npp và ncc"*
- **Giải pháp & Triển khai:**
  - Xây dựng module hoàn chỉnh **Quản lý công nợ** tại đường dẫn `/cong-no`:
    - Quản lý nhật ký công nợ theo ngày (`dd/mm/yyyy`) cho cả NPP (Khách bán buôn) và NCC (Vườn hoa).
    - Thống kê đối soát: Nợ đầu ngày, Phát sinh tăng (Tiền xuất hoa / Tiền nhập hoa), Phát sinh giảm (Tiền thu nợ / Tiền trả nợ), Nợ cuối ngày.
    - Bộ lọc theo ngày, theo đối tác, theo phân loại NPP/NCC.
    - Thẻ KPI tổng hợp, biểu đồ công nợ [CongNoStats.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoStats.tsx), hỗ trợ xuất file Excel (`.xlsx`).
  - File liên quan: [CongNoPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx), [useDebtStore](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/hoaKhangThanhStore.ts#L407).

---

### Yêu cầu 19: Chi tiết NPP hiển thị Đơn hàng mua & Bảng công nợ theo ngày
- **Thời gian:** `01:04:28 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"click vào chi tiết npp sẽ hiện ra đơn hàng mua của npp lấy từ modul đơn hàng. thêm bảng công nợ theo ngày nữa lấy từ modul công nợ."*
- **Giải pháp & Triển khai:**
  - Tại [NPPPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPPage.tsx) và [NPPDrawer.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPDrawer.tsx):
    - Cho phép click thẳng vào bất kỳ dòng nào để mở Drawer xem chi tiết.
    - Chia 2 sub-tab dữ liệu thực tế:
      1. **Tab "Đơn hàng mua":** Lấy toàn bộ danh sách đơn đặt của khách từ `useOrderStore` (chi tiết mặt hàng hoa, số lượng, thành tiền, đã trả, còn nợ, trạng thái).
      2. **Tab "Công nợ theo ngày":** Lấy toàn bộ nhật ký công nợ theo ngày từ `useDebtStore` (ngày `dd/mm/yyyy`, nợ cũ, tiền mua hoa (+), tiền đã thu (-), nợ cuối, ghi chú, người lập).

---

### Yêu cầu 20: Phân hệ Thu chi thêm nút bấm Chi phí cố định (Xăng 50.000...)
- **Thời gian:** `01:05:39 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"modul thu chi thêm có nút chi phí cố định, như là thêm nút xăng thì thêm vào là chi xăng là 50k ."*
- **Giải pháp & Triển khai:**
  - Thiết kế thanh công cụ **"Chi phí cố định (Thêm nhanh 1 chạm)"** đặt ngay đầu trang [ThuChiPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/thu-chi/ThuChiPage.tsx):
    - Nút ⛽ **Xăng xe: 50.000** $\rightarrow$ Bấm 1 phát tự động tạo phiếu chi tiền mặt 50.000 vào sổ quỹ kèm thông báo thành công.
    - Các nút có sẵn: 🍱 Cơm ca: 40.000, 📦 Băng keo/Xốp: 60.000, 💧 Nước uống: 20.000, 🚚 Phí bến bãi: 30.000.
    - Nút **"Cấu hình (+)"**: Mở modal [FixedExpenseModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/thu-chi/FixedExpenseModal.tsx) cho phép tự tạo thêm hoặc xoá các nút chi cố định tuỳ ý.
    - Trong Drawer tạo phiếu chi cũng có sẵn thanh chip chọn nhanh chi phí cố định.

---

### Yêu cầu 21: Module Đơn hàng cảnh báo Chưa trả nợ theo nguyên tắc FIFO quá 3 ngày
- **Thời gian:** `01:08:35 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"modul đơn hàng , nếu lên đơn hàng mà khách 3 ngày mà chưa thanh toán công nợ gần nhất sẽ thông báo là chưa trả nợ. kiểu là đơn 1 là 10 đơn 2 là 50 đơn 3 là 60 đơn 4 là 30 , nếu khách trả 5 <10 thì báo là chưa trả nợ, còn nếu khách đã trả là 30 >10 thì k cần thông báo."*
- **Giải pháp & Triển khai:**
  - Tạo thuật toán kiểm tra công nợ quá hạn FIFO tại [debtCheck.ts](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/lib/debtCheck.ts):
    - Phân bổ tổng tiền khách đã thanh toán lần lượt từ đơn cũ nhất đến đơn mới nhất.
    - Bất kỳ đơn nào có ngày đặt $\ge 3$ ngày mà số tiền phân bổ chưa đủ giá trị đơn (còn nợ $> 0$) sẽ kích hoạt trạng thái **Chưa trả nợ**.
    - Ngược lại, nếu khách đã trả đủ bù đắp các đơn cũ $\ge 3$ ngày (như ví dụ trả $30 \ge 10$) $\rightarrow$ Hệ thống tự động không cảnh báo.
  - Cảnh báo đa tầng:
    1. Toast cam xuất hiện ngay khi chọn khách hàng trong [DonHangFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx).
    2. Khung màu đỏ liệt kê chi tiết đơn cũ nợ bao nhiêu trong form tạo đơn.
    3. Hộp thoại xác nhận trước khi cho phép lưu đơn mới.
    4. Huy hiệu cảnh báo đỏ `⚠️ Chưa trả nợ (X ngày)` kèm bộ lọc `Chưa trả nợ (> 3 ngày)` tại [DonHangPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx).
    5. Banner cảnh báo trực quan trong [DonHangDetailModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx).

---

### Yêu cầu 22: Lưu nhật ký toàn bộ yêu cầu kèm mốc thời gian vào 1 file
- **Thời gian:** `01:09:59 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"hãy đưa tất cả yêu cầu của tôi vào 1 file yc đi. để tôi có thể xem lại những gi mình yêu cầu. yc có giờ nữa nhé"*
- **Giải pháp & Triển khai:**
  - Trích xuất toàn bộ lịch sử từ file nhật ký hội thoại.
  - Tổng hợp thành file tài liệu chuẩn: [YEU_CAU.md](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/YEU_CAU.md) và [yc.md](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/yc.md).
  - Có đầy đủ mốc thời gian chính xác tới từng giây, phân loại module và đối chiếu giải pháp kỹ thuật.

---

### Yêu cầu 23: Tùy chỉnh cột: Căn lề icon, xuống dòng icon, kích thước pixel và ghim cột ở tất cả module
- **Thời gian:** `07:29:30 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"phần tùy chỉnh cột thêm căn lề, xuống dòng dạng icon. kích thước và ghim cột nữa, ở tất cả modul"*
- **Giải pháp & Triển khai:**
  - Nâng cấp toàn diện popup tùy chỉnh cột [ColumnSettings.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/components/data/ColumnSettings.tsx):
    1. **Căn lề (Align) dạng icon:** 3 nút icon chuyển đổi nhanh: `AlignLeft` (Trái), `AlignCenter` (Giữa), `AlignRight` (Phải).
    2. **Xuống dòng (Wrap text) dạng icon:** Nút icon `WrapText` cho phép bật/tắt chế độ hiển thị nhiều hàng (`whitespace-normal break-words`) hoặc cắt gọn 1 dòng (`truncate`).
    3. **Ghim cột (Pin column) dạng icon:** Nút icon `Pin` ghim cố định cột bên trái khi cuộn ngang, có icon ghim và hiệu ứng đổ bóng ngăn cách bảng.
    4. **Kích thước cột (Column width):** Ô nhập số pixel trực tiếp kèm đơn vị `px` (bước nhảy 10px, min 40px, max 800px).
    5. **Tự động ghi nhớ cấu hình (Persistence):** Tạo hook [useColumnSettings.ts](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/hooks/useColumnSettings.ts) lưu trữ cấu hình cột vào `localStorage` cho từng module riêng biệt.
  - Đồng bộ và hỗ trợ đầy đủ trên tất cả 8 module:
    1. Đơn hàng ([DonHangPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx))
    2. Danh sách hoa ([HoaPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaPage.tsx))
    3. Danh sách NCC ([NCCPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/ncc/NCCPage.tsx))
    4. Danh sách NPP ([NPPPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPPage.tsx))
    5. Danh sách nhân viên ([NhanVienPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/nhan-vien/NhanVienPage.tsx))
    6. Tồn kho ([TonKhoPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/ton-kho/TonKhoPage.tsx))
    7. Thu chi ([ThuChiPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/thu-chi/ThuChiPage.tsx))
    8. Công nợ ([CongNoPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx))

---

### Yêu cầu 24: Báo cáo thống kê đơn hàng: Danh sách hoa mua lọc theo ngày
- **Thời gian:** `07:51:40 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"báo cáo  thống kê  ở modul đơn hàng thêm   danh sách hoa mua lọc theo ngày ."*
- **Giải pháp & Triển khai:**
  - Nâng cấp toàn diện tab **Báo cáo & Thống kê đơn** ([DonHangStats.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangStats.tsx)):
    1. **Thanh lọc ngày chuyên sâu:**
       - Nút chọn nhanh: `Tất cả`, `Hôm nay`, `Hôm qua`, `7 ngày qua`, `Tháng này`.
       - Ô chọn khoảng ngày tự do: `Từ ngày` - `Đến ngày` (`dd/mm/yyyy`).
       - Lọc theo từng NPP / Khách hàng hoặc tìm kiếm theo tên hoa, mã hoa, tên riêng.
    2. **Khối tóm tắt KPI tức thì cho khoảng thời gian đã chọn:**
       - Tổng sản lượng hoa đã mua (hoa).
       - Tổng thành tiền hoa mua (không có ký hiệu tiền tệ `₫`).
       - Số chủng loại hoa phát sinh giao dịch.
       - Số đơn hàng liên quan.
    3. **Hai chế độ xem dữ liệu linh hoạt (View Mode):**
       - **Chế độ 1: Tổng hợp theo loại hoa (Gom nhóm):** Hiển thị STT, Mã hoa, Tên hoa, Tên riêng, Tổng SL mua, Đơn giá trung bình, Tổng thành tiền, Số đơn mua, Tỷ trọng doanh thu (%).
       - **Chế độ 2: Chi tiết từng đơn mua (Nhật ký):** Hiển thị Ngày đặt (`dd/mm/yyyy`), ID đơn hàng, NPP / Khách hàng, Mã hoa, Tên hoa & Tên riêng, Số lượng mua, Đơn giá bán, Thành tiền, Trạng thái đơn.
    4. **Xuất báo cáo Excel chuyên nghiệp:** Nút bấm 1 chạm xuất file Excel (`.xlsx`) bảng kê hoa mua có đầy đủ dữ liệu ngày tháng và số liệu tổng cộng.

---

### Yêu cầu 25: Phân hệ Đơn hàng NCC & Tính năng Đọc ảnh ra đơn (OCR AI)
- **Thời gian:** `07:57:25 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"thêm modul đơn hàng ncc. như đơn hàng . thêm ảnh đọc ảnh ra đơn danh sách hoa và số lượng thôi."*
- **Giải pháp & Triển khai:**
  - **Tạo mới phân hệ Đơn hàng NCC** ([DonHangNCCPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/DonHangNCCPage.tsx), route `/don-hang-ncc`):
    - Hoàn toàn tương tự quy trình chuẩn của module Đơn hàng nhưng chuyên biệt cho đơn nhập từ Nhà vườn / Nhà cung cấp (PO NCC).
    - Quản lý đầy đủ: ID đơn nhập (`PO-NCC-xxx`), Ngày đặt, Nhà cung cấp / Nhà vườn, Số lượng hoa, Thành tiền hoa, Cước xe nhà vườn (+), Trừ hàng / bớt giá (-), Tổng tiền nhập, Đã trả NCC, Còn nợ NCC, Trạng thái đơn (Nháp, Đã gửi cho NCC, Đang chuyển, Đã nhập kho, Đã hủy).
    - Hỗ trợ đầy đủ bộ lọc đa tiêu chí, tìm kiếm nhanh, phân trang, và **Tùy chỉnh cột** (căn lề icon, xuống dòng icon, ghim cột, độ rộng pixel) đồng bộ hệ thống.
  - **Tính năng Đọc ảnh ra đơn (OCR AI Image-to-Order):**
    - Component [ImageOrderReaderModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/ImageOrderReaderModal.tsx):
      - Kéo thả file ảnh, duyệt ảnh từ máy tính hoặc **dán ảnh trực tiếp từ clipboard (`Ctrl+V`)** (tiện lợi khi chụp màn hình tin nhắn Zalo từ chủ vườn).
      - Nút bấm *"Dùng ảnh phiếu mẫu nhà vườn"* để thử nghiệm ngay lập tức.
      - Ứng dụng công nghệ nhận diện chữ thông minh qua thư viện `tesseract.js` nạp động (dynamic import).
    - Thuật toán bóc tách thông minh [imageParser.ts](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/imageParser.ts):
      - Nhận diện đúng **Tên hoa** và **Số lượng** (chỉ lấy hoa và số lượng theo đúng yêu cầu).
      - Fuzzy matching so khớp với danh mục hoa hiện có (`useFlowerStore`) để tự động điền Mã hoa, Đơn vị tính và Giá vốn nhập.
      - Bảng xem trước và chỉnh sửa linh hoạt trước khi xác nhận.
      - Nút bấm *"Đưa vào đơn hàng NCC"* tự động điền thẳng danh sách mặt hàng vào form tạo đơn nhập.
  - **Form tạo & chỉnh sửa đơn nhập:** [DonHangNCCFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/DonHangNCCFormModal.tsx) tích hợp sẵn nút *"📷 Đọc ảnh ra đơn"* ngay trên thanh công cụ và bảng mặt hàng hoa.
  - **Drawer chi tiết đơn & In phiếu:** [DonHangNCCDetailModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/DonHangNCCDetailModal.tsx) xem danh sách hoa, cập nhật tiến độ, xác nhận thanh toán đủ và in phiếu nhập.
  - **Báo cáo & Thống kê hoa nhập:** [DonHangNCCStats.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/DonHangNCCStats.tsx) cung cấp 6 thẻ KPI, biểu đồ Top hoa nhập nhiều nhất & giá trị nhất, bảng lọc hoa nhập theo ngày (tổng hợp và chi tiết) cùng tính năng Xuất Excel.

---

### Yêu cầu 26: Danh sách hoa xóa hẳn giá & Quy tắc đặt nhiều tên riêng chống trùng lặp
- **Thời gian:** `08:03:30 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"1 danh sách hoa k cần giá . xóa hẳn giá đi .
  > 2  tên riêng có nhiều ng đặt tên thì cách nhau dấu , . tên riêng k đc trùng nhau, tên hoa cũng k trùng nhau, kể cả  chữ hoa chữ thường"*
- **Giải pháp & Triển khai:**
  1. **Xóa bỏ hoàn toàn giá trong Danh sách hoa:**
     - Tại Drawer chi tiết hoa ([HoaDrawer.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaDrawer.tsx)): Xóa hẳn 2 ô "Giá vốn nhập" và "Giá bán sỉ NPP".
     - Tại form Thêm / Sửa hoa: Xóa bỏ 2 ô nhập liệu "Giá nhập vốn (VNĐ)" và "Giá bán sỉ NPP (VNĐ)".
     - Tại tab Thống kê hoa ([HoaStats.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaStats.tsx)): Xóa bỏ thẻ KPI "Giá trị vốn tồn" và hàm tính tiền tệ `formatVND`, thay bằng thẻ "Chủng loại hoa".
     - Bảng danh sách hoa ([HoaPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaPage.tsx)) hoàn toàn không có cột giá, giao diện tinh gọn, thoáng đãng.
  2. **Tên riêng hỗ trợ nhiều người đặt cách nhau bởi dấu phẩy (`,`) & Chống trùng lặp tuyệt đối:**
     - Xây dựng bộ công cụ chuẩn hóa và kiểm tra [flowerValidation.ts](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/lib/flowerValidation.ts):
       - `parseAliases(customName)`: Tự động tách các tên riêng qua dấu phẩy, loại bỏ khoảng trắng thừa và deduplicate nội bộ.
       - `validateFlowerName(...)`: Đảm bảo **Tên hoa không được trùng nhau** giữa các giống hoa, kể cả chữ hoa chữ thường (`case-insensitive`), và không được trùng với tên riêng của giống hoa khác.
       - `validateFlowerAliases(...)`: Đảm bảo **Các tên riêng không được trùng nhau** giữa các giống hoa, kể cả chữ hoa chữ thường, và không được trùng với chính tên hoa.
     - **Áp dụng đồng bộ:**
       - **Tại bảng danh sách ([HoaPage.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/hoa/HoaPage.tsx)):** Ô nhập trực tiếp tên riêng kiểm tra tự động khi người dùng gõ xong (onBlur/Enter); nếu trùng lặp sẽ hiện thông báo lỗi `toast.error` và tự động khôi phục giá trị hợp lệ trước đó.
       - **Tại Drawer chi tiết hoa:** Hiển thị danh sách các tên riêng dưới dạng tag/badge nổi bật.
       - **Tại Drawer thêm/sửa hoa:** Hướng dẫn rõ ràng và kiểm tra chặn lưu nếu vi phạm trùng tên hoa hoặc trùng tên riêng.
       - **Tại thuật toán tìm kiếm và OCR:** Tự động đối soát từng tên riêng riêng lẻ để nhận diện hoa chính xác tối đa.

---

### Yêu cầu 27: Tối ưu gợi ý hoa trong đơn hàng: Bỏ cột giá tiền gợi ý & Cho tên riêng xuống dòng
- **Thời gian:** `08:27:30 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"gợi ý vẫn có giá tiền này. k cần gợi ý giá. 
  > cho tên riêng xuống dòng,"*
- **Giải pháp & Triển khai:**
  1. **Bỏ hoàn toàn cột giá tiền trong popup gợi ý mặt hàng hoa ([DonHangFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx)):**
     - Xóa bỏ cột giá bán sỉ / giá vốn (`7.000`, `95.000`, `165.000`, `120.000`...) nằm ở cạnh phải của từng dòng hoa trong popup gợi ý (theo đúng ô khoanh đỏ trong ảnh chụp màn hình).
     - Không hiển thị giá tiền gợi ý tại cả popup chọn hoa từng dòng (`Row Picker`) và ô tìm kiếm nhanh (`Quick Add`).
  2. **Cho Tên riêng xuống dòng (dòng 2):**
     - Đưa thông tin `Tên riêng` xuống dòng thứ 2 đặt cạnh chỉ số `Tồn kho: xxx`, không để chung trên dòng 1 gây chật chội và che khuất tên chính của hoa.
     - Dòng 1: Hiển thị nổi bật `[Mã hoa]` và `Tên hoa tươi` đầy đủ bề rộng.
     - Dòng 2: Hiển thị `Tồn kho: xxx` • `Tên riêng: [Danh sách tên riêng/biệt danh]`.
  3. **Đồng bộ trên phân hệ Đơn hàng NCC ([DonHangNCCFormModal.tsx](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/DonHangNCCFormModal.tsx)):**
     - Xóa bỏ hiển thị "Giá vốn" trong dropdown chọn hoa.
     - Đưa Tên riêng xuống dòng thứ 2 dưới Tên hoa để đồng nhất trải nghiệm người dùng trên toàn hệ thống.

---

### Yêu cầu 28: Danh sách nhân viên có mật khẩu để đăng nhập và đăng xuất hệ thống
- **Thời gian:** `08:40:28 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"danh sách nhân viên có mật khẩu để tôi có thể đăng nhập và đăng xuất"*
- **Giải pháp & Triển khai:**
  1. **Cập nhật Mô hình Nhân viên (`Employee`) & Dữ liệu mẫu:**
     - Mở rộng kiểu dữ liệu `Employee` tại [`src/types/hoaKhangThanh.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/types/hoaKhangThanh.ts): Bổ sung `username` (Tên đăng nhập), `password` (Mật khẩu), và `role` ('admin' | 'member').
     - Thiết lập thông tin tài khoản cho toàn bộ nhân viên ban đầu tại [`src/data/mockHoaData.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/data/mockHoaData.ts) (Admin `khangnv`, Kế toán `hoanguyen`, Trưởng phòng KD `lananh`, Thủ kho `thuanha`...; mật khẩu mặc định `123456`).
  2. **Xây dựng Hệ thống Xác thực Toàn diện ([`src/stores/auth.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/auth.ts)):**
     - Quản lý trạng thái phiên đăng nhập `user: AuthUser | null` được lưu trữ an toàn trong `localStorage` (Zustand persist).
     - Hàm `login(credential, password)`: Cho phép đăng nhập linh hoạt bằng Tên đăng nhập (username), Mã nhân viên (code như `NV-001`), Số điện thoại, Email hoặc Họ tên.
     - Hàm `loginAsEmployee(employee)`: Hỗ trợ chuyển đổi nhanh tài khoản 1 chạm.
     - Hàm `logout()`: Xóa phiên làm việc hiện tại, đưa hệ thống về màn hình Đăng nhập ngay lập tức.
  3. **Màn hình Đăng nhập Thương hiệu Hoa Khang Thành ([`src/modules/auth/LoginPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/auth/LoginPage.tsx)):**
     - Giao diện đăng nhập hiện đại, khít gọn với logo thương hiệu, biểu tượng hoa tươi, form nhập tài khoản và mật khẩu có nút bật/tắt mắt xem mật khẩu.
     - Thẻ danh sách truy cập nhanh (Quick 1-Click Login) cho phép chọn ngay tài khoản nhân viên (Admin, Kế toán, Kinh doanh, Thủ kho...) để kiểm thử thuận tiện.
     - Tự động bảo vệ (Auth Guard) tại [`src/App.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/App.tsx): Khi chưa đăng nhập (`!user`), hệ thống tự động hiển thị màn hình Đăng nhập; khi đăng xuất (`logout()`), người dùng lập tức quay lại màn hình đăng nhập an toàn.
  4. **Cập nhật Bảng Danh sách Nhân viên ([`src/modules/nhan-vien/NhanVienPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/nhan-vien/NhanVienPage.tsx)):**
     - Bổ sung cột mới **"Tài khoản & Mật khẩu"** với bề rộng 230px.
     - Hiển thị Tên đăng nhập (username), huy hiệu vai trò (Admin / NV), trạng thái Online của tài khoản đang đăng nhập.
     - Hiển thị mật khẩu dưới dạng ẩn (`••••••`) kèm icon con mắt để bật/tắt xem mật khẩu trực tiếp trên từng dòng.
     - Nút bấm nhanh "Đăng nhập" để chuyển đổi phiên làm việc của nhân viên tương ứng chỉ với 1 click.
     - Hỗ trợ đầy đủ trên giao diện thẻ di động (Mobile Card).
  5. **Cập nhật Drawer Nhân viên ([`src/modules/nhan-vien/NhanVienDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/nhan-vien/NhanVienDrawer.tsx)):**
     - Chế độ Xem (View Mode): Bổ sung thẻ thông tin tài khoản chuyên biệt hiển thị Username, Mật khẩu (có nút ẩn/hiện), Phân quyền và nút "Đăng nhập ngay với tài khoản này".
     - Chế độ Tạo mới / Chỉnh sửa (Create / Edit Mode): Nhập trực tiếp Tên đăng nhập (Username), Mật khẩu (có nút ẩn/hiện mắt), và phân quyền Quản trị viên (Admin) / Nhân viên tiêu chuẩn.
     - Làm sạch toàn bộ định dạng tiền tệ: tuyệt đối không chứa ký hiệu `₫` hoặc `đ`, phân cách hàng nghìn bằng dấu chấm chuẩn ERP.

---

### Yêu cầu 29: Thay đổi phần chi tiết thanh toán đơn hàng: Bỏ "Khách đã trả" thay bằng "Công nợ cũ", bỏ "Tình trạng nợ" thay bằng "Thanh toán"
- **Thời gian:** `08:46:29 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"phân chi tiết thanh toán này phải thay đổi lại . 1  khách đã trả bỏ đi thay bằng công nợ cũ, 
  > 2 tình trạng nợ bỏ đi thay bằng thanh toán"*
- **Hình ảnh đính kèm từ người dùng:** Khu vực khoanh đỏ "CHI TIẾT THANH TOÁN & CÔNG NỢ" trong Drawer Thêm mới đơn đặt hàng.
- **Giải pháp & Triển khai:**
  1. **Bỏ hoàn toàn "Khách đã trả", thay bằng "Công nợ cũ":**
     - Tại [`src/modules/don-hang/DonHangFormModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx): Xóa bỏ dòng "Khách đã trả" và nút `[Khách trả đủ]`.
     - Thay thế bằng dòng **"Công nợ cũ:"** đi kèm ô nhập số tiền có định dạng dấu chấm phân cách hàng nghìn (`FormattedNumberInput`), hỗ trợ popup gợi ý giá tự động và nút bấm nhanh `[Lấy nợ NPP]` để tự động đồng bộ công nợ hiện tại của đối tác.
     - Tự động điền số công nợ cũ của Nhà phân phối khi chọn khách hàng từ danh sách.
  2. **Bỏ "Tình trạng nợ", thay bằng "Thanh toán":**
     - Xóa bỏ hộp hiển thị "Tình trạng nợ: 0 (Đã thanh toán đủ)" / "Công nợ còn lại".
     - Thay bằng khối nổi bật **"THANH TOÁN:"** được tính toán chính xác theo công thức kế toán đại lý hoa sỉ:  
       `Thanh toán = Tổng tiền đơn hàng + Công nợ cũ`.
     - Chú thích rõ ràng dòng phụ: `Tổng tiền đơn + Công nợ cũ`.
  3. **Đồng bộ hóa trên toàn bộ hệ thống đơn hàng:**
     - **Thanh chân trang (Footer Drawer):** Cập nhật hiển thị bộ ba chỉ số chuẩn: `Tổng tiền` • `Công nợ cũ` • `Thanh toán`.
     - **Mô hình Dữ liệu (`Order`):** Bổ sung trường `oldDebt` (Công nợ cũ) và `totalPayment` (Thanh toán) tại [`src/types/hoaKhangThanh.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/types/hoaKhangThanh.ts).
     - **Modal Xem chi tiết đơn hàng ([`src/modules/don-hang/DonHangDetailModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx)):** Hiển thị chuẩn xác "Công nợ cũ" và khối "THANH TOÁN" đồng bộ với giao diện tạo/sửa đơn.

---

### Yêu cầu 30: Tích hợp mẫu form `hoa_khang_thanh.html` làm phiếu in hóa đơn bán hàng chuyên nghiệp
- **Thời gian:** `08:47:53 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"hoa_khang_thanh.html sửa dụng from html này làm phiếu in . click vào sẽ mở ra phiếu in chứ k phải in đơn"*
- **Giải pháp & Triển khai:**
  1. **Khắc phục lỗi in trực tiếp (In đơn):**
     - Trước đây khi ấn nút "In phiếu", hệ thống kích hoạt trực tiếp hàm `window.print()` làm in toàn bộ trang web/drawer không đúng biểu mẫu hóa đơn.
     - Đã chuyển đổi hành vi: Khi người dùng click nút "In phiếu" (tại danh sách đơn hàng hoặc modal chi tiết đơn), hệ thống **mở ra Phiếu in xem trước (Invoice Preview)** sắc nét, chuẩn nhận diện Khang Thành Flower theo đúng form `hoa_khang_thanh.html`.
  2. **Xây dựng Modal Phiếu In Hóa Đơn Chuyên Biệt ([`HoaDonPrintModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/HoaDonPrintModal.tsx)):**
     - Tái hiện 100% bố cục, màu sắc sang trọng (phông chữ `Playfair Display` + `Montserrat`, tông vàng gold `#b38b00` và xanh hoàng gia `#1e3a8a`), logo thương hiệu Khang Thành Flower và mã QR ngân hàng thanh toán nhanh (`VietQR`).
     - Bảng chi tiết mặt hàng: Cột tích chọn kiểm tra (V), STT, Tên hoa, Số lượng, Đơn giá, Thành tiền và ô nhập Ghi chú riêng cho từng loại hoa.
     - Bảng tổng kết Glassmorphism: Tiền hàng, Phí vận chuyển (Cước xe), Tiền trừ hàng, TỔNG CỘNG, Nợ cũ (Công nợ cũ) và THANH TOÁN (tổng số tiền khách cần thanh toán).
  3. **Hỗ trợ Đa Chế Độ In & Chia Sẻ Thông Minh:**
     - **In A4 Đầy đủ:** In hóa đơn hoàn chỉnh bao gồm bảng giá, cước xe, trừ hàng, nợ cũ, thanh toán và mã QR.
     - **In Tối giản (Tên + SL):** Tự động ẩn giá tiền và thanh toán, phóng to chữ và hiển thị cột ô tích chọn kiểm hàng (V) + Ghi chú cho tài xế/kho khi giao nhận.
     - **Mở Tab Riêng:** Mở trực tiếp trang hóa đơn độc lập [`/hoa_khang_thanh.html`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/public/hoa_khang_thanh.html) với tham số đơn hàng đầy đủ.
     - **Sao chép link hóa đơn:** Hỗ trợ gửi nhanh link phiếu in cho khách hàng qua Zalo / Tin nhắn.
  4. **Tích hợp Nút In Phiếu:**
     - Đã thêm icon Máy in (`Printer`) tại cột thao tác của từng dòng đơn hàng trong [`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx) và nút "In phiếu" trên thẻ di động.
     - Cập nhật nút "In phiếu" trong [`DonHangDetailModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx) để mở phiếu in.

### Yêu cầu 31: Kiểm tra và làm sạch toàn bộ số liệu công nợ hiển thị sai (Làm sạch về 0 để nhập lại từ đầu)
- **Thời gian:** `09:20:51 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"xem lại số liệu công nợ hiển thị đang sai . k đúng thì xóa hết dữ liệu đi để tôi điền lại từ đầu"*
- **Giải pháp & Triển khai:**
  1. **Rà soát nguyên nhân sai lệch số liệu:**
     - Các file dữ liệu mẫu (`INITIAL_ORDERS`, `INITIAL_SUPPLIER_ORDERS`, `INITIAL_DEBT_RECORDS`, `INITIAL_DISTRIBUTORS`, `INITIAL_SUPPLIERS`) chứa các số tiền giả định cũ (ví dụ: công nợ 5.200.000, 15.200.000) không khớp với nhau giữa các module Đơn hàng, Công nợ, NPP và NCC.
     - Dữ liệu mẫu cũ kích hoạt cảnh báo sai "Chưa trả nợ" (do đơn hàng mẫu quá hạn 3 ngày) và gây nhầm lẫn khi người dùng muốn sử dụng thực tế.
  2. **Làm sạch toàn diện dữ liệu mẫu (Reset về 0):**
     - Trong [`src/data/mockHoaData.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/data/mockHoaData.ts):
       - Đưa `INITIAL_DEBT_RECORDS` về mảng rỗng `[]`.
       - Đưa `INITIAL_ORDERS` về mảng rỗng `[]`.
       - Đưa `INITIAL_SUPPLIER_ORDERS` về mảng rỗng `[]`.
       - Đưa tất cả số liệu công nợ (`oldDebt`, `salesAmount`, `collectedAmount`, `finalDebt`, `currentDebt`, `totalRevenue`) của toàn bộ NPP về `0`.
       - Đưa tất cả số liệu công nợ (`oldDebt`, `importAmount`, `paidAmount`, `finalDebt`, `totalDebt`) của toàn bộ NCC về `0`.
  3. **Tự động thanh lọc bộ nhớ trình duyệt (LocalStorage Purge):**
     - Xây dựng hàm `clearAllDebtAndOrderData()` trong [`src/stores/hoaKhangThanhStore.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/hoaKhangThanhStore.ts) tự động xóa sạch các khóa lưu trữ cục bộ (`hkt-debt-records-storage`, `hkt-orders-storage`, `hkt-supplier-orders-storage`) và đưa mọi trạng thái nợ về 0 ngay khi khởi động lại ứng dụng.
  4. **Bổ sung các nút bấm chủ động đặt lại công nợ về 0:**
     - **Module Công nợ ([`CongNoPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx)):** Thêm nút bấm **"Xóa sạch công nợ (Về 0)"** có hộp thoại xác nhận an toàn.
     - **Module Nhà phân phối ([`NPPPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPPage.tsx)):** Thêm nút bấm **"Đặt lại nợ về 0"** trên thanh công cụ.
     - **Module Nhà cung cấp ([`NCCPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/ncc/NCCPage.tsx)):** Thêm nút bấm **"Đặt lại nợ về 0"** trên thanh công cụ.
     - **Module Đơn hàng ([`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx)) & Đơn NCC ([`DonHangNccPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/DonHangNccPage.tsx)):** Thêm nút **"Xóa tất cả đơn"** khi có đơn hàng để dễ dàng làm sạch giao diện.
  5. **Xác nhận công thức tính công nợ chuẩn xác:**
     - NPP: Công nợ cuối = Công nợ cũ + Tiền bán hoa - Tiền thu nợ
     - NCC: Công nợ cuối = Công nợ cũ + Tiền nhập hoa - Tiền trả NCC
     - Đơn hàng: THANH TOÁN = Tổng tiền đơn + Công nợ cũ

### Yêu cầu 32: Đồng bộ và liên kết tự động 2 chiều giữa Đơn hàng và Công nợ (Lên đơn hàng tự động thêm công nợ)
- **Thời gian:** `09:36:23 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"khi lên đơn hàng phải thêm công nợ cho tôi luôn chứ. 2 cái nó link cho nhau và đồng bộ cho nhau"*
- **Giải pháp & Triển khai:**
  1. **Thiết lập đồng bộ tức thì 2 chiều giữa Đơn hàng và Công nợ:**
     - Trước đây, khi tạo đơn hàng mới trong module Đơn hàng, hệ thống chưa tự động tạo bản ghi phát sinh công nợ bên module Công nợ (`useDebtStore`).
     - Đã bổ sung hàm liên kết chuyên biệt `syncOrderToDebt()` và `recalcDistributorDebts()` trong [`hoaKhangThanhStore.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/hoaKhangThanhStore.ts).
     - Ngay khi người dùng ấn **Tạo đơn hàng** (`addOrder`):
       - Tự động sinh một bản ghi công nợ tương ứng tại tab **Công nợ Nhà Phân Phối (NPP)** với đầy đủ: Ngày ghi nhận, Mã NPP, Tên NPP, Chứng từ / ĐH (`order.code`), Công nợ cũ, Tiền bán hoa (+) = Tổng tiền đơn, Tiền thu nợ (-) = Số tiền khách đã trả ngay, Công nợ cuối = Nợ cũ + Tiền bán - Tiền thu.
       - Tự động cập nhật tổng phát sinh vào danh mục **Nhà Phân Phối** ([`NPPPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPPage.tsx)): Tiền bán hoa cộng dồn, Tiền thu nợ cộng dồn, Công nợ cuối cập nhật tức thì.
     - Khi chỉnh sửa đơn hàng (`updateOrder`) hoặc xác nhận thanh toán (`updatePaymentStatus`):
       - Tự động cập nhật lại bản ghi công nợ và số dư nợ của đối tác.
     - Khi xóa đơn hàng (`deleteOrder`):
       - Tự động loại bỏ bản ghi công nợ tương ứng khỏi module Công nợ và hoàn nguyên số dư nợ của NPP.
  2. **Đồng bộ tự động tương tự cho Đơn hàng NCC (Nhập hoa):**
     - Bổ sung hàm liên kết `syncSupplierOrderToDebt()` và `recalcSupplierDebts()`.
     - Lên đơn nhập hoa từ nhà vườn (`useSupplierOrderStore`): Tự động ghi nhận phát sinh tại tab **Công nợ Nhà Cung Cấp (NCC)** và cập nhật công nợ của NCC trong [`NCCPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/ncc/NCCPage.tsx).
  3. **Tự động tải công nợ cũ của đối tác khi lên đơn:**
     - Trong modal tạo đơn hàng ([`DonHangFormModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx)): Khi chọn khách hàng / NPP, hệ thống tự động kiểm tra công nợ cuối gần nhất từ module Công nợ và điền sẵn vào ô **Công nợ cũ**, hỗ trợ tính toán chính xác mục **THANH TOÁN = Tổng tiền đơn + Công nợ cũ**.
  4. **Cơ chế tự động đồng bộ bù (`syncAllOrdersToDebtRecords`):**
     - Đảm bảo toàn bộ đơn hàng luôn được liên kết đồng nhất với các bản ghi công nợ ngay khi khởi động.

### Yêu cầu 33: Cải tiến bảng công nợ: Thêm ghi theo ngày & ghi theo đơn, Thu/Chi, Số tiền, Công nợ còn; Xóa bỏ các cột cũ (Công nợ cũ, Tiền bán, Tiền thu nợ, Công nợ cuối)
- **Thời gian:** `10:12:42 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"công nợ này thì thêm ghi theo ngày và ghi theo đơn . có thu ,chi . có số tiền và công nợ còn. công nợ cũ với tiền bán, tiền thu nợ, công nợ cuối xóa đi ."*
- **Giải pháp & Triển khai:**
  1. **Xóa bỏ hoàn toàn 4 cột cũ gây trùng lặp và rối mắt:**
     - Xóa bỏ 4 cột cũ: `Công nợ cũ` (`oldDebt`), `Tiền bán hoa` (`increaseAmount`), `Tiền thu nợ` (`decreaseAmount`), và `Công nợ cuối` (`finalDebt`) khỏi bảng công nợ của cả 2 tab Nhà Phân Phối (NPP) và Nhà Cung Cấp (NCC).
  2. **Bổ sung 4 cột chuẩn nghiệp vụ sổ phụ công nợ (AR/AP Ledger):**
     - **Hình thức ghi (`entryType`):** Phân định rõ ràng `📅 Ghi theo ngày` hoặc `📦 Ghi theo đơn` với huy hiệu trực quan.
     - **Thu / Chi (`type`):** Hiển thị rõ bản chất dòng tiền với icon và màu chuẩn kế toán: `↓ Thu tiền` (xanh lá) và `↑ Chi tiền` (xanh dương).
     - **Số tiền (`amount`):** Giá trị tiền phát sinh của giao dịch hoặc lô hàng (định dạng dấu chấm chuẩn, không kèm ký hiệu `₫`/`đ`).
     - **Công nợ còn (`remainingDebt`):** Số dư nợ còn lại của đối tác sau khi thực hiện giao dịch (in đậm, nổi bật màu đỏ cảnh báo nợ).
  3. **Bộ lọc thông minh theo hình thức ghi nhận:**
     - Bổ sung bộ 3 nút lọc nhanh trên thanh công cụ: `[ Tất cả ]` • `[ 📅 Ghi theo ngày ]` • `[ 📦 Ghi theo đơn ]` để kế toán dễ dàng lọc xem các phát sinh nợ tổng hợp theo ngày hoặc tra cứu chi tiết từng đơn đặt hàng.
  4. **Cập nhật 4 Thẻ KPI Tổng quan (Summary Cards) tại đầu trang Công nợ ([`CongNoPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx)):**
     - Card 1: `1. Tổng Thu (-)` (tổng tiền thu nợ từ khách hoặc hoàn tiền từ NCC, màu xanh lá).
     - Card 2: `2. Tổng Chi (+)` (tổng tiền xuất bán nợ hoặc chi trả tiền nhập hoa, màu xanh dương).
     - Card 3: `3. Số tiền phát sinh` (tổng kim ngạch giao dịch phát sinh).
     - Card 4: `4. Công nợ còn` (tổng công nợ còn lại hiện tại của tất cả đối tác, màu đỏ đậm).
  5. **Nâng cấp Drawer Thêm mới & Chỉnh sửa công nợ ([`CongNoDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoDrawer.tsx)):**
     - Chọn hình thức ghi: `[ 📅 Ghi theo ngày ]` hoặc `[ 📦 Ghi theo đơn ]`.
     - Khi chọn "Ghi theo đơn": Tự động mở danh sách đơn hàng tương ứng (đơn bán hoa NPP từ `useOrderStore` hoặc đơn nhập hoa NCC từ `useSupplierOrderStore`) để kế toán click chọn, hệ thống tự động điền mã chứng từ, ngày phát sinh, số tiền đơn hàng và tính lại nợ còn lại.
     - Chọn phân loại: `[ ↓ Thu tiền ]` hoặc `[ ↑ Chi tiền ]`.
     - Nhập `Số tiền phát sinh` (hỗ trợ kiểm tra định dạng tức thì).
     - Thẻ `Công nợ còn lại sau giao dịch`: Tự động tính toán theo công thức kế toán (Nợ cũ đối tác $\pm$ Số tiền phát sinh), hỗ trợ kế toán chỉnh sửa nếu có thỏa thuận chốt nợ riêng.
     - Xóa bỏ triệt để các ô nhập cũ: Công nợ cũ, Tiền bán hoa, Tiền thu nợ, Công nợ cuối.
  6. **Đồng bộ hóa Xuất Excel và Giao diện Di động (Mobile Card):**
     - File Excel xuất ra chuẩn xác các cột mới: `Hình thức ghi`, `Thu / Chi`, `Số tiền`, `Công nợ còn`.
     - Thẻ trên thiết bị di động hiển thị khít gọn, nổi bật Thu/Chi và Công nợ còn.
  7. **Tự động liên kết khi lên đơn hàng mới:**
     - Khi người dùng tạo đơn hàng bán hoa (`addOrder`) hoặc đơn hàng nhập hoa NCC (`addSupplierOrder`), hệ thống tự động sinh bản ghi công nợ với `entryType: 'order'`, phân loại `type: 'chi'`, `amount: totalAmount`, và `remainingDebt: nợ mới`, hoàn toàn đồng bộ 2 chiều.

### Yêu cầu 34: Hoàn thiện chuẩn xác chế độ "Ghi theo ngày" là Tổng hợp NPP / NCC theo từng ngày
- **Thời gian:** `10:36:55 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"ghi theo ngày là tổng hợp npp theo ngày cơ mà"*
- **Hình ảnh đính kèm từ người dùng:** Ảnh khoanh đỏ vào cột Ngày ghi nhận (`22/10/2026`) và cột Tên Nhà Phân Phối (`Chuỗi Shop Hoa Tươi FlowerBox`).
- **Giải pháp & Triển khai:**
  1. **Khắc phục triệt để lỗi logic lọc dữ liệu cũ:**
     - Trước đây, khi người dùng click vào nút `[ 📅 Ghi theo ngày ]`, bộ lọc kiểm tra cờ `entryType === 'daily'`; do các đơn hàng được tạo tự động mang mã đơn (như `DH-2026-371`), bộ lọc cũ đã loại bỏ các đơn này khiến danh sách "Ghi theo ngày" bị trống hoặc không phản ánh đúng bản chất tổng hợp của ngày hôm đó.
  2. **Triển khai thuật toán Tổng hợp NPP / NCC theo từng ngày (Daily Aggregation Engine):**
     - Tại [`CongNoPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx): Khi ở chế độ `[ 📅 Ghi theo ngày ]` (được đặt làm chế độ xem mặc định):
       - Hệ thống tự động gom nhóm (group by) toàn bộ đơn hàng và phát sinh nợ theo cặp khóa: **`Ngày ghi nhận + Mã đối tác`** (`date + partnerId`).
       - Mỗi dòng hiển thị đại diện cho **1 đối tác trong 1 ngày duy nhất**:
         - **Ngày ghi nhận:** Ngày phát sinh giao dịch (ví dụ: `22/10/2026`).
         - **Hình thức ghi:** Huy hiệu `📅 Ghi theo ngày`.
         - **Mã NPP / Tên NPP:** Thông tin chuẩn của đối tác (`NPP-001 - Chuỗi Shop Hoa Tươi FlowerBox`).
         - **Chứng từ / ĐH:** Tóm tắt tổng số đơn trong ngày (ví dụ: `1 đơn: DH-2026-371` hoặc `2 đơn (DH-001, DH-002)`).
         - **Thu / Chi:** Tổng hợp phân loại (Chi nếu mua hàng nợ, Thu nếu thanh toán nợ).
         - **Số tiền:** Tổng tiền phát sinh trong cả ngày của đối tác đó.
         - **Công nợ còn:** Số dư nợ chốt cuối ngày của đối tác đó.
  3. **Bộ nút chuyển đổi trạng thái rõ ràng, tiện lợi:**
     - `[ 📅 Ghi theo ngày (Tổng hợp NPP) ]` (chế độ mặc định xem sổ tổng hợp ngày).
     - `[ 📦 Ghi theo đơn ]` (xem chi tiết từng đơn hàng riêng biệt `DH-2026-371`).
     - `[ Tất cả ]` (xem toàn bộ các dòng phát sinh chi tiết).
  4. **Nâng cấp Drawer Chi tiết công nợ ([`CongNoDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoDrawer.tsx)):**
     - Khi click xem dòng tổng hợp ngày, Drawer hiển thị đầy đủ bảng phụ: "Chi tiết các đơn hàng & phát sinh trong ngày" liệt kê từng đơn hàng cấu thành nên số tổng hợp đó, giúp kế toán đối soát minh bạch tức thì.
  5. **Tính toán thẻ KPI Công nợ chuẩn xác:**
     - Khử trùng lặp nợ (deduplication) để đảm bảo thẻ KPI "4. CÔNG NỢ CÒN" luôn hiển thị đúng tổng công nợ thực tế của từng đối tác, không bị cộng dồn trùng theo từng ngày.

### Yêu cầu 35: Tách biệt hoàn toàn Thu và Chi riêng: Không gộp tiền thu nợ và tiền xuất bán nợ vào chung 1 dòng
- **Thời gian:** `10:58:12 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"thu chi riêng chứ  sao lại gộp lại rồi"*
- **Hình ảnh đính kèm từ người dùng:**
  - Ảnh 1: Bảng công nợ khoanh đỏ cột Chứng từ / ĐH, Thu / Chi, và Số tiền `19.800.000` (bị cộng dồn giữa đơn hàng `14.800.000` và tiền thu nợ `5.000.000`).
  - Ảnh 2: Drawer chi tiết khoanh đỏ bảng con hiển thị 2 dòng phát sinh: `DH-2026-109 Chi (Bán hoa) 14.800.000` và `Phát sinh Thu tiền 5.000.000`.
- **Giải pháp & Triển khai:**
  1. **Khắc phục lỗi gộp chung Thu và Chi:**
     - Trước đó thuật toán nhóm theo `date + partnerId` đã cộng gộp cả tiền Chi bán hoa (`14.800.000`) và tiền Thu nợ (`5.000.000`) thành một số tiền `19.800.000` và gán nhãn `↑ Chi`, làm sai lệch dòng tiền và biến tiền thu nợ thành tiền mua hoa.
  2. **Tách biệt dòng Thu và dòng Chi tuyệt đối (Group by Date + Partner + Type):**
     - Sửa đổi thuật toán nhóm trong [`CongNoPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx):
       - Khóa nhóm được phân tách rõ ràng: **`Ngày + Đối tác + Loại Thu/Chi`** (`${r.date}__${r.partnerId}__${r.type}`).
       - Các phát sinh Chi tiền / Bán hoa nợ chỉ được gom với nhau thành **dòng Chi** (`↑ Chi: 14.800.000`).
       - Các phát sinh Thu tiền / Thu nợ chỉ được gom với nhau thành **dòng Thu** (`↓ Thu: 5.000.000`).
       - Tuyệt đối không bao giờ cộng gộp số tiền Thu vào tiền Chi.
  3. **Hiển thị trực quan và sắc nét từng dòng:**
     - Dòng Chi: Huy hiệu xanh dương `↑ Chi`, số tiền hiển thị `↑ 14.800.000` (màu xanh dương).
     - Dòng Thu: Huy hiệu xanh lá `↓ Thu`, số tiền hiển thị `↓ 5.000.000` (màu xanh lá).
  4. **Thêm bộ 3 nút lọc nhanh Thu / Chi trên thanh công cụ:**
     - `[ Tất cả Thu/Chi ]`
     - `[ ↓ Thu tiền ]` (chỉ xem các khoản thu tiền trả nợ từ khách)
     - `[ ↑ Chi tiền ]` (chỉ xem các đơn hàng xuất bán nợ)
  5. **Đồng bộ hóa 4 Thẻ KPI Tổng quan:**
     - Card 1: `1. TỔNG THU (-)` hiển thị chính xác `5.000.000` (màu xanh lá).
     - Card 2: `2. TỔNG CHI (+)` hiển thị chính xác `26.850.000` (màu xanh dương: `14.800.000 + 12.050.000`).
     - Card 3: `3. SỐ TIỀN PHÁT SINH`: `31.850.000`.
     - Card 4: `4. CÔNG NỢ CÒN`: `7.050.000` (màu đỏ).

### Yêu cầu 36: Thiết lập "Công nợ còn" thành cột ảo tính lũy kế tự động theo ngày (Virtual Running Balance)
- **Thời gian:** `11:12:00 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"công nợ còn là cột ảo mà nó tính theo  ngày"*
- **Hình ảnh đính kèm từ người dùng:** Ảnh chụp bảng công nợ khoanh đỏ cột Ngày ghi nhận, cột Số tiền và cột Công nợ còn (hàng 26/10 hiển thị `21.850.000` trong khi hàng 25/10 hiển thị `11.850.000` do trước đó lưu số tĩnh không tính lũy kế theo thời gian).
- **Giải pháp & Triển khai:**
  1. **Chuyển đổi bản chất: Từ số tĩnh lưu trữ sang "Cột ảo tính theo ngày" (Virtual Calculated Column):**
     - Trước đây, `remainingDebt` bị lưu thành một con số tĩnh lúc tạo bản ghi; khi người dùng nhập đơn hàng hoặc phiếu thu ở các ngày khác nhau, các bản ghi cũ không được cập nhật lại, dẫn đến tình trạng hàng trên hiển thị `21.850.000` còn hàng dưới hiển thị `11.850.000` không theo quy luật kế toán.
  2. **Triển khai động cơ tính lũy kế số dư theo thời gian (Running Balance Engine):**
     - Tại [`CongNoPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx):
       - Toàn bộ giao dịch của từng đối tác được sắp xếp theo đúng dòng thời gian thực tế: từ **CŨ NHẤT** đến **MỚI NHẤT** (`22/10 -> 24/10 -> 25/10 -> 26/10`).
       - Bắt đầu từ công nợ gốc đầu kỳ (`oldDebt`):
         - Gặp dòng Chi (+) -> cộng thêm vào nợ: `runningBalance += amount`.
         - Gặp dòng Thu (-) -> trừ bớt nợ: `runningBalance -= amount`.
       - Mỗi dòng được gán công nợ còn là số dư lũy kế chính xác tại thời điểm đó.
       - Khi hiển thị giao diện theo ngày mới nhất ở trên đầu: Dòng mới nhất luôn chốt đúng số nợ thực tế cuối cùng: **`11.850.000`**.
       - Nếu khách hàng trả trước/dư tiền (nợ âm), hệ thống hiển thị màu xanh lá: `Dư: ...` chuẩn kế toán.
  3. **Đồng bộ hóa tuyệt đối 4 Thẻ KPI và Dòng Tổng cộng:**
     - `1. TỔNG THU (-)`: `15.000.000` (5.000.000 + 10.000.000).
     - `2. TỔNG CHI (+)`: `26.850.000` (12.050.000 + 14.800.000).
     - `3. SỐ TIỀN PHÁT SINH`: `41.850.000`.
     - `4. CÔNG NỢ CÒN`: Tự động chốt chuẩn xác số nợ thực tế hiện tại là **`11.850.000`** (`26.850.000 - 15.000.000`).
     - Dòng tổng cộng chân bảng: `Số tiền: 41.850.000` • `Công nợ còn: 11.850.000`.
  4. **Cập nhật Drawer Tạo & Sửa công nợ ([`CongNoDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoDrawer.tsx)):**
     - Ô "Công nợ còn" chuyển thành thẻ hiển thị tự động `Cột ảo tự động tính theo ngày`, người dùng chỉ cần nhập số tiền và loại phát sinh, hệ thống tự động hoàn toàn việc tính toán lũy kế.

---

### Yêu cầu 37: Cập nhật logic cảnh báo Chưa trả nợ: Ngưỡng 4 ngày & Tổng tiền trả > Nợ cũ sau 4 ngày là hoàn tất (OK)
- **Thời gian:** `11:27:25 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"chưa trả nợ 4 ngày sửa lại thành  tổng tiền trả  > công nợ cong sau 4 ngày là đc. như trong ảnh thì ngày 24 25 trả 15 tr ,à nợ sau 4 ngày có 12 tr thôi vậy là ok rồi"*
- **Ý nghĩa & Bản chất nghiệp vụ:**
  - Trước đây, thuật toán cảnh báo chỉ cộng `paidAmount` trực tiếp trên đối tượng đơn hàng trong `useOrderStore` mà không tính các phiếu thu nợ được tạo trong `useDebtStore` (ví dụ phiếu thu 5.000.000 ngày 24/10 và 10.000.000 ngày 25/10). Điều này khiến hệ thống tưởng khách hàng trả 0, dẫn đến việc đơn cũ ngày 22/10 (`12.050.000`) bị gắn cờ "Chưa trả nợ" một cách vô lý.
  - Người dùng yêu cầu điều chỉnh 2 điểm mấu chốt:
    1. Ngưỡng cảnh báo chuyển từ **3 ngày** sang **4 ngày** (`daysAgo >= 4`).
    2. Quy tắc đánh giá: Nếu **Tổng số tiền khách hàng đã trả** (gồm cả trả trên đơn và các phiếu thu trong sổ công nợ) $\ge$ **Tổng nợ của các đơn cũ sau 4 ngày** (ví dụ nợ đơn 22/10 là `12.050.000`, khách trả ngày 24-25/10 là `15.000.000` > `12.050.000`) thì khách hàng đã trả hết nợ cũ $\rightarrow$ **Hệ thống xác nhận OK, tuyệt đối KHÔNG hiển thị cảnh báo "Chưa trả nợ"**.
- **Giải pháp & Triển khai:**
  1. **Nâng cấp thuật toán FIFO đa kênh tại [`debtCheck.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/lib/debtCheck.ts):**
     - Đổi điều kiện quá hạn từ `daysAgo >= 3` thành `daysAgo >= 4`.
     - Lấy dữ liệu thanh toán từ `useDebtStore`: Truy vấn toàn bộ phiếu thu nợ (`partnerType === 'npp'`, `type === 'thu'` hoặc `decreaseAmount > 0`) khớp với khách hàng.
     - Tính `totalPastPaid = totalPastPaidFromOrders + totalDebtStorePayments`.
     - Phân bổ `totalPastPaid` theo nguyên tắc FIFO (từ khoản nợ cũ nhất đến mới nhất).
     - Khi `totalPastPaid >= totalOverdueOrdersDebt`: Toàn bộ các đơn hàng quá hạn $\ge 4$ ngày được thanh toán 100% (`remainingDebt = 0`), trả về `hasOverdueUnpaidDebt = false`, `overdueOrders = []`, `totalOverdueDebt = 0` (Hoàn tất, không cảnh báo).
  2. **Đồng bộ giao diện danh sách đơn hàng ([`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx)):**
     - Kết nối `useDebtStore((s) => s.records)` để bảng đơn hàng tự động phản ứng tức thì khi có phiếu thu nợ mới.
     - Đổi nhãn bộ lọc thành: `⚠️ Chưa trả nợ (≥ 4 ngày)`.
     - Huy hiệu trên dòng đơn hiển thị chính xác theo số ngày: `Chưa trả nợ (4 ngày)`.
  3. **Đồng bộ Drawer Tạo/Sửa đơn hàng ([`DonHangFormModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx)):**
     - Đổi tiêu đề banner: `⚠️ Cảnh báo: Khách hàng chưa trả nợ (Đơn quá 4 ngày)` và số lượng `{count} đơn quá hạn ≥ 4 ngày`.
     - Cập nhật thông báo Toast và hộp thoại xác nhận khi chọn khách hàng có nợ quá 4 ngày.
  4. **Đồng bộ Modal Chi tiết đơn hàng ([`DonHangDetailModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx)):**
     - Đổi tiêu đề khối cảnh báo: `CẢNH BÁO: KHÁCH HÀNG CHƯA TRẢ NỢ (QUÁ 4 NGÀY)` và badge `{count} đơn quá hạn (≥ 4 ngày)`.

### Yêu cầu 38: Sửa lỗi mờ tên nút in phiếu & Bổ sung tính năng mở thẳng phiếu in ra tab mới
- **Thời gian:** `11:41:22 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"cái này  in phiếu đang bị mờ tên. tôi muốn mở hản ra 1 tap mới cơ"*
- **Hình ảnh đính kèm từ người dùng:** Ảnh chụp thanh công cụ trên cùng của popup xem phiếu in khoanh đỏ các nút `In A4 Đầy đủ`, `In Tối giản`, `Link`, `Tab mới`, trong đó các nút `Link` và `Tab mới` bị trắng chữ trên nền trắng mờ nhạt khó đọc.
- **Ý nghĩa & Bản chất nghiệp vụ:**
  1. **Lỗi hiển thị "Mờ tên":** Nút bấm sử dụng `variant="outline"` trên nền tối `#0f172a`, kết hợp với thuộc tính `text-white` dẫn đến chữ trắng trên nền trắng/sáng mờ nhạt, gần như tàng hình ("mờ tên").
  2. **Yêu cầu mở hẳn ra 1 tab mới:** Người dùng muốn có thể mở thẳng toàn màn hình phiếu in ra một tab mới của trình duyệt (`window.open`) để in ấn thuận tiện, kiểm tra hóa đơn mà không bị bó hẹp trong popup.
- **Giải pháp & Triển khai:**
  1. **Khắc phục triệt để lỗi mờ tên tại [`HoaDonPrintModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/HoaDonPrintModal.tsx):**
     - Loại bỏ `variant="outline"` gây xung đột màu.
     - Thiết kế nút `Mở Tab Mới` nổi bật với màu xanh ngọc đậm (`bg-emerald-600 hover:bg-emerald-500 text-white font-bold`), chữ sắc nét 100% độ tương phản.
     - Thiết kế nút `Sao chép Link` với nền xám đá (`bg-slate-800 border-slate-700 text-slate-200`) độ tương phản cao, rõ ràng.
  2. **Nâng cấp trang in độc lập [`hoa_khang_thanh.html`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/public/hoa_khang_thanh.html):**
     - Bổ sung thanh công cụ đầu trang khi mở tab mới với 3 nút bấm chuẩn: `🖨️ In A4 Đầy đủ`, `📄 In Tối giản (Tên + SL)`, `🔗 Sao chép Link`.
     - Hỗ trợ giải mã đầy đủ `id` (Mã đơn hàng: `ID: DH-...`), `phone` (SĐT khách hàng) và `tongSL` (Tổng số lượng cành/bó).
  3. **Bổ sung nút bấm mở tab mới 1 chạm tại Danh sách đơn hàng & Chi tiết đơn hàng:**
     - Tại [`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx): Thêm nút icon `ExternalLink` (xanh lá) bên cạnh nút máy in trên từng dòng đơn hàng; và thêm nút "Tab mới" trên thẻ đơn hàng mobile để người dùng bấm là mở thẳng tab mới ngay lập tức.
     - Tại [`DonHangDetailModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx): Thêm nút "Mở tab mới" cạnh nút "In phiếu".

### Yêu cầu 39: Bổ sung Báo cáo Lợi nhuận và Hiệu quả kinh doanh vào phân hệ Đơn hàng
- **Thời gian:** `11:51:22 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"ở phần báo cáo có báo cáo lợi nhuận nữa"*
- **Hình ảnh đính kèm từ người dùng:** Ảnh chụp tab "Báo cáo & Thống kê đơn" trong module Đơn hàng, khoanh đỏ breadcrumb Đơn hàng và tab Báo cáo, yêu cầu bổ sung phân tích lợi nhuận.
- **Ý nghĩa & Bản chất nghiệp vụ:**
  - Trong kinh doanh hoa tươi bán sỉ, bên cạnh sản lượng và doanh số, việc theo dõi **Giá vốn (Tiền nhập hoa)**, **Lợi nhuận gộp (Tiền lãi = Doanh số - Giá vốn)** và **Tỷ suất lợi nhuận (%)** của từng loại hoa cũng như từng đơn hàng là tối quan trọng để chủ cơ sở đánh giá hiệu quả kinh doanh và mặt hàng chủ lực sinh lời.
- **Giải pháp & Triển khai tại [`DonHangStats.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangStats.tsx):**
  1. **Nâng cấp khối Thẻ KPI chỉ số tổng quan đầu trang:**
     - Bổ sung các chỉ số tài chính trọng yếu:
       - `Tổng doanh số bán`
       - `Tổng giá vốn (Nhập hoa)`
       - `Tổng lợi nhuận gộp` (hiển thị màu xanh lá rực rỡ `+...`)
       - `Tỷ suất lợi nhuận TB (%)`
  2. **Bổ sung Biểu đồ phân tích:**
     - Thêm biểu đồ cột: **"Top hoa sinh lời cao nhất (Lợi nhuận - Triệu)"** trực quan hóa các loại hoa mang lại lợi nhuận cao nhất cho cửa hàng.
  3. **Tích hợp Tab "Báo cáo lợi nhuận" với 2 chế độ xem linh hoạt:**
     - Nút chọn chế độ xem mới: `📊 Báo cáo lợi nhuận` song song với `Tổng hợp theo hoa` và `Chi tiết từng đơn`.
     - **Chế độ 1: Lợi nhuận theo Loại hoa:** Thống kê chi tiết từng mặt hàng hoa gồm: Mã hoa, Tên hoa, Tên riêng, Số lượng bán, Giá vốn TB, Giá bán TB, Tổng tiền vốn, Doanh thu bán, **Lợi nhuận (Tiền lãi)**, **Tỷ suất LN (%)**, và **Tỷ trọng đóng góp LN (%)**.
     - **Chế độ 2: Lợi nhuận theo Đơn hàng:** Phân tích từng đơn bán gồm: Mã đơn, Ngày đặt, Khách hàng, Tổng SL hoa, Tổng chi phí vốn, Doanh số bán, **Lợi nhuận đơn**, **Tỷ suất LN (%)**, và Trạng thái.
  4. **Đồng bộ Thẻ KPI theo bộ lọc & Xuất Excel (.xlsx):**
     - Khi lọc theo ngày/khách hàng, khối KPI chuyển đổi tự động sang hiển thị Doanh thu, Chi phí vốn, Lợi nhuận gộp và Tỷ suất LN của khoảng thời gian đó.
     - Nút "Xuất Excel" tự động xuất file `Bao_Cao_Loi_Nhuan_Theo_Hoa_...xlsx` hoặc `Bao_Cao_Loi_Nhuan_Theo_Don_...xlsx` với đầy đủ các cột số liệu kế toán.

---

### Yêu cầu 40: Điều chỉnh cột Công nợ trên danh sách đơn hàng thành Công nợ cũ & Bổ sung cột Thanh toán
- **Thời gian:** `13:22:15 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"cột công nợ này chính là nợ cũ cơ mà"*
- **Hình ảnh đính kèm từ người dùng:** Ảnh chụp bảng danh sách Đơn hàng tại [`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx), khoanh đỏ số tiền ở cột "Công nợ" (14.800.000) đang trùng với cột "Tổng tiền" (14.800.000) của đơn hàng DH-2026-109.
- **Ý nghĩa & Bản chất nghiệp vụ:**
  - Theo quy trình bán hàng sỉ hoa tươi và nguyên tắc kế toán đã thiết lập tại Yêu cầu 29:
    - `Tổng tiền đơn hàng` = `Thành tiền` + `Cước xe` - `Trừ hàng`
    - Cột nợ trên bảng đơn hàng thực chất là **Công nợ cũ** (`oldDebt`) của khách hàng tại thời điểm lên đơn (nợ tích lũy từ các lần mua trước).
    - Cột kết quả cuối cùng mà khách hàng cần trả là **Thanh toán** (`totalPayment`) = `Tổng tiền` + `Công nợ cũ`.
    - Trước đó, bảng danh sách đơn hàng hiển thị `debtAmount` (`Tổng tiền - Đã trả`), dẫn tới khi đơn chưa thanh toán thì cột "Công nợ" lặp lại y nguyên cột "Tổng tiền", gây hiểu nhầm và sai lệch thông tin nợ cũ.
- **Giải pháp & Triển khai:**
  1. **Điều chỉnh cấu hình cột tại [`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx):**
     - Đổi nhãn cột từ `'Công nợ'` sang `'Công nợ cũ'` (`label: 'Công nợ cũ'`). Cơ chế hợp nhất trong [`useColumnSettings.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/hooks/useColumnSettings.ts) tự động cập nhật nhãn mới nhất cho mọi người dùng kể cả khi đã có cấu hình trong `localStorage`.
     - Bổ sung thêm cột `'totalPayment'` (`label: 'Thanh toán'`) ngay sau cột `'Công nợ cũ'`.
  2. **Hiển thị dữ liệu chính xác trong `renderCell`:**
     - Cột `debt` / `oldDebt`: Hiển thị `row.oldDebt || 0` với màu hổ phách/vàng cam cảnh báo (`text-amber-600 dark:text-amber-400 font-bold`) khi > 0, hoặc màu xám dịu khi = 0.
     - Cột `totalPayment`: Hiển thị `row.totalPayment || (total + (row.oldDebt || 0))` với màu tím chủ đạo (`text-primary font-bold font-mono`).
  3. **Đồng bộ trên giao diện Thẻ đơn hàng Mobile (`renderMobileCard`):**
     - Hiển thị đầy đủ bộ 3 chỉ số: `SL hoa` • `Tổng: ...` • `Thanh toán: ...`.
     - Góc chân thẻ hiển thị rõ: `Nợ cũ: {formatNumber(oldDebtVal)}` thay vì chữ `Nợ: ...` chung chung trước đây.
  4. **Cập nhật Store Quản lý Đơn hàng [`hoaKhangThanhStore.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/hoaKhangThanhStore.ts):**
     - Cả hàm `addOrder` và `updateOrder` đều tự động tính toán và lưu trữ chuẩn xác `oldDebt` và `totalPayment` = `totalAmount + oldDebt`.

---

### Yêu cầu 41: Tối ưu Bảng mặt hàng đơn hàng: Bỏ nút "Đổi hoa", mở rộng tên hoa 2 dòng và chuyển ô nhập thành kẻ khung liền mạch
- **Thời gian:** `13:30:28 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"thêm mới hay chỉnh sửa thì bỏ đổi hoa đi. cho độ rộng tên hoa rộng xuống 1 tí. thành tên bên trên, trên riêng xuống dưới. bỏ hết khung bao quanh hoa , số lượng , giá thành đường kẻ khung đc k"*
- **Hình ảnh đính kèm từ người dùng:** Ảnh chụp form "Chỉnh sửa đơn đặt hàng" ([`DonHangFormModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx)), khoanh đỏ nút "Đổi hoa ⌄" trên từng dòng mặt hàng hoa.
- **Ý nghĩa & Bản chất nghiệp vụ:**
  - Nút "Đổi hoa ⌄" chiếm dụng diện tích ngang của cột mặt hàng, khiến mã hoa, tên hoa, tên riêng và tồn kho bị co cụm trên 1 dòng nhỏ hẹp, chữ bị cắt cụt bằng dấu ba chấm (`...`).
  - Các ô nhập Số lượng, Giá nhập, Giá bán trước đó có khung viền cong (`rounded border`) dạng input rời rạc, làm bảng nhìn rối mắt, không phẳng và không đạt chuẩn bảng tính kế toán ERP (Grid Spreadsheet).
- **Giải pháp & Triển khai tại [`DonHangFormModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx):**
  1. **Loại bỏ hoàn toàn nút "Đổi hoa ⌄":**
     - Cả khi thêm mới lẫn chỉnh sửa đơn, nút "Đổi hoa" đã được gỡ bỏ hoàn toàn.
     - Người dùng chỉ cần nhấp trực tiếp vào ô hoa là popup chọn/đổi hoa lập tức mở ra, nhanh chóng và mượt mà.
  2. **Tổ chức lại hiển thị cột Mặt hàng hoa thành 2 dòng thông thoáng:**
     - **Dòng trên (Tên bên trên):** Mã hoa dạng badge mono nổi bật (`HOA-001`) + Tên hoa đầy đủ, chữ đậm rõ ràng, không bị ép hẹp.
     - **Dòng dưới (Tên riêng xuống dưới):** Tên riêng của khách/cửa hàng (`Tên riêng: Hồng đỏ`) với nền màu tím thương hiệu + Tồn kho hiện tại (`Tồn: 1.300`).
     - Tăng chiều cao tối thiểu (`min-h-[46px]`) và khoảng cách đệm `py-2 px-3` giúp bảng thoáng đãng, dễ đọc, dễ đối soát.
  3. **Chuyển đổi toàn bộ ô nhập (Hoa, Số lượng, Giá) thành đường kẻ khung liền mạch:**
     - Bỏ khung bo cong lơ lửng (`border-0 rounded-none bg-transparent`).
     - Tích hợp chế độ `variant="cell"` cho [`FormattedNumberInput`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx#L51-L245): Ô nhập tràn viền 100% kích thước ô, phân cách bởi chính các đường kẻ khung bảng (`border border-border/70`).
     - Khi trỏ chuột hoặc gõ số, ô được highlight nhẹ nhàng (`focus:bg-primary/5 focus:ring-1 focus:ring-inset focus:ring-primary`) chuẩn phong cách bảng tính Excel / Misa ERP.
  4. **Đồng bộ toàn bộ bảng:**
     - Áp dụng các đường kẻ khung đồng nhất cho Tiêu đề bảng (`th`), dòng dữ liệu (`td`) và chân bảng tổng cộng (`tfoot`).

---

### Yêu cầu 42: Cột Công nợ cũ & Thanh toán ở module Đơn hàng là CỘT ẢO đồng bộ Real-time theo dòng thời gian thực tế
- **Thời gian:** `13:46:12 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"công nợ cũ ở modul đơn hàng cũng là cột ảo k là cột ảo thì read time đồng bộ luôn chứ . tính tới ngày 26 thì đang dư công nợ mà sao vẫn còn 7 tr"*
- **Hình ảnh đính kèm từ người dùng:**
  1. Ảnh chụp module Đơn hàng ([`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx)): Đơn DH-2026-109 ngày 26/10/2026 đang hiển thị "Công nợ cũ" là 7.050.000 (khoanh đỏ).
  2. Ảnh chụp module Công nợ ([`CongNoPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx)): Lịch sử giao dịch của Chuỗi Shop Hoa Tươi FlowerBox: ngày 24/10 trả 5tr (còn nợ 7.050.000), ngày 25/10 trả 10tr -> số dư nợ chuyển thành **DƯ: 2.950.000** (khoanh đỏ). Sau đó ngày 26/10 lên đơn DH-2026-109 (14.800.000) thì Công nợ còn lại là 11.850.000.
- **Ý nghĩa & Bản chất nghiệp vụ:**
  - "Công nợ cũ" của một đơn hàng $O$ không phải là một con số tĩnh bất biến, mà thực chất là **số dư công nợ lũy kế (Running Balance)** của đối tác tại thời điểm ngay trước khi đơn hàng $O$ phát sinh.
  - Khi khách hàng trả tiền thừa (số tiền trả > số nợ), số dư là âm (khách đang dư tiền/credit balance: `Dư: 2.950.000`).
  - Tại ngày 26/10 khi phát sinh đơn DH-2026-109 (14.800.000), khách đã có số dư 2.950.000 từ ngày 25/10:
    - `Công nợ cũ` = `Dư: 2.950.000` (âm 2.950.000).
    - `Thanh toán` = $\text{Tổng tiền đơn} + \text{Công nợ cũ} = 14.800.000 - 2.950.000 = \mathbf{11.850.000}$ (khớp 100% với số dư công nợ ngày 26/10 trong sổ công nợ).
  - Trước đó, đơn DH-2026-109 lưu giá trị snapshot tĩnh 7.050.000 (từ ngày 24/10) và không tự động cập nhật lại khi ngày 25/10 có phiếu thu 10tr.
- **Giải pháp & Triển khai:**
  1. **Xây dựng module tính toán cột ảo [`orderDebtHelper.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/lib/orderDebtHelper.ts):**
     - Hàm `computeAllOrdersVirtualDebt`: Tự động gom nhóm toàn bộ đơn hàng và sổ công nợ theo từng đối tác, sắp xếp theo dòng thời gian từ cũ đến mới (chronological timeline) và tính toán lũy kế số dư trước mỗi đơn hàng.
     - Hàm `formatOldDebtDisplay`: Chuẩn hóa hiển thị nợ cũ: Nếu âm (< 0) hiển thị rõ `Dư: {số tiền}` với màu xanh ngọc rực rỡ (`text-emerald-600 dark:text-emerald-400 font-extrabold`), nếu dương (> 0) hiển thị màu hổ phách/cam, nếu bằng 0 hiển thị `0`.
  2. **Cập nhật module Đơn hàng [`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx):**
     - Áp dụng `virtualDebtMap` tính toán tự động real-time trong `useMemo`: Cả cột "Công nợ cũ" và "Thanh toán" lập tức cập nhật chuẩn xác từng đơn khi sổ công nợ thay đổi.
     - Đơn DH-2026-109 hiển thị: `Công nợ cũ: Dư: 2.950.000` và `Thanh toán: 11.850.000`.
     - Đồng bộ trên Thẻ đơn hàng Mobile, Modal chi tiết ([`DonHangDetailModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx)) và In phiếu hóa đơn ([`HoaDonPrintModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/HoaDonPrintModal.tsx), [`hoa_khang_thanh.html`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/public/hoa_khang_thanh.html)).
  3. **Đồng bộ hóa 2 chiều trong Store [`hoaKhangThanhStore.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/hoaKhangThanhStore.ts):**
     - Trong hàm `recalcDistributorDebts`, mỗi khi có giao dịch thu/chi mới phát sinh, toàn bộ đơn hàng của khách hàng đó được tự động cập nhật lại `oldDebt` và `totalPayment` theo đúng dòng thời gian lũy kế.
     - Trong Form đơn hàng ([`DonHangFormModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangFormModal.tsx)): Khi mở form hoặc bấm `[Lấy nợ NPP]`, số nợ cũ tự động lấy theo số dư lũy kế thực tế (hiển thị tag `Dư: ...` nếu khách trả thừa).

---

### Yêu cầu 43: Thêm theo dõi số ngày lên đơn gần nhất của NPP và cảnh báo quá 3 ngày chưa nhập thêm hoa
- **Thời gian:** `14:18:00 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"ở danh sách npp thêm số ngày lên đơn gần nhất. ý là xem npp nào quá 3 ngày chưa nhập thêm"*
- **Ý nghĩa & Bản chất nghiệp vụ:**
  - Nhà phân phối (NPP) là các đại lý, chuỗi shop hoa tươi nhập hoa thường xuyên. Khi một NPP quá 3 ngày chưa phát sinh đơn hàng mới (`daysSinceLastOrder > 3`), doanh nghiệp cần nhận diện ngay lập tức để nhân viên kinh doanh / kế toán chủ động liên hệ nhắc đơn, báo giá hoa mới, nắm bắt tình hình và thúc đẩy tái đặt hàng kịp thời.
- **Giải pháp & Triển khai:**
  1. **Tự động tính toán số ngày lên đơn gần nhất Real-time:**
     - Truy xuất danh sách đơn hàng từ [`useOrderStore`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/hoaKhangThanhStore.ts), liên kết chuẩn xác theo ID, tên hoặc số điện thoại của NPP.
     - Sắp xếp thời gian giảm dần (loại trừ các đơn hủy) để xác định ngày lên đơn mới nhất.
     - Sử dụng hàm `getDaysDifference` từ [`debtCheck.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/lib/debtCheck.ts) để tính số ngày đã trôi qua so với hiện tại.
  2. **Thêm cột "Đơn gần nhất" trong bảng NPP ([`NPPPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPPage.tsx)):**
     - Đặt tại cột thứ 4 (sau Số điện thoại và trước các cột công nợ).
     - **Quá 3 ngày chưa đặt (`daysAgo > 3`):** Hiển thị badge đỏ cảnh báo rực rỡ `⚠️ {daysAgo} ngày chưa đặt` kèm dòng phụ `Lần cuối: dd/mm/yyyy`.
     - **Đặt hôm nay (`daysAgo === 0`):** Badge xanh lá `✓ Hôm nay` kèm mã đơn.
     - **Đặt trong 1 - 3 ngày:** Badge xanh dương `{daysAgo} ngày trước` kèm ngày và mã đơn.
     - **Chưa có đơn:** Badge trung tính `Chưa lên đơn`.
  3. **Bộ lọc nhanh 1 chạm (Quick Filter Pills & MultiSelectFilter):**
     - Bổ sung thanh nút bấm phân loại nhanh 1 chạm ngay trên đầu bảng:
       - `Tất cả ({total})`
       - `⚠️ Quá 3 ngày chưa đặt ({overdue})` (Bấm 1 chạm để lọc ngay các NPP trễ hẹn nhập hoa)
       - `Đã đặt ≤ 3 ngày ({recent})`
       - `Chưa có đơn ({none})`
     - Bổ sung bộ lọc `Lên đơn gần nhất` vào `MultiSelectFilter` trong thanh công cụ.
  4. **Đồng bộ trên Thẻ Mobile & Drawer Chi tiết NPP ([`NPPDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPDrawer.tsx)):**
     - Thẻ Mobile hiển thị dòng trạng thái: `Đơn gần nhất: {daysAgo} ngày ({ngày})` với cảnh báo đỏ khi quá 3 ngày.
     - Trong Drawer xem chi tiết NPP, hiển thị banner cảnh báo đỏ nổi bật khi quá 3 ngày hoặc thanh trạng thái xanh nếu vừa đặt gần đây.
  5. **Bổ sung chỉ số trên Báo cáo Thống kê ([`NPPStats.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPStats.tsx)):**
     - Thêm thẻ KPI `Quá 3 ngày chưa đặt` với icon tam giác cảnh báo trên màn hình thống kê; dọn sạch toàn bộ ký hiệu `₫` theo đúng quy chuẩn chung.

---

### Yêu cầu 44: Xóa bỏ nút "Thanh toán đủ" trên Modal Chi tiết đơn hàng
- **Thời gian:** `14:29:15 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"nút thanh toán đủ là sao xóa đi."*
- **Hình ảnh đính kèm từ người dùng:**
  - Ảnh chụp thanh chân trang Modal Chi tiết đơn hàng ([`DonHangDetailModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx)) gồm hàng nút: `[Mở tab mới] [In phiếu] [Thanh toán đủ] [Chỉnh sửa]`.
- **Ý nghĩa & Lý do thực tế:**
  - Nút "Thanh toán đủ" vốn là nút tắt tự động gán khách đã trả hết tiền đơn hàng (`paidAmount = totalAmount`).
  - Trong quy trình kế toán chuẩn của hệ thống hoa, công nợ được quản lý xuyên suốt qua Sổ công nợ (`/cong-no`) và dòng tiền Thu chi (`/thu-chi`), hoặc khách thanh toán từng phần qua form sửa đơn. Việc để một nút bấm nhanh "Thanh toán đủ" dễ gây bấm nhầm, làm lệch số dư công nợ lũy kế (Running Balance) thực tế của khách hàng.
- **Giải pháp & Triển khai:**
  1. Xóa hoàn toàn nút bấm **"Thanh toán đủ"** khỏi thanh chân trang (Footer) của [`DonHangDetailModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx).
  2. Dọn sạch hàm `handlePayFull` và các biến không cần thiết (`debtAmount`, `updatePaymentStatus`), đảm bảo giao diện gọn gàng, chỉ giữ lại các thao tác chuẩn: `[Mở tab mới]`, `[In phiếu]`, `[Chỉnh sửa]`.
  3. Kiểm thử TypeScript và Build Vite đạt **Exit code 0** (0 lỗi).

---

### Yêu cầu 45: Drawer Chi tiết NPP: Rút gọn bảng danh sách đơn mua chỉ gồm 4 cột (Ngày, Số lượng, Tổng tiền, Trạng thái)
- **Thời gian:** `14:34:00 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"cho tiết npp danh sách đơn mua thì có là ngày slg tổng tiền trạng thái."*
- **Hình ảnh đính kèm từ người dùng:**
  - Ảnh chụp Tab "Đơn hàng mua" trong Drawer Chi tiết Nhà Phân Phối ([`NPPDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPDrawer.tsx)) với 9 cột cồng kềnh trước đó: `Mã đơn`, `Ngày đặt`, `Mặt hàng hoa`, `Tổng SL`, `Tổng tiền`, `Đã trả`, `Còn nợ`, `Trạng thái`, `Thanh toán`.
- **Ý nghĩa & Lý do thực tế:**
  - Tab "Đơn hàng mua" của NPP chỉ cần hiển thị thông tin tổng quan xúc tích của các đơn hoa tươi đã mua.
  - Các cột `Mặt hàng hoa` (quá dài), `Đã trả`, `Còn nợ`, `Thanh toán` khiến bảng bị giãn ngang, rối mắt và trùng lặp không cần thiết vì toàn bộ lịch sử công nợ, tiền thu, tiền bán đã được đối soát chi tiết và lũy kế tại Tab "Công nợ theo ngày" ngay bên cạnh.
- **Giải pháp & Triển khai:**
  1. Cấu trúc lại bảng đơn hàng mua trong [`NPPDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPDrawer.tsx) chính xác 4 cột:
     - **Ngày:** Hiển thị ngày đặt hàng (`dd/mm/yyyy`) kèm mã đơn dạng link mono (`DH-xxxx`) bên dưới.
     - **Số lượng (SL):** Căn giữa, in đậm tổng số lượng cành/bó hoa trong đơn.
     - **Tổng tiền:** Căn phải, in đậm số tiền đơn hàng (định dạng dấu chấm `.`).
     - **Trạng thái:** Căn giữa, badge trạng thái đơn hàng (Đang giao, Hoàn tất, Nháp, Đã hủy...).
  2. Bấm vào mã đơn sẽ mở popup xem chi tiết đơn hàng ([`DonHangDetailModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangDetailModal.tsx)) nếu cần xem chi tiết từng loại hoa hoặc in phiếu.
  3. Dòng chân bảng `tfoot` tổng kết chính xác: Tổng số đơn, Tổng số lượng và Tổng tiền.
  4. Đã kiểm thử `tsc -b` và `npm run build` hoàn thành không lỗi (Exit code 0).

---

### Yêu cầu 46: Drawer Chi tiết NPP: Sửa công nợ theo ngày chạy lũy kế (Running Balance) chuẩn kế toán và mở rộng bảng hiển thị
- **Thời gian:** `14:54:00 - 26/10/2026`
- **Nguyên văn yêu cầu:**
  > *"công nợ theo ngày ở chi tiết npp đang bị sai. check lại. làm cho bảng rộng ra đc k ."*
- **Hình ảnh đính kèm từ người dùng:**
  - Ảnh chụp Tab "Công nợ theo ngày" trong Drawer Chi tiết NPP ([`NPPDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPDrawer.tsx)):
    - Khoanh đỏ thẻ KPI `CÔNG NỢ CŨ: 5.000.000` nhưng ở dòng ngày đầu tiên 22/10 cột `Công nợ cũ` lại bằng `0`.
    - Mũi tên đỏ chỉ từ `Công nợ cuối: 7.050.000` của ngày 24/10 sang dòng ngày tiếp theo 25/10 với `Công nợ cũ: 21.850.000` (bị gạch chéo đỏ vì bị sai, đúng ra phải là `7.050.000`).
    - Các dòng ngày đều hiện số tĩnh `21.850.000` thay vì tính lũy kế tịnh tiến từng ngày.
    - Chân bảng `tfoot` cộng dồn sai các giá trị lũy kế.
    - Drawer và bảng quá hẹp khiến các cột bị co cụm, tiêu đề bị rớt xuống 2 dòng.
- **Ý nghĩa & Lý do thực tế:**
  - Sổ công nợ theo ngày của khách hàng/NPP là sổ cái kế toán lũy kế liên tục (Running Balance Ledger):
    $$\text{Công nợ cũ (ngày } N+1\text{)} = \text{Công nợ cuối (ngày } N\text{)}$$
  - Bắt đầu từ số dư công nợ ban đầu của NPP (`distributor.oldDebt`).
  - Mỗi ngày:
    $$\text{Công nợ cuối} = \text{Công nợ cũ} + \text{Tiền bán hoa (+)} - \text{Tiền thu nợ (-)}$$
  - Nếu kết quả là số âm thì thể hiện khách hàng đang trả dư tiền hoa (`Dư: [số tiền]`).
  - Drawer kích thước lớn (size `lg`) trước đây chỉ rộng 50rem (800px), quá chật để hiển thị 8 cột thông tin kế toán (Ngày, Công nợ cũ, Tiền bán hoa, Tiền thu nợ, Công nợ cuối, Số đơn, Trạng thái, Ghi chú).
- **Giải pháp & Triển khai:**
  1. **Tính toán lũy kế Real-time (Running Balance) cho bảng Công nợ theo ngày ([`NPPDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPDrawer.tsx)):**
     - Sắp xếp toàn bộ giao dịch theo thứ tự thời gian tăng dần từ quá khứ đến hiện tại (`normalizeToISODate`).
     - Khởi tạo số dư ban đầu: `running = distributor.oldDebt || 0`.
     - Duyệt từng bản ghi:
       - `oldDebt = running`
       - `finalDebt = running + increaseAmt - decreaseAmt`
       - `running = finalDebt`
     - Đảo ngược danh sách để hiển thị ngày mới nhất lên đầu bảng cho người dùng dễ theo dõi.
     - Xử lý trực quan trạng thái thanh toán dư: khi `oldDebt < 0` hoặc `finalDebt < 0`, tự động hiển thị chữ màu xanh ngọc bích `Dư: [số tiền]`.
  2. **Đồng bộ 4 thẻ KPI đầu Drawer & Chân bảng `tfoot`:**
     - **CÔNG NỢ CŨ:** Lấy chính xác số dư ban đầu trước kỳ giao dịch (`initialOldDebt`), nếu dư hiển thị `Dư: ...`.
     - **TIỀN BÁN HOA (+):** Tổng cộng tiền bán hoa phát sinh trong kỳ (`totalSales`).
     - **TIỀN THU NỢ (-):** Tổng cộng tiền khách đã thanh toán/thu nợ trong kỳ (`totalCollected`).
     - **CÔNG NỢ CUỐI (LŨY KẾ):** Số dư lũy kế thực tế tại ngày mới nhất (`finalCumulativeDebt`), nếu khách nộp thừa tiền hiển thị `Dư: ...`.
     - Chân bảng `tfoot` hiển thị đúng giá trị đầu kỳ, tổng phát sinh tăng, tổng phát sinh giảm và số dư cuối kỳ thực tế (không cộng dồn sai các số lũy kế).
  3. **Mở rộng kích thước Drawer và Bảng thông thoáng ([`Drawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/components/ui/Drawer.tsx) & [`NPPDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/npp/NPPDrawer.tsx)):**
     - Nâng cấp kích thước `DRAWER_SIZES['lg']` từ 50rem (800px) lên **76rem (~1216px, tối đa 95vw)**.
     - Thiết lập độ rộng bảng `min-w-[850px]` với thuộc tính `whitespace-nowrap` trên tất cả tiêu đề và ô dữ liệu, triệt tiêu hoàn toàn hiện tượng chữ nhảy 2 dòng hoặc tràn bảng.
  4. **Đồng bộ ngược vào Store ([`hoaKhangThanhStore.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/hoaKhangThanhStore.ts)):**
     - Trong hàm `recalcDistributorDebts`, cập nhật đồng bộ các giá trị `oldDebt`, `finalDebt`, `remainingDebt` vào `debtStore.records` để toàn bộ các module khác (Công nợ tổng hợp, Thu chi...) đều nhận dữ liệu chính xác nhất.
  5. Đã kiểm thử `tsc -b` và `npm run build` hoàn thành không lỗi (Exit code 0).

---

### Yêu cầu 47: Tích hợp API OCR Ocr4AI (https://ocr.laychu.com/api-docs#models) bóc tách tự động đơn hàng NCC
- **Thời gian:** `14:25:00 - 29/10/2026`
- **Nguyên văn yêu cầu:**
  > *"[OCR API Documentation: Images & PDFs | Ocr4AI](https://ocr.laychu.com/api-docs#models) vào web này để thêm api ocr để đọc"*
- **Ý nghĩa & Lý do thực tế:**
  - Ocr4AI (`https://ocr.laychu.com`) là giải pháp OCR chuyên biệt cho tiếng Việt và ứng dụng AI với tốc độ cực nhanh (300–600ms/ảnh), hỗ trợ xuất bảng biểu dạng Markdown.
  - Người dùng muốn tích hợp API này vào tính năng "Đọc ảnh ra đơn hàng NCC" để quét hóa đơn nhà vườn nhanh chóng, chính xác và chuyên nghiệp hơn so với Tesseract offline hoặc OCR.space.
- **Giải pháp & Triển khai:**
  1. **Tạo module tích hợp Ocr4AI chuyên biệt ([`ocr4ai.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/ocr4ai.ts)):**
     - Hỗ trợ endpoint OpenAI-compatible: `POST /v1/chat/completions` với model mặc định `ocr4ai-fast`.
     - Chế độ định dạng xuất: `ocr_format: "markdown"` (tự tạo bảng Markdown giữ chuẩn cấu trúc cột) hoặc `"text"`.
     - Nén và chuẩn hóa ảnh trước khi upload (JPEG 0.92, tối đa 2400px), đảm bảo dưới giới hạn 10MB/20M pixel của Ocr4AI.
     - Xử lý lỗi thân thiện theo mã lỗi API (401: sai key, 402: hết credit, 413: ảnh quá lớn, 429: quá tải/hết lượt miễn phí ngày, 500/503: máy chủ bận).
     - Lưu trữ API Key an toàn trong trình duyệt (`localStorage`) của thiết bị.
  2. **Cấu hình Vite Proxy chống chặn CORS ([`vite.config.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/vite.config.ts)):**
     - Vì Ocr4AI yêu cầu gọi từ server (không mở CORS cho trình duyệt gọi trực tiếp), thêm cấu hình proxy `/api/ocr4ai` chuyển tiếp sang `https://ocr.laychu.com/v1`.
     - Code client tự động nhận diện và fallback mượt mà qua proxy nội bộ khi phát hiện lỗi CORS từ trình duyệt.
  3. **Nâng cấp thuật toán bóc tách bảng Markdown ([`imageParser.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/imageParser.ts)):**
     - Bổ sung cơ chế nhận diện bảng Markdown dạng `| STT | Tên hàng | ĐVT | SL | Đơn giá | Thành tiền |`.
     - Tự động tách từng cột phân định bởi dấu `|`, lọc bỏ dòng gạch nối `|---|---|`, khớp chính xác tên hoa trong kho và số lượng thực tế.
  4. **Tích hợp vào giao diện Đọc ảnh Modal ([`ImageOrderReaderModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/ImageOrderReaderModal.tsx)):**
     - Đặt nút engine **Ocr4AI (laychu.com)** lên vị trí đầu tiên, gắn icon Sparkles nổi bật.
     - Bổ sung thẻ cấu hình Ocr4AI chuyên biệt với đầy đủ ô nhập API Key, Model (`ocr4ai-fast`), Định dạng OCR (`markdown` / `text`), Base URL, nút [Lưu key Ocr4AI], nút [Xóa key] cùng link mở nhanh trang Đăng ký và Tài liệu API.
  5. **Kiểm thử Kỹ thuật:**
     - TypeScript `tsc -b`: **Exit code 0** (0 lỗi).
     - Vite `npm run build`: **Biên dịch thành công 100%**.

---

### Yêu cầu 48: Căn lề phải Drawer Đọc ảnh ra đơn NCC, mở rộng kích thước tối đa và tích hợp bộ công cụ thu phóng & di chuyển ảnh (Zoom & Pan)
- **Thời gian:** `14:42:00 - 29/10/2026`
- **Nguyên văn yêu cầu:**
  > *"cũng ok rồi . có cho đc căn lên phải + độ rộng to ra để tôi có thể nhìn ảnh. phóng to thu nhỏ ảnh"*
- **Ý nghĩa & Lý do thực tế:**
  - Hộp thoại Đọc ảnh trước đây ở chính giữa màn hình với kích thước cố định (`max-w-4xl`), khung ảnh chỉ dạng `aspect-[4/3]` nên với các ảnh chụp hóa đơn dài/nhiều dòng từ Zalo hoặc nhà vườn, chữ bị thu nhỏ li ti rất khó đọc và đối chiếu số lượng.
  - Người dùng muốn:
    1. Căn về bên phải đồng bộ dạng Drawer cạnh phải (`h-full`, trượt từ mép phải màn hình sang).
    2. Độ rộng to ra linh hoạt (`76rem` / `90rem` / `Toàn màn hình`) để nhìn rõ cả ảnh hóa đơn lẫn bảng trích xuất cùng lúc (chia đều tỉ lệ 50/50).
    3. Bộ công cụ phóng to, thu nhỏ ảnh trực tiếp: nút bấm Zoom, lăn chuột (Mouse Wheel), kéo rê chuột (Pan/Drag) và xem ảnh toàn màn hình (Lightbox).
- **Giải pháp & Triển khai:**
  1. **Chuyển thành Drawer trượt cạnh phải chuyên nghiệp ([`ImageOrderReaderModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang-ncc/ImageOrderReaderModal.tsx)):**
     - Đổi container thành `fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs`.
     - Panel chiếm chiều cao tối đa (`h-full`), trượt mượt mà từ phải sang (`slide-in-from-right`).
     - Tích hợp cụm nút chuyển đổi kích thước trên header: **Vừa (76rem)**, **Rộng (90rem - Mặc định)** và **Toàn màn hình (100vw)**.
  2. **Tối ưu bố cục 2 cột siêu thoáng:**
     - Chia 50/50 giữa 2 cột: Cột ảnh hóa đơn (`lg:col-span-6`) và Cột bảng đối soát mặt hàng trích xuất (`lg:col-span-6`).
     - Tăng chiều cao vùng xem ảnh và bảng lên **580px**, đảm bảo nhìn trọn vẹn cả bảng kê và hình ảnh mà không phải cuộn lắt nhắt.
  3. **Bộ công cụ Thu phóng & Di chuyển ảnh (Zoom & Pan):**
     - Thanh công cụ điều khiển trên khung ảnh:
       - Nút Thu nhỏ `ZoomOut` (-25%).
       - Nút hiển thị tỉ lệ phần trăm `%` (bấm vào là tự động trả về 100%).
       - Nút Phóng to `ZoomIn` (+25%, tối đa 400%).
       - Nút Đặt lại `RotateCcw` (reset về 100% và tọa độ tâm).
       - Nút Toàn màn hình `Maximize2` mở Lightbox toàn khung hình.
     - Tương tác chuột cao cấp:
       - **Lăn chuột (Mouse Wheel):** Tự động zoom in/zoom out mượt mà.
       - **Kéo chuột (Drag/Pan):** Khi đang zoom > 100%, con trỏ đổi thành bàn tay (`cursor-grab` / `grabbing`), cho phép kéo rê tự do để soi từng góc hóa đơn.
       - **Nhấp đúp (Double-click):** Phóng to nhanh 200% hoặc trả về 100%.
  4. **Lightbox Modal toàn màn hình:**
     - Cho phép bật chế độ soi chi tiết 100vw x 100vh trên nền tối mờ, hỗ trợ zoom đến 400% để đọc rõ nét các hóa đơn viết tay mờ hoặc rách góc.
  5. **Kiểm thử Kỹ thuật:**
     - TypeScript `tsc -b`: **Exit code 0** (0 lỗi).
     - Vite `npm run build`: **Biên dịch thành công 100%**.

---

### Yêu cầu 49: Bổ sung tab thứ 3 "Lịch sử thao tác" trong module Đơn hàng (Audit Log)
- **Thời gian:** `13:42:46 - 05/11/2026`
- **Nguyên văn yêu cầu:**
  > *"modul đơn hàng thêm 1 tap lịch sử ở đây để lưu lại lịch sửa thao tác thêm sửa xóa của từng nhân viên."*
  *(Kèm ảnh chụp màn hình vẽ khung đỏ chỉ định vị trí ngay bên phải tab "Báo cáo & Thống kê đơn")*
- **Giải pháp & Triển khai:**
  1. **Tạo mới Tab thứ 3 trên thanh Segmented Tabs ([`DonHangPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangPage.tsx)):**
     - Mở rộng kiểu `type Tab = 'danhsach' | 'thongke' | 'lichsu'`.
     - Thêm tab `{ id: 'lichsu', label: 'Lịch sử thao tác', icon: History }` đặt ngay cạnh `thongke`, đúng chính xác vị trí ô vuông đỏ người dùng khoanh trên ảnh giao diện.
  2. **Xây dựng Hệ thống Ghi vết Thao tác (Order Audit Logging):**
     - **Types ([`hoaKhangThanh.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/types/hoaKhangThanh.ts)):**
       - `OrderAuditAction`: `'create' | 'update' | 'delete' | 'status_change'`.
       - `OrderAuditDiff`: Lưu danh sách trường thay đổi (`field`, `label`, `oldValue`, `newValue`).
       - `OrderAuditLog`: Lưu chi tiết bản ghi (Mã log, ID đơn, Mã đơn, Thao tác, Thời gian, Nhân viên thực hiện, Mã NV, Chức vụ, Khách hàng, Tóm tắt, Nội dung chi tiết, Diff so sánh và Bản sao đối tượng snapshot).
     - **Store Quản lý ([`orderLogStore.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/orderLogStore.ts)):**
       - Tự động bắt vết danh tính nhân viên đang đăng nhập từ `useAuthStore` hoặc người tạo đơn `order.creator`.
       - Tự động so sánh (calculate diff) chi tiết các trường bị sửa đổi giữa `oldOrder` và `order`: Trạng thái, NPP, Số lượng hoa, Thành tiền, Cước xe, Trừ hàng, Tổng tiền, Công nợ cũ, Thanh toán, Ghi chú, Mặt hàng hoa...
       - Lưu trữ dữ liệu bền vững qua LocalStorage (`hkt-order-audit-logs-storage`).
     - **Tích hợp Trigger Tự động vào Store ([`hoaKhangThanhStore.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/hoaKhangThanhStore.ts)):**
       - Bất cứ khi nào gọi `addOrder()`, `updateOrder()`, `updateOrderStatus()`, `updatePaymentStatus()`, hoặc `deleteOrder()`, hệ thống tự động ghi nhật ký vào `useOrderLogStore`.
  3. **Giao diện Phân hệ Lịch sử Thao tác ([`DonHangLichSu.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/don-hang/DonHangLichSu.tsx)):**
     - **5 Thẻ KPI Thống kê nhanh:**
       - Tổng thao tác đã lưu.
       - Thêm mới đơn (màu xanh ngọc).
       - Chỉnh sửa đơn (màu xanh dương).
       - Đổi trạng thái (màu tím indigo).
       - Xóa đơn hàng (màu đỏ rose).
     - **Thanh Công cụ Bộ lọc Tức thì:**
       - Ô tìm kiếm linh hoạt: Tìm theo Mã đơn (`DH-2026-xxx`), Tên nhân viên, Mã nhân viên (`NV-xxx`), Tên khách hàng/NPP hoặc nội dung thao tác.
       - Bộ lọc theo Loại thao tác: Tất cả, Thêm mới, Chỉnh sửa, Đổi trạng thái, Xóa đơn.
       - Bộ lọc theo Nhân viên: Lọc riêng từng nhân viên trong hệ thống.
       - Bộ lọc Mốc thời gian: Hôm nay, Hôm qua, 7 ngày qua, 30 ngày qua.
     - **Bảng Dữ liệu Nhật ký Đầy đủ:**
       - Cột Thời gian (`HH:mm:ss DD/MM/YYYY` kèm thời gian tương đối `(x phút trước)`).
       - Cột Thao tác (Badge màu trực quan với icon tương ứng).
       - Cột Nhân viên thực hiện (Avatar chữ cái đầu + Họ tên đậm + Mã NV + Chức vụ).
       - Cột Mã đơn hàng (kèm nhãn `[Đã xóa]` nếu là đơn đã bị xóa khỏi hệ thống).
       - Cột NPP / Khách hàng và Giá trị đơn hàng.
       - Cột Chi tiết thay đổi (Hiển thị tóm tắt và các thẻ tag so sánh `Giá trị cũ → Giá trị mới`).
       - Nút Xem chi tiết (`Eye`).
     - **Hộp thoại Drawer Chi tiết Nhật ký (Audit Inspection):**
       - Thẻ thông tin nhân viên thao tác.
       - Thẻ thông tin đơn hàng liên quan.
       - **Bảng đối chiếu thay đổi (Diff Table):** 3 cột trực quan (Trường thông tin | Giá trị trước | Giá trị sau khi sửa với màu đỏ/xanh rõ rệt).
       - **Bảng danh sách mặt hàng hoa từ Snapshot:** Hiển thị trọn vẹn danh sách hoa, số lượng, đơn giá, thành tiền của đơn hàng lúc thao tác (kể cả đơn đã bị xóa vĩnh viễn).
     - **Tiện ích Xuất file Excel & Quản trị:**
       - Nút **Xuất Excel** chuẩn định dạng báo cáo kiểm toán doanh nghiệp.
       - Nút **Dữ liệu mẫu** khôi phục nhanh nhật ký khởi tạo.
       - Nút **Xóa nhật ký** có hộp thoại xác nhận bảo mật (`useConfirm`).
  4. **Kiểm thử Kỹ thuật:**
     - TypeScript `tsc -b`: **Exit code 0** (0 lỗi).
     - Vite `npm run build`: **Biên dịch thành công 100%**.

---

### Yêu cầu 50: Kết nối Web với Google Sheets (Spreadsheet: HOA_KHANG_THANH) qua Google Service Account
- **Thời gian:** `14:52:20 - 05/11/2026`
- **Nguyên văn yêu cầu:**
  > *"{ "type": "serviceaccount", "projectid": "h161-508101", "privatekeyid": "7394696a19771486f1368cfaafe5ffe6b8e9ab00", "privatekey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n", "clientemail": "ca-nhan@h161-508101.iam.gserviceaccount.com", ... }*  
  > *[HOA_KHANG_THANH - Google Trang tính](https://docs.google.com/spreadsheets/d/1iFYENcKF-9y5y_cfsmSjZyfbITMl1aIYwYgPL6i9vnQ/edit?gid=0#gid=0)*  
  > *hãy kết nối web với gg sheet này. tự thiết kế các sheet cho từng modul và các cột ."*
- **Giải pháp & Triển khai:**
  1. **Tạo lập và Thiết kế 11 Sheets chuẩn kế toán trên Google Spreadsheet:**
     - Đã chạy tiến trình kết nối Google Sheets API v4 bằng Google Service Account (`ca-nhan@h161-508101.iam.gserviceaccount.com`).
     - Tự động xóa sheet mặc định `Trang tính1` và tạo mới **11 Sheets** tương ứng với từng module dữ liệu của hệ thống:
       1. `DON_HANG` (19 cột): Mã đơn, Ngày đặt, NPP/Khách hàng, SĐT, Địa chỉ, SL hoa, Thành tiền, Cước xe, Trừ hàng, Tổng tiền, Công nợ cũ, Thanh toán, Đã thanh toán, Còn nợ đơn, Trạng thái, TT thanh toán, Người tạo, Ghi chú, Cập nhật lúc.
       2. `CHI_TIET_DON_HANG` (12 cột): Mã đơn, Ngày đặt, Khách hàng, Mã hoa, Tên hoa, Số lượng, ĐVT, Giá vốn, Giá bán, Thành tiền vốn, Thành tiền bán, Lợi nhuận.
       3. `DANH_SACH_HOA` (7 cột): Mã hoa, Tên hoa, Tên riêng, Đơn vị tính, Danh mục hoa, Trạng thái, Ghi chú.
       4. `NHA_PHAN_PHOI` (14 cột): Mã NPP, Tên nhà phân phối, Người liên hệ, SĐT, Địa chỉ, Khu vực, Công nợ cũ, Tổng tiền mua, Đã trả, Công nợ hiện tại, Ngày lên đơn gần nhất, Số ngày chưa mua, Cảnh báo nợ, Trạng thái.
       5. `NHA_CUNG_CAP` (11 cột): Mã NCC, Tên nhà cung cấp, Người đại diện, SĐT, Địa chỉ, Khu vực trồng, Công nợ cũ, Tổng tiền nhập, Đã trả NCC, Công nợ hiện tại, Trạng thái.
       6. `DON_NHAP_NCC` (12 cột): Mã đơn nhập, Ngày nhập, NCC, Số lượng hoa, Tiền hàng, Cước xe, Tổng thanh toán, Đã trả NCC, Còn nợ, Trạng thái nhập, Người lập, Ghi chú.
       7. `CONG_NO` (10 cột): Mã công nợ (ID), Ngày ghi nhận, Đối tác, Loại đối tác (NPP/NCC), Loại giao dịch, Số tiền phát sinh, Công nợ lũy kế, Mã đơn liên quan, Người phụ trách, Ghi chú.
       8. `THU_CHI` (9 cột): Mã phiếu, Ngày chứng từ, Loại phiếu (Thu/Chi), Hạng mục, Số tiền, Người nộp/nhận, Phương thức, Người lập, Ghi chú.
       9. `TON_KHO` (9 cột): Mã hoa, Tên hoa, Đơn vị tính, Tồn đầu kỳ, Nhập trong kỳ, Xuất trong kỳ, Tồn cuối kỳ, Cảnh báo tồn, Vị trí kho.
       10. `NHAN_VIEN` (11 cột): Mã nhân viên, Họ và tên, Tên đăng nhập, Chức vụ, Phòng ban, Quyền hạn, SĐT, Email, Ngày vào làm, Lương cơ bản, Trạng thái.
       11. `LICH_SU_THAO_TAC` (10 cột): Mã log, Thời gian, Nhân viên thực hiện, Mã NV, Chức vụ, Thao tác, Mã đơn hàng, Khách hàng, Tóm tắt, Nội dung chi tiết thay đổi.
     - **Quy chuẩn Định dạng Bảng tính:** Cố định hàng tiêu đề đầu tiên (`frozenRowCount: 1`), nền xanh đen Slate `#1e293b`, chữ trắng in đậm, căn giữa, đệm lề, gắn nhãn màu tab đặc trưng cho từng module, và tự động căn chỉnh độ rộng cột (`autoResizeDimensions`).
  2. **Cấu hình & Tích hợp Tầng Máy chủ Backend / Proxy ([`googleSheetsPlugin.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/server/googleSheetsPlugin.ts)):**
     - Tạo plugin máy chủ Vite xử lý bảo mật ký RSA-SHA256 JWT bearer tự động cấp token OAuth2 Google trong 50 phút.
     - Cung cấp các API:
       - `GET /api/google-sheets/status`: Kiểm tra kết nối, trả về tiêu đề và thông tin các sheets.
       - `POST /api/google-sheets/sync-all`: Nhận dữ liệu tất cả các store từ Web và thực thi `batchUpdate` ghi đồng thời lên 11 sheets trên Google Spreadsheet.
       - `GET /api/google-sheets/pull-all`: `batchGet` tải toàn bộ dữ liệu mới nhất từ Google Sheets về Web.
  3. **Tích hợp Tầng Khách hàng (Client Service & Store):**
     - [`googleSheetsConfig.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/config/googleSheetsConfig.ts): Đọc cấu hình Spreadsheet ID, link URL và Service Account credentials từ tệp môi trường `.env` (`import.meta.env` và `process.env`).
     - [`.env`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/.env) & [`.env.example`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/.env.example): Lưu trữ toàn bộ khóa bí mật Service Account, Private Key, Client Email, Spreadsheet ID. Đã bổ sung `.env` vào [`.gitignore`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/.gitignore) để bảo mật tuyệt đối mã nguồn.
     - [`googleSheetsService.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/lib/googleSheetsService.ts): Bộ kết nối đồng bộ 2 chiều (Push và Pull).
     - [`googleSheetsStore.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/stores/googleSheetsStore.ts): Quản lý trạng thái kết nối, nhật ký đồng bộ, thời gian đồng bộ lần cuối và cơ chế tự động đồng bộ (Auto-sync).
     - **Cơ chế Tự động Đồng bộ (Auto-sync Background):** Lắng nghe thay đổi tự động từ `useOrderStore`, `useFlowerStore`, `useDistributorStore`, `useSupplierStore`, `useCashStore` (debounce 2 giây) để tự động đẩy dữ liệu mới nhất lên Google Sheets mà không làm gián đoạn trải nghiệm người dùng.
  4. **Giao diện Người dùng Đồng bộ Google Sheets:**
     - **Nút bấm trên thanh Header ([`GoogleSheetsHeaderButton.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/components/google-sheets/GoogleSheetsHeaderButton.tsx)):**
       - Đặt trên thanh điều hướng đầu trang cạnh đồng hồ hệ thống.
       - Biểu tượng Google Sheets màu xanh ngọc kèm chấm xanh nhấp nháy báo hiệu kết nối trực tiếp thời gian thực.
     - **Hộp thoại Quản lý Đồng bộ ([`GoogleSheetsModal.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/components/google-sheets/GoogleSheetsModal.tsx)):**
       - Thẻ hiển thị trạng thái kết nối, tên bảng tính `HOA_KHANG_THANH`, Service Account email.
       - Nút mở trực tiếp Google Sheets ra tab mới (`ExternalLink`).
       - Nút **"Đồng bộ lên Google Sheets"** (Push) và **"Tải từ Google Sheets về Web"** (Pull).
       - Nút gạt bật/tắt **"Tự động đồng bộ khi thao tác"** (Auto-sync).
       - Danh sách trực quan 11 sheets kèm mô tả và số lượng cột chi tiết.
       - Lịch sử nhật ký các lần gửi/nhận dữ liệu.
  5. **Kiểm thử Kỹ thuật:**
     - TypeScript `tsc -b`: **Exit code 0** (0 lỗi).
     - Vite `npm run build`: **Biên dịch thành công 100%**.
     - API Google Sheets: Đã khởi tạo thành công 11 sheets và nạp ban đầu 426 ô dữ liệu lên Google Spreadsheet.

---

### Yêu cầu 51: Tối ưu hóa & thống nhất cột Đối tác module Công nợ khớp hoàn toàn với Google Sheets
- **Thời gian:** `23:45:00 - 06/11/2026`
- **Nguyên văn yêu cầu:**
  > *"modul công nợ mã npp và tên là sao . sao ở gg sheet chỉ có 1 cột là đối tác thôi. xem lại"* kèm ảnh chụp màn hình đối chiếu Google Sheet (sheet `CONG_NO` cột B là Đối tác) và giao diện Web (có 2 cột "Mã NPP" và "Tên Nhà Phân Phối", trong đó cột "Mã NPP" bị ô viền rỗng không có mã).
- **Phân tích nguyên nhân:**
  1. Trước đây, giao diện Web phân chia thành 2 cột riêng biệt: `Mã NPP` (partnerCode) và `Tên Nhà Phân Phối` (partnerName). Khi người dùng tạo đơn hàng nhanh bằng tên khách hàng hoặc các đơn hàng phát sinh lẻ, thuộc tính `partnerCode` không được khởi tạo riêng, dẫn đến việc render `span` rỗng có viền xám tạo thành các ô trống vô nghĩa.
  2. Trong khi đó, trên bảng Google Sheets (sheet `CONG_NO`) và module Đơn hàng, thiết kế kế toán chuẩn chỉ sử dụng duy nhất 1 cột: **`Đối tác`** (chứa tên đối tác như `HUY - HÀ NỘI`, `TRANG-SÀI GÒN`), tạo sự không đồng nhất giữa Web và Google Sheets.
- **Giải pháp & Triển khai thực hiện:**
  1. **Thống nhất bảng dữ liệu Công nợ Web ([`CongNoPage.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoPage.tsx)):**
     - Đổi cột chính hiển thị thành 1 cột duy nhất: **"NPP / Khách hàng"** (cho tab NPP) và **"NCC / Nhà cung cấp"** (cho tab NCC), khớp hoàn toàn 1:1 với cột **"Đối tác"** trên Google Sheet `CONG_NO` và module Đơn hàng.
     - Ẩn mặc định cột riêng biệt `Mã NPP` / `Mã NCC` (`visible: false`) trong định nghĩa cột (`NPP_COLUMNS` và `NCC_COLUMNS`). Người dùng vẫn có thể bật lại trong Cài đặt cột nếu muốn, và khi bật lại nếu không có mã thì hiển thị dấu gạch ngang `—` thay vì ô rỗng.
     - Trong cột Đối tác: Tự động tra cứu mã đối tác tương ứng từ danh bạ NPP (`distributors`) hoặc NCC (`suppliers`). Nếu có mã chính thức (ví dụ: `NPP-001`, `NCC-002`), mã sẽ hiển thị như một huy hiệu nhỏ (`badge font-mono`) tinh gọn ngay bên dưới tên đối tác; nếu không có mã thì hiển thị tên đối tác sạch đẹp, liền mạch, không còn bất kỳ ô trống nào.
  2. **Tối ưu hiển thị Mobile Card & Drawer chi tiết ([`CongNoDrawer.tsx`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/modules/cong-no/CongNoDrawer.tsx)):**
     - Trong thẻ Mobile Card: Tự động tra cứu mã và chỉ hiển thị badge khi có mã hợp lệ; không hiển thị ô viền trống rỗng.
     - Trong Drawer xem chi tiết công nợ: Loại bỏ cặp dấu ngoặc đơn rỗng `()` khi đối tác chưa có mã.
  3. **Đồng bộ hóa 2 chiều chuẩn xác từ Google Sheets ([`googleSheetsService.ts`](file:///d:/t%E1%BA%A3i%20xu%E1%BB%91ng%202/hoa%20khang%20th%C3%A0nh/src/lib/googleSheetsService.ts)):**
     - Khi thực hiện tải dữ liệu từ Google Sheets về Web (Pull), hệ thống tự động đối chiếu tên đối tác từ cột B với danh sách `distributors` và `suppliers` để phục hồi đầy đủ `partnerId` và `partnerCode` nếu có, đảm bảo dữ liệu trong Zustand store luôn nhất quán và toàn vẹn.
  4. **Kiểm thử Kỹ thuật:**
     - TypeScript `tsc -b`: **Exit code 0** (0 lỗi).
     - Vite `npm run build`: **Biên dịch thành công 100%**.

---

## III. TỔNG KẾT & QUY CHUẨN ĐÃ ĐƯỢC ÁP DỤNG XUYÊN SUỐT

1. **Quy chuẩn Tiền tệ & Định dạng số:**
   - Tuyệt đối **không hiển thị ký hiệu `₫` hoặc `đ`**.
   - Tất cả các số tiền đều sử dụng dấu chấm (`.`) phân cách hàng nghìn (ví dụ: `50.000`, `14.600.000`).
2. **Quy chuẩn Ngày tháng:**
   - Toàn bộ ngày tháng hiển thị theo định dạng Việt Nam: `dd/mm/yyyy` (ví dụ: `26/10/2026`).
3. **Quy chuẩn Trải nghiệm Người dùng (UX/UI):**
   - Thiết kế giao diện kế toán ERP khít gọn, không khoảng cách thừa, tối ưu cho thao tác nhập liệu bàn phím liên tục.
   - Drawer cạnh phải linh hoạt 3 kích thước: Rộng - Vừa - Nhỏ.
   - Tốc độ tải trang tức thì, hỗ trợ lưu trữ cục bộ (Local Persistence) qua Zustand.
4. **Kiểm thử Kỹ thuật:**
   - Lệnh `npm run typecheck` (`tsc -b`): **Exit code 0** (0 lỗi type).
   - Lệnh `npm run build` (`vite build`): **Biên dịch thành công** 100% tài sản phân phối trong `dist/`.
