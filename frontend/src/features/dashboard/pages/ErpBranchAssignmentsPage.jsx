import { CalendarClock, MapPin, PencilLine, PlusCircle, RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { branchAssignmentApi } from "../services/branchAssignmentApi";
import { userApi } from "../services/userApi";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialForm() {
  return {
    userId: "",
    branchId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    isActive: true,
    isPrimary: false,
  };
}

function AssignmentFormBody({ value, onChange, onSubmit, onReset, saving, users, branches }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
        Tugaskan crew ke branch untuk rentang tanggal tertentu.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-muted mb-1">Crew</p>
          <select className="kr-input h-11 text-sm" value={value.userId}
            onChange={e => onChange({ ...value, userId: e.target.value })}>
            <option value="">— Pilih crew —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted mb-1">Tempat Tugas</p>
          <select className="kr-input h-11 text-sm" value={value.branchId}
            onChange={e => onChange({ ...value, branchId: e.target.value })}>
            <option value="">— Pilih branch —</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-muted mb-1">Mulai</p>
          <input type="date" className="kr-input h-11 text-sm" value={value.startDate}
            onChange={e => onChange({ ...value, startDate: e.target.value })} />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted mb-1">Selesai</p>
          <input type="date" className="kr-input h-11 text-sm" value={value.endDate}
            onChange={e => onChange({ ...value, endDate: e.target.value })}
            placeholder="Kosongkan jika permanen" />
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <Button type="submit" disabled={saving} size="sm">
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onReset}>Reset</Button>
      </div>
    </form>
  );
}

