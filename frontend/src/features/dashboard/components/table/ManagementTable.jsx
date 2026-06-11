import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "../../../../components/ui";

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (value instanceof Date) return value.toLocaleString("id-ID");
  return value;
}

export default function ManagementTable({
  columns = [],
  rows = [],
  emptyText = "Belum ada data untuk filter yang dipilih.",
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  resetKey,
  maxHeightClass = "max-h-[34rem]",
  stickyHeader = true,
  onPageChange,
  onPageSizeChange,
}) {
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (!pageSizeOptions.includes(pageSize)) {
      setPageSize(defaultPageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSizeOptions.join(","), defaultPageSize]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const start = totalRows ? (currentPage - 1) * pageSize : 0;
  const end = Math.min(currentPage * pageSize, totalRows);

  const paginatedRows = useMemo(() => {
    return rows.slice(start, end);
  }, [rows, start, end]);

  function changePage(nextPage) {
    const normalized = Math.min(Math.max(1, nextPage), totalPages);
    setCurrentPage(normalized);
    onPageChange?.(normalized);
  }

  function changePageSize(nextSize) {
    const normalized = Number(nextSize);
    setPageSize(normalized);
    setCurrentPage(1);
    onPageSizeChange?.(normalized);
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <p className="text-xs text-[var(--color-muted)] md:text-sm">
          Menampilkan <span className="font-semibold text-[var(--color-text)]">{start + (totalRows ? 1 : 0)}</span> -{" "}
          <span className="font-semibold text-[var(--color-text)]">{end}</span> dari{" "}
          <span className="font-semibold text-[var(--color-text)]">{totalRows}</span> data
        </p>

        <label className="flex items-center gap-2 text-xs text-[var(--color-muted)] md:text-sm">
          <span>Rows per page</span>
          <select
            className="kr-input min-w-[92px] py-1.5 text-sm"
            value={pageSize}
            onChange={(event) => changePageSize(event.target.value)}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`overflow-x-auto ${maxHeightClass} overflow-y-auto`}>
        <table className="min-w-full border-collapse text-left text-xs md:text-sm">
          <thead className="bg-[var(--color-surface-2)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`bg-[var(--color-surface-2)] px-3 py-2.5 font-semibold shadow-[inset_0_-1px_0_var(--color-border)] ${
                    stickyHeader
                      ? "sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface-2)]/95"
                      : ""
                  } ${column.className || ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {paginatedRows.length ? (
              paginatedRows.map((row, rowIndex) => (
                <tr key={row.id || row.key || rowIndex} className="align-top hover:bg-[var(--color-surface-2)]/60">
                  {columns.map((column) => {
                    const content = column.render ? column.render(row, rowIndex + start) : formatCellValue(row[column.key]);
                    return (
                      <td key={column.key} className={`px-3 py-3 align-top ${column.cellClassName || ""}`}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-xs text-[var(--color-muted)] md:text-sm">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
        <p className="text-xs text-[var(--color-muted)] md:text-sm">
          Page <span className="font-semibold text-[var(--color-text)]">{currentPage}</span> of{" "}
          <span className="font-semibold text-[var(--color-text)]">{totalPages}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft size={16} />
            Previous
          </Button>
          <Button variant="secondary" onClick={() => changePage(currentPage + 1)} disabled={currentPage >= totalPages}>
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
