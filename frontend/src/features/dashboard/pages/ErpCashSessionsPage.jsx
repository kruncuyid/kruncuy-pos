import { Banknote, Clock3, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, SectionHeader, StatCard } from "../../../components/ui";
import { formatCurrency, formatDateTime, statusTone } from "../utils/reportFormatters";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { erpOverviewApi } from "../services/erpOverviewApi";

export default function ErpCashSessionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    branchId: "ALL",
    userId: "ALL",
    status: "ALL",
    search: "",
  });
  const [summary, setSummary] = useState({
    totalSessions: 0,
    openSessions: 0,
    closedSessions: 0,
    totalOpeningCash: 0,
    totalExpectedCash: 0,
    totalClosingCash: 0,
    totalBranches: 0,
  });

  async function loadData(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = {
        startDate: nextFilters.startDate,
        endDate: nextFilters.endDate,
        search: nextFilters.search,
      };

      if (nextFilters.branchId !== "ALL") params.branchId = nextFilters.branchId;
      if (nextFilters.userId !== "ALL") params.userId = nextFilters.userId;
      if (nextFilters.status !== "ALL") params.status = nextFilters.status;

      const [cashResponse, branchesResponse] = await Promise.all([
        erpOverviewApi.getCashSessions(params),
        branchApi.getBranches(),
      ]);

      const payload = cashResponse.data?.data || {};
      setRows(payload.rows || []);
      setBranches(payload.branches || branchesResponse.data?.data || []);
      setSummary(payload.summary || summary);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat cash sessions.");
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
      { title: "Total session", value: summary.totalSessions, icon: Banknote },
      { title: "Open", value: summary.openSessions, icon: ShieldCheck },
      { title: "Closed", value: summary.closedSessions, icon: Clock3 },
      { title: "Branch", value: summary.totalBranches, icon: Wallet },
    ],
    [summary]
  );

  const columns = useMemo(
    () => [
      {
        key: "branchName",
        label: "Branch",
        render: (row) => (
          <div>
            <p className="font-semibold text-[var(--color-text)]">{row.branchName}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{row.branchCode}</p>
          </div>
        ),
      },
      {
        key: "operator",
        label: "Operator",
        render: (row) => (
          <div>
            <p className="font-medium text-[var(--color-text)]">{row.operatorName}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{row.operatorUsername}</p>
          </div>
        ),
      },
      {
        key: "openedAt",
        label: "Open",
        render: (row) => <span className="text-sm text-[var(--color-muted)]">{formatDateTime(row.openedAt)}</span>,
      },
      {
        key: "closedAt",
        label: "Close",
        render: (row) => <span className="text-sm text-[var(--color-muted)]">{formatDateTime(row.closedAt)}</span>,
      },
      {
        key: "openingCash",
        label: "Opening",
        render: (row) => <span className="font-semibold">{formatCurrency(row.openingCash)}</span>,
      },
      {
        key: "expectedCash",
        label: "Expected",
        render: (row) => <span className="font-semibold">{formatCurrency(row.expectedCash)}</span>,
      },
      {
        key: "closingCash",
        label: "Closing",
        render: (row) => <span className="font-semibold">{row.status === "CLOSED" ? formatCurrency(row.closingCash) : "-"}</span>,
      },
      {
        key: "cashDifference",
        label: "Diff",
        render: (row) => {
          if (row.cashDifference === null || row.cashDifference === undefined) return "-";
          const tone = row.cashDifference === 0 ? "success" : row.cashDifference > 0 ? "info" : "danger";
          return <Badge tone={tone}>{formatCurrency(row.cashDifference)}</Badge>;
        },
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
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
      userId: "ALL",
      status: "ALL",
      search: "",
    };
    setFilters(reset);
    loadData(reset);
  }

  return (
    <ErpShell title="Cash Sessions" description="Ringkasan sesi kasir, opening, closing, dan selisih cash.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Cash Sessions</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Lihat status shift kasir, opening cash, expected cash, closing cash, dan selisihnya.
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
        {metrics.map((item) => {
          const Icon = item.icon;
          return <StatCard key={item.title} title={item.title} value={loading ? "-" : item.value} icon={<Icon size={18} />} />;
        })}
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <SectionHeader title="Filter cash sessions" description="Cari sesi kasir berdasarkan periode, branch, operator, atau status." />

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
            <span className="font-medium">Status</span>
            <select className="kr-input" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="ALL">Semua status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <Input
            label="Search"
            placeholder="Branch, operator, status"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />

          <div className="flex flex-wrap gap-3 lg:col-span-5">
            <Button type="submit">Terapkan</Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>

        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <span>Opening cash: {formatCurrency(summary.totalOpeningCash)}</span>
            <span>Expected cash: {formatCurrency(summary.totalExpectedCash)}</span>
            <span>Closing cash: {formatCurrency(summary.totalClosingCash)}</span>
            <span>Session: {summary.totalSessions}</span>
          </div>
        </div>

        <div className="mt-5">
          <ManagementTable
            columns={columns}
            rows={rows}
            emptyText="Belum ada cash session yang sesuai filter."
            stickyHeader
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
            maxHeightClass="max-h-[34rem]"
            resetKey={`${filters.startDate}-${filters.endDate}-${filters.branchId}-${filters.userId}-${filters.status}-${filters.search}-${rows.length}`}
          />
        </div>
      </Card>
    </ErpShell>
  );
}
