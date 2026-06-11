import { Search } from "lucide-react";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";
import Card from "./Card";

/**
 * FilterBar — standardized filter form for all ERP pages.
 *
 * Usage:
 * ```
 * <FilterBar
 *   filters={[
 *     { key: "startDate", label: "Start date", type: "date" },
 *     { key: "branchId", label: "Branch", type: "select", options: branchOptions, placeholder: "All branches" },
 *     { key: "search", label: "Search", type: "search" },
 *   ]}
 *   values={filters}
 *   onChange={handleChange}
 *   onApply={handleApply}
 *   onReset={handleReset}
 *   loading={loading}
 * />
 * ```
 */

export default function FilterBar({
  filters = [],
  values = {},
  onChange,
  onApply,
  onReset,
  loading = false,
  className = "",
}) {
  function handleChange(key, value) {
    if (onChange) onChange(key, value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (onApply) onApply();
  }

  // Determine grid columns based on filter count
  const gridCols =
    filters.length <= 2
      ? "sm:grid-cols-2"
      : filters.length <= 3
        ? "sm:grid-cols-3"
        : filters.length <= 4
          ? "sm:grid-cols-4"
          : "sm:grid-cols-3 lg:grid-cols-5";

  return (
    <Card className={`p-4 sm:p-5 ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className={`grid gap-3 ${gridCols}`}>
          {filters.map((filter) => {
            const value = values[filter.key] ?? "";

            if (filter.type === "select" || filter.type === "select-search") {
              return (
                <Select
                  key={filter.key}
                  label={filter.label}
                  options={filter.options || []}
                  placeholder={filter.placeholder || `Semua ${filter.label.toLowerCase()}`}
                  value={value}
                  onChange={(event) => handleChange(filter.key, event.target.value)}
                  disabled={filter.disabled}
                />
              );
            }

            if (filter.type === "search") {
              return (
                <Input
                  key={filter.key}
                  label={filter.label}
                  icon={<Search size={16} />}
                  placeholder={filter.placeholder || "Cari..."}
                  value={value}
                  onChange={(event) => handleChange(filter.key, event.target.value)}
                />
              );
            }

            return (
              <Input
                key={filter.key}
                label={filter.label}
                type={filter.type || "text"}
                placeholder={filter.placeholder}
                value={value}
                onChange={(event) => handleChange(filter.key, event.target.value)}
              />
            );
          })}

          {/* Action buttons — always appended */}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Memuat..." : "Terapkan"}
          </Button>
          {onReset ? (
            <Button type="button" variant="secondary" size="sm" onClick={onReset} disabled={loading}>
              Reset
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
