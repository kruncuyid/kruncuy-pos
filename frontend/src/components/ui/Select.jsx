import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { label, hint, options = [], placeholder, className = "", value, onChange, disabled, ...props },
  ref
) {
  return (
    <label className="grid gap-2 text-sm text-[var(--color-text)]">
      {label ? <span className="font-medium">{label}</span> : null}
      <select
        ref={ref}
        className={`kr-input ${className}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => {
          const val = typeof opt === "object" ? opt.value : opt;
          const lab = typeof opt === "object" ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lab}
            </option>
          );
        })}
      </select>
      {hint ? <span className="text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
});

export default Select;
