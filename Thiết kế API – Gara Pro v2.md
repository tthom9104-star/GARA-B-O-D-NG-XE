# Thiết kế API – Gara Pro v2

Tài liệu thiết kế API cho hệ thống quản lý gara bảo dưỡng xe. Thiết kế bám sát code hiện có (`server.js`, `src/policy.js`, `src/store.js`) và bổ sung lớp REST theo tài nguyên để dễ hiểu, dễ trình bày và dễ mở rộng.

## 1. Hiện trạng và hướng thiết kế

**Hiện trạng:** máy chủ có 6 endpoint kiểu đồng bộ: `POST /api/login`, `POST /api/logout`, `GET /api/state`, `GET /api/rev`, `POST /api/sync`, `POST /api/reset`. Mọi thay đổi dữ liệu đều gộp vào `/api/sync` dưới dạng `{col, id, doc}`.

**Hướng thiết kế:** giữ nguyên cơ chế cũ để giao diện đang chạy không bị hỏng, và thêm bộ API REST `/api/v1/...` chia theo tài nguyên. Mỗi endpoint mới chỉ là lớp mỏng gọi lại `policy.apply()`, nên toàn bộ quy tắc phân quyền và kiểm tra dữ liệu phía server được dùng lại, không viết trùng.

## 2. Quy ước chung

| Hạng mục | Quy ước |
| --- | --- |
| Địa chỉ gốc | `http://localhost:3000/api/v1` |
| Định dạng | JSON, `Content-Type: application/json; charset=utf-8` |
| Xác thực | Header `Authorization: Bearer <token>` (token 48 ký tự hex lấy từ đăng nhập, hết hạn theo phiên) |
| Tên tài nguyên | Danh từ số nhiều, chữ thường, gạch ngang: `/orders`, `/parts`, `/appointments` |
| Mã định danh | Chuỗi `A-Za-z0-9_-`, tối đa 40 ký tự (ví dụ `o12`, `v3`, `u4`) |
| Thời gian | Ngày `YYYY-MM-DD`, giờ `HH:mm`, mốc thời gian là milli-giây epoch (`t`) |
| Tiền | Số nguyên VND, VAT và giảm giá tính theo phần trăm (0–100) |
| Phiên bản | Tiền tố `/api/v1` ở đường dẫn |

### 2.1. Phương thức HTTP

| Phương thức | Ý nghĩa |
| --- | --- |
| `GET` | Đọc, không làm thay đổi dữ liệu |
| `POST` | Tạo mới, hoặc thực hiện một hành động nghiệp vụ (`/orders/:id/pay`) |
| `PATCH` | Sửa một phần |
| `PUT` | Thay thế toàn bộ (dùng cho cài đặt) |
| `DELETE` | Xóa (chỉ admin, chỉ với người dùng, dịch vụ, phụ tùng) |

### 2.2. Kiểm soát xung đột bản ghi

Mỗi bản ghi có trường `_v` (số phiên bản) do máy chủ tăng sau mỗi lần sửa. Khi sửa, client gửi kèm `_v` đã đọc (trong body hoặc header `If-Match: <_v>`). Nếu có người khác đã sửa trước, máy chủ trả `409 Conflict` và client phải tải lại rồi thao tác lại. Cơ chế này đã có sẵn trong `policy.apply()`.

### 2.3. Định dạng lỗi

Giữ trường `error` như hiện nay để giao diện cũ vẫn đọc được, thêm trường `code` để máy đọc:

```json
{ "error": "Sai tên đăng nhập hoặc mật khẩu", "code": "INVALID_CREDENTIALS" }
```

| Mã HTTP | Khi nào | Ví dụ `code` |
| --- | --- | --- |
| 200 | Thành công |  |
| 201 | Tạo mới thành công |  |
| 204 | Thành công, không có nội dung (xóa) |  |
| 400 | Dữ liệu không hợp lệ | `VALIDATION_FAILED` |
| 401 | Chưa đăng nhập hoặc phiên hết hạn | `UNAUTHENTICATED` |
| 403 | Không đủ quyền hoặc sai trạng thái nghiệp vụ | `FORBIDDEN` |
| 404 | Không có tài nguyên hoặc không có API này | `NOT_FOUND` |
| 405 | Sai phương thức | `METHOD_NOT_ALLOWED` |
| 409 | Xung đột phiên bản `_v` hoặc dữ liệu trùng | `VERSION_CONFLICT` |
| 413 | Body vượt 2 MB | `PAYLOAD_TOO_LARGE` |
| 429 | Đăng nhập sai quá nhiều lần (khóa 5 phút) | `TOO_MANY_ATTEMPTS` |

