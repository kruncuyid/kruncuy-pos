import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, Receipt, Ban, AlertTriangle, Shield } from "lucide-react";
import CrewShell from "../components/CrewShell";
import { crewApi } from "../services/crewApi";
import { formatCurrency, formatNumber, formatDateTime } from "../../dashboard/utils/reportFormatters";
import { Badge, Modal } from "../../../components/ui";
import api from "../../../core/api/api";
import { getStoredUser } from "../../../core/auth/session";

const VOID_REASONS = [
  { value: "SALAH_INPUT", label: "Salah Input" },
  { value: "CANCEL", label: "Dibatalkan Pelanggan" },
  { value: "REFUND", label: "Refund" },
  { value: "OTHER", label: "Lainnya" },
];

const VOID_THRESHOLD = Number(import.meta.env.VITE_VOID_THRESHOLD || 100000);

export default function CrewSalesTodayPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState("");
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [managerPassword, setManagerPassword] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await crewApi.getTodaySales();
      setData(res.data.data);
    } catch (_) {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const items = data?.items || [];
  const summary = data?.summary || {};

  async function copyInvoice(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  }

  return (
    <CrewShell title="Penjualan Hari Ini" compactHeader>
      <button onClick={() => navigate("/crew")} className="flex items-center gap-1.5 text-sm text-muted mb-2">
        <ArrowLeft size={16} /> Kembali
      </button>

      {loading ? (
        <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-20 w-full rounded-2xl" />)}</div>
      ) : (
        <>
          {/* Row 1: Omzet — full width */}
          <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-green-700">Omzet Hari Ini</p>
            <p className="mt-1 text-3xl font-black text-green-900">{formatCurrency(summary.totalSales)}</p>
          </div>

          {/* Row 2: Transaksi + PCS — 2 columns */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Transaksi</p>
              <p className="mt-1 text-2xl font-black">{formatNumber(summary.totalTransactions)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">PCS Terjual</p>
              <p className="mt-1 text-2xl font-black">{formatNumber(summary.totalPcs)}</p>
            </div>
          </div>

          {/* Row 3: Transaction List (clickable) */}
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
              <Receipt size={28} className="mx-auto mb-2 opacity-40" />
              Belum ada transaksi hari ini
            </div>
          ) : (
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted px-0.5">
                Daftar Transaksi ({items.length})
              </p>
              {items.map((tx) => (
                <button key={tx.id} onClick={() => setSelectedTx(tx)}
                  className="w-full rounded-2xl border border-border bg-surface p-4 text-left active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-primary">{tx.invoiceNumber}</span>
                        <Badge tone={tx.paymentMethod === "CASH" ? "success" : tx.paymentMethod === "QRIS" ? "info" : "warning"}
                          className="text-[9px] px-1.5 py-0">{tx.paymentMethod}</Badge>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{formatDateTime(tx.createdAt)} • {tx.items?.length || 0} item</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black">{formatCurrency(tx.totalAmount)}</p>
                      <p className="text-[10px] text-muted">{tx.totalPcs} pcs</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal open={Boolean(selectedTx)} title="Detail Transaksi" onClose={() => setSelectedTx(null)} size="sm">
        {selectedTx && (
          <div className="grid gap-4">
            {/* Invoice & Copy */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted">Invoice</p>
                <button onClick={() => copyInvoice(selectedTx.invoiceNumber)}
                  className="flex items-center gap-1.5 text-sm font-mono font-bold text-primary hover:underline mt-0.5"
                >
                  {selectedTx.invoiceNumber}
                  {copiedId === selectedTx.invoiceNumber ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="opacity-50" />}
                </button>
              </div>
              <Badge tone={selectedTx.paymentMethod === "CASH" ? "success" : selectedTx.paymentMethod === "QRIS" ? "info" : "warning"}>
                {selectedTx.paymentMethod}
              </Badge>
            </div>

            {/* Time & Status */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted">Waktu</p>
                <p className="font-medium mt-0.5">{formatDateTime(selectedTx.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted">Channel</p>
                <p className="font-medium mt-0.5">{selectedTx.salesChannel || "OFFLINE"}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold uppercase text-muted mb-2">Item</p>
              <div className="space-y-2">
                {selectedTx.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b border-border pb-1.5 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted">{formatCurrency(item.price)} x {item.qty}</p>
                    </div>
                    <p className="font-bold shrink-0 ml-3">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(selectedTx.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Total PCS</span>
                <span>{formatNumber(selectedTx.totalPcs)}</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span>{formatCurrency(selectedTx.totalAmount)}</span>
              </div>
            </div>

            {/* Void Section */}
            {selectedTx.status !== "VOID" && (
              <div className="border-t border-border pt-3 mt-2">
                <p className="text-xs font-semibold uppercase text-muted mb-2">Batalkan Transaksi</p>
                <select className="kr-input h-11 text-sm mb-2" value={voidReason}
                  onChange={e => { setVoidReason(e.target.value); setVoidError(""); }}>
                  <option value="">— Pilih alasan —</option>
                  {VOID_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {voidError && <p className="text-xs text-red-600 mb-2">{voidError}</p>}
                <button onClick={() => {
                  if (!voidReason) { setVoidError("Pilih alasan void"); return; }
                  setVoidError("");
                  setShowVoidConfirm(true);
                }} disabled={!voidReason}
                  className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700 active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2">
                  <Ban size={16} /> Batalkan Transaksi
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Void Confirmation Modal */}
      <Modal open={showVoidConfirm} title="Konfirmasi Pembatalan" onClose={() => setShowVoidConfirm(false)} size="sm">
        {selectedTx && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
              <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" />
              <p className="text-lg font-black text-red-700">{formatCurrency(selectedTx.totalAmount)}</p>
              <p className="text-sm text-red-600 mt-1">Total transaksi akan dibatalkan</p>
            </div>

            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Invoice</span>
                <span className="font-mono font-bold">{selectedTx.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Alasan</span>
                <span className="font-medium">{VOID_REASONS.find(r => r.value === voidReason)?.label || voidReason}</span>
              </div>
            </div>

            {selectedTx.totalAmount > VOID_THRESHOLD && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <Shield size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Persetujuan Manajer Diperlukan</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Transaksi di atas Rp {VOID_THRESHOLD.toLocaleString()} memerlukan persetujuan manajer.
                      Masukkan password manajer untuk melanjutkan.
                    </p>
                    <input type="password" className="kr-input h-10 text-sm mt-2" placeholder="Password manajer"
                      value={managerPassword} onChange={e => setManagerPassword(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowVoidConfirm(false); setManagerPassword(""); }}
                className="w-full rounded-xl border border-border bg-surface py-2.5 text-sm font-bold">
                Batal
              </button>
              <button onClick={async () => {
                setVoiding(true); setVoidError("");
                try {
                  const payload = { reason: voidReason };
                  if (selectedTx.totalAmount > VOID_THRESHOLD) {
                    if (!managerPassword) { setVoidError("Masukkan password manajer"); setVoiding(false); return; }
                    // Verify manager password first
                    try {
                      await api.post("/auth/login", {
                        username: getStoredUser()?.username,
                        password: managerPassword,
                      });
                    } catch {
                      setVoidError("Password manajer salah"); setVoiding(false); return;
                    }
                    payload.managerApproval = true;
                  }
                  await api.post(`/transactions/${selectedTx.id}/void`, payload);
                  setShowVoidConfirm(false); setSelectedTx(null);
                  setVoidReason(""); setManagerPassword(""); await load();
                } catch (e) {
                  setVoidError(e?.response?.data?.message || "Gagal membatalkan transaksi.");
                  setShowVoidConfirm(false);
                }
                finally { setVoiding(false); }
              }} disabled={voiding || (selectedTx.totalAmount > VOID_THRESHOLD && !managerPassword)}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700 active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2">
                <Ban size={16} /> {voiding ? "Memproses..." : "Ya, Batalkan"}
              </button>
            </div>
            {voidError && <p className="text-xs text-red-600 text-center">{voidError}</p>}
          </div>
        )}
      </Modal>
    </CrewShell>
  );
}
