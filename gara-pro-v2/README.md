# Gara Pro v2

Hệ thống quản lý gara bảo dưỡng xe, chạy trên web và cài được như app (PWA).

## Chạy
1. Mở thư mục này bằng VS Code.
2. Cài extension **Live Server**, chuột phải `index.html` → **Open with Live Server**.
   (Mở thẳng `index.html` cũng chạy được, chỉ không cài được thành app và không có chế độ offline.)

## Tài khoản dùng thử
| Vai trò | Đăng nhập | Mật khẩu |
|---|---|---|
| Quản trị viên | admin | admin |
| Lễ tân | letan | 123 |
| Thợ kỹ thuật | tho / tho2 | 123 |
| Khách hàng | khach | 123 |

Khách mới do lễ tân tạo hồ sơ xe sẽ có tài khoản = số điện thoại, mật khẩu 123456.

## Cấu trúc
- `js/core.js`      tiện ích, icon, dữ liệu mẫu (`seed()`), popup, biểu đồ
- `js/common.js`    thành phần dùng chung (lịch sử xe, bước tiến độ, mẫu in hóa đơn)
- `js/admin.js`     Quản trị viên
- `js/reception.js` Lễ tân
- `js/tech.js`      Thợ kỹ thuật
- `js/customer.js`  Khách hàng
- `js/app.js`       đăng nhập, menu, thông báo (nạp cuối cùng)
- `css/style.css`   giao diện, chế độ sáng/tối, responsive
- `sw.js`, `manifest.json`, `icon.svg`  cho PWA

Dữ liệu lưu trong localStorage của trình duyệt. Muốn nhiều máy dùng chung dữ liệu cần thêm backend và cơ sở dữ liệu.
