import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function safeString(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function buildSheetFromRows(rows, columns) {
  const header = columns.map((column) => column.label);
  const body = rows.map((row) =>
    columns.map((column) => {
      if (column.exportValue) return column.exportValue(row);
      if (column.exportKey) return row[column.exportKey];
      if (column.key) return row[column.key];
      return "";
    })
  );

  return XLSX.utils.aoa_to_sheet([header, ...body]);
}

export function exportReportToExcel({
  fileName = "report",
  title = "Report",
  summaryRows = [],
  detailColumns = [],
  detailRows = [],
}) {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Title", title],
    ["Generated At", new Date().toLocaleString("id-ID")],
    [],
    ...summaryRows.map((item) => [item.label, item.value]),
  ]);
  const detailSheet = buildSheetFromRows(detailRows, detailColumns);

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(workbook, detailSheet, "Details");

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportReportToPdf({
  fileName = "report",
  title = "Report",
  description = "",
  summaryRows = [],
  detailColumns = [],
  detailRows = [],
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text(title, 40, 40);
  if (description) {
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(description, 40, 58);
  }

  doc.setFontSize(10);
  doc.setTextColor(30);
  let y = 84;
  summaryRows.forEach((item) => {
    doc.text(`${item.label}: ${safeString(item.value)}`, 40, y);
    y += 16;
  });

  const head = [detailColumns.map((column) => column.label)];
  const body = detailRows.map((row) =>
    detailColumns.map((column) => {
      if (column.exportValue) return safeString(column.exportValue(row));
      if (column.exportKey) return safeString(row[column.exportKey]);
      if (column.key) return safeString(row[column.key]);
      return "";
    })
  );

  autoTable(doc, {
    head,
    body,
    startY: Math.max(y + 12, 110),
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [185, 28, 43],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [247, 248, 250],
    },
  });

  doc.save(`${fileName}.pdf`);
}
