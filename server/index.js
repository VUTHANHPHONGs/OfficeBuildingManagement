require("dotenv").config();

const express = require("express");
const path = require("node:path");
const sql = require("mssql");
const { LocalStore, collections } = require("./local-store");

const projectRoot = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const dataMode = process.env.DATA_MODE || "local";
const store = new LocalStore(path.join(projectRoot, "data", "local-db.json"));
const app = express();

if (!["local", "sqlserver"].includes(dataMode)) {
  throw new Error("DATA_MODE must be either local or sqlserver");
}

const schemas = {
  companies: ["code", "name", "taxCode", "contact"],
  offices: ["code", "building", "area", "status"],
  contracts: ["code", "company", "startDate", "endDate"],
  services: ["code", "name", "unit", "unitPrice"],
  employees: ["code", "name", "role", "building"]
};

const reportContracts = {
  "company-cost": ["totalCost", "rentCost", "serviceCost", "invoiceCount"],
  "daily-services": ["totalUses", "totalCost", "mealUses", "parkingUses"],
  payroll: ["totalPayroll", "employeeCount", "averagePayroll", "serviceRevenue"],
  "building-cashflow": ["totalIncome", "totalExpense", "netCashflow", "entryCount"]
};

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((_, response, next) => {
  response.set({
    "Referrer-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });
  next();
});
app.use("/assets", express.static(path.join(projectRoot, "assets"), { maxAge: "1h" }));

function sqlConfig() {
  return {
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: process.env.DB_ENCRYPT === "true",
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true"
    }
  };
}

function sendError(response, status, code, message) {
  response.status(status).json({ code, message });
}

function validateRecord(collection, body) {
  const fields = schemas[collection];
  if (!fields || !body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = {};
  for (const field of fields) {
    const value = body[field];
    if (typeof value === "string" && value.trim()) record[field] = value.trim();
    else if (field === "area" || field === "unitPrice") {
      const number = Number(value);
      if (Number.isFinite(number) && number > 0) record[field] = number;
    }
  }
  return fields.every((field) => record[field] !== undefined) ? record : null;
}

function sqlMappingPending(response) {
  return sendError(response, 501, "SCHEMA_MAPPING_PENDING", "Chờ TV3 bàn giao schema/data dictionary để ánh xạ SQL Server an toàn.");
}

app.get("/api/health", async (_, response) => {
  if (dataMode !== "sqlserver") return response.json({ status: "ok", dataMode: "local" });
  try {
    const pool = await sql.connect(sqlConfig());
    await pool.request().query("SELECT 1 AS connected");
    return response.json({ status: "ok", dataMode: "sqlserver", schemaMapping: "pending" });
  } catch (error) {
    return sendError(response, 503, "DATABASE_UNAVAILABLE", "Không thể kết nối SQL Server. Hãy kiểm tra cấu hình .env.");
  }
});

for (const collection of collections) {
  app.get(`/api/${collection}`, async (_, response, next) => {
    if (dataMode === "sqlserver") return sqlMappingPending(response);
    try { return response.json(await store.list(collection)); } catch (error) { return next(error); }
  });
  app.post(`/api/${collection}`, async (request, response, next) => {
    if (dataMode === "sqlserver") return sqlMappingPending(response);
    const record = validateRecord(collection, request.body);
    if (!record) return sendError(response, 422, "VALIDATION_ERROR", "Dữ liệu không hợp lệ hoặc thiếu trường bắt buộc.");
    try { return response.status(201).json(await store.create(collection, record)); } catch (error) { return next(error); }
  });
  app.put(`/api/${collection}/:id`, async (request, response, next) => {
    if (dataMode === "sqlserver") return sqlMappingPending(response);
    const record = validateRecord(collection, request.body);
    if (!record) return sendError(response, 422, "VALIDATION_ERROR", "Dữ liệu không hợp lệ hoặc thiếu trường bắt buộc.");
    try {
      const updated = await store.update(collection, request.params.id, record);
      return updated ? response.json(updated) : sendError(response, 404, "NOT_FOUND", "Không tìm thấy bản ghi cần sửa.");
    } catch (error) { return next(error); }
  });
  app.delete(`/api/${collection}/:id`, async (request, response, next) => {
    if (dataMode === "sqlserver") return sqlMappingPending(response);
    try { return (await store.remove(collection, request.params.id)) ? response.status(204).end() : sendError(response, 404, "NOT_FOUND", "Không tìm thấy bản ghi cần xóa."); } catch (error) { return next(error); }
  });
}

for (const [name, summaryKeys] of Object.entries(reportContracts)) {
  app.get(`/api/reports/${name}`, (_, response) => {
    if (dataMode === "sqlserver") return sqlMappingPending(response);
    return response.json({
      summary: Object.fromEntries(summaryKeys.map((key) => [key, 0])),
      chart: [],
      rows: [],
      total: 0,
      message: "Chưa có dữ liệu tài chính. Chờ TV3–TV5 tích hợp SQL Server, transaction và trigger."
    });
  });
}

app.post("/api/transactions/:name", (request, response) => {
  const allowed = new Set(["contract", "daily-service", "invoice", "payment", "payroll"]);
  if (!allowed.has(request.params.name)) return sendError(response, 404, "NOT_FOUND", "Không tìm thấy giao dịch.");
  return sendError(response, 501, "TRANSACTION_INTEGRATION_PENDING", "Chờ TV4 bàn giao Stored Procedure và TV5 bàn giao mã lỗi Trigger.");
});

app.get("/", (_, response) => response.sendFile(path.join(projectRoot, "index.html")));
app.use((request, response) => sendError(response, 404, "NOT_FOUND", `Không tìm thấy ${request.method} ${request.path}`));
app.use((error, _, response, __) => {
  console.error(error);
  sendError(response, 500, "INTERNAL_ERROR", "Máy chủ gặp lỗi không mong muốn.");
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Office Chain Manager chạy tại http://127.0.0.1:${port}`);
});
