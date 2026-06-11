const tones = {
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-transparent",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)] border-transparent",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-transparent",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-transparent",
  info: "bg-[var(--color-info-soft)] text-[var(--color-info)] border-transparent",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone] || tones.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
