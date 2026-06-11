import { Button, Card } from "../../../../components/ui";

export default function ReportPagination({
  currentPage = 1,
  totalPages = 1,
  totalRows = 0,
  pageSize = 10,
  onPageChange,
}) {
  const start = totalRows ? (currentPage - 1) * pageSize + 1 : 0;
  const end = Math.min(currentPage * pageSize, totalRows);

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
      <p className="text-sm text-[var(--color-muted)]">
        Menampilkan <span className="font-semibold text-[var(--color-text)]">{start}</span> -{" "}
        <span className="font-semibold text-[var(--color-text)]">{end}</span> dari{" "}
        <span className="font-semibold text-[var(--color-text)]">{totalRows}</span> data
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]">
          Page {currentPage} of {Math.max(totalPages, 1)}
        </div>

        <Button
          variant="secondary"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </Card>
  );
}
