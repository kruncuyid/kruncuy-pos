import { CalendarRange, CheckCircle2, RefreshCw, Star, Trophy, Users2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { formatCurrency } from '../utils/reportFormatters';
import { erpOverviewApi } from "../services/erpOverviewApi";


export default function ErpPerformancePage() {
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [crewUsers, setCrewUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7),
    branchId: "ALL",
    userId: "ALL",
  });
  const [bonusRules, setBonusRules] = useState({
    targetMinPcs: 25,
    bonusPerPcs: 250,
    bonusPerExtraSauce: 250,
  });

  async function loadData(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = {
        month: nextFilters.month,
      };

      if (nextFilters.branchId !== "ALL") params.branchId = nextFilters.branchId;
      if (nextFilters.userId !== "ALL") params.userId = nextFilters.userId;

      const [performanceResponse, branchesResponse] = await Promise.all([
        erpOverviewApi.getPerformance(params),
        branchApi.getBranches(),
      ]);

      const payload = performanceResponse.data.data || {};
      setRows(payload.rows || []);
      setBranches(payload.branches || branchesResponse.data.data || []);
      setCrewUsers(payload.crewUsers || []);
      setBonusRules(payload.bonusRules || bonusRules);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat performa crew.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const totalCrew = rows.length;
    const totalAttendance = rows.reduce((sum, item) => sum + Number(item.attendanceCount || 0), 0);
    const totalTransactions = rows.reduce((sum, item) => sum + Number(item.totalTransactions || 0), 0);
    const totalBonus = rows.reduce((sum, item) => sum + Number(item.totalBonus || 0), 0);
    return [
      { title: "Crew aktif", value: totalCrew, icon: Users2 },
      { title: "Kali hadir", value: totalAttendance, icon: CheckCircle2 },
      { title: "Transaksi", value: totalTransactions, icon: CalendarRange },
      { title: "Total bonus", value: formatCurrency(totalBonus), icon: Trophy },
    ];
  }, [rows]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleApply(event) {
    event.preventDefault();
    loadData(filters);
  }

  function handleReset() {
    const reset = {
      month: new Date().toISOString().slice(0, 7),
      branchId: "ALL",
      userId: "ALL",
    };
    setFilters(reset);
    loadData(reset);
  }

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Crew",
        render: (row) => (
          <div>
            <p className="font-semibold text-[var(--color-text)]">{row.name}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{row.email}</p>
          </div>
        ),
      },
      {
        key: "branchName",
        label: "Branch",
        render: (row) => <span className="text-sm text-[var(--color-muted)]">{row.branchName || "-"}</span>,
      },
      {
        key: "attendanceCount",
        label: "Hadir",
        render: (row) => <Badge tone="neutral">{row.attendanceCount}</Badge>,
      },
      {
        key: "totalTransactions",
        label: "Trx",
        render: (row) => <span className="font-semibold text-[var(--color-text)]">{row.totalTransactions}</span>,
      },
      {
        key: "totalPcs",
        label: "Pcs",
        render: (row) => <span className="font-semibold text-[var(--color-text)]">{row.totalPcs}</span>,
      },
      {
        key: "corePcs",
        label: "Core pcs",
        render: (row) => <span className="font-semibold text-[var(--color-text)]">{row.corePcs}</span>,
      },
      {
        key: "extraSaucePcs",
        label: "Extra saos",
        render: (row) => <span className="font-semibold text-[var(--color-text)]">{row.extraSaucePcs}</span>,
      },
      {
        key: "pcsBonus",
        label: "Bonus pcs",
        render: (row) => <span className="font-semibold text-[var(--color-text)]">{formatCurrency(row.pcsBonus)}</span>,
      },
      {
        key: "extraSauceBonus",
        label: "Bonus saos",
        render: (row) => (
          <span className="font-semibold text-[var(--color-text)]">{formatCurrency(row.extraSauceBonus)}</span>
        ),
      },
      {
        key: "totalBonus",
        label: "Total bonus",
        render: (row) => <span className="font-semibold text-[var(--color-primary)]">{formatCurrency(row.totalBonus)}</span>,
      },
    ],
    []
  );

  return (
    <ErpShell title="Performance" description="Performa crew bulanan dan bonus dari database.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Performance</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Rekap performa crew per bulan berdasarkan absensi, transaksi, pcs core, extra saos, dan bonus.
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
        {summary.map((item) => {
          const Icon = item.icon;
          return <StatCard key={item.title} title={item.title} value={loading ? "-" : item.value} icon={<Icon size={18} />} />;
        })}
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <SectionHeader
          title="Filter performa"
          description="Pilih bulan, branch, atau crew untuk melihat rekap performa yang lebih spesifik."
        />

        <form className="mt-4 grid gap-3 lg:grid-cols-4" onSubmit={handleApply}>
          <Input
            label="Bulan"
            type="month"
            value={filters.month}
            onChange={(event) => updateFilter("month", event.target.value)}
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
            <span className="font-medium">Crew</span>
            <select className="kr-input" value={filters.userId} onChange={(event) => updateFilter("userId", event.target.value)}>
              <option value="ALL">Semua crew</option>
              {crewUsers.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3 lg:items-end">
            <Button type="submit">Terapkan</Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>

        <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
          Aturan bonus saat ini: minimal {bonusRules.targetMinPcs} pcs core, bonus pcs {formatCurrency(bonusRules.bonusPerPcs)} per pcs, bonus extra saos{" "}
          {formatCurrency(bonusRules.bonusPerExtraSauce)} per pcs.
        </div>

        <div className="mt-5">
          <ManagementTable
            columns={columns}
            rows={rows}
            emptyText="Tidak ada performa crew pada bulan ini."
            resetKey={`${filters.month}-${filters.branchId}-${filters.userId}-${rows.length}`}
            maxHeightClass="max-h-[34rem]"
            stickyHeader
          />
        </div>
      </Card>
    </ErpShell>
  );
}
