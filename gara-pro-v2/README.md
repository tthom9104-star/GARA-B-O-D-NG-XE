# Gara Pro v2

Hệ thống quản lý gara bảo dưỡng xe, chạy trên web và cài được như app (PWA).

## Cách 1: Chạy có máy chủ (khuyên dùng, nhiều máy dùng chung dữ liệu)
Cần Node.js 18 trở lên (Node 22.13+ dùng SQLite, bản cũ hơn tự chuyển sang file JSON). Không cần cài thêm thư viện.
```
cd gara-pro-v2
node server.js          # hoặc: npm start
```
Mở http://localhost:3000. Muốn mở từ điện thoại cùng mạng Wi-Fi: `node server.js --lan` rồi vào `http://<IP máy>:3000`.
Dữ liệu lưu trong thư mục `data/`. Mật khẩu được băm (scrypt), mọi thao tác đều được máy chủ kiểm tra lại theo vai trò.

## Cách 2: Không cần máy chủ (chỉ để xem thử)
Mở thư mục `public/` bằng VS Code, chuột phải `index.html` → **Open with Live Server** (hoặc mở thẳng file).
Dữ liệu lưu trong localStorage của trình duyệt đó, không chia sẻ giữa các máy. Giao diện tự phát hiện: có máy chủ thì dùng máy chủ, không thì dùng localStorage.

## Tài khoản dùng thử
| Vai trò | Đăng nhập | Mật khẩu |
|---|---|---|
| Quản trị viên | admin | admin |
| Lễ tân | letan | 123 |
| Thợ kỹ thuật | tho / tho2 | 123 |
| Khách hàng | khach | 123 |

Khách mới do lễ tân tạo hồ sơ xe có tài khoản = số điện thoại, mật khẩu 123456. Đổi mật khẩu admin trước khi dùng thật.

## Cấu trúc
- `server.js` máy chủ HTTP + API (`/api/login`, `/api/state`, `/api/sync`...)
- `src/store.js` lưu trữ · `src/auth.js` băm mật khẩu, phiên, chống dò · `src/policy.js` phân quyền phía server · `src/seed.js` dữ liệu mẫu
- `public/` giao diện: `js/core.js` (tiện ích, icon, dữ liệu mẫu, popup, biểu đồ), `js/common.js` (dùng chung), `js/admin.js`, `js/reception.js`, `js/tech.js`, `js/customer.js` (theo vai trò), `js/app.js` (đăng nhập, menu, thông báo), `js/api.js` (kết nối máy chủ, nạp cuối), `css/style.css`, `sw.js`, `manifest.json`, `icon.svg`