### 2.4. Phân trang và lọc

Các danh sách lớn (`/orders`, `/vehicles`, `/logs`) hỗ trợ:

- `?page=1&limit=20` (mặc định `limit=20`, tối đa 100)
- `?q=` tìm theo từ khóa (biển số, tên chủ xe, số phiếu)
- `?sort=-date` (dấu `-` là giảm dần)

Phản hồi dạng danh sách: `{ "data": [...], "page": 1, "limit": 20, "total": 135 }`.

## 3. Vai trò

| Mã | Vai trò | Phạm vi |
| --- | --- | --- |
| `admin` | Quản lý | Toàn hệ thống |
| `rec` | Lễ tân | Xe, phiếu, lịch hẹn, báo giá, thanh toán |
| `tech` | Thợ kỹ thuật | Phiếu được giao cho mình, đang ở trạng thái `working` |
| `cus` | Khách hàng | Chỉ xe, phiếu, lịch hẹn gắn với số điện thoại của mình |

Máy chủ lọc dữ liệu đọc theo vai trò (`policy.readScope`) nên cùng một endpoint `GET` trả kết quả khác nhau tùy người gọi.

## 4. Xác thực (`/auth`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| POST | `/auth/login` | Công khai | Đăng nhập, trả token |
| POST | `/auth/logout` | Đã đăng nhập | Hủy phiên |
| GET | `/auth/me` | Đã đăng nhập | Thông tin người đang đăng nhập |
| PUT | `/auth/password` | Đã đăng nhập | Đổi mật khẩu của chính mình |

**Đăng nhập**

```json
POST /api/v1/auth/login
{ "user": "letan", "pw": "123" }
```

```json
200 OK
{ "token": "9f2c...", "me": { "id": "u2", "name": "Lễ tân", "role": "rec" } }
```

Lỗi: `401` sai thông tin, `429` sai quá nhiều lần (giới hạn theo cặp IP và tên đăng nhập).

## 5. Người dùng (`/users`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/users` | Mọi vai trò (khách chỉ thấy mình và nhân viên) | Danh sách. Chỉ admin thấy `user` (tên đăng nhập) |
| POST | `/users` | admin (mọi vai trò); rec (chỉ tạo `cus`) | Tạo tài khoản |
| GET | `/users/:id` | Như trên | Chi tiết |
| PATCH | `/users/:id` | admin; người dùng sửa tên và mật khẩu của mình | Sửa |
| DELETE | `/users/:id` | admin | Xóa (không xóa chính mình, phải còn ít nhất 1 admin) |
| POST | `/users/:id/reset-password` | admin | Đặt lại mật khẩu |

```json
POST /api/v1/users
{ "name": "Nguyễn Văn A", "user": "0901234567", "role": "cus", "phone": "0901234567", "pw": "123456" }
```

Quy tắc: tên đăng nhập 3–40 ký tự, không có khoảng trắng và không trùng; khách hàng bắt buộc có số điện thoại; mật khẩu tối thiểu 3 ký tự và được băm (scrypt), không bao giờ trả về trong phản hồi.

## 6. Danh mục dịch vụ (`/services`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/services` | admin, rec | Danh sách dịch vụ và định mức công chuẩn |
| POST | `/services` | admin | Thêm dịch vụ |
| PATCH | `/services/:id` | admin | Sửa |
| DELETE | `/services/:id` | admin | Xóa |

Trường: `id`, `name` (1–120 ký tự), `hrs` (giờ công chuẩn, 0–100), `price` (đơn giá công).

## 7. Phụ tùng và kho (`/parts`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/parts` | admin, rec | Danh sách. `?lowStock=true` chỉ lấy phụ tùng có `stock <= min` |
| POST | `/parts` | admin | Thêm phụ tùng |
| PATCH | `/parts/:id` | admin (mọi trường); rec (chỉ `stock`) | Sửa |
| DELETE | `/parts/:id` | admin | Xóa |
| POST | `/parts/:id/stock-in` | admin | Nhập kho, cộng thêm `qty` vào `stock` |

```json
POST /api/v1/parts/p3/stock-in
{ "qty": 20 }
```

Trường: `name`, `price`, `stock` (tồn), `min` (ngưỡng cảnh báo sắp hết). Lễ tân chỉ được thay đổi tồn kho, việc này xảy ra tự động khi thanh toán.

