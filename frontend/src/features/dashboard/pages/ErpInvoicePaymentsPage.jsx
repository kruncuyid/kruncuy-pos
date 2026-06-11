import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ErpShell from "../components/ErpShell";
import { supplierInvoiceApi } from "../services/supplierInvoiceApi";
import { Button, Modal, Input, Card } from "../../../components/ui";
import { formatCurrency, formatDateTime } from "../utils/reportFormatters";

export default function ErpInvoicePaymentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", paymentMethod: "TRANSFER", notes: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        supplierInvoiceApi.getById(id),
        supplierInvoiceApi.listPayments(id),
      ]);
      setInvoice(invRes.data.data);
      setPayments(payRes.data.data || []);
    } catch (_) { }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handlePay() {
    if (!payForm.amount) return;
    setSaving(true);
    try {
      await supplierInvoiceApi.createPayment(id, payForm);
      setShowPay(false);
      setPayForm({ amount: "", paymentMethod: "TRANSFER", notes: "" });
      await load();
    } catch (_) { }
    finally { setSaving(false); }
  }

  if (loading) return <ErpShell title="Invoice"><div className="erp-skeleton h-32 w-full rounded-2xl" /></ErpShell>;

  return (
    <ErpShell title={`Invoice ${invoice?.invoiceNumber || ""}`} description="Detail invoice dan pembayaran">
      {invoice && (
        <Card className="mb-4">
          <div className="grid gap-2">
            <p className="font-semibold text-lg">{invoice.invoiceNumber}</p>
            <p className="text-sm">{invoice.supplier?.name} — {invoice.branch?.name}</p>
            <p className="text-sm">Total: {formatCurrency(invoice.totalAmount)}</p>
            <p className="text-sm">Dibayar: {formatCurrency(invoice.paidAmount)}</p>
            <p className="text-sm">Status: {invoice.status}</p>
            <p className="text-sm">Jatuh tempo: {formatDateTime(invoice.dueDate)}</p>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold">Riwayat Pembayaran ({payments.length})</p>
        <Button onClick={() => setShowPay(true)}><span className="text-lg font-bold">+</span> Bayar</Button>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-[var(--color-muted)]">
          Belum ada pembayaran
        </div>
      ) : (
        <div className="grid gap-2">
          {payments.map((p) => (
            <div key={p.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex justify-between">
              <div>
                <p className="font-semibold">{formatCurrency(p.amount)}</p>
                <p className="text-xs text-[var(--color-muted)]">{p.paymentMethod}</p>
              </div>
              <p className="text-xs text-[var(--color-muted)]">{formatDateTime(p.paymentDate)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate(-1)}>Kembali</Button>
      </div>

      <Modal open={showPay} title="Catat Pembayaran" onClose={() => setShowPay(false)} size="sm">
        <div className="grid gap-4">
          <Input label="Jumlah *" type="number" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} />
          <Input label="Metode" value={payForm.paymentMethod} onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))} placeholder="TRANSFER" />
          <Input label="Catatan" value={payForm.notes} onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={() => setShowPay(false)}>Batal</Button>
            <Button onClick={handlePay} loading={saving}>Bayar</Button>
          </div>
        </div>
      </Modal>
    </ErpShell>
  );
}
