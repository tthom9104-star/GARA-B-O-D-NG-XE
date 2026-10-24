# Đề án: Gara bảo dưỡng xe (Gara Pro)

## 1. Thành viên nhóm

| Họ tên | MSSV |
|---|---|
| Trần Đại Vĩ | 2506012001 |
| Lê Phạm Thành Thơm | 2506022004 |
| Trịnh Quốc Đạt | 2506022005 |

## 2. Phân công: ai làm gì

| Thành viên | Chức năng phụ trách (theo yêu cầu đề án) | File chính |
|---|---|---|
| **Trần Đại Vĩ** | **Quản lý Hệ thống (Quản trị & Báo cáo):** quản lý tài khoản và phân quyền, cấu hình danh mục dịch vụ / định mức công chuẩn, báo cáo doanh thu theo ngày-tháng-năm, nhật ký, cài đặt gara.<br>**Kho phụ tùng:** danh mục phụ tùng, nhập kho, cảnh báo sắp hết hàng.<br>**Máy chủ & dữ liệu:** API, đăng nhập an toàn, phân quyền phía server, lưu SQLite. | `public/js/admin.js`, `server.js`, `src/auth.js`, `src/policy.js`, `src/store.js`, `src/seed.js`, `public/js/api.js` |
| **Lê Phạm Thành Thơm** | **Quản lý Tiếp nhận xe:** tạo hồ sơ xe, tra cứu lịch sử, lập phiếu tiếp nhận, quản lý lịch hẹn.<br>**Khảo sát và Báo giá:** báo giá 3 phiên bản (Tiết kiệm / Tiêu chuẩn / Cao cấp), giảm giá, VAT, gửi khách duyệt.<br>**Thanh toán & Giao xe:** giao việc cho thợ, thanh toán, trừ kho, in báo giá / hóa đơn. | `public/js/reception.js`, `public/js/common.js` |
| **Trịnh Quốc Đạt** | **Quản lý Sửa chữa:** màn hình thợ kỹ thuật (nhận việc, bấm giờ công, tick hạng mục, báo lỗi phát sinh, hoàn tất).<br>**Khách hàng (tùy chọn):** xem xe và lịch sử, so sánh và duyệt báo giá, đặt lịch, xem hóa đơn, nhắc bảo dưỡng định kỳ.<br>**Giao diện & PWA:** khung ứng dụng, menu theo vai trò, thông báo, sáng/tối, responsive, cài như app. | `public/js/tech.js`, `public/js/customer.js`, `public/js/app.js`, `public/css/style.css`, `public/sw.js`, `public/manifest.json` |

**Làm chung cả nhóm:** dữ liệu mẫu và kiểm thử theo từng vai trò (`public/js/core.js`), viết báo cáo và thuyết trình.

## 3. Phạm vi đề án và tình trạng

| Yêu cầu | Người làm | Trạng thái |
|---|---|---|
| Quản lý Tiếp nhận xe (Reception) | Thơm | Hoàn thành |
| Khảo sát và Báo giá (Ước tính & Báo giá) | Thơm | Hoàn thành |
| Quản lý Sửa chữa & Kho phụ tùng (Service & Inventory) | Đạt (sửa chữa), Vĩ (kho) | Hoàn thành |
| Thanh toán & Giao xe | Thơm | Hoàn thành |
| Quản lý Hệ thống (Quản trị & Báo cáo) | Vĩ | Hoàn thành |
| Máy chủ + cơ sở dữ liệu dùng chung nhiều máy | Vĩ | Hoàn thành |

## 4. Vai trò người dùng

Quản trị viên, Lễ tân, Thợ kỹ thuật, Khách hàng (mô tả trong file `user roles`, sơ đồ trong file `.png`).

## 5. Chạy dự án

Mã nguồn nằm trong `gara-pro-v2/`. Xem hướng dẫn và tài khoản dùng thử trong `gara-pro-v2/README.md`.
