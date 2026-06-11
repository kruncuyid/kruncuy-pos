import { RefreshCw } from "lucide-react";
import Button from "./Button";

export default function PageHeader({
  title,
  description,
  badge,
  actions,
  loading = false,
  onRefresh,
  className = "",
}) {
  return (
    <header
      className={`kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6 ${className}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
            ERP workspace
          </p>
          {badge ? (
            <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
              {badge}
            </span>
          ) : null}
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onRefresh ? (
          <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        ) : null}
        {actions}
      </div>
    </header>
  );
}
