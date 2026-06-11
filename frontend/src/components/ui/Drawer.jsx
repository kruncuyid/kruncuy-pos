import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

export default function Drawer({
  open,
  title,
  description,
  children,
  onClose,
  size = "md",
  side = "right",
  className = "",
}) {
  if (!open) return null;

  const sideClasses = {
    right: "right-0 top-0 h-full rounded-l-2xl border-l",
    left: "left-0 top-0 h-full rounded-r-2xl border-r",
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/30 dark:bg-slate-950/50" />

      {/* Panel */}
      <div
        className={`relative ml-auto flex w-full ${SIZES[size] || SIZES.md} flex-col bg-[var(--color-surface)] shadow-dropdown ${sideClasses[side]} ${className} erp-fade-in`}
        onClick={(event) => event.stopPropagation()}
        style={{
          animation: "erp-slide-in 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>

      <style>{`
        @keyframes erp-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
