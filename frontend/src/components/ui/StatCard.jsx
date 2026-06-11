import Card from "./Card";

export default function StatCard({ title, value, delta, icon, className = "" }) {
  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-xs text-[var(--color-muted)] sm:text-sm">{title}</p>
          <h3 className="mt-1.5 truncate text-xl font-bold leading-tight tracking-tight sm:mt-2 sm:text-2xl">
            {value}
          </h3>
          {delta ? <p className="mt-1.5 truncate text-[11px] text-[var(--color-muted)] sm:mt-2 sm:text-xs">{delta}</p> : null}
        </div>
        {icon ? (
          <div className="shrink-0 rounded-2xl bg-[var(--color-primary-soft)] p-2.5 text-[var(--color-primary)] sm:p-3">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