## 8. Hồ sơ xe (`/vehicles`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/vehicles` | admin, rec, tech (tất cả); cus (chỉ xe của mình) | Danh sách. Lọc `?plate=`, `?phone=`, `?q=` |
| POST | `/vehicles` | admin, rec | Tạo hồ sơ xe (lễ tân có thể kèm tạo tài khoản khách) |
| GET | `/vehicles/:id` | Theo phạm vi đọc | Chi tiết |
| PATCH | `/vehicles/:id` | admin, rec | Sửa |
| GET | `/vehicles/:id/orders` | Theo phạm vi đọc | Lịch sử bảo dưỡng của xe |

Trường: `plate` (biển số, tự viết hoa, không trùng), `model`, `owner`, `phone`, `km`, `nextDate` (ngày bảo dưỡng tiếp theo), `nextKm`.

## 9. Phiếu tiếp nhận và sửa chữa (`/orders`)

Đây là tài nguyên trung tâm. Một phiếu đi qua các trạng thái:

`received` (tiếp nhận) → `quoted` (đã báo giá) → `approved` (khách duyệt) → `working` (đang sửa) → `done` (hoàn tất) → `paid` (đã thanh toán)

Khách có thể trả phiếu từ `quoted` về `received` kèm ghi chú yêu cầu chỉnh sửa.

### 9.1. Tài nguyên cơ bản

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/orders` | admin, rec (tất cả); tech (phiếu liên quan); cus (phiếu xe của mình) | Danh sách. Lọc `?status=`, `?vehicleId=`, `?tech=`, `?from=&to=` |
| POST | `/orders` | admin, rec | Lập phiếu tiếp nhận (luôn bắt đầu ở `received`, số phiếu `PT-0001` do máy chủ cấp) |
| GET | `/orders/:id` | Theo phạm vi đọc | Chi tiết, gồm `quotes`, `tasks`, `issues`, `log` |
| PATCH | `/orders/:id` | admin, rec | Sửa báo giá, giảm giá (`disc`), VAT (`vat`), số km |

### 9.2. Hành động nghiệp vụ

Mỗi bước chuyển trạng thái là một endpoint riêng. Máy chủ tự kiểm tra trạng thái hiện tại và vai trò, nên không thể nhảy bước. Mỗi hành động tự ghi thêm một dòng vào `log` của phiếu.

| Phương thức | Đường dẫn | Ai gọi | Chuyển trạng thái | Mô tả |
| --- | --- | --- | --- | --- |
| POST | `/orders/:id/send-quote` | rec, admin | `received` → `quoted` | Gửi báo giá 3 phiên bản cho khách, tạo thông báo cho khách |
| POST | `/orders/:id/approve` | cus (xe của mình) | `quoted` → `approved` | Khách duyệt, body `{ "chosen": 1 }` (chỉ số phiên bản: 0 Tiết kiệm, 1 Tiêu chuẩn, 2 Cao cấp) |
| POST | `/orders/:id/request-revision` | cus (xe của mình) | `quoted` → `received` | Yêu cầu chỉnh sửa, body `{ "note": "..." }` (tối đa 500 ký tự) |
| POST | `/orders/:id/assign` | rec, admin | `approved` → `working` | Giao việc cho thợ, body `{ "tech": "u3" }`, tạo danh sách `tasks` từ hạng mục dịch vụ đã chọn |
| POST | `/orders/:id/tasks/:index/start` | tech (phiếu của mình) | giữ `working` | Bấm giờ bắt đầu hạng mục |
| POST | `/orders/:id/tasks/:index/stop` | tech (phiếu của mình) | giữ `working` | Dừng bấm giờ, cộng dồn `sec` |
| PATCH | `/orders/:id/tasks/:index` | tech (phiếu của mình) | giữ `working` | Tick hoàn thành (`done`) hoặc nhập giờ thủ công (`sec`) |
| POST | `/orders/:id/issues` | tech (phiếu của mình) | giữ `working` | Báo lỗi phát sinh, tạo thông báo cho lễ tân |
| POST | `/orders/:id/complete` | tech (phiếu của mình) | `working` → `done` | Báo hoàn tất |
| POST | `/orders/:id/pay` | rec, admin | `done` → `paid` | Thanh toán, body `{ "pay": "Tiền mặt" }`, tự trừ kho, ghi `paidAt`, báo admin nếu phụ tùng sắp hết |
| GET | `/orders/:id/invoice` | rec, admin, cus (xe của mình) |  | Dữ liệu in báo giá hoặc hóa đơn (tổng tiền, giảm giá, VAT, thành tiền) |

**Ví dụ: khách duyệt báo giá**

```json
POST /api/v1/orders/o2/approve
{ "chosen": 1 }
```

```json
200 OK
{ "id": "o2", "no": "PT-0002", "status": "approved", "chosen": 1, "_v": 4 }
```

**Ví dụ lỗi nghiệp vụ**

```json
POST /api/v1/orders/o5/approve   (phiếu đang ở trạng thái working)
403 { "error": "Phiếu này không ở bước chờ duyệt báo giá", "code": "FORBIDDEN" }
```

### 9.3. Cấu trúc một phiếu

| Trường | Ý nghĩa |
| --- | --- |
| `id`, `no` | Mã nội bộ và số phiếu (`PT-0001`) |
| `vid` | Mã xe |
| `km`, `req` | Số km lúc nhận, yêu cầu của khách |
| `status` | Một trong 6 trạng thái ở trên |
| `quotes` | Mảng 3 phiên bản `{ name, items[] }`, mỗi `item` là dịch vụ (`t: "s"`) hoặc phụ tùng |
| `chosen` | Chỉ số phiên bản khách chọn, hoặc `null` |
| `disc`, `vat` | Giảm giá và VAT (%) |
| `tech` | Mã thợ được giao |
| `tasks` | Hạng mục sửa: `{ name, std, sec, run, done }` (giờ chuẩn, giây thực tế, mốc bấm giờ, hoàn thành) |
| `issues`, `log`, `note` | Lỗi phát sinh, nhật ký phiếu (chỉ thêm, không sửa dòng cũ), ghi chú |
| `date`, `paidAt`, `pay` | Ngày tiếp nhận, ngày và hình thức thanh toán |

## 10. Lịch hẹn (`/appointments`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/appointments` | admin, rec (tất cả); cus (của mình) | Danh sách. Lọc `?date=`, `?status=` |
| POST | `/appointments` | cus (xe của mình, trạng thái `new`); rec, admin | Đặt lịch |
| POST | `/appointments/:id/confirm` | rec, admin | `new` → `confirmed` |
| POST | `/appointments/:id/complete` | rec, admin | `confirmed` → `done` |
| POST | `/appointments/:id/cancel` | cus (lịch của mình, chưa diễn ra); rec, admin | Hủy, chuyển sang `cancel` |

