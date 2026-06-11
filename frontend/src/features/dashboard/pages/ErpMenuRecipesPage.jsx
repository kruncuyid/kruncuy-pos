import { BookOpenText, ChevronRight, PencilLine, PlusCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { inventoryApi } from "../services/inventoryApi";
import { productApi } from "../services/productApi";

function formatNumber(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return "-";
  return number.toLocaleString("id-ID");
}

function formatDecimal(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return "0";
  if (Number.isInteger(number)) return String(number);
  return number.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

function initialForm() {
  return {
    id: "",
    productId: "",
    version: "1",
    yieldQty: "1",
    notes: "",
    isActive: true,
    items: [
      {
        itemType: "inventory",
        inventoryItemId: "",
        subRecipeId: "",
        qtyPerUnit: "",
        notes: "",
      },
    ],
  };
}

function normalizeItems(items = []) {
  return items.length
    ? items.map((item) => ({
        itemType: item.subRecipeId ? "subrecipe" : "inventory",
        inventoryItemId: item.inventoryItemId || "",
        subRecipeId: item.subRecipeId || "",
        qtyPerUnit: item.qtyPerUnit !== undefined && item.qtyPerUnit !== null ? String(item.qtyPerUnit) : "",
        notes: item.notes || "",
      }))
    : [{ itemType: "inventory", inventoryItemId: "", subRecipeId: "", qtyPerUnit: "", notes: "" }];
}

function RecipeFormBody({ value, onChange, onSubmit, onReset, saving, products, inventoryItems }) {
  const selectedProduct = products.find((product) => product.id === value.productId);

  function updateRow(index, patch) {
    const nextItems = value.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onChange({ ...value, items: nextItems });
  }

  function addRow() {
    onChange({
      ...value,
      items: [...value.items, { inventoryItemId: "", qtyPerUnit: "", notes: "" }],
    });
  }

  function removeRow(index) {
    const nextItems = value.items.filter((_, itemIndex) => itemIndex !== index);
    onChange({
      ...value,
      items: nextItems.length ? nextItems : [{ inventoryItemId: "", qtyPerUnit: "", notes: "" }],
    });
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="md:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-muted)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-[var(--color-text)]">Menu resep</span>
          <span>{selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : "Pilih menu"}</span>
        </div>
        <div className="mt-1 text-xs">Resep ini dipakai POS untuk memotong raw material saat transaksi selesai.</div>
      </div>

      <div className="md:col-span-2">
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Menu</span>
          <select
            className="kr-input"
            value={value.productId}
            onChange={(event) => onChange({ ...value, productId: event.target.value })}
            disabled={Boolean(value.id)}
          >
            <option value="">Pilih menu</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <Input
          label="Versi resep"
          type="number"
          value={value.version}
          onChange={(event) => onChange({ ...value, version: event.target.value })}
          placeholder="1"
          hint="Naikkan versi jika komposisi berubah."
        />
      </div>
      <div>
        <Input
          label="Yield"
          type="number"
          value={value.yieldQty}
          onChange={(event) => onChange({ ...value, yieldQty: event.target.value })}
          placeholder="1"
          hint="Jumlah output per 1 resep."
        />
      </div>

      <div className="md:col-span-2">
        <Input
          label="Catatan resep"
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          placeholder="Opsional"
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
      <div className="md:col-span-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
        Tambahkan item bahan baku, packaging, atau utility yang akan dipotong saat menu ini terjual.
      </div>

      <div className="md:col-span-2 grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Komposisi resep</p>
            <p className="text-xs text-[var(--color-muted)]">Atur bahan per 1 menu.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addRow}>
            <PlusCircle size={14} />
            Tambah bahan
          </Button>
        </div>

        <div className="grid gap-3">
          {value.items.map((row, index) => (
            <div key={index} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
              <div className="grid gap-3 md:grid-cols-[110px_minmax(0,1.5fr)_100px_minmax(0,1fr)_auto] md:items-end">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Tipe</span>
                  <select className="kr-input" value={row.itemType || "inventory"}
                    onChange={(e) => updateRow(index, { itemType: e.target.value, inventoryItemId: "", subRecipeId: "" })}>
                    <option value="inventory">Bahan</option>
                    <option value="subrecipe">Sub-Resep</option>
                  </select>
                </label>

                {row.itemType === "subrecipe" ? (
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Sub-resep</span>
                    <select className="kr-input" value={row.subRecipeId}
                      onChange={(e) => updateRow(index, { subRecipeId: e.target.value })}>
                      <option value="">Pilih produk</option>
                      {products.filter(p => p.id !== value.productId).map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Item bahan</span>
                    <select className="kr-input" value={row.inventoryItemId}
                      onChange={(e) => updateRow(index, { inventoryItemId: e.target.value })}>
                      <option value="">Pilih bahan</option>
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                      ))}
                    </select>
                  </label>
                )}

                <Input label="Qty" type="number" value={row.qtyPerUnit}
                  onChange={(e) => updateRow(index, { qtyPerUnit: e.target.value })} placeholder="1" />

                <Input label="Catatan" value={row.notes}
                  onChange={(e) => updateRow(index, { notes: e.target.value })} placeholder="Ops" />

                <Button type="button" variant="danger" size="sm" className="md:mb-1"
                  onClick={() => removeRow(index)} disabled={value.items.length <= 1}>
                  <Trash2 size={14} /> Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          <PlusCircle size={16} />
          {saving ? "Menyimpan..." : "Simpan resep"}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export default function ErpMenuRecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(initialForm());
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [recipeResponse, productResponse, inventoryResponse] = await Promise.all([
        inventoryApi.getMenuRecipes(),
        productApi.getProducts(),
        inventoryApi.getInventoryItems(),
      ]);

      setRecipes(recipeResponse.data?.data || []);
      setProducts(productResponse.data?.data || []);
      setInventoryItems((inventoryResponse.data?.data || []).filter((item) => item.isActive !== false));
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data resep menu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const active = recipes.filter((recipe) => recipe.isActive).length;
    const withItems = recipes.filter((recipe) => (recipe.items || []).length > 0).length;
    const productsLinked = recipes.length;
    const avgItems = recipes.length
      ? (recipes.reduce((sum, recipe) => sum + (recipe.items || []).length, 0) / recipes.length).toFixed(1)
      : "0.0";

    return [
      { title: "Total resep", value: recipes.length, icon: BookOpenText },
      { title: "Aktif", value: active, icon: ChevronRight },
      { title: "Sudah isi bahan", value: withItems, icon: PencilLine },
      { title: "Rata bahan", value: avgItems, icon: PlusCircle },
    ];
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesQuery =
        !keyword ||
        [recipe.product?.name, recipe.product?.code, recipe.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword)) ||
        (recipe.items || []).some((item) =>
          [item.inventoryItem?.name, item.inventoryItem?.code, item.notes]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword))
        );

      return matchesQuery;
    });
  }, [query, recipes]);

  function resetForm() {
    setForm(initialForm());
  }

  function openCreate() {
    setForm(initialForm());
    setIsModalOpen(true);
  }

  function openEdit(recipe) {
    setForm({
      id: recipe.id,
      productId: recipe.productId,
      version: recipe.version !== undefined ? String(recipe.version) : "1",
      yieldQty: recipe.yieldQty !== undefined ? String(recipe.yieldQty) : "1",
      notes: recipe.notes || "",
      isActive: recipe.isActive ?? true,
      items: normalizeItems(recipe.items || []),
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
      const payload = {
        version: Number(form.version || 1),
        yieldQty: Number(form.yieldQty || 1),
        notes: form.notes.trim(),
        isActive: form.isActive,
        items: form.items
          .filter((item) => (item.inventoryItemId || item.subRecipeId) && item.qtyPerUnit !== "")
          .map((item) => ({
            inventoryItemId: item.itemType === "subrecipe" ? null : item.inventoryItemId,
            subRecipeId: item.itemType === "subrecipe" ? item.subRecipeId : null,
            qtyPerUnit: Number(item.qtyPerUnit || 0),
            notes: item.notes.trim(),
          })),
      };

      if (!form.productId) {
        throw new Error("Menu wajib dipilih");
      }

      if (!payload.items.length) {
        throw new Error("Minimal ada 1 item bahan yang diisi");
      }

      await inventoryApi.upsertMenuRecipe(form.productId, payload);
      await loadData();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan resep menu.");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "product",
        label: "Menu",
        render: (recipe) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{recipe.product?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{recipe.product?.code || "-"}</p>
          </div>
        ),
      },
      {
        key: "version",
        label: "Versi",
        render: (recipe) => <span className="font-medium">v{recipe.version || 1}</span>,
      },
      {
        key: "yield",
        label: "Yield",
        render: (recipe) => <span className="font-medium">{formatDecimal(recipe.yieldQty || 1)}</span>,
      },
      {
        key: "items",
        label: "Bahan",
        render: (recipe) => (
          <div className="grid gap-1">
            <span className="font-medium">{recipe.items?.length || 0} bahan</span>
            <span className="text-xs text-[var(--color-muted)] line-clamp-1">
              {(recipe.items || [])
                .slice(0, 2)
                .map((item) => `${item.inventoryItem?.name || "-"} ${formatDecimal(item.qtyPerUnit || 0)} ${item.inventoryItem?.unit || ""}`)
                .join(" · ") || "-"}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (recipe) => <Badge tone={recipe.isActive ? "success" : "danger"}>{recipe.isActive ? "Active" : "Inactive"}</Badge>,
      },
      {
        key: "actions",
        label: "Aksi",
        render: (recipe) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => openEdit(recipe)}>
              <PencilLine size={14} />
              Edit
            </Button>
          </div>
        ),
        cellClassName: "min-w-[140px]",
      },
    ],
    []
  );

  return (
    <ErpShell title="Recipes" description="Resep menu ke bahan baku dan packaging.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Menu Recipes</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Hubungkan satu menu ke raw material, packaging, dan utility agar stok outlet otomatis berkurang saat POS dipakai.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle size={16} />
            Tambah resep
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">Kelola resep</p>
            <h3 className="mt-1 text-xl font-black tracking-tight">Daftar resep menu</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Setiap resep bisa punya versi, yield, dan komposisi bahan. Gunakan pencarian untuk menemukan menu atau bahan dengan cepat.
            </p>
          </div>

          <div className="grid gap-3">
            <Input
              label="Cari resep"
              icon={<Search size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama menu, kode, atau bahan"
            />
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-muted)]">
              <span className="font-medium text-[var(--color-text)]">Tips:</span> menu tanpa resep akan tetap tampil, tapi belum punya daftar bahan otomatis.
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeader
          title="Daftar resep"
          description="Kelola komposisi bahan tiap menu untuk membantu pengurangan stok otomatis saat transaksi."
        />

        {loading ? (
          <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
            Memuat resep menu...
          </div>
        ) : filteredRecipes.length ? (
          <div className="mt-5">
            <ManagementTable
              columns={columns}
              rows={filteredRecipes}
              emptyText="Belum ada resep menu."
              resetKey={`${query}-${filteredRecipes.length}`}
              maxHeightClass="max-h-[40rem]"
            />
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Belum ada resep yang cocok"
              description="Coba ubah kata kunci pencarian atau tambahkan resep untuk menu baru."
            />
          </div>
        )}
      </Card>

      <Modal
        open={isModalOpen}
        title={form.productId ? "Edit resep menu" : "Tambah resep menu"}
        onClose={closeModal}
        size="2xl"
      >
        <RecipeFormBody
          value={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onReset={closeModal}
          saving={saving}
          products={products}
          inventoryItems={inventoryItems}
        />
      </Modal>
    </ErpShell>
  );
}
