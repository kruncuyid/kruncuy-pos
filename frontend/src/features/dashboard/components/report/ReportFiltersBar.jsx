import { Button, Card, Input } from "../../../../components/ui";

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="grid gap-2 text-sm text-[var(--color-text)]">
      <span className="font-medium">{label}</span>
      <select className="kr-input" value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ReportFiltersBar({
  branchValue,
  cashierValue,
  channelValue,
  paymentValue,
  startDateValue,
  endDateValue,
  branchOptions = [],
  cashierOptions = [],
  channelOptions = [],
  paymentOptions = [],
  onBranchChange,
  onCashierChange,
  onChannelChange,
  onPaymentChange,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  loading = false,
}) {
  return (
    <Card className="p-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]">
        <SelectField
          label="Branch"
          value={branchValue}
          onChange={onBranchChange}
          options={branchOptions}
        />
        <SelectField
          label="Cashier"
          value={cashierValue}
          onChange={onCashierChange}
          options={cashierOptions}
        />
        <SelectField
          label="Channel"
          value={channelValue}
          onChange={onChannelChange}
          options={channelOptions}
        />
        <SelectField
          label="Payment"
          value={paymentValue}
          onChange={onPaymentChange}
          options={paymentOptions}
        />
        <Input
          label="Start date"
          type="date"
          value={startDateValue}
          onChange={onStartDateChange}
        />
        <Input
          label="End date"
          type="date"
          value={endDateValue}
          onChange={onEndDateChange}
        />
        <div className="flex items-end gap-2">
          <Button onClick={onApply} disabled={loading} className="min-w-[110px]">
            Terapkan
          </Button>
          <Button variant="secondary" onClick={onReset} disabled={loading} className="min-w-[90px]">
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}
