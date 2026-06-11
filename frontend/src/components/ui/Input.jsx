import { forwardRef } from "react";

const Input = forwardRef(function Input({ label, hint, className = "", id, icon, ...props }, ref) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const iconPaddingStyle = icon ? { paddingLeft: "3.25rem" } : undefined;

  return (
    <label className="grid gap-2 text-sm text-[var(--color-text)]" htmlFor={inputId}>
      {label ? <span className="font-medium">{label}</span> : null}
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`kr-input ${className}`}
          style={iconPaddingStyle}
          {...props}
        />
      </div>
      {hint ? <span className="text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
});

export default Input;
