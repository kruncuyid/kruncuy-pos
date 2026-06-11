import { Building2, Eye, Package, PlusCircle, RefreshCw, Warehouse as WarehouseIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  SectionHeader,
  StatCard,
  Alert,
} from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import { warehouseApi } from "../services/warehouseApi";
import { branchApi } from "../services/branchApi";
import { formatDateTime, formatNumber } from "../utils/reportFormatters";

function formatQty(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? formatNumber(num) : num.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

function initialForm() {
  return {
    id: "",
    name: "",
    code: "",
    address: "",
    branchId: "",
    isActive: true,
  };
}

export default function ErpWarehousePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouseStocks, setWarehouseStocks] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [search, setSearch] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItems, setAdjustItems] = useState([{ inventoryItemId: "", qty: "" }]);
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [whResponse, brResponse] = await Promise.all([
        warehouseApi.getWarehouses(),
        branchApi.getBranches(),
      ]);
      setWarehouses(whResponse.data?.data || []);
      setBranches(brResponse.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data warehouse.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadStocks(warehouseId) {
    setStockLoading(true);
    try {
      const response = await warehouseApi.getWarehouseStocks(warehouseId);
      setWarehouseStocks(response.data?.data || []);
    } catch (err) {
      setError("Gagal memuat stok warehouse.");
    } finally {
      setStockLoading(false);
    }
  }

  async function loadInventory() {
    try {
      const { default: invApi } = await import("../services/inventoryApi");
      const res = await invApi.getInventoryItems();
      setInventoryItems(res.data?.data || []);
    } catch {}
  }

  function openDetail(warehouse) {
    setSelectedWarehouse(warehouse);
    loadStocks(warehouse.id);
    loadInventory();
  }

  function openCreate() {
    setForm(initialForm());
    setModalOpen(true);
  }

  function openEdit(warehouse) {
    setForm({
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || "",
      branchId: warehouse.branchId || "",
      isActive: warehouse.isActive,
    });
    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name || !form.code) {
      setError("Nama dan kode warehouse wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      if (form.id) {
        await warehouseApi.updateWarehouse(form.id, form);
      } else {
        await warehouseApi.createWarehouse(form);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menyimpan warehouse.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjustStock() {
    const validItems = adjustItems.filter(i => i.inventoryItemId && i.qty !== "");
    if (!validItems.length) { setError("Pilih minimal 1 item"); return; }
    setAdjustSaving(true); setError("");
    try {
      await warehouseApi.updateWarehouseStocks(selectedWarehouse.id, { items: validItems.map(i => ({ inventoryItemId: i.inventoryItemId, currentStock: Number(i.qty) })) });
      setAdjustOpen(false);
      setAdjustItems([{ inventoryItemId: "", qty: "" }]);
      await loadStocks(selectedWarehouse.id);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal");
    } finally { setAdjustSaving(false); }
  }

  const filteredWarehouses = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return warehouses;
    return warehouses.filter(
      (wh) =>
        wh.name?.toLowerCase().includes(q) ||
        wh.code?.toLowerCase().includes(q) ||
        wh.address?.toLowerCase().includes(q)
    );
  }, [warehouses, search]);

  const metrics = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter((wh) => wh.isActive !== false).length;
    const withBranch = warehouses.filter((wh) => wh.branchId).length;
    return [
      { title: "Total Warehouse", value: total, icon: WarehouseIcon },
      { title: "Aktif", value: active, icon: Building2 },
      { title: "Terikat Branch", value: withBranch, icon: Package },
    ];
  }, [warehouses]);

  return (
    <ErpShell title="Warehouse" description="Pusat penyimpanan dan distribusi stok barang.">
      <PageHeader
        title="Warehouse"
        description="Kelola gudang pusat dan distribusi barang ke outlet. Lihat stok per warehouse dan lacak pergerakan barang."
        onRefresh={loadData}
        loading={loading}
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusCircle size={16} />
            Tambah Warehouse
          </Button>
        }
      />

      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <StatCard key={metric.title} title={metric.title} value={loading ? "-" : metric.value} icon={<Icon size={18} />} />;
        })}
      </section>

      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="Daftar Warehouse"
          description={loading ? "Memuat..." : `${filteredWarehouses.length} warehouse`}
        />
        <div className="mt-4 max-w-sm">
          <Input
            placeholder="Cari warehouse..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="erp-skeleton h-16 w-full" />)}
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Belum ada warehouse"
              description="Tambahkan warehouse baru untuk mulai mengelola stok gudang."
              icon={<WarehouseIcon size={20} />}
              actionLabel="Tambah Warehouse"
              onAction={openCreate}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredWarehouses.map((wh) => (
              <div
                key={wh.id}
                className="kr-card-hover rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition-all hover:-translate-y-0.5 cursor-pointer"
                onClick={() => openDetail(wh)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{wh.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">{wh.code}</p>
                  </div>
                  <Badge tone={wh.isActive !== false ? "success" : "neutral"}>
                    {wh.isActive !== false ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {wh.address ? (
                  <p className="mt-3 text-xs text-[var(--color-muted)] line-clamp-2">{wh.address}</p>
                ) : null}
                {wh.branch ? (
                  <p className="mt-2 text-xs text-[var(--color-info)]">{wh.branch.name}</p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openDetail(wh); }}>
                    <Eye size={14} /> Stok
                  </Button>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(wh); }}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail Drawer */}
      <Drawer
        open={Boolean(selectedWarehouse)}
        title={selectedWarehouse?.name || "Detail Warehouse"}
        description={selectedWarehouse?.code}
        onClose={() => { setSelectedWarehouse(null); setWarehouseStocks([]); }}
        size="lg"
      >
        {selectedWarehouse ? (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Kode</span>
                <span className="text-sm font-semibold">{selectedWarehouse.code}</span>
              </div>
              {selectedWarehouse.branch ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Branch</span>
                  <span className="text-sm">{selectedWarehouse.branch.name}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Status</span>
                <Badge tone={selectedWarehouse.isActive !== false ? "success" : "neutral"}>
                  {selectedWarehouse.isActive !== false ? "Active" : "Inactive"}
                </Badge>
              </div>
              {selectedWarehouse.address ? (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Alamat</span>
                  <p className="mt-1 text-sm">{selectedWarehouse.address}</p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <SectionHeader
                title="Stok"
                description={stockLoading ? "Memuat..." : `${warehouseStocks.length} item`}
              />
              <Button size="sm" onClick={() => setAdjustOpen(true)}><PlusCircle size={14} /> Adjust Stok</Button>
            </div>

            {stockLoading ? (
              <div className="grid gap-2">
                {[1, 2, 3].map((i) => <div key={i} className="erp-skeleton h-10 w-full" />)}
              </div>
            ) : warehouseStocks.length === 0 ? (
              <EmptyState
                title="Belum ada stok"
                description="Warehouse ini belum memiliki stok."
                icon={<Package size={20} />}
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-[var(--color-surface-2)] text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Stok</th>
                      <th className="px-4 py-3">Min</th>
                      <th className="px-4 py-3">Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {warehouseStocks.map((stock) => (
                      <tr key={stock.id} className="hover:bg-[var(--color-surface-2)]/60">
                        <td className="px-4 py-3 font-medium">{stock.inventoryItem?.name || stock.itemName || "-"}</td>
                        <td className="px-4 py-3 font-semibold">{formatQty(stock.currentStock)}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">{stock.minStock != null ? formatQty(stock.minStock) : "-"}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">{stock.maxStock != null ? formatQty(stock.maxStock) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </Drawer>

      {/* Adjust Stock Modal */}
      <Modal open={adjustOpen} title="Adjust Stok Warehouse" onClose={() => setAdjustOpen(false)} size="md">
        <div className="grid gap-4">
          <p className="text-sm text-muted">Set stok untuk {selectedWarehouse?.name}. Item akan di-<em>upsert</em> (tambah atau update).</p>
          {adjustItems.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_auto] gap-2 items-end">
              <label className="grid gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted">Item</span>
                <select className="kr-input h-10" value={row.inventoryItemId}
                  onChange={(e) => {
                    const next = [...adjustItems];
                    next[i].inventoryItemId = e.target.value;
                    setAdjustItems(next);
                  }}>
                  <option value="">Pilih</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                  ))}
                </select>
              </label>
              <Input label="Qty" type="number" value={row.qty} placeholder="0"
                onChange={(e) => {
                  const next = [...adjustItems];
                  next[i].qty = e.target.value;
                  setAdjustItems(next);
                }} />
              <Button type="button" variant="danger" size="sm" className="mb-0.5"
                onClick={() => setAdjustItems(prev => prev.filter((_, idx) => idx !== i))}
                disabled={adjustItems.length <= 1}>×</Button>
            </div>
          ))}
          <Button variant="subtle" size="sm" onClick={() => setAdjustItems(prev => [...prev, { inventoryItemId: "", qty: "" }])}>
            + Tambah item
          </Button>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={() => setAdjustOpen(false)}>Batal</Button>
            <Button onClick={handleAdjustStock} loading={adjustSaving}>Simpan Stok</Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        title={form.id ? "Edit Warehouse" : "Tambah Warehouse"}
        onClose={() => setModalOpen(false)}
        size="md"
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nama warehouse"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Contoh: Gudang Pusat"
              required
            />
            <Input
              label="Kode warehouse"
              value={form.code}
              onChange={(event) => updateForm("code", event.target.value.toUpperCase())}
              placeholder="Contoh: GUDANG-01"
              hint="Kode unik warehouse"
              required
            />
          </div>
          <Input
            label="Alamat"
            value={form.address}
            onChange={(event) => updateForm("address", event.target.value)}
            placeholder="Alamat warehouse"
          />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Branch</span>
            <select className="kr-input" value={form.branchId} onChange={(event) => updateForm("branchId", event.target.value)}>
              <option value="">Tidak terikat branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Status</span>
            <select className="kr-input" value={form.isActive ? "true" : "false"} onChange={(event) => updateForm("isActive", event.target.value === "true")}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={saving}>{form.id ? "Update" : "Simpan"}</Button>
          </div>
        </form>
      </Modal>
    </ErpShell>
  );
}
