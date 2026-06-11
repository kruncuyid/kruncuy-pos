import { CalendarDays, Building2, CheckCircle2, Clock3, RefreshCw, Users2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { erpOverviewApi } from "../services/erpOverviewApi";

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ErpAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [branches, setBranches] = useState([]);
  const [crewUsers, setCrewUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    branchId: "ALL",
    userId: "ALL",
    status: "ALL",
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
      if (nextFilters.userId !== "ALL") params.userId = nextFilters.userId;
      if (nextFilters.status !== "ALL") params.status = nextFilters.status;

      const [attendanceResponse, branchesResponse] = await Promise.all([
        erpOverviewApi.getAttendance(params),
        branchApi.getBranches(),
      ]);

      const payload = attendanceResponse.data.data || {};
      setAttendance(payload.attendances || []);
      setBranches(payload.branches || branchesResponse.data.data || []);
      setCrewUsers(payload.crewUsers || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((item) => item.checkInAt).length;
    const checkout = attendance.filter((item) => item.checkOutAt).length;
    const branchesCount = new Set(attendance.map((item) => item.branchId)).size;
    return [
      { title: "Total absensi", value: total, icon: CalendarDays },
      { title: "Sudah check-in", value: present, icon: CheckCircle2 },
      { title: "Sudah check-out", value: checkout, icon: Clock3 },
      { title: "Branch terlibat", value: branchesCount, icon: Building2 },
    ];
  }, [attendance]);

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
    };
    setFilters(reset);
    loadData(reset);
  }

  const columns = useMemo(
    () => [
      {
        key: "attendanceDate",
        label: "Tanggal",
        render: (item) => (
          <div>
            <p className="font-semibold text-[var(--color-text)]">{formatDateOnly(item.attendanceDate)}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDateTime(item.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "branch",
        label: "Branch",
        render: (item) => (
          <div>
            <p className="font-medium text-[var(--color-text)]">{item.branch?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{item.branch?.code || "-"}</p>
          </div>
        ),
      },
      {
        key: "user",
        label: "Crew",
        render: (item) => (
          <div>
            <p className="font-semibold text-[var(--color-text)]">{item.user?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{item.user?.email || "-"}</p>
          </div>
        ),
      },
      {
        key: "checkInAt",
        label: "Masuk",
        render: (item) => <span className="text-sm text-[var(--color-muted)]">{formatDateTime(item.checkInAt)}</span>,
      },
      {
        key: "checkOutAt",
        label: "Keluar",
        render: (item) => <span className="text-sm text-[var(--color-muted)]">{formatDateTime(item.checkOutAt)}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (item) => (
          <Badge tone={item.checkInAt ? "success" : "danger"}>{item.checkInAt ? "PRESENT" : "ABSENT"}</Badge>
        ),
      },
      {
        key: "notes",
        label: "Catatan",
        render: (item) => <span className="text-sm text-[var(--color-muted)]">{item.notes || "-"}</span>,
      },
    ],
    []
  );

  return (
    <ErpShell title="Attendance" description="Absensi crew dan status shift per branch.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Attendance</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Lihat absensi crew, waktu check-in/check-out, dan status harian untuk audit operasional branch.
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
          title="Filter attendance"
          description="Gunakan periode, branch, crew, dan status untuk mencari absensi yang dibutuhkan."
        />

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
            <span className="font-medium">Crew</span>
            <select className="kr-input" value={filters.userId} onChange={(event) => updateFilter("userId", event.target.value)}>
              <option value="ALL">Semua crew</option>
              {crewUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Status</span>
            <select className="kr-input" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="ALL">Semua status</option>
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3 lg:col-span-5">
            <Button type="submit">Terapkan</Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>

        <div className="mt-5">
          <ManagementTable
            columns={columns}
            rows={attendance}
            emptyText="Tidak ada data attendance pada periode ini."
            resetKey={`${filters.startDate}-${filters.endDate}-${filters.branchId}-${filters.userId}-${filters.status}-${attendance.length}`}
            maxHeightClass="max-h-[34rem]"
            stickyHeader
          />
        </div>
      </Card>
    </ErpShell>
  );
}
