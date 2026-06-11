import { Card } from "../../../../components/ui";

const toneStyles = {
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  neutral: "bg-slate-100 text-slate-600",
};

export default function ReportMetricGrid({ metrics = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--color-muted)]">{metric.label}</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-[var(--color-text)]">
                {metric.value}
              </p>
              {metric.hint ? (
                <p className="mt-2 text-xs text-[var(--color-muted)]">{metric.hint}</p>
              ) : null}
            </div>
            {metric.badge ? (
              <div className={`rounded-2xl px-3 py-2 text-xs font-semibold ${toneStyles[metric.tone || "neutral"]}`}>
                {metric.badge}
              </div>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
