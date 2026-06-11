import { LoaderCircle } from "lucide-react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  loading = false,
  disabled = false,
  ...props
}) {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 select-none";

  const variants = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-[0.98]",
    secondary:
      "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)]",
    subtle:
      "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]",
    ghost:
      "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
    danger:
      "bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-[0.98]",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
    xl: "h-12 px-6 text-base",
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
