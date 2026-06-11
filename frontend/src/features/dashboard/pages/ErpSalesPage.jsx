import { CalendarDays, CircleDollarSign, RefreshCw, Store, Users2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, SectionHeader, StatCard } from "../../../components/ui";
import { formatCurrency, formatDateTime, buildChannelLabel, paymentTone } from "../utils/reportFormatters";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { reportApi } from "../services/reportApi";

export default function ErpSalesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    branchId: "ALL",
    cashierId: "ALL",
    salesChannel: "ALL",
    paymentMethod: "ALL",
  });
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalSales: 0,
    totalPcs: 0,
    cashTotal: 0,
    qrisTotal: 0,
    onlineTotal: 0,
    paymentBreakdown: {},
  });

  async function loadData(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = {
        startDate: nextFilters.startDate,
        endDate: nextFilters.endDate,
      };

      if (nextFilters.branchId !== "ALL") params.branchId = nextFilters.branchId;
      if (nextFilters.cashierId !== "ALL") params.cashierId = nextFilters.cashierId;
      if (nextFilters.salesChannel !== "ALL") params.salesChannel = nextFilters.salesChannel;
      if (nextFilters.paymentMethod !== "ALL") params.paymentMethod = nextFilters.paymentMethod;

      const [salesResponse, branchesResponse] = await Promise.all([
        reportApi.getSalesRecap(params),
        branchApi.getBranches(),
      ]);

      const payload = salesResponse.data?.data || {};
      setRows(payload.rows || []);
      setBranches(payload.branches || branchesResponse.data?.data || []);
      setCashiers(payload.cashierOptions || []);
      setSummary(payload.summary || summary);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat sales overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = useMemo(
    () => [
      { title: "Transaksi", value: summary.totalTransactions, icon: CalendarDays },
      { title: "Omzet", value: formatCurrency(summary.totalSales), icon: Store },
      { title: "Pcs", value: summary.totalPcs || 0, icon: Users2 },
      { title: "Cash", value: formatCurrency(summary.cashTotal), icon: CircleDollarSign },
    ],
    [summary]
  );

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        label: "Waktu",
        render: (row) => (
          <div>
            <p className="font-semibold text-[var(--color-text)]">{row.invoiceNumber}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDateTime(row.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "cashierDisplayName",
        label: "Cashier",
        render: (row) => (
          <div>
            <p className="font-semibold text-[var(--color-text)]">{row.cashierDisplayName || row.cashierName || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{row.cashierUsername || "-"}</p>
          </div>
        ),
      },
      {
        key: "branchName",
        label: "Branch",
        render: (row) => <span className="text-sm text-[var(--color-muted)]">{row.branchName}</span>,
      },
      {
        key: "salesChannel",
        label: "Channel",
        render: (row) => <Badge tone={row.salesChannel === "ONLINE" ? "info" : "neutral"}>{buildChannelLabel(row)}</Badge>,
      },
      {
        key: "paymentMethod",
        label: "Payment",
        render: (row) => <span className="font-medium">{row.paymentMethod}</span>,
      },
      {
        key: "totalPcs",
        label: "Pcs",
        render: (row) => <span className="font-semibold">{row.totalPcs}</span>,
      },
      {
        key: "totalAmount",
        label: "Total",
        render: (row) => <span className="font-semibold">{formatCurrency(row.totalAmount)}</span>,
      },
    ],
    []
  );

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleApply(event) {
    event.preventDefault();
    loadData(filters);
  }

  function handleReset() {
    const reset = {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      branchId: "ALL",
      cashierId: "ALL",
      salesChannel: "ALL",
      paymentMethod: "ALL",
    };
    setFilters(reset);
    loadData(reset);
  }

  return (
    <ErpShell title="Sales" description="Ringkasan penjualan harian dan histori transaksi yang rapi.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Sales</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Lihat ringkasan penjualan harian, channel offline/online, dan cashier yang memproses transaksi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => loadData(filters)} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <StatCard key={metric.title} title={metric.title} value={loading ? "-" : metric.value} icon={<Icon size={18} />} />;
        })}
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <SectionHeader title="Filter sales" description="Pilih branch, cashier, channel, payment, dan rentang tanggal." />

        <form className="mt-4 grid gap-3 lg:grid-cols-5" onSubmit={handleApply}>
          <Input
            label="Tanggal awal"
            type="date"
            value={filters.startDate}
            onChange={(event) => updateFilter("startDate", event.target.value)}
          />
          <Input
            label="Tanggal akhir"
            type="date"
            value={filters.endDate}
            onChange={(event) => updateFilter("endDate", event.target.value)}
          />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Branch</span>
            <select className="kr-input" value={filters.branchId} onChange={(event) => updateFilter("branchId", event.target.value)}>
              <option value="ALL">Semua branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Cashier</span>
            <select className="kr-input" value={filters.cashierId} onChange={(event) => updateFilter("cashierId", event.target.value)}>
              <option value="ALL">Semua cashier</option>
              {cashiers.map((cashier) => (
                <option key={cashier.id} value={cashier.id}>
                  {cashier.displayName || cashier.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Channel</span>
            <select className="kr-input" value={filters.salesChannel} onChange={(event) => updateFilter("salesChannel", event.target.value)}>
              <option value="ALL">Semua channel</option>
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm lg:col-span-2">
            <span className="font-medium">Payment</span>
            <select className="kr-input" value={filters.paymentMethod} onChange={(event) => updateFilter("paymentMethod", event.target.value)}>
              <option value="ALL">Semua payment</option>
              <option value="CASH">Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="SPLIT">Split bill</option>
              <option value="GOFOOD">GoFood</option>
              <option value="GRABFOOD">GrabFood</option>
              <option value="SHOPEEFOOD">ShopeeFood</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3 lg:col-span-5">
            <Button type="submit">Terapkan</Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>

        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <span>Total transaksi: {summary.totalTransactions}</span>
            <span>Payment cash: {formatCurrency(summary.cashTotal)}</span>
            <span>Payment qris: {formatCurrency(summary.qrisTotal)}</span>
            <span>Online total: {formatCurrency(summary.onlineTotal)}</span>
          </div>
        </div>

        <div className="mt-5">
          <ManagementTable
            columns={columns}
            rows={rows}
            emptyText="Belum ada transaksi sesuai filter."
            stickyHeader
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
            maxHeightClass="max-h-[34rem]"
            resetKey={`${filters.startDate}-${filters.endDate}-${filters.branchId}-${filters.cashierId}-${filters.salesChannel}-${filters.paymentMethod}-${rows.length}`}
          />
        </div>
      </Card>
    </ErpShell>
  );
}
