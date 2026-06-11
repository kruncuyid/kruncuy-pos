import { TrendingUp, CalendarDays, Clock3, Target, Award } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui";
import CrewShell from "../components/CrewShell";
import { crewApi } from "../services/crewApi";
import { formatCurrency, formatNumber } from "../../dashboard/utils/reportFormatters";

function getMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getElapsedDays(startDate) {
  if (!startDate) return 1;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 1;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((now - start) / 86400000) + 1);
}

function formatMonthLabel(val) {
  if (!val) return "-";
  const [y, m] = val.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function getCalendarStyle(status) {
  if (status === "TARGET_HIT") return "border-green-300 bg-green-100 text-green-800";
  if (status === "NO_SALES") return "border-red-200 bg-red-50 text-red-600";
  return "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]";
}

function buildCalendarCells(days = [], monthValue) {
  const [year, month] = (monthValue || getMonthValue()).split("-").map(Number);
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0);
  const mondayIndex = (firstDate.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < mondayIndex; i += 1) cells.push(null);
  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push(days.find((item) => item.date === dateKey) || {
      date: dateKey, dayOfMonth: day, totalPcs: 0, corePcs: 0, extraSaucePcs: 0,
      totalTransactions: 0, status: "NO_SALES", attendanceCount: 0,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function MetricBox({ label, value, icon, tone = "neutral" }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center gap-2">
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          tone === "success" ? "bg-green-100 text-green-700" : tone === "primary" ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "bg-[var(--color-surface-2)] text-[var(--color-muted)]"
        }`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
          <p className="text-sm font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function CrewPerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(getMonthValue());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await crewApi.getMonthlyPerformance({ month });
        if (mounted) setData(res.data.data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || "Gagal memuat.");
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [month]);

  const metrics = data?.metrics || {};
  const calendar = data?.calendar || {};
  const days = calendar?.days || [];
  const targetMinPcs = Number(calendar?.targetMinPcs || 25);
  const bonusPerPcs = Number(calendar?.bonusPerPcs || 250);
  const bonusPerExtraSauce = Number(calendar?.bonusPerExtraSauce || 250);

  const totalPcs = Number(metrics.totalPcs || 0);
  const totalTransactions = Number(metrics.totalTransactions || 0);
  const totalSales = Number(metrics.totalSales || 0);
  const totalBonus = Number(metrics.estimatedBonus || 0);
  const attendanceCount = Number(metrics.attendanceCount || 0);
  const elapsed = getElapsedDays(calendar?.days?.[0]?.date || data?.period?.start);
  const avgPcs = elapsed > 0 ? Math.round(totalPcs / elapsed) : 0;

  // Weekly stats
  const thisWeekDays = days.filter((d) => {
    const diff = Math.abs(new Date(d.date) - new Date()) / 86400000;
    return diff <= 7;
  });
  const weekPcs = thisWeekDays.reduce((s, d) => s + Number(d.totalPcs || 0), 0);
  const weekTargetHit = thisWeekDays.filter((d) => d.status === "TARGET_HIT").length;

  const cells = useMemo(() => buildCalendarCells(days, month), [days, month]);
  const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <CrewShell title="Performa Saya" compactHeader>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-3 px-1">
        {/* Month selector */}
        <input
          type="month"
          className="kr-input w-full text-center text-base font-bold"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ fontSize: 16, padding: "12px 16px" }}
        />

        {/* Top metrics */}
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1,2,3,4].map((i) => <div key={i} className="erp-skeleton h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="PCS Bulan Ini" value={formatNumber(totalPcs)} icon={<TrendingUp size={16} />} tone="primary" />
              <MetricBox label="Hadir" value={formatNumber(attendanceCount)} icon={<CalendarDays size={16} />} />
              <MetricBox label="Target Tercapai" value={`${weekTargetHit} hari`} icon={<Target size={16} />} tone="success" />
              <MetricBox label="Transaksi" value={formatNumber(totalTransactions)} icon={<Clock3 size={16} />} />
            </div>

            {/* Weekly stats */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Minggu Ini</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black">{formatNumber(weekPcs)}</p>
                  <p className="text-xs text-[var(--color-muted)]">PCS</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{formatCurrency(weekPcs * bonusPerPcs)}</p>
                  <p className="text-xs text-[var(--color-muted)]">Estimasi bonus</p>
                </div>
              </div>
            </div>

            {/* Bonus section */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Estimasi Bonus</p>
                  <p className="mt-1 text-3xl font-black text-[var(--color-primary)]">{formatCurrency(totalBonus)}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{formatNumber(avgPcs)} PCS/hari • {formatCurrency(bonusPerPcs)}/PCS</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
                  <span className="text-xs font-semibold text-red-700">Belum Dibayarkan</span>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">Kalender Performa</p>
              <div className="grid grid-cols-7 gap-1">
                {dayLabels.map((label) => (
                  <div key={label} className="text-center text-[10px] font-semibold text-[var(--color-muted)] py-1">{label}</div>
                ))}
                {cells.map((cell, idx) => (
                  cell ? (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => setSelectedDay(cell)}
                      className={`aspect-square rounded-lg border text-center text-xs font-semibold transition-colors ${getCalendarStyle(cell.status)}`}
                    >
                      {cell.dayOfMonth}
                    </button>
                  ) : (
                    <div key={`empty-${idx}`} />
                  )
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
                <span>🟢 Target</span>
                <span>🟡 Aktif</span>
                <span>🔴 Kosong</span>
              </div>
            </div>
          </>
        )}

        <div className="h-4" />
      </div>

      {/* Day detail modal */}
      <Modal open={Boolean(selectedDay)} title={selectedDay?.date || "Detail"} onClose={() => setSelectedDay(null)} size="sm">
        {selectedDay ? (
          <div className="grid gap-3">
            <div className="rounded-2xl border bg-[var(--color-surface-2)] p-4">
              <div className="flex justify-between"><span className="text-xs text-muted">Tanggal</span><span className="font-semibold">{selectedDay.date}</span></div>
              <div className="flex justify-between mt-2"><span className="text-xs text-muted">Status</span>
                <span className={`font-semibold ${selectedDay.status === "TARGET_HIT" ? "text-green-600" : selectedDay.status === "NO_SALES" ? "text-red-600" : ""}`}>
                  {selectedDay.status === "TARGET_HIT" ? "✅ Target tercapai" : selectedDay.status === "NO_SALES" ? "❌ Tidak ada penjualan" : "🟡 Aktif"}
                </span>
              </div>
              <div className="flex justify-between mt-2"><span className="text-xs text-muted">PCS</span><span className="font-bold">{formatNumber(selectedDay.totalPcs)}</span></div>
              <div className="flex justify-between mt-2"><span className="text-xs text-muted">PCS Core</span><span className="font-semibold">{formatNumber(selectedDay.corePcs)}</span></div>
              <div className="flex justify-between mt-2"><span className="text-xs text-muted">Extra Saos</span><span className="font-semibold">{formatNumber(selectedDay.extraSaucePcs)}</span></div>
              <div className="flex justify-between mt-2"><span className="text-xs text-muted">Transaksi</span><span className="font-semibold">{formatNumber(selectedDay.totalTransactions)}</span></div>
              {selectedDay.attendanceCount > 0 ? <div className="flex justify-between mt-2"><span className="text-xs text-muted">Absensi</span><span className="font-semibold text-green-600">Hadir</span></div> : null}
              <div className="mt-3 border-t pt-3">
                <p className="text-xs font-semibold text-muted">Bonus hari ini</p>
                <p className="text-lg font-black text-primary">
                  {formatCurrency(Math.max(0, selectedDay.corePcs - targetMinPcs) * bonusPerPcs + Number(selectedDay.extraSaucePcs || 0) * bonusPerExtraSauce)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </CrewShell>
  );
}
