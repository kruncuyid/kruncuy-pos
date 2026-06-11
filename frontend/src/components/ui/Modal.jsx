import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
};

export default function Modal({ open, title, children, onClose, size = "xl", className = "" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-2 sm:p-4" onClick={onClose}>
      <div
        className={`kr-card flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden ${SIZES[size] || SIZES.xl} ${className} p-3 sm:p-5`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-border)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
