import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";

const tones = {
  info: {
    container: "bg-[var(--color-info-soft)] border-[var(--color-info)]/20 text-[var(--color-info)]",
    icon: Info,
  },
  success: {
    container: "bg-[var(--color-success-soft)] border-[var(--color-success)]/20 text-[var(--color-success)]",
    icon: CheckCircle2,
  },
  warning: {
    container: "bg-[var(--color-warning-soft)] border-[var(--color-warning)]/20 text-[var(--color-warning)]",
    icon: AlertCircle,
  },
  danger: {
    container: "bg-[var(--color-danger-soft)] border-[var(--color-danger)]/20 text-[var(--color-danger)]",
    icon: XCircle,
  },
};

export default function Alert({
  tone = "info",
  title,
  children,
  className = "",
  onDismiss,
}) {
  const config = tones[tone] || tones.info;
  const Icon = config.icon;

  return (
    <div
      className={`erp-fade-in flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${config.container} ${className}`}
      role="alert"
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="mt-0.5 leading-5 opacity-90">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
