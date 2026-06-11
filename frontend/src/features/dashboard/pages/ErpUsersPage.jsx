import { Building2, Lock, PlusCircle, RefreshCw, ShieldCheck, Trash2, User2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import { getStoredUser } from "../../../core/auth/session";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { userApi } from "../services/userApi";

function initialForm() {
  return {
    id: "",
    username: "",
    nickname: "",
    name: "",
    email: "",
    password: "",
    role: "CREW",
    branchId: "",
    isActive: true,
  };
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function isOwnerRow(user) {
  return user?.role === "OWNER";
}

function UserFormModal({ open, value, branches, saving, onChange, onClose, onSubmit, isEdit, canAssignOwner }) {
  return (
    <Modal
      open={open}
      title={isEdit ? "Edit user" : "Tambah user"}
      onClose={onClose}
      size="xl"
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <Input
          label="Username"
          value={value.username}
          onChange={(event) => onChange({ ...value, username: event.target.value.toLowerCase().replace(/\s+/g, "") })}
          placeholder="Contoh: andi"
          hint="Dipakai untuk login ERP dan crew."
        />
        <Input
          label="Nickname"
          value={value.nickname}
          onChange={(event) => onChange({ ...value, nickname: event.target.value })}
          placeholder="Contoh: Andi"
          hint="Nama panggilan / display singkat."
        />
        <Input
          label="Full name"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Contoh: Andi Pratama"
        />
        <Input
          label="Email"
          value={value.email}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
          placeholder="Contoh: andi@kruncuy.id"
        />
        <Input
          label={isEdit ? "Password baru" : "Password"}
          type="password"
          value={value.password}
          onChange={(event) => onChange({ ...value, password: event.target.value })}
          placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
          hint={isEdit ? "Kosongkan jika tidak ingin mengganti password." : "Password akan dipakai saat login."}
        />
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Role</span>
          <select
            className="kr-input"
            value={value.role}
            onChange={(event) => onChange({ ...value, role: event.target.value })}
          >
            <option value="CREW">CREW</option>
            <option value="PURCHASING">PURCHASING</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERADMIN" disabled={!canAssignOwner}>
              SUPERADMIN
            </option>
            <option value="OWNER" disabled={!canAssignOwner}>
              OWNER
            </option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Branch</span>
          <select
            className="kr-input"
            value={value.branchId || ""}
            onChange={(event) => onChange({ ...value, branchId: event.target.value })}
          >
            <option value="">Tanpa branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Status aktif</span>
          <select
            className="kr-input"
            value={value.isActive ? "true" : "false"}
            onChange={(event) => onChange({ ...value, isActive: event.target.value === "true" })}
          >
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </label>
        <div className="md:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
          Username dipakai untuk login. Full name dipakai sebagai identitas utama, sedangkan nickname dipakai untuk tampilan singkat di POS dan laporan.
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : isEdit ? "Update user" : "Simpan user"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ open, user, saving, onClose, onConfirm }) {
  if (!open || !user) return null;

  return (
    <Modal open={open} title="Hapus user" onClose={onClose} size="md">
      <div className="grid gap-4">
        <p className="text-sm leading-7 text-[var(--color-muted)]">
          Yakin ingin menghapus user <span className="font-semibold text-[var(--color-text)]">{user.name}</span>?
        </p>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-6 text-red-700">
          Aksi ini tidak bisa dibatalkan. User owner tetap terkunci dan tidak bisa dihapus.
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" onClick={onConfirm} disabled={saving}>
            {saving ? "Menghapus..." : "Hapus user"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ErpUsersPage() {
  const currentUser = getStoredUser();
  const canAssignOwner = currentUser?.role === "SUPERADMIN";

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState(initialForm());
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, branchesResponse] = await Promise.all([
        userApi.getUsers(),
        branchApi.getBranches(),
      ]);

      setUsers(usersResponse.data.data || []);
      setBranches(branchesResponse.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat daftar user.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const active = users.filter((user) => user.isActive).length;
    const crew = users.filter((user) => user.role === "CREW").length;
    const branchAssigned = users.filter((user) => user.branchId).length;
    return [
      { title: "Total user", value: users.length, icon: User2 },
      { title: "User aktif", value: active, icon: ShieldCheck },
      { title: "Crew aktif", value: crew, icon: Users },
      { title: "Terkait branch", value: branchAssigned, icon: Building2 },
    ];
  }, [users]);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !keyword ||
        [user.username, user.nickname, user.name, user.email, user.role, user.branch?.name, user.branch?.code]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesBranch =
        branchFilter === "ALL" || user.branchId === branchFilter || user.branch?.id === branchFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? user.isActive : !user.isActive);

      return matchesQuery && matchesRole && matchesBranch && matchesStatus;
    });
  }, [branchFilter, query, roleFilter, statusFilter, users]);

  const roleOptions = useMemo(() => {
    const unique = new Set(users.map((user) => user.role).filter(Boolean));
    return Array.from(unique).sort();
  }, [users]);

  function openCreateModal() {
    setForm(initialForm());
    setFormOpen(true);
  }

  function openEditModal(user) {
    setForm({
      id: user.id,
      username: user.username || "",
      nickname: user.nickname || "",
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "CREW",
      branchId: user.branchId || "",
      isActive: user.isActive ?? true,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setForm(initialForm());
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        username: form.username.trim(),
        nickname: form.nickname.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        branchId: form.branchId || null,
        isActive: form.isActive,
      };

      if (!payload.username || !payload.name || !payload.email) {
        throw new Error("Username, full name, dan email wajib diisi");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        throw new Error("Format email tidak valid");
      }

      if (!form.id && !form.password.trim()) {
        throw new Error("Password wajib diisi untuk user baru");
      }

      if ((!form.id || form.password.trim()) && form.password.trim().length < 6) {
        throw new Error("Password minimal 6 karakter");
      }

      if (!form.id || form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (form.id) {
        await userApi.updateUser(form.id, payload);
      } else {
        await userApi.createUser(payload);
      }

      await loadData();
      closeForm();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");

    try {
      await userApi.deleteUser(deleteTarget.id);
      await loadData();
      setDeleteTarget(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menghapus user.");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "username",
        label: "Username",
        render: (user) => <span className="font-semibold text-[var(--color-text)]">{user.username || "-"}</span>,
      },
      {
        key: "nickname",
        label: "Nickname",
        render: (user) => <span className="font-medium text-[var(--color-text)]">{user.nickname || "-"}</span>,
      },
      {
        key: "name",
        label: "Full name",
        render: (user) => <span className="font-medium text-[var(--color-text)]">{user.name || "-"}</span>,
      },
      {
        key: "role",
        label: "Role",
        render: (user) => <Badge tone={user.role === "CREW" ? "info" : "neutral"}>{user.role}</Badge>,
      },
      {
        key: "branch",
        label: "Branch",
        render: (user) => (
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-text)]">{user.branch?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{user.branch?.code || "-"}</p>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (user) => (
          <Badge tone={user.isActive ? "success" : "danger"}>{user.isActive ? "Aktif" : "Nonaktif"}</Badge>
        ),
      },
      {
        key: "email",
        label: "Email",
        render: (user) => <span className="text-sm text-[var(--color-muted)]">{user.email || "-"}</span>,
      },
      {
        key: "createdAt",
        label: "Dibuat",
        render: (user) => <span className="text-sm text-[var(--color-muted)]">{formatDate(user.createdAt)}</span>,
      },
      {
        key: "actions",
        label: "Aksi",
        render: (user) => {
      const locked = isOwnerRow(user);

          return (
            <div className="flex flex-wrap gap-2">
              {locked ? (
                <Badge tone="warning">
                  <Lock size={12} className="mr-1" />
                  Terkunci
                </Badge>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(user)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(user)}>
                    <Trash2 size={14} />
                    Hapus
                  </Button>
                </>
              )}
            </div>
          );
        },
        cellClassName: "min-w-[180px]",
      },
    ],
    []
  );

  return (
    <ErpShell title="Users" description="Kelola user ERP dan crew dari database.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Users</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Daftar username, nickname, full name, role, dan penempatan branch yang dipakai untuk login ERP maupun crew.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <PlusCircle size={16} />
            Tambah user
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
        <SectionHeader
          title="Daftar user"
          description="Cari berdasarkan username, nickname, full name, email, role, branch, atau status aktif. Data ini langsung dibaca dari database."
        />

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <Input label="Cari user" placeholder="Username, nickname, full name, email" value={query} onChange={(e) => setQuery(e.target.value)} />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Filter role</span>
            <select className="kr-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="ALL">Semua role</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Filter branch</span>
            <select className="kr-input" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="ALL">Semua branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Filter status</span>
            <select className="kr-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Semua status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </label>
        </div>

        <div className="mt-5">
          <ManagementTable
            columns={columns}
            rows={filteredUsers}
            emptyText="Tidak ada user yang cocok dengan filter."
            resetKey={`${query}-${roleFilter}-${branchFilter}-${statusFilter}-${users.length}`}
            maxHeightClass="max-h-[32rem]"
            stickyHeader
          />
        </div>
      </Card>

      <UserFormModal
        open={formOpen}
        value={form}
        branches={branches}
        saving={saving}
        onChange={setForm}
        onClose={closeForm}
        onSubmit={handleSubmit}
        isEdit={!!form.id}
        canAssignOwner={canAssignOwner}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        user={deleteTarget}
        saving={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </ErpShell>
  );
}
