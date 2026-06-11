import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, TrendingUp, Wallet, Clock, CheckCircle2, LogOut,
  Package, RotateCcw, Receipt, AlertTriangle, DollarSign, ArrowRight,
} from "lucide-react";
import CrewShell from "../components/CrewShell";
import { crewApi } from "../services/crewApi";
import { crewDepotTransferApi } from "../services/depotTransferApi";
import { cashWithdrawalApi } from "../services/cashWithdrawalApi";
import { Modal } from "../../../components/ui";
import { cashSessionApi } from "../services/cashSessionApi";
import { formatCurrency, formatNumber } from "../../dashboard/utils/reportFormatters";

function formatTime(date) {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function CrewHomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [closingLoading, setClosingLoading] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const [summaryModal, setSummaryModal] = useState(false);
  const [lastShift, setLastShift] = useState(null);
  const [branchPick, setBranchPick] = useState(null);
  const [branchPickList, setBranchPickList] = useState([]);

  async function loadAll() {
    setLoading(true); setError("");
    try {
      const [gateRes, salesRes, withdrawalRes, perfRes, approvalRes] = await Promise.all([
        crewApi.getAttendanceGate().catch(() => null),
        crewApi.getTodaySales().catch(() => null),
        cashWithdrawalApi.getDashboard().catch(() => null),
        crewApi.getMonthlyPerformance({}).catch(() => null),
        crewDepotTransferApi.getDepotApprovals({}).catch(() => null),
      ]);
      setData({
        gate: gateRes?.data?.data || null,
        sales: salesRes?.data?.data || null,
        withdrawals: withdrawalRes?.data?.data || null,
        performance: perfRes?.data?.data || null,
        approvals: approvalRes?.data?.data || null,
      });
    } catch (err) {
      setError(err?.message || "Gagal memuat data.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleOpenShift() {
    // Cek daftar branch crew
    try {
      const res = await crewApi.getMyBranches();
      const branches = res.data?.data || [];
      if (branches.length > 1) {
        setBranchPickList(branches);
        return; // Tampilkan modal pilih branch
      }
    } catch { /* lanjut dengan branch default */ }
    await doOpenShift(null);
  }

  async function doOpenShift(branchId) {
    setShiftLoading(true); setError(""); setBranchPick(null);
    let lat = null, lng = null;
    try {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
        });
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000 });
        });
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      }
    } catch { /* GPS skip */ }
    try {
      const payload = { openingCash: 0, lat, lng };
      if (branchId) payload.branchId = branchId;
      await cashSessionApi.openSession(payload);
      await loadAll();
      navigate("/crew/pos");
    } catch (err) {
      setError(err?.response?.data?.message || "Shift gagal dibuka.");
    } finally { setShiftLoading(false); }
  }

  async function handleCloseShift() {
    // Auto-fill closing cash dengan expected cash
    setClosingCash(String(sisaCash)); setCloseNote(""); setCloseModal(true);
  }

  async function confirmCloseShift() {
    const variance = Number(closingCash || 0) - sisaCash;
    if (Math.abs(variance) > 0 && !closeNote.trim()) {
      setError("Catat alasan selisih cash sebelum tutup shift.");
      return;
    }
    setClosingLoading(true); setError("");
    try {
      await cashSessionApi.closeSession({ closingCash: Number(closingCash || 0) });
      setCloseModal(false);
      setLastShift({ sisaCash, closingCash: Number(closingCash || 0), variance });
      setSummaryModal(true);
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Shift gagal ditutup.");
    } finally { setClosingLoading(false); }
  }

  if (loading) {
    return (
      <CrewShell title="Beranda" compactHeader>
        <div className="grid gap-3 px-1">
          <div className="erp-skeleton h-20 w-full rounded-2xl" />
          <div className="erp-skeleton h-36 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="erp-skeleton h-20 w-full rounded-2xl" />
            <div className="erp-skeleton h-20 w-full rounded-2xl" />
          </div>
          <div className="erp-skeleton h-40 w-full rounded-2xl" />
        </div>
      </CrewShell>
    );
  }

  const gate = data?.gate || {};
  const sales = data?.sales || {};
  const withdrawals = data?.withdrawals || {};
  const perf = data?.performance || {};
  const approvals = data?.approvals || {};

  const activeSession = gate?.activeSession;
  const shiftOpen = !!activeSession;

  const summary = sales?.summary || {};
  const payBd = sales?.paymentBreakdown || sales?.summary?.paymentBreakdown || {};
  const cashSales = Number(payBd.CASH || 0);
  const qrisSales = Number(payBd.QRIS || 0);
  const onlineSales = Number(payBd.GOFOOD || 0) + Number(payBd.GRABFOOD || 0) + Number(payBd.SHOPEEFOOD || 0);
  const totalSales = Number(summary.totalSales || 0);
  const totalTx = Number(summary.totalTransactions || 0);
  const totalPcs = Number(summary.totalPcs || 0);

  const wi = data?.withdrawals?.summary || {};
  const pendingWithdrawals = (wi.byStatus?.REQUESTED || 0) + (wi.byStatus?.OTP_ISSUED || 0);
  const completedWithdrawals = Number(wi.completedAmount || 0);
  const openingCash = Number(sales?.latestSession?.openingCash || 0);
  const sisaCash = Math.max(0, openingCash + cashSales - completedWithdrawals);

  const perfMetrics = perf?.metrics || {};
  const estimatedBonus = Number(perfMetrics.estimatedBonus || 0);
  const pcsToday = Number(perfMetrics.totalPcs || summary.totalPcs || 0);

  const pendingApprovals = approvals?.items?.length || 0;
  const totalAlerts = pendingWithdrawals + pendingApprovals;

  // Payment chart data
  const chartItems = [
    { label: "Tunai", value: cashSales, color: "#10b981" },
    { label: "QRIS", value: qrisSales, color: "#3b82f6" },
    { label: "GoFood", value: Number(payBd.GOFOOD || 0), color: "#f59e0b" },
    { label: "GrabFood", value: Number(payBd.GRABFOOD || 0), color: "#ef4444" },
    { label: "Shopee", value: Number(payBd.SHOPEEFOOD || 0), color: "#8b5cf6" },
  ].filter(i => i.value > 0);
  const chartTotal = chartItems.reduce((s, i) => s + i.value, 0);

  return (
    <CrewShell title="Beranda" compactHeader>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between mb-2">
          <span>{error}</span>
          <button onClick={loadAll} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <div className="grid gap-3 px-1 pb-4">
        {/* ═══ SHIFT STATUS ═══ */}
        <div className={`rounded-2xl border p-4 ${shiftOpen ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                {shiftOpen ? "Shift Aktif" : "Shift Belum Dibuka"}
              </p>
              <p className={`mt-1 text-lg font-black ${shiftOpen ? "text-green-800" : "text-yellow-800"}`}>
                {shiftOpen ? `${activeSession?.branch?.name || ""} • ${formatTime(activeSession?.openedAt)}` : "Belum ada shift hari ini"}
              </p>
            </div>
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/60 ${shiftOpen ? "text-green-600" : "text-yellow-600"}`}>
              {shiftOpen ? <CheckCircle2 size={20} /> : <Clock size={20} />}
            </div>
          </div>

          {/* Alert badges */}
          {totalAlerts > 0 && (
            <div className="flex gap-2 mt-3">
              {pendingWithdrawals > 0 && (
                <button onClick={() => navigate("/crew/cash-withdrawals")}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                  <Wallet size={13} /> {pendingWithdrawals} setoran
                </button>
              )}
              {pendingApprovals > 0 && (
                <button onClick={() => navigate("/crew/operational")}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800">
                  <Package size={13} /> {pendingApprovals} transfer
                </button>
              )}
            </div>
          )}
        </div>

        {/* ═══ SHIFT ACTIVE: QUICK ACTIONS ═══ */}
        {shiftOpen && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate("/crew/pos")}
              className="col-span-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-white text-left active:scale-[0.98] transition-transform shadow-lg">
              <ShoppingCart size={24} />
              <p className="text-lg font-black mt-1">Buka POS</p>
              <p className="text-sm text-white/80">Mulai transaksi penjualan</p>
            </button>
            <button onClick={() => navigate("/crew/cash-withdrawals")}
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left active:scale-[0.98] transition-transform">
              <DollarSign size={18} className="text-amber-600" />
              <p className="text-sm font-bold mt-1">Penarikan Cash</p>
              <p className="text-[10px] text-muted">{pendingWithdrawals} pending</p>
            </button>
            <button onClick={() => navigate("/crew/operational")}
              className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-left active:scale-[0.98] transition-transform">
              <Package size={18} className="text-blue-600" />
              <p className="text-sm font-bold mt-1">Operasional</p>
              <p className="text-[10px] text-muted">Transfer, retur, belanja</p>
            </button>
            <button onClick={() => navigate("/crew/stock-opname")}
              className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-left active:scale-[0.98] transition-transform">
              <RotateCcw size={18} className="text-purple-600" />
              <p className="text-sm font-bold mt-1">Stock Opname</p>
              <p className="text-[10px] text-muted">Cek stok fisik</p>
            </button>
            <button onClick={handleCloseShift}
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-left active:scale-[0.98] transition-transform">
              <LogOut size={18} className="text-red-600" />
              <p className="text-sm font-bold mt-1">Tutup Shift</p>
              <p className="text-[10px] text-muted">Selesai kerja</p>
            </button>
          </div>
        )}

        {/* ═══ SHIFT CLOSED: OPEN SHIFT ═══ */}
        {!shiftOpen && (
          <button onClick={handleOpenShift} disabled={shiftLoading}
            className="w-full rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white text-left active:scale-[0.98] transition-transform shadow-lg"
            style={{ minHeight: 72 }}>
            <p className="text-lg font-black">{shiftLoading ? "Membuka..." : "Buka Shift"}</p>
            <p className="text-sm text-white/80">Mulai hari kerja — GPS akan diaktifkan</p>
          </button>
        )}

        {/* ═══ TARGET PCS PROGRESS ═══ */}
        {shiftOpen && (() => {
          const targetPcs = 450;
          const pct = Math.min(100, Math.round((pcsToday / targetPcs) * 100));
          return (
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Target PCS Hari Ini</p>
                <p className={`text-sm font-black ${pct >= 100 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {pcsToday} / {targetPcs}
                </p>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted mt-1.5">
                {pct >= 100 ? "🎉 Target tercapai!" : `${100 - pct}% lagi menuju target`}
              </p>
            </div>
          );
        })()}

        {/* ═══ OMZET (clickable) ═══ */}
        <button onClick={() => navigate("/crew/sales-today")}
          className="w-full rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 text-left active:scale-[0.98] transition-transform">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Penjualan Hari Ini</p>
          <p className="mt-1 text-4xl font-black text-green-900">{formatCurrency(totalSales)}</p>
          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
            {totalTx} transaksi <ArrowRight size={12} />
          </p>
        </button>

        {/* ═══ TRANSAKSI + PCS ═══ */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Transaksi</p>
            <p className="mt-1 text-3xl font-black">{formatNumber(totalTx)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">PCS Terjual</p>
            <p className="mt-1 text-3xl font-black">{formatNumber(totalPcs)}</p>
          </div>
        </div>

        {/* ═══ PAYMENT CHART ═══ */}
        {chartItems.length > 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Metode Pembayaran</p>
            <div className="flex h-4 rounded-full overflow-hidden mb-3">
              {chartItems.map((i, idx) => (
                <div key={idx} style={{ width: (i.value / chartTotal) * 100 + "%", backgroundColor: i.color, minWidth: chartTotal > 0 ? 4 : 0 }} />
              ))}
            </div>
            <div className="space-y-1.5">
              {chartItems.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
                    <span className="text-muted">{i.label}</span>
                  </span>
                  <span className="font-semibold">{formatCurrency(i.value)} <span className="text-xs text-muted ml-1">{Math.round((i.value / chartTotal) * 100)}%</span></span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted">
            <Receipt size={20} className="mx-auto mb-1 opacity-40" />
            Belum ada transaksi hari ini
          </div>
        )}

        {/* ═══ CASH SUMMARY ═══ */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Ringkasan Cash</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted">Uang Masuk</span><span className="font-semibold text-emerald-600">{formatCurrency(cashSales + openingCash)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted">Uang Keluar</span><span className="font-semibold">{formatCurrency(completedWithdrawals)}</span></div>
            <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="font-semibold">Sisa Cash</span><span className="font-black">{formatCurrency(sisaCash)}</span></div>
          </div>
        </div>

        {/* ═══ PENDING WITHDRAWAL ═══ */}
        {pendingWithdrawals > 0 && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-yellow-800">Penarikan Menunggu</p>
                <p className="mt-1 text-xl font-black text-yellow-900">{formatCurrency(sisaCash)}</p>
                <p className="text-xs text-yellow-700 mt-0.5">Hubungi manajemen untuk verifikasi</p>
              </div>
              <Wallet size={20} className="text-yellow-600 shrink-0" />
            </div>
            <button onClick={() => navigate("/crew/cash-withdrawals")}
              className="mt-3 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold active:scale-[0.98] transition-transform">
              Lihat detail
            </button>
          </div>
        )}

        {/* ═══ BONUS ═══ */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Estimasi Bonus</p>
              <p className="mt-0.5 text-2xl font-black text-primary">{formatCurrency(estimatedBonus)}</p>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp size={14} className="text-muted" />
                <span className="text-xs text-muted">{formatNumber(pcsToday)} PCS hari ini</span>
              </div>
            </div>
            {estimatedBonus > 0 && (
              <span className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 shrink-0">Belum Dibayar</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BRANCH PICKER MODAL ═══ */}
      {branchPickList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setBranchPickList([])}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-black text-center">Pilih Tempat Tugas</p>
            <p className="text-sm text-muted text-center mt-1">Kamu punya akses ke beberapa outlet hari ini.</p>
            <div className="grid gap-2 mt-4">
              {branchPickList.map(b => (
                <button key={b.id} onClick={() => doOpenShift(b.id)}
                  className="w-full rounded-2xl border-2 border-border bg-surface p-4 text-left active:scale-[0.98] transition-transform hover:border-primary">
                  <p className="font-bold text-base">{b.name}</p>
                  <p className="text-xs text-muted">{b.code}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setBranchPickList([])} className="w-full text-center text-sm text-muted mt-3 underline">Batal</button>
          </div>
        </div>
      )}

      {/* ═══ CLOSE SHIFT MODAL ═══ */}
      <Modal open={closeModal} title="Tutup Shift" onClose={() => setCloseModal(false)} size="sm">
        <div className="grid gap-4">
          <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted">Cash Seharusnya</span><span className="font-bold">{formatCurrency(sisaCash)}</span></div>
          </div>

          <div>
            <p className="text-sm font-bold mb-1">Cash Fisik di Laci</p>
            <input type="number" className="kr-input text-2xl font-black text-center" min="0"
              style={{ fontSize: 24, padding: 16 }}
              placeholder={String(sisaCash)} value={closingCash} onChange={e => setClosingCash(e.target.value)}
              autoFocus />
          </div>

          {Number(closingCash || 0) > 0 && Number(closingCash || 0) !== sisaCash && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-bold text-amber-800">
                ⚠️ Selisih: {formatCurrency(Math.abs(Number(closingCash) - sisaCash))}
                {Number(closingCash) > sisaCash ? " (kelebihan)" : " (kekurangan)"}
              </p>
              <textarea className="w-full rounded-lg border border-amber-300 bg-white mt-2 p-2 text-xs" rows={2}
                placeholder="Catat alasan selisih (wajib)"
                value={closeNote} onChange={e => setCloseNote(e.target.value)} />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={confirmCloseShift} disabled={closingLoading}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-transform"
              style={{ minHeight: 48 }}>
              {closingLoading ? "Menutup..." : "Tutup Shift"}
            </button>
            <button onClick={() => setCloseModal(false)}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold active:scale-[0.98] transition-transform"
              style={{ minHeight: 48 }}>Batal</button>
          </div>
        </div>
      </Modal>

      {/* ═══ SHIFT SUMMARY MODAL ═══ */}
      <Modal open={summaryModal} title="Shift Selesai" onClose={() => setSummaryModal(false)} size="sm">
        <div className="grid gap-4">
          <div className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-green-500" />
            <p className="text-lg font-black mt-2">Shift Selesai</p>
          </div>
          <div className="rounded-2xl border p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted">Omzet</span><span className="font-bold">{formatCurrency(totalSales)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Transaksi</span><span className="font-bold">{totalTx}</span></div>
            <div className="flex justify-between"><span className="text-muted">PCS</span><span className="font-bold">{totalPcs}</span></div>
            <div className="border-t pt-2 mt-2" />
            <div className="flex justify-between"><span className="text-muted">Cash sistem</span><span className="font-bold">{formatCurrency(lastShift?.sisaCash || sisaCash)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Cash fisik</span><span className="font-bold">{formatCurrency(lastShift?.closingCash || 0)}</span></div>
            <div className={`flex justify-between font-black ${(lastShift?.variance || 0) !== 0 ? "text-red-600" : "text-green-600"}`}>
              <span>Selisih</span>
              <span>{formatCurrency(lastShift?.variance || 0)}</span>
            </div>
          </div>
          <button onClick={() => { setSummaryModal(false); }}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white active:scale-95 transition-transform"
            style={{ minHeight: 48 }}>Selesai</button>
        </div>
      </Modal>
    </CrewShell>
  );
}
