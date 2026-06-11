import { RotateCcw, PlusCircle, Search, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Drawer, Input, Modal, PageHeader, SectionHeader, Alert, Select } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { returnApi } from "../services/returnApi";
import { supplierApi } from "../services/supplierApi";
import { inventoryApi } from "../services/inventoryApi";
import { formatCurrency, formatDateTime, formatNumber } from "../utils/reportFormatters";

function statusTone(s) { return s === "APPROVED" ? "success" : s === "COMPLETED" ? "info" : "warning"; }

export default function ErpReturnsPage() {
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]); const [inventoryItems, setInventoryItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false); const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState(""); const [form, setForm] = useState({ supplierId: "", reason: "", items: [{ inventoryItemId: "", qty: "", unitCost: "", unit: "pcs", reason: "" }], notes: "" });

  async function loadData() { setLoading(true); try { const [r, s, i] = await Promise.all([returnApi.list(), supplierApi.list(), inventoryApi.getInventoryItems()]); setReturns(r.data?.data || []); setSuppliers(s.data?.data || []); setInventoryItems(i.data?.data || []); } catch (err) { setError(err?.response?.data?.message); } finally { setLoading(false); } }
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => { const q = search.toLowerCase(); return returns.filter((r) => !q || r.returnNumber?.toLowerCase().includes(q) || r.supplier?.name?.toLowerCase().includes(q)); }, [returns, search]);

  function addItem() { setForm((f) => ({ ...f, items: [...f.items, { inventoryItemId: "", qty: "", unitCost: "", unit: "pcs", reason: "" }] })); }

  async function handleSubmit(e) {
    e.preventDefault(); if (!form.supplierId || !form.reason) { setError("Supplier dan alasan wajib"); return; }
    setSaving(true); try {
      await returnApi.create({ ...form, items: form.items.filter((i) => i.inventoryItemId).map((i) => ({ inventoryItemId: i.inventoryItemId, qty: Number(i.qty) || 0, unitCost: Number(i.unitCost) || 0, unit: i.unit, reason: i.reason })) });
      setModalOpen(false); await loadData();
    } catch (err) { setError(err?.response?.data?.message); } finally { setSaving(false); }
  }

  const cols = useMemo(() => [
    { key: "returnNumber", label: "No. Return", render: (r) => <span className="font-semibold cursor-pointer" onClick={() => setDetail(r)}>{r.returnNumber}</span> },
    { key: "supplier", label: "Supplier", render: (r) => r.supplier?.name }, { key: "reason", label: "Alasan" },
    { key: "status", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: "returnDate", label: "Tanggal", render: (r) => <span className="text-xs">{formatDateTime(r.returnDate)}</span> },
  ], []);

  return (
    <ErpShell title="Returns" description="Return barang ke supplier.">
      <PageHeader title="Returns" description="Return barang ke supplier." badge="New" onRefresh={loadData} loading={loading}
        actions={<Button size="sm" onClick={() => { setForm({ supplierId: "", reason: "", items: [{ inventoryItemId: "", qty: "", unitCost: "", unit: "pcs", reason: "" }], notes: "" }); setModalOpen(true); }}><PlusCircle size={16} />Buat Return</Button>} />
      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <SectionHeader title="Daftar Return" /> <Input placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} className="max-w-xs" />
        </div>
        <div className="mt-4"><ManagementTable columns={cols} rows={filtered} emptyText="Belum ada return." /></div>
      </Card>
      <Modal open={modalOpen} title="Buat Return" onClose={() => setModalOpen(false)} size="xl">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Select label="Supplier" options={suppliers.filter((s) => s.isActive !== false).map((s) => ({ value: s.id, label: s.name }))} placeholder="Pilih" value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} />
          <Input label="Alasan return" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Rusak / kadaluarsa / salah kirim" required />
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <Select label="Item" options={inventoryItems.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))} placeholder="Pilih" value={item.inventoryItemId} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], inventoryItemId: e.target.value }; return { ...f, items }; })} />
              <Input label="Qty" type="number" className="w-20" value={item.qty} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], qty: e.target.value }; return { ...f, items }; })} />
              <Input label="Harga" type="number" className="w-28" value={item.unitCost} onChange={(e) => setForm((f) => { const items = [...f.items]; items[idx] = { ...items[idx], unitCost: e.target.value }; return { ...f, items }; })} />
              {idx > 0 ? <Button type="button" variant="ghost" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}>×</Button> : <div className="w-10" />}
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Tambah item</Button>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button><Button type="submit" loading={saving}>Buat Return</Button></div>
        </form>
      </Modal>
    </ErpShell>
  );
}
