# Vai trò người dùng trong Gara Pro

Hệ thống có 4 vai trò. Mỗi tài khoản chỉ có một vai trò và chỉ thấy đúng phần việc của mình. Máy chủ kiểm tra lại quyền ở từng thao tác nên không thể vượt quyền bằng cách sửa code trên trình duyệt. Trong ứng dụng, bấm vào avatar → **Vai trò & quyền hạn** để xem lại ghi chú này.

| | Quản lý (Admin) | Lễ tân | Thợ kỹ thuật | Khách hàng |
|---|---|---|---|---|
| Tài khoản thử | admin / admin | letan / 123 | tho, tho2 / 123 | khach / 123 |
| Vai trò | Quản lý nhân viên, điều hành toàn hệ thống | Tiếp đón, báo giá, thu tiền | Bảo dưỡng, sửa chữa, cập nhật tiến độ | Theo dõi xe, duyệt báo giá |
| Menu | Tổng quan, Nhân viên & tài khoản, Danh mục & kho, Báo cáo, Nhật ký, Cài đặt | Tổng quan, Xe & khách, Phiếu tiếp nhận, Lịch hẹn | Việc của tôi, Tra cứu xe | Trang chủ, Xe của tôi, Đặt lịch, Hóa đơn |

## 1. Quản lý (Admin)
**Làm được:** thêm / sửa / xóa / đặt lại mật khẩu tài khoản và phân quyền cho lễ tân, thợ, khách; cấu hình danh mục dịch vụ, định mức công chuẩn, phụ tùng, nhập kho; xem báo cáo doanh thu theo ngày-tháng-năm, hiệu suất thợ, xuất CSV; xem nhật ký; sửa thông tin gara và VAT; sao lưu / khôi phục dữ liệu; nhận cảnh báo phụ tùng sắp hết.
**Giới hạn:** không tự đổi vai trò hay xóa chính mình; luôn còn ít nhất một quản lý.

## 2. Lễ tân
**Làm được:** tạo hồ sơ xe (tự tạo tài khoản khách = số điện thoại, mật khẩu 123456); tra cứu lịch sử bảo dưỡng; lập phiếu tiếp nhận; soạn báo giá 3 phiên bản (Tiết kiệm / Tiêu chuẩn / Cao cấp), giảm giá, VAT, gửi khách; xác nhận lịch hẹn; giao việc cho thợ; bàn giao xe, thanh toán, in báo giá / hóa đơn (tự trừ kho).
**Giới hạn:** không sửa danh mục dịch vụ, giá phụ tùng, tài khoản nhân viên; chỉ tạo được tài khoản khách.

## 3. Thợ kỹ thuật
**Làm được:** nhận xe được giao; tra cứu xe và lịch sử sửa chữa; bấm giờ công từng hạng mục, tick hoàn thành, nhập giờ thủ công; thêm hạng mục phát sinh; báo lỗi mới cho lễ tân; báo hoàn tất.
**Giới hạn:** chỉ sửa được phiếu đang giao cho mình và đang sửa; không thấy báo cáo doanh thu.

## 4. Khách hàng
**Làm được:** xem lịch sử xe của mình; so sánh và duyệt báo giá hoặc yêu cầu chỉnh sửa; đặt / hủy lịch hẹn; xem tiến độ; xem và in hóa đơn; nhận nhắc bảo dưỡng định kỳ.
**Giới hạn:** chỉ thấy xe, phiếu, lịch hẹn gắn với số điện thoại của mình.

## Luồng phối hợp
Khách đặt lịch → **Lễ tân** xác nhận, tiếp nhận xe, soạn và gửi báo giá → **Khách** duyệt một phiên bản → **Lễ tân** giao việc → **Thợ** sửa, báo lỗi phát sinh nếu có, báo hoàn tất → **Lễ tân** bàn giao và thanh toán (trừ kho, báo **Quản lý** nếu phụ tùng sắp hết) → **Quản lý** xem báo cáo.
