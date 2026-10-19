# Phần 6 — Web App quản lý chuỗi tòa nhà

## Outcome

Một Web App ExpressJS cho phần 6: CRUD cho Công ty, Văn phòng, Hợp đồng, Dịch vụ và Nhân viên; màn hình gọi 5 transaction; bốn màn hình báo cáo; và các điểm nối rõ ràng để thay lớp lưu trữ local bằng SQL Server.

## Constraints

- Chưa có lược đồ BCNF, SQL Server, Stored Procedure hoặc Trigger thực tế từ các thành viên khác.
- Không suy đoán tên bảng/cột hay mô phỏng kết quả giao dịch SQL.
- UI dùng hướng Minimalism & Swiss Style, dashboard mật độ cao, có khả năng truy cập bàn phím.

## Non-goals

- Không triển khai truy vấn SQL, xác thực, hay CSDL phân tán/MongoDB.
- Không thay thế công việc của TV1–TV5, TV7.

## Acceptance criteria

- Chạy được bằng ExpressJS trên laptop; CRUD cục bộ được lưu qua lần khởi động lại server.
- Có đầy đủ 4 màn hình báo cáo với lọc, bảng, trạng thái rỗng/lỗi và xuất CSV.
- Có màn hình cho 5 transaction và cơ chế ánh xạ lỗi Trigger, nhưng không báo cáo sai là đã kết nối SQL.
- API `/api` cùng origin cho phép frontend giao tiếp với server; `.env` định nghĩa chế độ local hoặc SQL Server.

## Phases

1. Hoàn thành — shell ứng dụng, design tokens và điều hướng.
2. Hoàn thành — ExpressJS API, CRUD cục bộ lưu trên server và adapter frontend cùng origin.
3. Hoàn thành — báo cáo, export và màn hình transaction/error integration.
4. Hoàn thành có giới hạn — kiểm tra cú pháp và API CRUD create/update/delete đã qua; kiểm thử SQL Server chờ đầu vào từ TV3–TV5.
