import { PencilLine, PlusCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { productCategoryApi } from "../services/productCategoryApi";

function initialForm() {
  return {
    id: "",
    name: "",
    code: "",
    description: "",
    sortOrder: "0",
    isActive: true,
  };
}

function CategoryFormBody({ value, onChange, onSubmit, onReset, saving }) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div>
        <Input
          label="Nama kategori"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Contoh: Gorengan"
        />
      </div>
      <div>
        <Input
          label="Kode kategori"
          value={value.code}
          onChange={(event) => onChange({ ...value, code: event.target.value.toUpperCase() })}
          placeholder="Contoh: GORENGAN"
          hint="Kode unik untuk identifikasi kategori."
        />
      </div>
      <div>
        <Input
          label="Urutan tampil"
          type="number"
          value={value.sortOrder}
          onChange={(event) => onChange({ ...value, sortOrder: event.target.value })}
          placeholder="0"
        />
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
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
      <div className="md:col-span-2">
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Deskripsi</span>
          <textarea
            className="kr-input min-h-[110px] resize-y"
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
            placeholder="Catatan singkat tentang kategori."
          />
        </label>
      </div>
      <div className="md:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
        Kategori dipakai untuk grouping menu, filter product, dan tampilan POS.
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          <PlusCircle size={16} />
          {saving ? "Menyimpan..." : value.id ? "Update kategori" : "Simpan kategori"}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export default function ErpProductCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(initialForm());
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const response = await productCategoryApi.getProductCategories();
      setCategories(response.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat kategori menu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const metrics = useMemo(() => {
    const active = categories.filter((category) => category.isActive).length;
    return [
      { title: "Total kategori", value: categories.length },
      { title: "Kategori aktif", value: active },
      { title: "Kategori nonaktif", value: categories.length - active },
    ];
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return categories.filter((category) => {
      return (
        !keyword ||
        [category.name, category.code, category.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
      );
    });
  }, [categories, query]);

  function resetForm() {
    setForm(initialForm());
  }

  function openCreateModal() {
    setForm(initialForm());
    setIsModalOpen(true);
  }

  function handleEdit(category) {
    setForm({
      id: category.id,
      name: category.name || "",
      code: category.code || "",
      description: category.description || "",
      sortOrder: category.sortOrder !== undefined ? String(category.sortOrder) : "0",
      isActive: category.isActive ?? true,
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
        description: form.description.trim(),
        sortOrder: Number(form.sortOrder || 0),
        isActive: form.isActive,
      };

      if (!payload.name || !payload.code) {
        throw new Error("Nama dan kode kategori wajib diisi");
      }

      if (form.id) {
        await productCategoryApi.updateProductCategory(form.id, payload);
      } else {
        await productCategoryApi.createProductCategory(payload);
      }

      await loadCategories();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(category) {
    const confirmed = window.confirm(`Nonaktifkan kategori ${category.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await productCategoryApi.updateProductCategory(category.id, {
        name: category.name,
        code: category.code,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: false,
      });
      await loadCategories();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menonaktifkan kategori.");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Kategori",
        render: (category) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{category.name}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{category.code}</p>
          </div>
        ),
      },
      {
        key: "description",
        label: "Description",
        render: (category) => <span className="text-sm text-[var(--color-muted)]">{category.description || "-"}</span>,
      },
      {
        key: "sortOrder",
        label: "Order",
        render: (category) => <span className="font-medium">{category.sortOrder ?? 0}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (category) => (
          <Badge tone={category.isActive ? "success" : "danger"}>{category.isActive ? "Active" : "Inactive"}</Badge>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (category) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleEdit(category)}>
              <PencilLine size={14} />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDeactivate(category)} disabled={!category.isActive}>
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
    <ErpShell title="Product Categories" description="Kelola kategori menu untuk grouping produk dan filter POS.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Product Categories</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Kategori dipakai untuk grouping menu agar pengaturan produk dan POS lebih rapi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadCategories} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <PlusCircle size={16} />
            Tambah kategori
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <StatCard key={metric.title} title={metric.title} value={loading ? "-" : metric.value} />
        ))}
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-6">
        <Card className="p-5">
          <SectionHeader
            title="Daftar kategori"
            description="Edit kategori menu, ubah urutan tampil, atau nonaktifkan bila tidak dipakai."
          />

          <div className="mt-4">
            <Input
              label="Search kategori"
              icon={<Search size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama / kode / deskripsi"
            />
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
              Memuat kategori...
            </div>
          ) : filteredCategories.length ? (
            <div className="mt-5">
              <ManagementTable
                columns={columns}
                rows={filteredCategories}
                emptyText="Tambahkan kategori dari tombol di atas."
                resetKey={`${query}-${filteredCategories.length}`}
                maxHeightClass="max-h-[38rem]"
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Belum ada kategori"
                description="Tambahkan kategori menu untuk mengelompokkan produk."
              />
            </div>
          )}
        </Card>
      </section>

      <Modal open={isModalOpen} title={form.id ? "Edit kategori" : "Tambah kategori"} onClose={closeModal} size="xl">
        <div className="mb-4 text-sm text-[var(--color-muted)]">Atur kategori menu agar produk lebih mudah dikelola.</div>
        <CategoryFormBody
          value={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onReset={closeModal}
          saving={saving}
        />
      </Modal>
    </ErpShell>
  );
}
