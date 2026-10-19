# XÂY DỰNG HỆ CSDL QUẢN LÝ CHUỖI TÒA NHÀ VĂN PHÒNG CHO THUÊ

## Yêu cầu môi trường

- **Python 3**: chạy HTTP server cục bộ cho giao diện.
- **Node.js 18 trở lên và npm**: cài dependency và chạy kiểm tra cú pháp JavaScript. Dự án đã được kiểm tra với Node.js 21 và npm 10.
- **Trình duyệt**: Chrome, Edge hoặc Firefox.



## Cài đặt

Từ thư mục gốc dự án, cài dependency theo lockfile:

```powershell
npm ci
```

Kiểm tra công cụ đã sẵn sàng:

```powershell
python --version
node --version
npm --version
```

## Chạy ứng dụng

Sau khi cài dependency, chạy một HTTP server tĩnh từ thư mục dự án:

```powershell
python -m http.server 4173
```

Sau đó mở `http://localhost:4173`.

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
