import { ClipboardList, PlusCircle, RefreshCw, Search, CheckCircle, XCircle, Send, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Drawer, Input, Modal, PageHeader, SectionHeader, StatCard, Alert, Select } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { purchaseRequestApi } from "../services/purchaseRequestApi";
import { inventoryApi } from "../services/inventoryApi";
import { formatDateTime, formatNumber } from "../utils/reportFormatters";

function initialForm() { return { items: [{ inventoryItemId: "", qty: "", unit: "pcs", notes: "" }], notes: "" }; }

function statusTone(s) { if (s === "APPROVED") return "success"; if (s === "REJECTED") return "danger"; if (s === "SUBMITTED") return "warning"; return "neutral"; }

export default function ErpPurchaseRequestPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const [prRes, invRes] = await Promise.all([
        purchaseRequestApi.list(),
        inventoryApi.getInventoryItems(),
      ]);
      setItems(prRes.data?.data || []);
      setInventoryItems(invRes.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
      if (!q) return true;
      return i.prNumber?.toLowerCase().includes(q) || i.requestedBy?.name?.toLowerCase().includes(q);
    });
  }, [items, search, statusFilter]);

  function openCreate() { setForm(initialForm()); setModalOpen(true); setError(""); }
  function addItem() { setForm((f) => ({ ...f, items: [...f.items, { inventoryItemId: "", qty: "", unit: "pcs", notes: "" }] })); }
  function updateItem(idx, key, val) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [key]: val };
    setForm((f) => ({ ...f, items }));
  }
  function removeItem(idx) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.items.length || !form.items[0].inventoryItemId) { setError("Minimal 1 item"); return; }
    setSaving(true); setError("");
    try {
      await purchaseRequestApi.create({
        items: form.items.map((i) => ({ inventoryItemId: i.inventoryItemId, qty: Number(i.qty) || 0, unit: i.unit })),
        notes: form.notes,
      });
      setModalOpen(false); await loadData();
    } catch (err) { setError(err?.response?.data?.message || "Gagal."); } finally { setSaving(false); }
  }

  async function handleSubmitPR(id) {
    try { await purchaseRequestApi.submit(id); await loadData(); } catch (err) { setError(err?.response?.data?.message); }
  }
  async function handleApprove(id) {
    try { await purchaseRequestApi.approve(id); await loadData(); } catch (err) { setError(err?.response?.data?.message); }
  }

  const columns = useMemo(() => [
    { key: "prNumber", label: "No. PR", render: (r) => <span className="font-semibold cursor-pointer" onClick={() => setDetail(r)}>{r.prNumber}</span> },
    { key: "branch", label: "Branch", render: (r) => r.branch?.name },
    { key: "requestedBy", label: "Pemohon", render: (r) => r.requestedBy?.name },
    { key: "items", label: "Item", render: (r) => `${r.items?.length || 0} item` },
    { key: "status", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: "createdAt", label: "Tanggal", render: (r) => <span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span> },
    { key: "actions", label: "", render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setDetail(r)}><Eye size={14} /></Button>
        {r.status === "DRAFT" ? <Button size="sm" variant="secondary" onClick={() => handleSubmitPR(r.id)}><Send size={14} /></Button> : null}
        {r.status === "SUBMITTED" ? <Button size="sm" variant="secondary" onClick={() => handleApprove(r.id)}><CheckCircle size={14} /></Button> : null}
      </div>
    )},
  ], []);

  return (
    <ErpShell title="Purchase Request" description="Pengajuan pembelian barang.">
      <PageHeader title="Purchase Request" description="Pengajuan pembelian barang untuk operasional outlet."
        badge="New" onRefresh={loadData} loading={loading}
        actions={<Button size="sm" onClick={openCreate}><PlusCircle size={16} />Buat PR</Button>} />
      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <SectionHeader title="Daftar PR" description={loading ? "" : `${filtered.length} pengajuan`} />
          <div className="flex gap-2">
            <select className="kr-input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Semua status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <Input placeholder="Cari PR..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} className="max-w-xs" />
          </div>
        </div>
        <div className="mt-4">
          <ManagementTable columns={columns} rows={filtered} emptyText="Belum ada PR." resetKey={filtered.length} />
        </div>
      </Card>
      <Modal open={modalOpen} title="Buat Purchase Request" onClose={() => setModalOpen(false)} size="xl">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            {form.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <Select label="Item" options={inventoryItems.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                  placeholder="Pilih item" value={item.inventoryItemId} onChange={(e) => updateItem(idx, "inventoryItemId", e.target.value)} />
                <Input label="Qty" type="number" min="0" className="w-24" value={item.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} />
                {idx > 0 ? <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)}>×</Button> : <div className="w-10" />}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Tambah item</Button>
          </div>
          <Input label="Catatan" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Alasan pembelian" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan PR</Button>
          </div>
        </form>
      </Modal>
      <Drawer open={Boolean(detail)} title={detail?.prNumber || "Detail PR"} onClose={() => setDetail(null)} size="md">
        {detail ? (
          <div className="grid gap-4">
            <div className="grid gap-2 rounded-2xl border p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Status</span><Badge tone={statusTone(detail.status)}>{detail.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted">Pemohon</span><span>{detail.requestedBy?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Branch</span><span>{detail.branch?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Tanggal</span><span>{formatDateTime(detail.createdAt)}</span></div>
            </div>
            <SectionHeader title="Items" />
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-xs uppercase text-muted">
                  <tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2">Unit</th></tr>
                </thead>
                <tbody className="divide-y">
                  {detail.items?.map((i) => (
                    <tr key={i.id}><td className="px-3 py-2">{i.inventoryItem?.name || "-"}</td><td className="px-3 py-2 text-right font-semibold">{formatNumber(i.qty)}</td><td className="px-3 py-2">{i.unit}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detail.notes ? <div className="rounded-2xl border p-4 text-sm"><span className="text-xs font-semibold uppercase text-muted">Catatan</span><p className="mt-1">{detail.notes}</p></div> : null}
          </div>
        ) : null}
      </Drawer>
    </ErpShell>
  );
}
