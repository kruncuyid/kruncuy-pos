import { FileText, PlusCircle, Search, Eye, Send, CheckCircle, XCircle, Warehouse as WarehouseIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Drawer, Input, Modal, PageHeader, SectionHeader, StatCard, Alert, Select } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { purchaseOrderApi } from "../services/purchaseOrderApi";
import { supplierApi } from "../services/supplierApi";
import { inventoryApi } from "../services/inventoryApi";
import { warehouseApi } from "../services/warehouseApi";
import { formatCurrency, formatDateTime, formatNumber } from "../utils/reportFormatters";

function statusTone(s) { const map = { SENT: "info", APPROVED: "success", RECEIVED: "success", PARTIALLY_RECEIVED: "warning", CANCELLED: "danger", DRAFT: "neutral" }; return map[s] || "neutral"; }
function initialForm() { return { supplierId: "", expectedDate: "", items: [{ inventoryItemId: "", qty: "", unitPrice: "", unit: "pcs" }], notes: "" }; }

export default function ErpPurchaseOrderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const [poRes, supRes, invRes, whRes] = await Promise.all([
        purchaseOrderApi.list(), supplierApi.list(), inventoryApi.getInventoryItems(), warehouseApi.getWarehouses(),
      ]);
      setOrders(poRes.data?.data || []);
      setSuppliers(supRes.data?.data || []);
      setInventoryItems(invRes.data?.data || []);
      setWarehouses(whRes.data?.data || []);
    } catch (err) { setError(err?.response?.data?.message || "Gagal memuat."); } finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (!q) return true;
      return o.poNumber?.toLowerCase().includes(q) || o.supplier?.name?.toLowerCase().includes(q);
    });
  }, [orders, search, statusFilter]);

  function openCreate() { setForm(initialForm()); setModalOpen(true); }
  function addItem() { setForm((f) => ({ ...f, items: [...f.items, { inventoryItemId: "", qty: "", unitPrice: "", unit: "pcs" }] })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.supplierId || !form.items[0]?.inventoryItemId) { setError("Supplier dan minimal 1 item"); return; }
    setSaving(true);
    try {
      await purchaseOrderApi.create({
        ...form, warehouseId: form.warehouseId || null,
        items: form.items.map((i) => ({ inventoryItemId: i.inventoryItemId, qty: Number(i.qty) || 0, unitPrice: Number(i.unitPrice) || 0, unit: i.unit }))
      });
      setModalOpen(false); await loadData();
    } catch (err) { setError(err?.response?.data?.message); } finally { setSaving(false); }
  }

  const columns = useMemo(() => [
    { key: "poNumber", label: "No. PO", render: (r) => <span className="font-semibold cursor-pointer" onClick={() => setDetail(r)}>{r.poNumber}</span> },
    { key: "supplier", label: "Supplier", render: (r) => r.supplier?.name },
    { key: "totalAmount", label: "Total", render: (r) => <span className="font-semibold">{formatCurrency(r.totalAmount)}</span> },
    { key: "status", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: "createdAt", label: "Tanggal", render: (r) => <span className="text-xs">{formatDateTime(r.createdAt)}</span> },
    { key: "actions", label: "", render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setDetail(r)}><Eye size={14} /></Button>
        {r.status === "DRAFT" ? <Button size="sm" variant="secondary" onClick={async () => { try { await purchaseOrderApi.submit(r.id); await loadData(); } catch (err) { setError(err?.response?.data?.message); } }}><Send size={14} /></Button> : null}
        {r.status === "SENT" ? <Button size="sm" variant="secondary" onClick={async () => { try { await purchaseOrderApi.approve(r.id); await loadData(); } catch (err) { setError(err?.response?.data?.message); } }}><CheckCircle size={14} /></Button> : null}
      </div>
    )},
  ], []);

  return (
    <ErpShell title="Purchase Order" description="Order pembelian ke supplier.">
      <PageHeader title="Purchase Order" description="Order pembelian ke supplier." badge="New" onRefresh={loadData} loading={loading}
        actions={<Button size="sm" onClick={openCreate}><PlusCircle size={16} />Buat PO</Button>} />
      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <SectionHeader title="Daftar PO" description={loading ? "" : `${filtered.length} order`} />
          <div className="flex gap-2">
            <select className="kr-input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Semua</option>
              <option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="APPROVED">Approved</option>
              <option value="RECEIVED">Received</option><option value="CANCELLED">Cancelled</option>
            </select>
            <Input placeholder="Cari PO..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} className="max-w-xs" />
          </div>
        </div>
        <div className="mt-4"><ManagementTable columns={columns} rows={filtered} emptyText="Belum ada PO." /></div>
      </Card>
      <Modal open={modalOpen} title="Buat Purchase Order" onClose={() => setModalOpen(false)} size="xl">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Supplier" options={suppliers.filter((s) => s.isActive !== false).map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Pilih supplier" value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} />
            <Select label="Terima ke Depo (opsional)" options={warehouses.filter((w) => w.isActive !== false).map((w) => ({ value: w.id, label: w.name }))}
              placeholder="Pilih depo tujuan" value={form.warehouseId} onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))} hint="Kosongkan jika barang langsung ke outlet" />
          </div>
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <Select label="Item" options={inventoryItems.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                placeholder="Pilih" value={item.inventoryItemId} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], inventoryItemId: e.target.value }; return { ...f, items }; })} />
              <Input label="Qty" type="number" className="w-20" value={item.qty} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], qty: e.target.value }; return { ...f, items }; })} />
              <Input label="Harga" type="number" className="w-28" value={item.unitPrice} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], unitPrice: e.target.value }; return { ...f, items }; })} />
              {idx > 0 ? <Button type="button" variant="ghost" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}>×</Button> : <div className="w-10" />}
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Tambah item</Button>
          <Input label="Catatan" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Buat PO</Button>
          </div>
        </form>
      </Modal>
      <Drawer open={Boolean(detail)} title={detail?.poNumber} onClose={() => setDetail(null)} size="md">
        {detail ? (
          <div className="grid gap-4">
            <div className="grid gap-2 rounded-2xl border p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Status</span><Badge tone={statusTone(detail.status)}>{detail.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted">Supplier</span><span>{detail.supplier?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Total</span><span className="font-bold">{formatCurrency(detail.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Tanggal</span><span>{formatDateTime(detail.createdAt)}</span></div>
            </div>
            <SectionHeader title="Items" />
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm"><thead className="bg-surface-2 text-xs uppercase text-muted">
                <tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Harga</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-right">Diterima</th></tr>
              </thead><tbody className="divide-y">
                {detail.items?.map((i) => (
                  <tr key={i.id}><td className="px-3 py-2">{i.inventoryItem?.name || "-"}</td><td className="px-3 py-2 text-right">{formatNumber(i.qty)}</td><td className="px-3 py-2 text-right">{formatCurrency(i.unitPrice)}</td><td className="px-3 py-2 text-right font-semibold">{formatCurrency(i.totalPrice)}</td><td className="px-3 py-2 text-right">{formatNumber(i.qtyReceived)}</td></tr>
                ))}
              </tbody></table>
            </div>
          </div>
        ) : null}
      </Drawer>
    </ErpShell>
  );
}
