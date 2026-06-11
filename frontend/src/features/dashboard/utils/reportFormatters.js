export function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

export function formatInteger(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

export function formatCellValue(value, type = "text") {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "currency") return formatCurrency(value);
  if (type === "number") return formatNumber(value);
  if (type === "decimal") return Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 3 });
  if (type === "datetime") return formatDateTime(value);
  if (type === "date") return formatDateOnly(value);
  return String(value);
}

export function getMonthToDateDefaults() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export function paymentTone(value) {
  const upper = String(value || "").toUpperCase();
  if (upper === "CASH") return "success";
  if (upper === "QRIS") return "info";
  if (upper === "SPLIT") return "warning";
  if (upper === "COMPLETED" || upper === "POSTED" || upper === "CLOSED") return "success";
  if (upper === "OPEN" || upper === "REQUESTED") return "warning";
  if (upper === "VOID" || upper === "CANCELLED") return "danger";
  if (upper === "ONLINE") return "info";
  return "neutral";
}

export function statusTone(status) {
  const upper = String(status || "").toUpperCase();
  if (upper === "OPEN") return "warning";
  if (upper === "CLOSED" || upper === "COMPLETED") return "success";
  if (upper === "CANCELLED" || upper === "EXPIRED") return "danger";
  return "neutral";
}

export function buildChannelLabel(row) {
  if (row?.salesChannel === "ONLINE") {
    return `ONLINE | ${row.onlinePlatform || "Online"}`;
  }
  return "OFFLINE";
}

export function formatGrowth(value) {
  if (value === null || value === undefined) return "-";
  return `${value >= 0 ? "+" : ""}${value}%`;
}

export function promiseToast(promise, { loading = "Memproses...", success = "Berhasil!", error = "Gagal!" } = {}) {
  return promise;
}
