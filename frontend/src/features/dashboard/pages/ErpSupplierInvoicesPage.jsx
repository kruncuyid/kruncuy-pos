import { useEffect, useState } from "react";
import { Plus, DollarSign } from "lucide-react";
import ErpShell from "../components/ErpShell";
import { supplierInvoiceApi } from "../services/supplierInvoiceApi";
import { Button, Modal, Input, Select, Badge, EmptyState } from "../../../components/ui";
import { formatCurrency, formatDateTime, formatDateOnly } from "../utils/reportFormatters";

function statusTone(s) {
  if (s === "PAID") return "success";
  if (s === "PARTIAL") return "warning";
  if (s === "OVERDUE") return "danger";
  if (s === "CANCELLED") return "neutral";
  return "info";
}
function statusLabel(s) {
  return { PENDING: "Belum Dibayar", PARTIAL: "Sebagian", PAID: "Lunas", OVERDUE: "Jatuh Tempo", CANCELLED: "Batal" }[s] || s;
}

export default function ErpSupplierInvoicesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplierId: "", invoiceNumber: "", totalAmount: "", dueDate: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await supplierInvoiceApi.list();
      setData(res.data.data || []);
    } catch (_) { setData([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.supplierId || !form.invoiceNumber || !form.totalAmount || !form.dueDate) return;
    setSaving(true);
    try {
      await supplierInvoiceApi.create(form);
      setShowForm(false);
      setForm({ supplierId: "", invoiceNumber: "", totalAmount: "", dueDate: "", notes: "" });
      await load();
    } catch (_) { }
    finally { setSaving(false); }
  }

  return (
    <ErpShell title="Supplier Invoice" description="Tagihan dari supplier">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Invoice Baru</Button>
      </div>

      {loading ? (
        <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="Belum ada invoice" description="Catat invoice dari supplier untuk melacak utang." action={() => setShowForm(true)} actionLabel="Invoice Baru" />
      ) : (
        <div className="grid gap-2">
          {data.map((inv) => (
            <div key={inv.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{inv.invoiceNumber}</span>
                    <Badge tone={statusTone(inv.status)}>{statusLabel(inv.status)}</Badge>
                  </div>
                  <p className="text-sm mt-1">{inv.supplier?.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[var(--color-muted)]">
                    <span>💰 {formatCurrency(inv.totalAmount)}</span>
                    <span>✅ Dibayar {formatCurrency(inv.paidAmount)}</span>
                    <span>📅 Jatuh tempo {formatDateOnly(inv.dueDate)}</span>
                    <span>🏢 {inv.branch?.name}</span>
                  </div>
                  {inv.payments?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                      <p className="text-[10px] font-semibold uppercase text-[var(--color-muted)]">Pembayaran</p>
                      {inv.payments.map((p) => (
                        <p key={p.id} className="text-xs text-[var(--color-muted)]">
                          {formatDateTime(p.paymentDate)} — {formatCurrency(p.amount)} ({p.paymentMethod})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} title="Invoice Baru" onClose={() => setShowForm(false)} size="sm">
        <div className="grid gap-4">
          <Input label="Nomor Invoice *" value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} placeholder="INV-001" />
          <Input label="Total *" type="number" value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} placeholder="100000" />
          <Input label="Jatuh Tempo *" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          <Input label="Catatan" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Batal</Button>
            <Button onClick={handleSave} loading={saving}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </ErpShell>
  );
}
