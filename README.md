# XÂY DỰNG HỆ CSDL QUẢN LÝ CHUỖI TÒA NHÀ VĂN PHÒNG CHO THUÊ

## Yêu cầu môi trường

- **Node.js 22 trở lên và npm**: chạy ExpressJS, cài dependency và kiểm tra mã. Đây là yêu cầu của driver SQL Server đang dùng.
- **Trình duyệt**: Chrome, Edge hoặc Firefox.

SQL Server chưa cần thiết để chạy local: ExpressJS lưu CRUD vào `data/local-db.json`, một tệp chỉ có trên máy local. SQL Server chỉ cần khi tích hợp dữ liệu thật của TV3–TV5.

> Máy hiện tại đang dùng Node.js 21. Cần nâng lên Node.js 22 LTS hoặc mới hơn trước khi chạy server trong môi trường được dependency SQL Server hỗ trợ.



## Cài đặt

Từ thư mục gốc dự án, cài dependency theo lockfile:

```powershell
npm ci
```

Kiểm tra công cụ đã sẵn sàng:

```powershell
node --version
npm --version
```

## Chạy ứng dụng

Sau khi cài dependency, chạy ExpressJS từ thư mục dự án:

```powershell
npm start
```

Sau đó mở `http://127.0.0.1:3000`.

Khi cần tự khởi động lại server sau mỗi lần sửa mã backend:

```powershell
npm run dev
```

## Kết nối SQL Server sau này

Sao chép `.env.example` thành `.env`, rồi điền thông tin SQL Server do TV3 cung cấp. Chỉ đổi `DATA_MODE=sqlserver` khi đã nhận lược đồ cuối cùng, data dictionary, Stored Procedure của TV4 và mã lỗi Trigger của TV5. Không commit `.env` hoặc tệp `data/local-db.json`.

Kiểm tra cú pháp JavaScript:

```powershell
npm run check
```

<!-- ## Chế độ tích hợp hiện tại

Khi chưa có đầu vào từ TV1–TV5, app dùng local integration mode: dữ liệu CRUD được lưu ở `localStorage`; báo cáo trống có chủ đích và các transaction được đánh dấu chờ tích hợp. App không tạo dữ liệu tài chính giả.

Khi backend sẵn sàng, cấu hình trước khi tải `assets/app.js`:

```html
<script>window.APP_CONFIG = { apiBase: "https://your-api.example/api" };</script>
```

Backend cần cung cấp:

- CRUD: `GET/POST/PUT/DELETE /companies`, `/offices`, `/contracts`, `/services`, `/employees`.
- Báo cáo: `GET /reports/company-cost`, `/reports/daily-services`, `/reports/payroll`, `/reports/building-cashflow`.
- Giao dịch: `POST /transactions/{contract|daily-service|invoice|payment|payroll}`.

Mỗi báo cáo trả `{ summary, chart, rows, total }`, trong đó `chart` là mảng
`[{ "label": "2026-01", "value": 1500000 }]`. Số tiền trong `summary` và
`rows` phải là số/`DECIMAL`; giao diện đảm nhiệm định dạng VND.

Các khóa `summary` cần dùng:

- `company-cost`: `totalCost`, `rentCost`, `serviceCost`, `invoiceCount`.
- `daily-services`: `totalUses`, `totalCost`, `mealUses`, `parkingUses`.
- `payroll`: `totalPayroll`, `employeeCount`, `averagePayroll`, `serviceRevenue`.
- `building-cashflow`: `totalIncome`, `totalExpense`, `netCashflow`, `entryCount`. -->