Trường: `vid`, `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `note` (tối đa 300 ký tự), `status` (`new`, `confirmed`, `done`, `cancel`).

## 11. Thông báo (`/notifications`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/notifications` | Mọi vai trò | Thông báo gửi cho mình hoặc cho vai trò của mình (`to: "role:rec"`), mới nhất trước |
| POST | `/notifications/:id/read` | Người nhận | Đánh dấu đã đọc cho chính mình |
| POST | `/notifications/read-all` | Người nhận | Đánh dấu đã đọc tất cả |

Thông báo do máy chủ tự tạo khi có sự kiện (gửi báo giá, khách duyệt, giao việc, báo lỗi phát sinh, hoàn tất, phụ tùng sắp hết). Hệ thống tự dọn, giữ tối đa 300 thông báo.

## 12. Báo cáo và nhật ký

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/reports/revenue` | admin | Doanh thu. `?group=day\|month\|year&from=2026-01-01&to=2026-12-31` |
| GET | `/reports/technicians` | admin | Hiệu suất thợ: số phiếu, tổng giờ thực tế so với giờ chuẩn |
| GET | `/reports/revenue.csv` | admin | Xuất CSV |
| GET | `/logs` | admin | Nhật ký thao tác, mới nhất trước. Chỉ thêm, không sửa, giữ tối đa 400 dòng |

**Ví dụ**

```json
GET /api/v1/reports/revenue?group=month&from=2026-01-01&to=2026-10-31
```

```json
200 OK
{ "group": "month", "data": [ { "period": "2026-09", "orders": 14, "revenue": 38500000 }, { "period": "2026-10", "orders": 11, "revenue": 29200000 } ] }
```

Doanh thu chỉ tính các phiếu ở trạng thái `paid`, theo ngày `paidAt`.

## 13. Cài đặt và hệ thống

| Phương thức | Đường dẫn | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/settings` | Mọi vai trò | Tên, địa chỉ, điện thoại gara và VAT mặc định |
| PUT | `/settings` | admin | Cập nhật cài đặt |
| GET | `/sync/rev` | Đã đăng nhập | Số phiên bản dữ liệu hiện tại (tương đương `/api/rev`) để nhiều máy kiểm tra thay đổi |
| POST | `/admin/reset` | admin | Khôi phục dữ liệu mẫu (nguy hiểm, buộc mọi người đăng nhập lại) |
| GET | `/admin/backup` | admin | Tải bản sao lưu toàn bộ dữ liệu dạng JSON |

Trường cài đặt: `name`, `addr`, `phone`, `vat` (0–100).