export default function ErpBranchAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState(initialForm());
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [assignmentResponse, branchResponse, userResponse] = await Promise.all([
        branchAssignmentApi.getAssignments(),
        branchApi.getBranches(),
        userApi.getUsers(),
      ]);

      setAssignments(assignmentResponse.data?.data || []);
      setBranches((branchResponse.data?.data || []).filter((branch) => branch.isActive !== false));
      setUsers((userResponse.data?.data || []).filter((user) => user.isActive !== false));
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data assignment branch.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const active = assignments.filter((item) => item.isActive).length;
    const primary = assignments.filter((item) => item.isPrimary).length;
    const usersAssigned = new Set(assignments.map((item) => item.userId)).size;
    const branchesCovered = new Set(assignments.map((item) => item.branchId)).size;

    return [
      { title: "Total assignment", value: assignments.length, icon: PencilLine },
      { title: "Aktif", value: active, icon: ShieldCheck },
      { title: "Crew terpetakan", value: usersAssigned, icon: UserRound },
      { title: "Branch terpakai", value: branchesCovered, icon: MapPin },
    ];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return assignments.filter((item) => {
      const matchesBranch = !branchFilter || item.branchId === branchFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && item.isActive) ||
        (statusFilter === "INACTIVE" && !item.isActive);
      const matchesQuery =
        !keyword ||
        [item.user?.name, item.user?.email, item.branch?.name, item.branch?.code]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      return matchesBranch && matchesStatus && matchesQuery;
    });
  }, [assignments, branchFilter, query, statusFilter]);

  function resetForm() {
    setForm(initialForm());
  }

  function openCreate() {
    setForm(initialForm());
    setIsModalOpen(true);
  }

  function openEdit(assignment) {
    setForm({
      userId: assignment.userId,
      branchId: assignment.branchId,
      startDate: assignment.startDate ? new Date(assignment.startDate).toISOString().slice(0, 10) : "",
      endDate: assignment.endDate ? new Date(assignment.endDate).toISOString().slice(0, 10) : "",
      isActive: assignment.isActive ?? true,
      isPrimary: assignment.isPrimary ?? false,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!form.userId || !form.branchId) {
        throw new Error("Crew dan branch wajib dipilih");
      }

      await branchAssignmentApi.createAssignment({
        userId: form.userId,
        branchId: form.branchId,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isActive: form.isActive,
        isPrimary: form.isPrimary,
      });

      await loadData();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(assignment) {
    const confirmed = window.confirm(`Nonaktifkan assignment ${assignment.user?.name} di ${assignment.branch?.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await branchAssignmentApi.deactivateAssignment(assignment.id);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menonaktifkan assignment.");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "Crew",
        render: (assignment) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{assignment.user?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{assignment.user?.email || "-"}</p>
          </div>
        ),
      },
      {
        key: "branch",
        label: "Branch",
        render: (assignment) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{assignment.branch?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{assignment.branch?.code || "-"}</p>
          </div>
        ),
      },
      {
        key: "period",
        label: "Periode",
        render: (assignment) => (
          <div className="grid gap-1 text-sm">
            <span>
              <span className="text-[var(--color-muted)]">Mulai:</span> {formatDate(assignment.startDate)}
            </span>
            <span>
              <span className="text-[var(--color-muted)]">Selesai:</span> {formatDate(assignment.endDate)}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (assignment) => (
          <Badge tone={assignment.isActive ? "success" : "danger"}>{assignment.isActive ? "Bertugas" : "Selesai"}</Badge>
        ),
      },
      {
        key: "updatedAt",
        label: "Update",
        render: (assignment) => <span className="text-sm font-medium">{formatDateTime(assignment.updatedAt)}</span>,
      },
      {
        key: "actions",
        label: "Aksi",
        render: (assignment) => (
          <div className="flex flex-wrap justify-end gap-1">
            <Button variant="secondary" size="sm" onClick={() => openEdit(assignment)}>
              <PencilLine size={14} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDeactivate(assignment)} disabled={!assignment.isActive}>
              Nonaktifkan
            </Button>
          </div>
        ),
        cellClassName: "min-w-[220px]",
      },
    ],
    []
  );

  return (
    <ErpShell title="Branch Assignments" description="Kelola penempatan crew ke branch operasional.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Branch Assignments</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Atur crew mana yang ditempatkan di branch tertentu beserta riwayat penempatannya.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle size={16} />
            Tambah assignment
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <StatCard
              key={metric.title}
              title={metric.title}
              value={loading ? "-" : metric.value}
              icon={<Icon size={18} />}
            />
          );
        })}
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">Filter data</p>
            <h3 className="mt-1 text-xl font-black tracking-tight">Cari penempatan crew</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Saring berdasarkan branch, status, atau nama crew.</p>
          </div>

          <div className="grid gap-3">
            <Input
              label="Cari crew / branch"
              icon={<Search size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama crew, email, atau branch"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[var(--color-text)]">
                <span className="font-medium">Filter branch</span>
                <select className="kr-input" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
                  <option value="">Semua branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[var(--color-text)]">
                <span className="font-medium">Filter status</span>
                <select className="kr-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="ALL">Semua status</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeader
          title="Daftar assignment"
          description="Crew yang ditempatkan ke branch tertentu beserta status penempatannya."
        />

        {loading ? (
          <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
            Memuat assignment branch...
          </div>
        ) : filteredAssignments.length ? (
          <div className="mt-5">
            <ManagementTable
              columns={columns}
              rows={filteredAssignments}
              emptyText="Belum ada assignment branch."
              resetKey={`${query}-${branchFilter}-${statusFilter}-${filteredAssignments.length}`}
              maxHeightClass="max-h-[40rem]"
            />
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Belum ada assignment yang cocok"
              description="Coba ubah filter atau tambahkan assignment baru."
            />
          </div>
        )}
      </Card>

      <Modal
        open={isModalOpen}
        title="Tambah assignment crew"
        onClose={closeModal}
        size="2xl"
      >
        <AssignmentFormBody
          value={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onReset={closeModal}
          saving={saving}
          users={users}
          branches={branches}
        />
      </Modal>
    </ErpShell>
  );
}
