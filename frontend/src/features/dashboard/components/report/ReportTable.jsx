import { Card } from "../../../../components/ui";

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (value instanceof Date) return value.toLocaleString("id-ID");
  return value;
}

export default function ReportTable({
  columns = [],
  rows = [],
  emptyText = "Belum ada data untuk filter yang dipilih.",
  maxHeightClass = "max-h-[34rem]",
  stickyHeader = true,
}) {
  return (
    <Card className="overflow-hidden">
      <div className={`overflow-x-auto ${maxHeightClass} overflow-y-auto`}>
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`bg-[var(--color-surface-2)] px-4 py-3 font-semibold ${
                    stickyHeader ? "sticky top-0 z-10" : ""
                  } ${column.className || ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={row.id || row.key || rowIndex} className="align-top hover:bg-[var(--color-surface-2)]/60">
                  {columns.map((column) => {
                    const content = column.render ? column.render(row, rowIndex) : formatCellValue(row[column.key]);
                    return (
                      <td key={column.key} className={`px-4 py-4 ${column.cellClassName || ""}`}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
