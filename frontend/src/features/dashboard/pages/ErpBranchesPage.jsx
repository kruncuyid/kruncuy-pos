import { Building2, CheckCircle2, MapPin, PlusCircle, RefreshCw, Trash2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import MapPicker from "../../../components/ui/MapPicker";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";

function initialForm() {
  return {
    id: "",
    name: "",
    code: "",
    address: "",
    lat: "",
    lng: "",
    isActive: true,
  };
}

function BranchForm({ value, onChange, onSubmit, onCancel, saving }) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div>
        <Input
          label="Nama branch"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Contoh: KRUNCUY Gondokusuman"
        />
      </div>
      <div>
        <Input
          label="Kode branch"
          value={value.code}
          onChange={(event) => onChange({ ...value, code: event.target.value.toUpperCase() })}
          placeholder="Contoh: GONDOKUSUMAN"
          hint="Kode unik dan dipakai untuk referensi sistem."
        />
      </div>
      <div className="md:col-span-2">
        <Input
          label="Alamat"
          value={value.address}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
          placeholder="Alamat branch"
        />
      </div>
      <div className="md:col-span-2 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Latitude" type="number" step="any" value={value.lat} onChange={(e) => onChange({ ...value, lat: e.target.value })} placeholder="-7.8018" hint="Atau geser pin di peta" />
          <Input label="Longitude" type="number" step="any" value={value.lng} onChange={(e) => onChange({ ...value, lng: e.target.value })} placeholder="110.3647" />
        </div>
        <MapPicker
          lat={Number(value.lat) || -7.8018}
          lng={Number(value.lng) || 110.3647}
          onCoordsChange={(newLat, newLng) => {
            onChange({ ...value, lat: String(newLat), lng: String(newLng) });
          }}
          label="Geser pin untuk menentukan lokasi outlet" />
      </div>
      <div>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Status aktif</span>
          <select
            className="kr-input"
            value={value.isActive ? "true" : "false"}
            onChange={(event) => onChange({ ...value, isActive: event.target.value === "true" })}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </div>
      <div className="md:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
        Data tersimpan langsung ke database dan dipakai oleh dashboard / role access.
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          <PlusCircle size={16} />
          {saving ? "Menyimpan..." : value.id ? "Update branch" : "Simpan branch"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export default function ErpBranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm());

  async function loadBranches() {
    setLoading(true);
    setError("");

    try {
      const response = await branchApi.getBranches();
      setBranches(response.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat daftar branch.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  const metrics = useMemo(() => {
    const active = branches.filter((branch) => branch.isActive).length;
    const inactive = branches.length - active;
    return [
      { title: "Total branch", value: branches.length, icon: Building2 },
      { title: "Branch aktif", value: active, icon: CheckCircle2 },
      { title: "Branch nonaktif", value: inactive, icon: XCircle },
    ];
  }, [branches]);

  const filteredBranches = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return branches.filter((branch) => {
      const matchesQuery =
        !keyword ||
        [branch.name, branch.code, branch.address]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? branch.isActive : !branch.isActive);

      return matchesQuery && matchesStatus;
    });
  }, [branches, query, statusFilter]);

  function resetForm() {
    setForm(initialForm());
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function handleEdit(branch) {
    setForm({
      id: branch.id,
      name: branch.name || "",
      code: branch.code || "",
      address: branch.address || "",
        lat: branch.lat || "",
        lng: branch.lng || "",
      isActive: branch.isActive ?? true,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim(),
        lat: Number(form.lat) || undefined,
        lng: Number(form.lng) || undefined,
        isActive: form.isActive,
      };

      if (!payload.name || !payload.code) {
        throw new Error("Nama dan kode branch wajib diisi");
      }

      if (form.lat && form.lng) {
        const lat = Number(form.lat);
        const lng = Number(form.lng);
        if (isNaN(lat) || lat < -90 || lat > 90) throw new Error("Latitude tidak valid (rentang -90 s/d 90)");
        if (isNaN(lng) || lng < -180 || lng > 180) throw new Error("Longitude tidak valid (rentang -180 s/d 180)");
        payload.lat = lat;
        payload.lng = lng;
      } else if (form.lat || form.lng) {
        throw new Error("Latitude dan longitude harus diisi keduanya");
      }

      if (form.id) {
        await branchApi.updateBranch(form.id, payload);
      } else {
        await branchApi.createBranch(payload);
      }

      await loadBranches();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan branch.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(branch) {
    const confirmed = window.confirm(`Nonaktifkan branch ${branch.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await branchApi.deleteBranch(branch.id);
      await loadBranches();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menonaktifkan branch.");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Branch",
        render: (branch) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{branch.name}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{branch.code}</p>
          </div>
        ),
      },
      {
        key: "address",
        label: "Address",
        render: (branch) => <span className="text-sm text-[var(--color-muted)]">{branch.address || "-"}</span>,
      },
      {
        key: "createdAt",
        label: "Created",
        render: (branch) => (
          <span className="font-medium">{new Date(branch.createdAt).toLocaleDateString("id-ID")}</span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (branch) => (
          <Badge tone={branch.isActive ? "success" : "danger"}>{branch.isActive ? "Active" : "Inactive"}</Badge>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (branch) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleEdit(branch)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDeactivate(branch)} disabled={!branch.isActive}>
              <Trash2 size={14} />
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
    <ErpShell title="Branch management" description="Kelola cabang langsung dari database.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Branch management</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Kelola cabang langsung dari database. Perubahan ini dipakai oleh dashboard, branch access, dan reporting.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadBranches}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <PlusCircle size={16} />
            Tambah branch
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return <StatCard key={metric.title} title={metric.title} value={loading ? "-" : metric.value} icon={<Icon size={18} />} />;
        })}
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-6">
        <Card className="p-5">
          <SectionHeader
            title="Daftar branch"
            description="Branch yang terdaftar di database. Edit untuk memperbarui detail, atau nonaktifkan bila branch tidak dipakai."
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              label="Search branch"
              icon={<MapPin size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama / kode / alamat"
            />
            <label className="grid gap-2 text-sm text-[var(--color-text)]">
              <span className="font-medium">Filter status</span>
              <select className="kr-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">All status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
              Memuat branch...
            </div>
          ) : filteredBranches.length ? (
            <div className="mt-5">
              <ManagementTable
                columns={columns}
                rows={filteredBranches}
                emptyText="Tambahkan branch pertama untuk mulai mengelola outlet."
                resetKey={`${query}-${statusFilter}-${filteredBranches.length}`}
                maxHeightClass="max-h-[38rem]"
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Belum ada branch"
                description="Tambahkan branch pertama untuk mulai mengelola outlet."
                actionLabel="Buat branch"
                onAction={openCreateModal}
              />
            </div>
          )}
        </Card>
      </section>

      <Modal open={isModalOpen} title={form.id ? "Edit branch" : "Tambah branch"} onClose={closeModal} size="xl">
        <BranchForm value={form} onChange={setForm} onSubmit={handleSubmit} onCancel={closeModal} saving={saving} />
      </Modal>
    </ErpShell>
  );
}
