import { formatCellValue, formatCurrency, formatNumber, paymentTone } from "./utils/reportFormatters";

function metric(label, key, options = {}) {
  return { label, key, ...options };
}

function col(key, label, type = "text", extra = {}) {
  return { key, label, type, ...extra };
}

const SUMMARY_METRIC_BUILDERS = {
  default: (summary) => [
    metric("Total rows", "rowCount", { hint: "Jumlah baris data", tone: "neutral", format: (v) => formatNumber(v) }),
  ],
};

function buildMetricsFromSummary(summary = {}, config = {}) {
  const presets = config.metrics || [];
  return presets.map((preset) => ({
    label: preset.label,
    value: preset.format ? preset.format(summary[preset.key]) : formatCellValue(summary[preset.key], preset.type || "text"),
    hint: preset.hint || "",
    badge: preset.badge || config.badge || "Report",
    tone: preset.tone || "neutral",
  }));
}

export const REPORT_VIEW_CONFIG = {
  "daily-sales-recap": {
    filterProfile: "basic",
    metrics: [
      metric("Total sales", "totalSales", { type: "currency", hint: "Omzet dalam periode", tone: "primary" }),
      metric("Total transactions", "totalTransactions", { type: "number", hint: "Jumlah transaksi", tone: "neutral" }),
      metric("Active days", "totalDays", { type: "number", hint: "Hari dengan transaksi", tone: "success" }),
      metric("Avg daily sales", "averageDailySales", { type: "currency", hint: "Rata-rata per hari", tone: "warning" }),
    ],
    columns: [
      col("day", "Day", "date"),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
      col("totalPcs", "Pcs", "number"),
    ],
  },
  "branch-top-sales": {
    filterProfile: "basic",
    metrics: [
      metric("Top branch", "topBranch", { hint: "Branch terbaik", tone: "primary" }),
      metric("Total sales", "totalSales", { type: "currency", tone: "success" }),
      metric("Branches", "branchCount", { type: "number", tone: "neutral" }),
      metric("Transactions", "totalTransactions", { type: "number", tone: "warning" }),
    ],
    columns: [
      col("rank", "Rank", "number"),
      col("branchName", "Branch"),
      col("branchCode", "Code"),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
      col("totalPcs", "Pcs", "number"),
      col("cashTotal", "Cash", "currency"),
      col("onlineTotal", "Online", "currency"),
    ],
  },
  "sales-by-branch": {
    filterProfile: "sales",
    metrics: [
      metric("Total sales", "totalSales", { type: "currency", tone: "primary" }),
      metric("Branches", "branchCount", { type: "number", tone: "neutral" }),
      metric("Transactions", "totalTransactions", { type: "number", tone: "success" }),
      metric("Top branch", "topBranch", { tone: "warning" }),
    ],
    columns: [
      col("branchName", "Branch"),
      col("branchCode", "Code"),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
      col("totalPcs", "Pcs", "number"),
      col("cashTotal", "Cash", "currency"),
      col("qrisTotal", "QRIS", "currency"),
      col("onlineTotal", "Online", "currency"),
    ],
  },
  "sales-by-cashier": {
    filterProfile: "sales",
    metrics: [
      metric("Total sales", "totalSales", { type: "currency", tone: "primary" }),
      metric("Cashiers", "cashierCount", { type: "number", tone: "neutral" }),
      metric("Transactions", "totalTransactions", { type: "number", tone: "success" }),
      metric("Total pcs", "totalPcs", { type: "number", tone: "warning" }),
    ],
    columns: [
      col("cashierName", "Cashier"),
      col("cashierUsername", "Username"),
      col("branchName", "Branch"),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
      col("totalPcs", "Pcs", "number"),
    ],
  },
  "sales-by-channel": {
    filterProfile: "sales",
    metrics: [
      metric("Total sales", "totalSales", { type: "currency", tone: "primary" }),
      metric("Offline", "offlineTotal", { type: "currency", tone: "success" }),
      metric("Online", "onlineTotal", { type: "currency", tone: "info" }),
      metric("Channels", "channelCount", { type: "number", tone: "neutral" }),
    ],
    columns: [
      col("salesChannel", "Channel", "badge", { badgeTone: paymentTone }),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
      col("totalPcs", "Pcs", "number"),
    ],
  },
  "sales-by-platform": {
    filterProfile: "sales",
    metrics: [
      metric("Total sales", "totalSales", { type: "currency", tone: "primary" }),
      metric("Platforms", "platformCount", { type: "number", tone: "neutral" }),
      metric("Transactions", "totalTransactions", { type: "number", tone: "success" }),
      metric("Total pcs", "totalPcs", { type: "number", tone: "warning" }),
    ],
    columns: [
      col("platform", "Platform", "badge", { badgeTone: paymentTone }),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
      col("totalPcs", "Pcs", "number"),
    ],
  },
  "transaction-detail": {
    filterProfile: "sales",
    metrics: [
      metric("Total sales", "totalSales", { type: "currency", tone: "primary" }),
      metric("Transactions", "totalTransactions", { type: "number", tone: "neutral" }),
      metric("Average ticket", "averageTicket", { type: "currency", tone: "warning" }),
      metric("Total pcs", "totalPcs", { type: "number", tone: "success" }),
    ],
    columns: [
      col("invoiceNumber", "Invoice"),
      col("createdAt", "Date", "datetime"),
      col("branchName", "Branch"),
      col("cashierName", "Cashier"),
      col("salesChannel", "Channel", "badge", { badgeTone: paymentTone }),
      col("paymentMethod", "Payment", "badge", { badgeTone: paymentTone }),
      col("itemCount", "Items", "number"),
      col("totalPcs", "Pcs", "number"),
      col("totalAmount", "Total", "currency"),
      col("itemSummary", "Items detail"),
    ],
  },
  "void-transactions": {
    filterProfile: "basic",
    metrics: [
      metric("Void count", "totalVoidTransactions", { type: "number", tone: "danger" }),
      metric("Void amount", "totalVoidAmount", { type: "currency", tone: "warning" }),
    ],
    columns: [
      col("invoiceNumber", "Invoice"),
      col("createdAt", "Created", "datetime"),
      col("voidedAt", "Voided", "datetime"),
      col("branchName", "Branch"),
      col("cashierName", "Cashier"),
      col("paymentMethod", "Payment", "badge", { badgeTone: paymentTone }),
      col("totalAmount", "Amount", "currency"),
      col("voidReason", "Reason"),
    ],
  },
  "menu-performance": {
    filterProfile: "sales",
    metrics: [
      metric("Top product", "topProduct", { tone: "primary" }),
      metric("Total sales", "totalSales", { type: "currency", tone: "success" }),
      metric("Products", "productCount", { type: "number", tone: "neutral" }),
      metric("Qty sold", "totalQty", { type: "number", tone: "warning" }),
    ],
    columns: [
      col("productName", "Product"),
      col("categoryName", "Category"),
      col("totalQty", "Qty", "number"),
      col("totalSales", "Sales", "currency"),
    ],
  },
  "category-performance": {
    filterProfile: "sales",
    metrics: [
      metric("Top category", "topCategory", { tone: "primary" }),
      metric("Total sales", "totalSales", { type: "currency", tone: "success" }),
      metric("Categories", "categoryCount", { type: "number", tone: "neutral" }),
    ],
    columns: [
      col("categoryName", "Category"),
      col("productCount", "Products", "number"),
      col("totalQty", "Qty", "number"),
      col("totalSales", "Sales", "currency"),
    ],
  },
  "payment-recap": {
    filterProfile: "sales",
    metrics: [
      metric("Total sales", "totalSales", { type: "currency", tone: "primary" }),
      metric("Cash", "cashTotal", { type: "currency", tone: "success" }),
      metric("QRIS", "qrisTotal", { type: "currency", tone: "info" }),
      metric("Methods", "methodCount", { type: "number", tone: "neutral" }),
    ],
    columns: [
      col("paymentMethod", "Payment", "badge", { badgeTone: paymentTone }),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
    ],
  },
  "cash-vs-noncash": {
    filterProfile: "sales",
    metrics: [
      metric("Cash total", "cashTotal", { type: "currency", tone: "success" }),
      metric("Non-cash", "nonCashTotal", { type: "currency", tone: "info" }),
      metric("Cash share", "cashSharePercent", { hint: "% transaksi cash", tone: "warning", format: (v) => `${Number(v || 0)}%` }),
      metric("Transactions", "totalTransactions", { type: "number", tone: "neutral" }),
    ],
    columns: [
      col("type", "Type", "badge", { badgeTone: (v) => (v === "CASH" ? "success" : "info") }),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
    ],
  },
  "cash-sessions": {
    filterProfile: "basic",
    metrics: [
      metric("Sessions", "totalSessions", { type: "number", tone: "primary" }),
      metric("Open", "openSessions", { type: "number", tone: "warning" }),
      metric("Closed", "closedSessions", { type: "number", tone: "success" }),
      metric("Opening cash", "totalOpeningCash", { type: "currency", tone: "neutral" }),
    ],
    columns: [
      col("branchName", "Branch"),
      col("cashierName", "Cashier"),
      col("status", "Status", "badge", { badgeTone: paymentTone }),
      col("openingCash", "Opening", "currency"),
      col("expectedCash", "Expected", "currency"),
      col("closingCash", "Closing", "currency"),
      col("openedAt", "Opened", "datetime"),
      col("closedAt", "Closed", "datetime"),
    ],
  },
  "opening-cash": {
    filterProfile: "basic",
    metrics: [
      metric("Sessions", "totalSessions", { type: "number", tone: "primary" }),
      metric("Total opening", "totalOpeningCash", { type: "currency", tone: "success" }),
      metric("Average opening", "averageOpeningCash", { type: "currency", tone: "warning" }),
    ],
    columns: [
      col("branchName", "Branch"),
      col("cashierName", "Cashier"),
      col("openingCash", "Opening cash", "currency"),
      col("openedAt", "Opened", "datetime"),
      col("status", "Status", "badge", { badgeTone: paymentTone }),
    ],
  },
  "closing-cash": {
    filterProfile: "basic",
    metrics: [
      metric("Closed sessions", "closedSessions", { type: "number", tone: "primary" }),
      metric("Closing cash", "totalClosingCash", { type: "currency", tone: "success" }),
      metric("Expected cash", "totalExpectedCash", { type: "currency", tone: "info" }),
    ],
    columns: [
      col("branchName", "Branch"),
      col("cashierName", "Cashier"),
      col("closingCash", "Closing", "currency"),
      col("expectedCash", "Expected", "currency"),
      col("variance", "Variance", "currency"),
      col("closedAt", "Closed", "datetime"),
    ],
  },
  "expected-cash": {
    filterProfile: "basic",
    metrics: [
      metric("Sessions", "totalSessions", { type: "number", tone: "primary" }),
      metric("Expected cash", "totalExpectedCash", { type: "currency", tone: "info" }),
      metric("Total variance", "totalVariance", { type: "currency", tone: "warning" }),
    ],
    columns: [
      col("branchName", "Branch"),
      col("cashierName", "Cashier"),
      col("status", "Status", "badge", { badgeTone: paymentTone }),
      col("openingCash", "Opening", "currency"),
      col("expectedCash", "Expected", "currency"),
      col("closingCash", "Closing", "currency"),
      col("variance", "Variance", "currency"),
      col("expenseTotal", "Expenses", "currency"),
      col("withdrawalTotal", "Withdrawals", "currency"),
    ],
  },
  "inventory-stock": {
    filterProfile: "basic",
    metrics: [
      metric("Items", "itemCount", { type: "number", tone: "primary" }),
      metric("Low stock", "lowStockCount", { type: "number", tone: "warning" }),
      metric("Opname required", "opnameRequiredCount", { type: "number", tone: "neutral" }),
    ],
    columns: [
      col("branchName", "Branch"),
      col("itemName", "Item"),
      col("itemType", "Type", "badge"),
      col("unit", "Unit"),
      col("currentStock", "Stock", "decimal"),
      col("minStock", "Min", "decimal"),
      col("maxStock", "Max", "decimal"),
      col("isOpnameRequired", "Opname"),
      col("lastOpnameAt", "Last opname", "datetime"),
    ],
  },
  "stock-opname-opening": {
    filterProfile: "basic",
    metrics: [
      metric("Opname count", "opnameCount", { type: "number", tone: "primary" }),
      metric("Completed", "completedCount", { type: "number", tone: "success" }),
      metric("Total variance", "totalVariance", { type: "decimal", tone: "warning" }),
    ],
    columns: [
      col("opnameDate", "Date", "date"),
      col("branchName", "Branch"),
      col("performedBy", "Performed by"),
      col("itemCount", "Items", "number"),
      col("isCompleted", "Status", "badge", { badgeTone: paymentTone }),
      col("totalVariance", "Variance", "decimal"),
      col("notes", "Notes"),
    ],
  },
  "stock-opname-closing": {
    filterProfile: "basic",
    metrics: [
      metric("Opname count", "opnameCount", { type: "number", tone: "primary" }),
      metric("Completed", "completedCount", { type: "number", tone: "success" }),
      metric("Total variance", "totalVariance", { type: "decimal", tone: "warning" }),
    ],
    columns: [
      col("opnameDate", "Date", "date"),
      col("branchName", "Branch"),
      col("performedBy", "Performed by"),
      col("itemCount", "Items", "number"),
      col("isCompleted", "Status", "badge", { badgeTone: paymentTone }),
      col("totalVariance", "Variance", "decimal"),
      col("notes", "Notes"),
    ],
  },
  "stock-opname-variance": {
    filterProfile: "basic",
    metrics: [
      metric("Items", "itemCount", { type: "number", tone: "primary" }),
      metric("Positive", "positiveVariance", { type: "number", tone: "success" }),
      metric("Negative", "negativeVariance", { type: "number", tone: "danger" }),
      metric("Abs variance", "totalAbsVariance", { type: "decimal", tone: "warning" }),
    ],
    columns: [
      col("opnameDate", "Date", "date"),
      col("branchName", "Branch"),
      col("kind", "Kind", "badge"),
      col("itemName", "Item"),
      col("systemQty", "System", "decimal"),
      col("countedQty", "Counted", "decimal"),
      col("varianceQty", "Variance", "decimal"),
      col("performedBy", "Performed by"),
    ],
  },
  "inventory-movement": {
    filterProfile: "basic",
    metrics: [
      metric("Movements", "movementCount", { type: "number", tone: "primary" }),
      metric("Inbound qty", "inboundQty", { type: "decimal", tone: "success" }),
      metric("Outbound qty", "outboundQty", { type: "decimal", tone: "warning" }),
    ],
    columns: [
      col("createdAt", "Date", "datetime"),
      col("location", "Location"),
      col("itemName", "Item"),
      col("type", "Type", "badge"),
      col("quantity", "Qty", "decimal"),
      col("performedBy", "Performed by"),
      col("referenceType", "Reference"),
      col("notes", "Notes"),
    ],
  },
  "branch-product-coverage": {
    filterProfile: "basic",
    metrics: [
      metric("Coverage", "coverageCount", { type: "number", tone: "primary" }),
      metric("Available", "availableCount", { type: "number", tone: "success" }),
      metric("Active", "activeCount", { type: "number", tone: "neutral" }),
    ],
    columns: [
      col("branchName", "Branch"),
      col("productName", "Product"),
      col("categoryName", "Category"),
      col("price", "Price", "currency"),
      col("pcs", "Pcs", "number"),
      col("isAvailable", "Availability", "badge", { badgeTone: (v) => (v === "Available" ? "success" : "warning") }),
      col("isActive", "Status", "badge", { badgeTone: (v) => (v === "Active" ? "success" : "neutral") }),
    ],
  },
  "crew-attendance": {
    filterProfile: "basic",
    metrics: [
      metric("Records", "totalRecords", { type: "number", tone: "primary" }),
      metric("Present", "presentCount", { type: "number", tone: "success" }),
      metric("Checkout", "checkoutCount", { type: "number", tone: "info" }),
      metric("Branches", "branchCount", { type: "number", tone: "neutral" }),
    ],
    columns: [
      col("attendanceDate", "Date", "date"),
      col("branchName", "Branch"),
      col("crewName", "Crew"),
      col("status", "Status", "badge"),
      col("checkInAt", "Check in", "datetime"),
      col("checkOutAt", "Check out", "datetime"),
      col("notes", "Notes"),
    ],
  },
  "crew-monthly-performance": {
    filterProfile: "basic",
    metrics: [
      metric("Top performer", "topPerformer", { tone: "primary" }),
      metric("Total sales", "totalSales", { type: "currency", tone: "success" }),
      metric("Crew tracked", "crewCount", { type: "number", tone: "neutral" }),
      metric("Attendance", "totalAttendance", { type: "number", tone: "warning" }),
    ],
    columns: [
      col("crewName", "Crew"),
      col("branchName", "Branch"),
      col("attendanceCount", "Attendance", "number"),
      col("totalTransactions", "Transactions", "number"),
      col("totalSales", "Sales", "currency"),
      col("totalPcs", "Pcs", "number"),
      col("averageTicket", "Avg ticket", "currency"),
    ],
  },
  "outlet-expense": {
    filterProfile: "basic",
    metrics: [
      metric("Expenses", "expenseCount", { type: "number", tone: "primary" }),
      metric("Posted", "postedAmount", { type: "currency", tone: "success" }),
      metric("Requested", "requestedAmount", { type: "currency", tone: "warning" }),
    ],
    columns: [
      col("expenseDate", "Date", "date"),
      col("branchName", "Branch"),
      col("createdBy", "Created by"),
      col("status", "Status", "badge", { badgeTone: paymentTone }),
      col("totalAmount", "Amount", "currency"),
      col("itemCount", "Items", "number"),
      col("note", "Note"),
    ],
  },
  "audit-log": {
    filterProfile: "basic",
    metrics: [
      metric("Logs", "logCount", { type: "number", tone: "primary" }),
      metric("Actions", "actionCount", { type: "number", tone: "neutral" }),
      metric("Entities", "entityCount", { type: "number", tone: "info" }),
    ],
    columns: [
      col("createdAt", "Date", "datetime"),
      col("action", "Action", "badge"),
      col("entity", "Entity"),
      col("entityId", "Entity ID"),
      col("description", "Description"),
      col("branchName", "Branch"),
      col("performedBy", "Performed by"),
    ],
  },
  "accounts-payable-aging": {
    filterProfile: "basic",
    metrics: [
      metric("Outstanding invoices", "totalInvoices", { type: "number", tone: "warning" }),
      metric("Total outstanding", "totalOutstanding", { type: "currency", tone: "danger" }),
      metric("0-30 days", "agingBuckets.0-30", { type: "currency", tone: "info" }),
      metric("31-60 days", "agingBuckets.31-60", { type: "currency", tone: "warning" }),
      metric("61-90 days", "agingBuckets.61-90", { type: "currency", tone: "danger" }),
      metric("90+ days", "agingBuckets.90+", { type: "currency", tone: "critical" }),
    ],
    columns: [
      col("supplierName", "Supplier"),
      col("invoiceNumber", "Invoice"),
      col("branchName", "Branch"),
      col("totalAmount", "Total", "currency"),
      col("paidAmount", "Paid", "currency"),
      col("remaining", "Remaining", "currency"),
      col("dueDate", "Due Date", "date"),
      col("daysRemaining", "Days Left", "number"),
      col("bucket", "Aging", "badge"),
      col("status", "Status", "badge"),
    ],
  },
  "cash-reconciliation": {
    filterProfile: "basic",
    metrics: [
      metric("Sessions", "totalSessions", { type: "number", tone: "primary" }),
      metric("Opening cash", "totalOpeningCash", { type: "currency", tone: "info" }),
      metric("Cash sales", "totalCashSales", { type: "currency", tone: "success" }),
      metric("Expenses", "totalExpenses", { type: "currency", tone: "warning" }),
      metric("Withdrawals", "totalWithdrawals", { type: "currency", tone: "danger" }),
      metric("Expected cash", "totalExpectedCash", { type: "currency", tone: "info" }),
    ],
    columns: [
      col("branchName", "Branch"),
      col("cashierName", "Cashier"),
      col("openedAt", "Opened", "datetime"),
      col("status", "Session", "badge"),
      col("openingCash", "Opening", "currency"),
      col("cashSales", "Cash Sales", "currency"),
      col("expenses", "Expenses", "currency"),
      col("withdrawals", "Withdrawals", "currency"),
      col("expectedCash", "Expected", "currency"),
      col("actualClosingCash", "Actual", "currency"),
      col("variance", "Variance", "currency"),
    ],
  },
};

export function getReportViewConfig(reportKey) {
  return REPORT_VIEW_CONFIG[reportKey] || {
    filterProfile: "basic",
    metrics: [],
    columns: [],
  };
}

export function buildReportMetrics(summary = {}, reportKey) {
  const config = getReportViewConfig(reportKey);
  return buildMetricsFromSummary(summary, config);
}

export function buildExportColumns(reportKey) {
  const config = getReportViewConfig(reportKey);
  return (config.columns || []).map((column) => ({
    key: column.key,
    label: column.label,
    exportValue: (row) => formatCellValue(row[column.key], column.type),
  }));
}

export { SUMMARY_METRIC_BUILDERS, buildMetricsFromSummary };
