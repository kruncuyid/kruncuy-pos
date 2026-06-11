import { PencilLine, PlusCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { productApi } from "../services/productApi";
import { formatCurrency, formatNumber } from '../utils/reportFormatters';
import { productCategoryApi } from "../services/productCategoryApi";

function initialForm() {
  return {
    id: "",
    name: "",
    code: "",
    categoryId: "",
    price: "",
    pcs: "",
    imageUrl: "",
    isActive: true,
  };
}

function ProductFormBody({ value, categories, onChange, onSubmit, onReset, saving }) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="md:col-span-1">
        <Input
          label="Nama menu"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Contoh: Tahu Walik 5K"
        />
      </div>
      <div className="md:col-span-1">
        <Input
          label="Kode menu"
          value={value.code}
          onChange={(event) => onChange({ ...value, code: event.target.value.toUpperCase() })}
          placeholder="Contoh: TAHU-WALIK-5K"
          hint="Kode unik untuk identifikasi produk."
        />
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Kategori</span>
          <select
            className="kr-input"
            value={value.categoryId}
            onChange={(event) => onChange({ ...value, categoryId: event.target.value })}
          >
            <option value="">Pilih kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <Input
          label="Harga jual"
          type="number"
          value={value.price}
          onChange={(event) => onChange({ ...value, price: event.target.value })}
          placeholder="5000"
        />
      </div>
      <div>
        <Input
          label="PCS per item"
          type="number"
          value={value.pcs}
          onChange={(event) => onChange({ ...value, pcs: event.target.value })}
          placeholder="6"
          hint="Jumlah isi paket per 1 item menu."
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

      <div className="md:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
        Menu ini akan dipakai oleh POS, branch pricing, report, dan recipe.
      </div>

      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          <PlusCircle size={16} />
          {saving ? "Menyimpan..." : value.id ? "Update menu" : "Simpan menu"}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export default function ErpProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [form, setForm] = useState(initialForm());
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        productApi.getProducts(),
        productCategoryApi.getProductCategories(),
      ]);

      setProducts(productsResponse.data?.data || []);
      setCategories(categoriesResponse.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data menu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const active = products.filter((product) => product.isActive).length;
    const inactive = products.length - active;
    return [
      { title: "Total menu", value: products.length },
      { title: "Menu aktif", value: active },
      { title: "Menu nonaktif", value: inactive },
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !keyword ||
        [product.name, product.code, product.category?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesCategory = categoryFilter === "ALL" || product.categoryId === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, categoryFilter]);

  function resetForm() {
    setForm(initialForm());
  }

  function openCreateModal() {
    setForm(initialForm());
    setIsModalOpen(true);
  }

  function handleEdit(product) {
    setForm({
      id: product.id,
      name: product.name || "",
      code: product.code || "",
      categoryId: product.categoryId || "",
      price: product.price !== undefined ? String(product.price) : "",
      pcs: product.pcs !== undefined ? String(product.pcs) : "",
      isActive: product.isActive ?? true,
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
        categoryId: form.categoryId,
        price: Number(form.price || 0),
        pcs: Number(form.pcs || 0),
        isActive: form.isActive,
      };

      if (!payload.name || !payload.code || !payload.categoryId) {
        throw new Error("Nama, kode, dan kategori menu wajib diisi");
      }

      if (!payload.price || payload.price <= 0) {
        throw new Error("Harga jual harus lebih dari 0");
      }

      if (!payload.pcs || payload.pcs <= 0) {
        throw new Error("Jumlah PCS harus lebih dari 0");
      }

      if (form.id) {
        await productApi.updateProduct(form.id, payload);
      } else {
        await productApi.createProduct(payload);
      }

      await loadData();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan menu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Nonaktifkan menu ${product.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await productApi.deleteProduct(product.id);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menonaktifkan menu.");
    } finally {
      setSaving(false);
    }
  }

  const productColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Menu",
        render: (product) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{product.name}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{product.code}</p>
          </div>
        ),
      },
      {
        key: "category",
        label: "Category",
        render: (product) => <span className="font-medium">{product.category?.name || "-"}</span>,
      },
      {
        key: "price",
        label: "Price",
        render: (product) => <span className="font-medium">{formatCurrency(product.price)}</span>,
      },
      {
        key: "pcs",
        label: "PCS / item",
        render: (product) => <span className="font-medium">{product.pcs}</span>,
        className: "whitespace-nowrap",
      },
      {
        key: "status",
        label: "Status",
        render: (product) => (
          <Badge tone={product.isActive ? "success" : "danger"}>{product.isActive ? "Active" : "Inactive"}</Badge>
        ),
        className: "w-[120px]",
      },
      {
        key: "actions",
        label: "Actions",
        render: (product) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleEdit(product)}>
              <PencilLine size={14} />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(product)} disabled={!product.isActive}>
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
    <ErpShell title="Products" description="Edit menu yang akan dijual, harga dasar, kategori, dan isi paket.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Products</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Semua perubahan disimpan ke database dan dipakai oleh POS, branch pricing, report, dan recipe.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <PlusCircle size={16} />
            Tambah menu
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
            title="Daftar menu"
            description="Edit menu yang akan dijual, ubah harga, atau nonaktifkan bila menu tidak dipakai."
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              label="Search menu"
              icon={<Search size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama / kode menu"
            />
            <label className="grid gap-2 text-sm text-[var(--color-text)]">
              <span className="font-medium">Filter kategori</span>
              <select className="kr-input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="ALL">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
              Memuat menu...
            </div>
          ) : filteredProducts.length ? (
            <div className="mt-5">
              <ManagementTable
                columns={productColumns}
                rows={filteredProducts}
                emptyText="Coba ubah keyword atau kategori, atau tambahkan menu baru dari tombol di atas."
                resetKey={`${query}-${categoryFilter}-${filteredProducts.length}`}
                maxHeightClass="max-h-[38rem]"
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Belum ada menu"
                description="Coba ubah keyword atau kategori, atau tambahkan menu baru dari tombol di atas."
              />
            </div>
          )}
        </Card>
      </section>

      <Modal
        open={isModalOpen}
        title={form.id ? "Edit menu" : "Tambah menu"}
        onClose={closeModal}
        size="xl"
      >
        <div className="mb-4 text-sm text-[var(--color-muted)]">
          Atur menu yang akan dijual, harga dasar, kategori, dan isi paket PCS.
        </div>
        <ProductFormBody
          value={form}
          categories={categories}
          onChange={setForm}
          onSubmit={handleSubmit}
          onReset={closeModal}
          saving={saving}
        />
      </Modal>
    </ErpShell>
  );
}
