import { Clock3, ShieldCheck, Wallet, KeyRound, CheckCircle2, ArrowLeft, AlertTriangle, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CrewShell from "../components/CrewShell";
import { cashWithdrawalApi } from "../services/cashWithdrawalApi";
import { formatCurrency, formatDateTime } from "../../dashboard/utils/reportFormatters";

function statusBadge(s) {
  const map = {
    REQUESTED: { label: "Menunggu", cls: "bg-amber-100 text-amber-800" },
    OTP_ISSUED: { label: "Kode Dibuat", cls: "bg-blue-100 text-blue-800" },
    COMPLETED: { label: "Selesai", cls: "bg-green-100 text-green-800" },
    CANCELLED: { label: "Dibatalkan", cls: "bg-gray-100 text-gray-500" },
    EXPIRED: { label: "Kedaluwarsa", cls: "bg-red-100 text-red-700" },
  };
  return map[s] || { label: s, cls: "bg-gray-100 text-gray-600" };
}

export default function CrewCashWithdrawalsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState("");
  const [otpResult, setOtpResult] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await cashWithdrawalApi.getDashboard();
      setData(r.data.data);
    } catch (e) { setError("Gagal memuat."); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleOtp(id) {
    setGeneratingId(id); setError("");
    try {
      const r = await cashWithdrawalApi.generateOtp(id);
      setOtpResult(r.data.data);
      await load();
    } catch (e) { setError(e?.response?.data?.message || "Gagal."); } finally { setGeneratingId(""); }
  }

  const ws = data?.withdrawals || [];
  const summary = data?.summary || {};
  const openingCash = Number(data?.branch?.openingCash || data?.activeSession?.openingCash || 0);
  const todayCashSales = Number(data?.todayCashSales || 0);
  const todayExpenses = Number(data?.todayExpenses || 0);
  const completedAmount = Number(summary.completedAmount || 0);
  const pettyCash = Number(data?.minCash || 50000);
  const sisaCash = Math.max(0, openingCash + todayCashSales - todayExpenses - completedAmount);
  const bisaDisetor = Math.max(0, sisaCash - pettyCash);
  const pendingCount = (summary.byStatus?.REQUESTED || 0) + (summary.byStatus?.OTP_ISSUED || 0);

  return (
    <CrewShell title="Penarikan Cash" compactHeader>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-semibold underline">Tutup</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 px-1">
          {[1,2,3].map(i => <div key={i} className="erp-skeleton h-20 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-3 px-1 pb-4">
          {/* ═══ CASH SUMMARY — 3 Angka ═══ */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Ringkasan Cash</p>
            <div className="space-y-2">
              <Row label="Uang Masuk" value={formatCurrency(openingCash + todayCashSales)} tone="success" />
              <Row label="Uang Keluar" value={formatCurrency(todayExpenses + completedAmount)} />
              <div className="border-t border-border pt-2 mt-2" />
              <Row label="Sisa Cash" value={formatCurrency(sisaCash)} bold />
              <Row label="Uang Kembalian" value={formatCurrency(pettyCash)} />
              <div className="border-t border-dashed border-border pt-2 mt-2" />
              <Row label="Bisa Disetor" value={formatCurrency(bisaDisetor)} bold color={bisaDisetor > 0 ? "text-emerald-600" : "text-gray-400"} />
            </div>
          </div>

          {/* ═══ STATS ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-amber-700">Menunggu</p>
              <p className="text-2xl font-black text-amber-800">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-green-700">Sudah ditarik</p>
              <p className="text-2xl font-black text-green-800">{formatCurrency(completedAmount)}</p>
            </div>
          </div>

          {/* ═══ PENDING ALERT ═══ */}
          {pendingCount > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Ada {pendingCount} penarikan menunggu</p>
                <p className="text-xs text-amber-700 mt-0.5">Manajemen akan menghubungi crew untuk verifikasi.</p>
              </div>
            </div>
          )}

          {/* ═══ WITHDRAWAL LIST ═══ */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted px-0.5">
            Riwayat Setoran ({ws.length})
          </p>

          {ws.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
              <Wallet size={28} className="mx-auto mb-2 opacity-40" />
              Belum ada penarikan cash
            </div>
          ) : (
            <div className="grid gap-2">
              {ws.map((w) => {
                const badge = statusBadge(w.status);
                return (
                  <div key={w.id} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-muted">{w.withdrawalNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className="text-xl font-black mt-1">{formatCurrency(w.amount)}</p>
                        {w.note && <p className="text-xs text-muted mt-0.5">{w.note}</p>}
                      </div>
                    </div>

                    {/* REQUESTED → Buat Kode */}
                    {w.status === "REQUESTED" && (
                      <button onClick={() => handleOtp(w.id)} disabled={generatingId === w.id}
                        className="mt-3 w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white active:scale-95 transition-transform disabled:opacity-50"
                        style={{ minHeight: 48 }}>
                        {generatingId === w.id ? "Memproses..." : "Buat Kode Serah Terima"}
                      </button>
                    )}

                    {/* OTP_ISSUED → Buat Ulang */}
                    {w.status === "OTP_ISSUED" && (
                      <div className="mt-3 space-y-2">
                        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
                          <p className="text-xs font-semibold text-blue-700">Kode sudah dibuat. Berikan ke manajemen.</p>
                        </div>
                        <button onClick={() => handleOtp(w.id)} disabled={generatingId === w.id}
                          className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-bold text-amber-700 active:scale-95 transition-transform disabled:opacity-50"
                          style={{ minHeight: 44 }}>
                          {generatingId === w.id ? "Memproses..." : "Buat Ulang Kode"}
                        </button>
                      </div>
                    )}

                    {/* COMPLETED */}
                    {w.status === "COMPLETED" && (
                      <div className="mt-3 rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle2 size={16} />
                        Penarikan selesai. Cash outlet berkurang {formatCurrency(w.amount)}.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ INFO BOX ═══ */}
          <div className="rounded-2xl border border-border bg-surface p-3 text-xs text-muted space-y-1">
            <p><strong>💡 Uang Kembalian</strong> — Rp {formatCurrency(pettyCash)} harus selalu ada di laci untuk kembalian.</p>
            <p><strong>💰 Bisa Disetor</strong> — uang lebih yang bisa diambil manajemen.</p>
            <p><strong>🔑 Alur Penarikan</strong> — Crew minta → Manajemen buat kode → Crew masukkan kode → Selesai.</p>
          </div>
        </div>
      )}

      {/* ═══ OTP MODAL ═══ */}
      {otpResult && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setOtpResult(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 mx-3 mb-3 sm:mb-0 shadow-xl" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold uppercase tracking-wider text-center text-muted">Kode Serah Terima</p>
            <p className="mt-4 text-lg font-bold text-center text-gray-800">Kode telah dikirim ke manajemen</p>
            <p className="text-sm text-center text-muted mt-2">Berlaku sampai {formatDateTime(otpResult.otpExpiresAt)}</p>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mt-4 text-xs text-amber-800">
              <p className="font-bold">Instruksi:</p>
              <p className="mt-1">Minta kode serah terima dari manajemen. Masukkan kode untuk menyelesaikan penarikan.</p>
            </div>

            <button onClick={() => setOtpResult(null)}
              className="mt-4 w-full rounded-xl border bg-gray-900 py-3 text-sm font-bold text-white active:scale-95 transition-transform">
              Tutup
            </button>
          </div>
        </div>
      )}
    </CrewShell>
  );
}

function Row({ label, value, bold, tone, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm ${bold ? "font-black" : "font-semibold"} ${tone === "success" ? "text-emerald-600" : ""} ${color || ""}`}>{value}</span>
    </div>
  );
}
