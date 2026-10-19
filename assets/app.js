(() => {
  "use strict";

  const config = { apiBase: (window.APP_CONFIG?.apiBase || "").replace(/\/$/, "") };
  const main = document.querySelector("main");
  const nav = document.querySelector("#navigation");
  const title = document.querySelector("#page-title");
  const breadcrumb = document.querySelector("#breadcrumb");
  const storageKey = "office-chain-manager:v1";
  const errorMessages = {
    50001: "Dữ liệu bị từ chối bởi ràng buộc nghiệp vụ.",
    50002: "Văn phòng đã có hợp đồng trong khoảng thời gian đã chọn.",
    50003: "Nhật ký dịch vụ không hợp lệ. Hãy kiểm tra nhân viên và ngày ghi nhận."
  };
  const schemas = {
    companies: {
      title: "Công ty", fields: [
        ["code", "Mã công ty"], ["name", "Tên công ty"], ["taxCode", "Mã số thuế"], ["contact", "Người liên hệ"]
      ]
    },
    offices: {
      title: "Văn phòng", fields: [
        ["code", "Mã văn phòng"], ["building", "Tòa nhà"], ["area", "Diện tích (m²)", "number"], ["status", "Trạng thái"]
      ]
    },
    contracts: {
      title: "Hợp đồng", fields: [
        ["code", "Mã hợp đồng"], ["company", "Công ty"], ["startDate", "Ngày bắt đầu", "date"], ["endDate", "Ngày kết thúc", "date"]
      ]
    },
    services: {
      title: "Dịch vụ", fields: [
        ["code", "Mã dịch vụ"], ["name", "Tên dịch vụ"], ["unit", "Đơn vị tính"], ["unitPrice", "Đơn giá", "number"]
      ]
    },
    employees: {
      title: "Nhân viên", fields: [
        ["code", "Mã nhân viên"], ["name", "Họ và tên"], ["role", "Chức vụ"], ["building", "Tòa nhà"]
      ]
    }
  };
  const reports = {
    "company-cost": { title: "Chi phí công ty", description: "Theo dõi chi phí tháng của từng công ty.", endpoint: "company-cost", chart: "line", filters: [["companyId", "Công ty"], ["from", "Từ tháng", "month"], ["to", "Đến tháng", "month"]], metrics: [["Tổng chi phí", "totalCost"], ["Tiền thuê", "rentCost"], ["Chi phí dịch vụ", "serviceCost"], ["Số hóa đơn", "invoiceCount", false]], columns: [["period", "Kỳ tính"], ["company", "Công ty"], ["contract", "Hợp đồng"], ["amount", "Thành tiền"]] },
    "daily-services": { title: "Chi tiết dịch vụ ngày", description: "Tra cứu các lần sử dụng dịch vụ theo ngày.", endpoint: "daily-services", chart: "bar", filters: [["companyId", "Công ty"], ["employeeId", "Nhân viên"], ["serviceType", "Loại dịch vụ"], ["from", "Từ ngày", "date"], ["to", "Đến ngày", "date"]], metrics: [["Tổng lượt", "totalUses", false], ["Tổng tiền", "totalCost"], ["Ăn uống", "mealUses", false], ["Gửi xe", "parkingUses", false]], columns: [["date", "Ngày"], ["employee", "Nhân viên"], ["service", "Dịch vụ"], ["quantity", "Số lượng"], ["amount", "Thành tiền"]] },
    payroll: { title: "Bảng lương", description: "Tổng hợp lương nhân viên tòa nhà theo kỳ.", endpoint: "payroll", chart: "bar", filters: [["buildingId", "Tòa nhà"], ["period", "Kỳ lương", "month"]], metrics: [["Tổng quỹ lương", "totalPayroll"], ["Số nhân viên", "employeeCount", false], ["Lương bình quân", "averagePayroll"], ["Doanh thu dịch vụ", "serviceRevenue"]], columns: [["period", "Kỳ lương"], ["employee", "Nhân viên"], ["role", "Chức vụ"], ["amount", "Thực nhận"]] },
    "building-cashflow": { title: "Thu chi toàn tòa nhà", description: "Tổng hợp thu, chi và các chứng từ liên quan.", endpoint: "building-cashflow", chart: "line", filters: [["buildingId", "Tòa nhà"], ["from", "Từ ngày", "date"], ["to", "Đến ngày", "date"]], metrics: [["Tổng thu", "totalIncome"], ["Tổng chi", "totalExpense"], ["Chênh lệch", "netCashflow"], ["Số chứng từ", "entryCount", false]], columns: [["date", "Ngày"], ["type", "Loại"], ["reference", "Chứng từ"], ["description", "Diễn giải"], ["amount", "Số tiền"]] }
  };
  const transactions = [
    ["contract", "Ký hợp đồng thuê mặt bằng", "USP_Trx_KyHopDongThueMatBang"],
    ["daily-service", "Ghi nhận dịch vụ hằng ngày", "USP_Trx_GhiNhanDichVuHangNgay"],
    ["invoice", "Phát hành hóa đơn tháng", "USP_Trx_PhatHanhHoaDonThang"],
    ["payment", "Thanh toán hóa đơn và vào sổ quỹ", "USP_Trx_ThanhToanHoaDonVaVaoSoQuy"],
    ["payroll", "Chốt bảng lương nhân viên", "USP_Trx_ChotBangLuongNhanVien"]
  ];
  let route = location.hash.slice(1) || "dashboard";
  let editing = null;
  let recentRecordId = "";
  const reportState = {};

  const escape = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const money = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
  const recordLabel = (record) => record?.name || record?.code || "Chưa có dữ liệu";
  const local = {
    read() { try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; } },
    write(data) { localStorage.setItem(storageKey, JSON.stringify(data)); },
    list(entity) { return this.read()[entity] || []; },
    save(entity, record) { const all = this.read(); const rows = all[entity] || []; const index = rows.findIndex((row) => row.id === record.id); index < 0 ? rows.push(record) : rows.splice(index, 1, record); all[entity] = rows; this.write(all); return record; },
    remove(entity, id) { const all = this.read(); all[entity] = (all[entity] || []).filter((row) => row.id !== id); this.write(all); }
  };
  const request = async (path, options = {}) => {
    const response = await fetch(`${config.apiBase}${path}`, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
    if (!response.ok) { const body = await response.json().catch(() => ({})); const error = new Error(body.message || `Yêu cầu thất bại (${response.status})`); error.code = body.code; throw error; }
    return response.status === 204 ? null : response.json();
  };
  const gateway = {
    async list(entity) { return config.apiBase ? request(`/${entity}`) : local.list(entity); },
    async save(entity, record) { if (!config.apiBase) return local.save(entity, record); return record.id ? request(`/${entity}/${record.id}`, { method: "PUT", body: JSON.stringify(record) }) : request(`/${entity}`, { method: "POST", body: JSON.stringify(record) }); },
    async remove(entity, id) { if (!config.apiBase) return local.remove(entity, id); return request(`/${entity}/${id}`, { method: "DELETE" }); }
  };
  const notify = (message, isError = false) => { const node = document.createElement("div"); node.className = `toast${isError ? " error" : ""}`; node.textContent = message; document.querySelector("#toast-region").append(node); setTimeout(() => node.classList.add("is-leaving"), 4000); setTimeout(() => node.remove(), 4300); };
  const setButtonBusy = (button, label = "Đang xử lý…") => {
    if (!button || button.disabled) return () => { };
    const originalLabel = button.textContent;
    button.disabled = true; button.setAttribute("aria-busy", "true"); button.classList.add("is-busy"); button.textContent = label;
    return () => { button.disabled = false; button.removeAttribute("aria-busy"); button.classList.remove("is-busy"); button.textContent = originalLabel; };
  };
  const explainError = (error) => errorMessages[error.code] || error.message || "Có lỗi xảy ra. Hãy thử lại.";

  function navMarkup() {
    const general = [["dashboard", "Tổng quan"], ...Object.entries(schemas).map(([key, item]) => [key, item.title]), ["transactions", "Giao dịch"]];
    const reportLinks = Object.entries(reports).map(([key, item]) => [`report-${key}`, item.title]);
    return `<p class="nav-group">VẬN HÀNH</p>${general.map(link).join("")}<p class="nav-group">BÁO CÁO</p>${reportLinks.map(link).join("")}`;
    function link([key, label]) { return `<button class="nav-item" data-route="${key}" ${route === key ? 'aria-current="page"' : ""}>${escape(label)}</button>`; }
  }
  function setHeading(heading, trail) { title.textContent = heading; breadcrumb.textContent = trail || heading.toUpperCase(); }
  function pageHeader(heading, description, action = "") { return `<section class="page-header"><div><h2>${escape(heading)}</h2><p>${escape(description)}</p></div>${action}</section>`; }
  function empty(message) { return `<p class="empty">${escape(message)}</p>`; }
  function loadingMarkup() { return `<div class="loading-skeleton" aria-live="polite" aria-label="Đang tải nội dung"><span></span><div class="grid kpis"><i></i><i></i><i></i><i></i></div><b></b></div>`; }
  function chartMarkup(points, report) {
    if (!points?.length) return `<div class="report-placeholder"><div><strong>Biểu đồ sẽ hiển thị khi có dữ liệu SQL Server</strong><p>API trả <code>chart: [{ label, value }]</code>; bảng chi tiết bên dưới luôn là phương án thay thế có thể truy cập.</p></div></div>`;
    const max = Math.max(...points.map((point) => Number(point.value) || 0), 1);
    return `<div class="chart-bars" role="img" aria-label="${escape(report.title)}: ${points.map((point) => `${point.label} ${money(point.value)}`).join(", ")}">${points.map((point) => `<div class="chart-bar-item"><span class="chart-label">${escape(point.label)}</span><div class="chart-track"><span class="chart-value" style="width:${Math.max(2, (Number(point.value) || 0) / max * 100)}%"></span></div><strong>${money(point.value)}</strong></div>`).join("")}</div>`;
  }
  function table(columns, rows, action = "") {
    if (!rows.length) return empty("Chưa có dữ liệu. Kết nối SQL Server hoặc nhập dữ liệu qua các form quản lý.");
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${columns.map(([, label]) => `<th scope="col">${escape(label)}</th>`).join("")}${action ? "<th scope=\"col\">Thao tác</th>" : ""}</tr></thead><tbody>${rows.map((row) => `<tr class="${row.id === recentRecordId ? "is-new" : ""}">${columns.map(([key]) => `<td>${escape(row[key])}</td>`).join("")}${action ? `<td>${action(row)}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
  }
  async function renderDashboard() {
    const totals = await Promise.all(Object.keys(schemas).map((entity) => gateway.list(entity).then((rows) => [entity, rows.length])));
    const count = Object.fromEntries(totals);
    setHeading("Tổng quan", "TỔNG QUAN");
    main.innerHTML = `${pageHeader("Trung tâm vận hành", "Sẵn sàng ghép SQL Server khi nhóm hoàn thành phần dữ liệu.")}<div class="grid kpis">${[["Công ty", count.companies], ["Văn phòng", count.offices], ["Hợp đồng", count.contracts], ["Nhân viên", count.employees]].map(([label, value]) => `<article class="card kpi"><p>${label}</p><strong>${value}</strong></article>`).join("")}</div><div class="grid split" style="margin-top:16px"><section class="card section"><h3>Trạng thái tích hợp</h3><div class="notice"><span aria-hidden="true">i</span><div><strong>${config.apiBase ? "Đã cấu hình API" : "Chế độ cục bộ"}</strong><span>${config.apiBase ? "Dữ liệu được lấy qua API đã cấu hình." : "CRUD được lưu trên trình duyệt; báo cáo tài chính chờ dữ liệu thật từ TV3–TV5."}</span></div></div><p class="section-note">Đầu vào cần để hoàn thiện: schema/seed data, 5 Stored Procedure, danh sách lỗi Trigger và thông tin SQL Server.</p></section><section class="card section"><h3>Việc cần làm tiếp theo</h3><ol class="section-note"><li>Nhập thử các thực thể bằng CRUD.</li><li>Cấu hình API khi backend sẵn sàng.</li><li>Đối soát bốn báo cáo với dữ liệu SQL Server.</li></ol></section></div>`;
  }
  async function renderCrud(entity) {
    const schema = schemas[entity]; const rows = await gateway.list(entity); const draft = editing?.entity === entity ? editing.record : {};
    setHeading(schema.title, "QUẢN LÝ DỮ LIỆU");
    const inputs = schema.fields.map(([key, label, type = "text"]) => `<label class="field">${escape(label)}<input name="${key}" type="${type}" value="${escape(draft[key] || "")}" required /></label>`).join("");
    main.innerHTML = `${pageHeader(`Quản lý ${schema.title.toLowerCase()}`, "Nhập dữ liệu cục bộ trước; dữ liệu sẽ chuyển sang API khi được cấu hình.")}<section class="card section"><h3>${draft.id ? "Cập nhật bản ghi" : `Thêm ${schema.title.toLowerCase()}`}</h3><form id="crud-form" data-entity="${entity}" class="form-grid">${inputs}<div class="form-actions"><button class="button primary" type="submit">${draft.id ? "Lưu thay đổi" : "Thêm mới"}</button>${draft.id ? '<button class="button secondary" data-cancel-edit type="button">Hủy</button>' : ""}</div></form></section><section class="card section" style="margin-top:16px"><div class="toolbar"><h3>Danh sách (${rows.length})</h3></div>${table(schema.fields, rows, (row) => `<button class="text-button" data-edit="${entity}" data-id="${row.id}">Sửa</button><button class="text-button delete" data-delete="${entity}" data-id="${row.id}">Xóa</button>`)}</section>`;
  }
  function renderTransactions() {
    setHeading("Giao dịch", "TÍCH HỢP NGHIỆP VỤ");
    main.innerHTML = `${pageHeader("5 giao dịch nghiệp vụ", "Các nút sẽ gọi Stored Procedure của TV4 qua backend.")}<div class="notice"><span aria-hidden="true">i</span><div><strong>Chờ hợp đồng Stored Procedure</strong><span>Cần tên chính thức, tham số input/output và mã lỗi từ TV4 trước khi gửi giao dịch thật.</span></div></div><section class="card section"><div class="transaction-list">${transactions.map(([key, label, procedure]) => `<article class="transaction"><span class="badge">Chờ TV4</span><div><strong>${label}</strong><p>${procedure}</p></div><button class="button secondary" data-transaction="${key}" ${config.apiBase ? "" : "disabled title=\"Chưa cấu hình API\""}>Thực hiện</button></article>`).join("")}</div></section>`;
  }
  async function renderReport(id) {
    const report = reports[id]; const state = reportState[id] || { summary: {}, rows: [], message: "Chưa có nguồn báo cáo. Cấu hình API và truy vấn SQL sau khi TV3–TV5 bàn giao." }; const filters = report.filters.map(([key, label, type = "text"]) => `<label class="field">${label}<input name="${key}" type="${type}" /></label>`).join("");
    setHeading(report.title, "BÁO CÁO");
    const metrics = report.metrics.map(([label, key, currency = true]) => `<article class="card kpi"><p>${label}</p><strong>${currency ? money(state.summary?.[key]) : new Intl.NumberFormat("vi-VN").format(Number(state.summary?.[key] || 0))}</strong></article>`).join("");
    main.innerHTML = `${pageHeader(report.title, report.description, `<button class="button secondary" data-export="${id}">Xuất CSV</button>`)}<form class="card filters" data-report-filter="${id}">${filters}<button class="button primary" type="submit">Áp dụng</button></form>${state.message ? `<div class="notice"><span aria-hidden="true">i</span><div>${escape(state.message)}</div></div>` : ""}<div class="grid kpis">${metrics}</div><div class="grid split" style="margin-top:16px"><section class="card section"><h3>Xu hướng / so sánh</h3>${chartMarkup(state.chart, report)}</section><section class="card section"><h3>Ghi chú đối soát</h3><p class="section-note">Tổng KPI phải bằng tổng các dòng truy vấn đã lọc. Dùng DECIMAL trong SQL Server và định dạng VND tại giao diện.</p></section></div><section class="card section" style="margin-top:16px"><h3>Dữ liệu chi tiết</h3>${table(report.columns, state.rows || [])}</section>`;
  }
  async function render() {
    nav.innerHTML = navMarkup(); main.innerHTML = loadingMarkup(); main.classList.remove("is-entering");
    try { if (route === "dashboard") await renderDashboard(); else if (schemas[route]) await renderCrud(route); else if (route === "transactions") renderTransactions(); else if (route.startsWith("report-")) await renderReport(route.replace("report-", "")); else { route = "dashboard"; location.hash = route; } }
    catch (error) { main.innerHTML = `<div class="notice"><div><strong>Không thể tải dữ liệu</strong><span>${escape(explainError(error))}</span></div></div>`; }
    requestAnimationFrame(() => main.classList.add("is-entering"));
  }
  async function submitCrud(form) {
    const entity = form.dataset.entity; const record = Object.fromEntries(new FormData(form).entries()); record.id = editing?.entity === entity ? editing.record.id : `${entity}-${Date.now()}`;
    const restore = setButtonBusy(form.querySelector('[type="submit"]'));
    try { await gateway.save(entity, record); recentRecordId = record.id; editing = null; notify("Đã lưu dữ liệu."); await render(); setTimeout(() => { recentRecordId = ""; }, 900); } catch (error) { restore(); notify(explainError(error), true); }
  }
  async function loadReport(id, form) {
    if (!config.apiBase) { reportState[id] = { summary: {}, rows: [], message: "Chưa cấu hình API/SQL Server nên không có số liệu tài chính để hiển thị." }; return render(); }
    const query = new URLSearchParams(new FormData(form));
    const restore = setButtonBusy(form.querySelector('[type="submit"]'), "Đang tải…");
    try { const result = await request(`/reports/${reports[id].endpoint}?${query}`); reportState[id] = { ...result, message: "" }; await render(); } catch (error) { restore(); reportState[id] = { summary: {}, rows: [], message: explainError(error) }; await render(); }
  }
  function exportCsv(id) {
    const report = reports[id]; const rows = reportState[id]?.rows || []; const values = [report.columns.map(([, label]) => label), ...rows.map((row) => report.columns.map(([key]) => row[key] ?? ""))];
    const csv = values.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `${id}.csv`; link.click(); URL.revokeObjectURL(url); notify("Đã xuất CSV.");
  }
  document.addEventListener("click", async (event) => {
    const target = event.target.closest("button"); if (!target) return;
    if (target.dataset.route) { route = target.dataset.route; location.hash = route; return; }
    if (target.id === "menu-toggle") { const sidebar = document.querySelector(".sidebar"); sidebar.classList.toggle("open"); target.setAttribute("aria-expanded", String(sidebar.classList.contains("open"))); return; }
    if (target.dataset.cancelEdit !== undefined) { editing = null; return render(); }
    if (target.dataset.edit) { const rows = await gateway.list(target.dataset.edit); editing = { entity: target.dataset.edit, record: rows.find((row) => row.id === target.dataset.id) }; return render(); }
    if (target.dataset.delete) { if (!confirm("Bạn có chắc muốn xóa bản ghi này?")) return; const restore = setButtonBusy(target, "Đang xóa…"); try { await gateway.remove(target.dataset.delete, target.dataset.id); notify("Đã xóa bản ghi."); await render(); } catch (error) { restore(); notify(explainError(error), true); } }
    if (target.dataset.export) exportCsv(target.dataset.export);
    if (target.dataset.transaction) { const restore = setButtonBusy(target, "Đang gửi…"); try { await request(`/transactions/${target.dataset.transaction}`, { method: "POST", body: "{}" }); notify("Giao dịch đã được gửi."); restore(); } catch (error) { restore(); notify(explainError(error), true); } }
  });
  document.addEventListener("submit", (event) => { if (event.target.id === "crud-form") { event.preventDefault(); submitCrud(event.target); } if (event.target.dataset.reportFilter) { event.preventDefault(); loadReport(event.target.dataset.reportFilter, event.target); } });
  window.addEventListener("hashchange", () => { route = location.hash.slice(1) || "dashboard"; editing = null; render(); });
  render();
})();