## 14. Ma trận phân quyền

Ký hiệu: ✔ được, ✖ không, ◐ có điều kiện (xem ghi chú).

| Tài nguyên | Hành động | admin | rec | tech | cus |
| --- | --- | --- | --- | --- | --- |
| users | Xem | ✔ | ✔ | ✔ | ◐ (mình và nhân viên) |
| users | Tạo | ✔ | ◐ (chỉ khách) | ✖ | ✖ |
| users | Sửa, xóa, đặt lại mật khẩu | ✔ | ✖ | ◐ (chỉ mình) | ◐ (chỉ mình) |
| services | Xem | ✔ | ✔ | ✖ | ✖ |
| services | Thêm, sửa, xóa | ✔ | ✖ | ✖ | ✖ |
| parts | Xem | ✔ | ✔ | ✖ | ✖ |
| parts | Thêm, sửa, nhập kho, xóa | ✔ | ◐ (chỉ tồn kho khi thanh toán) | ✖ | ✖ |
| vehicles | Xem | ✔ | ✔ | ✔ | ◐ (xe của mình) |
| vehicles | Tạo, sửa | ✔ | ✔ | ✖ | ✖ |
| orders | Xem | ✔ | ✔ | ✔ | ◐ (xe của mình) |
| orders | Tạo, báo giá, giao việc, thanh toán | ✔ | ✔ | ✖ | ✖ |
| orders | Cập nhật tiến độ, báo hoàn tất | ✖ | ✖ | ◐ (phiếu của mình, đang `working`) | ✖ |
| orders | Duyệt hoặc yêu cầu chỉnh sửa báo giá | ✖ | ✖ | ✖ | ◐ (xe của mình, đang `quoted`) |
| appointments | Xem, xác nhận | ✔ | ✔ | ✖ | ◐ (xem của mình) |
| appointments | Đặt, hủy | ✔ | ✔ | ✖ | ◐ (xe của mình) |
| reports, logs | Xem | ✔ | ✖ | ✖ | ✖ |
| settings | Xem / sửa | ✔ / ✔ | ✔ / ✖ | ✔ / ✖ | ✔ / ✖ |

## 15. Bảo mật

- Mật khẩu băm bằng scrypt, không lưu và không trả về mật khẩu thô.
- Token ngẫu nhiên 48 ký tự hex, có hạn, tự hủy khi tài khoản bị xóa.
- Giới hạn đăng nhập sai: khóa 5 phút theo cặp IP và tên đăng nhập (mã 429).
- Mọi thay đổi đều được kiểm tra lại phía server theo vai trò và quyền sở hữu dữ liệu, giao diện không thể tự cấp quyền.
- Giới hạn kích thước body 2 MB, kiểm tra kiểu và độ dài từng trường.
- Nhật ký phiếu và nhật ký hệ thống chỉ được thêm, không được sửa hay xóa dòng cũ.
- Nên đổi mật khẩu `admin` mặc định trước khi dùng thật.

## 16. Tương thích với API cũ

| API cũ | Cách xử lý |
| --- | --- |
| `POST /api/login` | Giữ nguyên, cùng xử lý với `/api/v1/auth/login` |
| `GET /api/state`, `GET /api/rev` | Giữ nguyên để giao diện hiện tại tiếp tục hoạt động |
| `POST /api/sync` | Giữ nguyên, đánh dấu là API nội bộ dành cho giao diện web |
| `POST /api/reset` | Giữ nguyên, tương đương `/api/v1/admin/reset` |

Giao diện hiện tại không cần sửa. API `/api/v1` dành cho tích hợp mới (ứng dụng di động, kiểm thử tự động, tài liệu cho báo cáo).

## 17. Kế hoạch triển khai

1. **Giai đoạn 1 – Tài liệu (đã xong):** tài liệu này, dùng cho báo cáo và thuyết trình.
2. **Giai đoạn 2 – Đọc:** thêm các `GET` (`/orders`, `/vehicles`, `/parts`, `/reports/...`) với lọc và phân trang, dùng lại `readScope`.
3. **Giai đoạn 3 – Ghi theo tài nguyên:** thêm `POST`, `PATCH`, `DELETE` cơ bản, bọc `policy.apply()`.
4. **Giai đoạn 4 – Hành động nghiệp vụ:** thêm các endpoint chuyển trạng thái của `/orders` và `/appointments`, mỗi endpoint kiểm tra trạng thái trước khi gọi `apply`.
5. **Giai đoạn 5 – Hoàn thiện:** mã lỗi `code`, header `If-Match`, `/admin/backup`, file kiểm thử bằng `curl` hoặc Postman.
