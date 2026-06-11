import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DatabaseZap, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  CartesianGrid, Legend, ComposedChart,
} from "recharts";
import { Button, Card } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import { formatCurrency, formatNumber } from "../utils/reportFormatters";
import { erpApi } from "../services/erpApi";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
const COLORS_BAR = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
const PMT_LABELS = { CASH: "Tunai", QRIS: "QRIS", GOFOOD: "GoFood", GRABFOOD: "GrabFood", SHOPEEFOOD: "Shopee" };
const PMT_COLORS = { CASH: "#10b981", QRIS: "#3b82f6", GOFOOD: "#f59e0b", GRABFOOD: "#ef4444", SHOPEEFOOD: "#8b5cf6" };

function fmt(v) { return v >= 0 ? "+" + v + "%" : v + "%"; }

export default function ErpDashboard() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get("branchId") || "";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dateFilter, setDateFilter] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const params = {};
      if (branchId) params.branchId = branchId;
      if (dateFilter) {
        params.date = dateFilter;
      }
      const r = await erpApi.getDashboard(params);
      setData(r.data.data);
    } catch (e) { setError(e?.response?.data?.message || "Gagal"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [branchId, dateFilter]);

  const s = data?.summary || {};
  const snaps = data?.branchSnapshots || [];
  const daily = data?.dailySales || [];

  // ── NEW: Channel breakdown + PCS target ──
  const ch = data?.channelBreakdown || {};
  const totalOmzet = Number(ch.offline || 0) + Number(ch.online || 0);
  const pcsTarget = data?.pcsTarget || { total: 0, achieved: 0, remaining: 0, percentage: 0 };
  const pct = pcsTarget.total > 0 ? pcsTarget.percentage : 0;
  const achieved = pct >= 100;

  // ── DERIVED DATA ──
  const pmt = s.paymentBreakdown || {};
  const pieData = Object.entries(pmt).filter(([, v]) => Number(v) > 0).map(([k, v]) => ({ name: PMT_LABELS[k] || k, value: Number(v), key: k }));

  const branchBars = [...snaps].sort((a, b) => Number(b.totals.totalSales) - Number(a.totals.totalSales));
  const maxSales = Math.max(...branchBars.map(d => Number(d.totals.totalSales || 0)), 1);

  const avgTx = s.totalTransactions > 0 ? Math.round(s.totalSales / s.totalTransactions) : 0;
  const todaySales = Number(s.totalSales || 0);
  const yesterdaySales = daily.length > 1 ? daily[daily.length - 2].sales : 0;
  const dailyGrowth = yesterdaySales > 0 ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : null;

  // PCS by branch
  const pcsBranch = branchBars.filter(b => Number(b.totals.totalPcs) > 0);
  const totalPcsAll = pcsBranch.reduce((a, b) => a + Number(b.totals.totalPcs), 0);

  return (
    <ErpShell>
      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">KRUNCUY POS • Executive Dashboard</p>
          <h1 className="text-2xl font-black tracking-tight mt-0.5">
            {branchId ? data?.selectedBranch?.name || "Branch" : "Ringkasan Semua Cabang"}
            {data?.selectedDate && <span className="text-base font-semibold text-muted ml-2">— {data.selectedDate}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="kr-input h-10 text-sm w-[150px]" value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            placeholder="Pilih tanggal" />
          <select className="kr-input h-10 text-sm min-w-[130px]" value={branchId}
            onChange={e => setParams(e.target.value ? { branchId: e.target.value } : {})}>
            <option value="">Semua Cabang</option>
            {(data?.branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={load}><DatabaseZap size={14} /></Button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* ═══════ KPI ROW — 2 BIG CARDS ═══════ */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Card 1: Total Omzet — Online vs Offline */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Total Omzet Hari Ini</p>
          {loading ? <div className="erp-skeleton h-12 w-48 mt-2 rounded-xl" />
            : <p className="text-3xl font-black mt-1">{formatCurrency(totalOmzet)}</p>}
          <p className="text-xs text-muted mt-1">{formatNumber(s.totalTransactions)} transaksi</p>
          <div className="mt-4 space-y-2.5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="font-medium">Offline</span>
                </span>
                <span className="font-bold">{formatCurrency(ch.offline || 0)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: (totalOmzet > 0 ? ((ch.offline || 0) / totalOmzet) * 100 : 0) + "%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                  <span className="font-medium">Online</span>
                </span>
                <span className="font-bold">{formatCurrency(ch.online || 0)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-orange-400 transition-all"
                  style={{ width: (totalOmzet > 0 ? ((ch.online || 0) / totalOmzet) * 100 : 0) + "%" }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted">
            <span>Offline: <strong className="text-blue-600">{totalOmzet > 0 ? Math.round(((ch.offline || 0) / totalOmzet) * 100) : 0}%</strong></span>
            <span>Online: <strong className="text-orange-600">{totalOmzet > 0 ? Math.round(((ch.online || 0) / totalOmzet) * 100) : 0}%</strong></span>
          </div>
        </div>

        {/* Card 2: PCS Terjual vs Target */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">PCS Terjual vs Target</p>
          {loading ? <div className="erp-skeleton h-12 w-48 mt-2 rounded-xl" />
            : <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black">{formatNumber(pcsTarget.achieved)}</span>
                <span className="text-lg font-semibold text-muted">/ {formatNumber(pcsTarget.total)}</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${achieved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {achieved ? "+" + formatNumber(Math.abs(pcsTarget.achieved - pcsTarget.total)) : "-" + formatNumber(pcsTarget.remaining)}
                </span>
              </div>}
          <p className="text-xs text-muted mt-1">Target gabungan {pcsTarget.branches || s.branchCount} cabang</p>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{Math.min(100, pct)}% tercapai</span>
              <span className="font-bold">{formatNumber(pcsTarget.remaining)} sisa</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${achieved ? "bg-emerald-500" : "bg-blue-500"}`}
                style={{ width: Math.min(100, pct) + "%" }} />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted">
            <span>Progress: <strong className={achieved ? "text-emerald-600" : "text-blue-600"}>{pct}%</strong></span>
            <span>Total 7 hari: <strong>{formatCurrency(s.thisWeekSales)}</strong></span>
            {s.growthPercent !== null && (
              <span className={s.growthPercent >= 0 ? "text-emerald-600" : "text-red-600"}>
                {fmt(s.growthPercent)} vs minggu lalu
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ CHARTS ROW 1 — TREND + PAYMENT ═══════ */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* ── Daily Trend: Sales (bar) + PCS (line) ── */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Tren Harian</p>
              <h3 className="text-base font-black">Penjualan & PCS 7 Hari</h3>
            </div>
            {s.growthPercent !== null && (
              <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${s.growthPercent >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {s.growthPercent >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {fmt(s.growthPercent)} mingguan
              </div>
            )}
          </div>
          {loading ? <div className="erp-skeleton h-52 w-full rounded-2xl" />
            : daily.length === 0 ? <div className="flex h-52 items-center justify-center text-sm text-muted">Belum ada data</div>
            : <ResponsiveContainer width="100%" height={215}>
                <ComposedChart data={daily} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, n) => n === "sales" ? formatCurrency(v) : formatNumber(v)} labelFormatter={(l, p) => p?.[0]?.payload?.date || l} />
                  <Legend wrapperStyle={{ fontSize: 11, marginTop: 5 }} />
                  <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} name="Sales" />
                  <Line yAxisId="right" dataKey="pcs" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} name="PCS" />
                </ComposedChart>
              </ResponsiveContainer>}
          <div className="flex justify-between mt-2 text-[10px] text-muted px-1">
            <span>Total 7h: {formatCurrency(daily.reduce((a, d) => a + d.sales, 0))}</span>
            <span>Rata-rata: {formatCurrency(Math.round(daily.reduce((a, d) => a + d.sales, 0) / (daily.length || 1)))}/hari</span>
            <span>Total PCS: {formatNumber(daily.reduce((a, d) => a + d.pcs, 0))}</span>
          </div>
        </Card>

        {/* ── Payment Donut ── */}
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Metode Pembayaran</p>
          <h3 className="text-base font-black mb-1">Breakdown Hari Ini</h3>
          {loading ? <div className="erp-skeleton h-52 w-full rounded-2xl" />
            : pieData.length === 0 ? <div className="flex h-52 items-center justify-center text-sm text-muted">Belum ada transaksi</div>
            : <ResponsiveContainer width="100%" height={205}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={82} paddingAngle={3} dataKey="value">
                    {pieData.map((e) => <Cell key={e.key} fill={PMT_COLORS[e.key] || "#999"} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>}
          {pieData.length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
              {pieData.map(d => (
                <div key={d.key} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PMT_COLORS[d.key] || "#999" }} />
                  <span className="text-muted truncate">{d.name}</span>
                  <span className="font-semibold ml-auto">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ═══════ CHARTS ROW 2 — TX TREND + BRANCH BARS + PCS PIE ═══════ */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* ── Transaction Trend ── */}
        <Card className="p-4 lg:col-span-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Tren Transaksi</p>
          <h3 className="text-base font-black mb-3">Per Hari</h3>
          {loading ? <div className="erp-skeleton h-36 w-full rounded-2xl" />
            : daily.length === 0 ? <div className="flex h-36 items-center justify-center text-sm text-muted">—</div>
            : <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={daily} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatNumber(v)} />
                  <Area type="monotone" dataKey="tx" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>}
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>Total: {formatNumber(daily.reduce((a, d) => a + d.tx, 0))}</span>
            <span>Rata: {formatNumber(Math.round(daily.reduce((a, d) => a + d.tx, 0) / (daily.length || 1)))}/hari</span>
          </div>
        </Card>

        {/* ── Branch Sales Bars ── */}
        <Card className="p-4 lg:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Per Cabang</p>
          <h3 className="text-base font-black mb-3">Sales per Outlet</h3>
          {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-6 w-full rounded-lg" />)}</div>
            : branchBars.length === 0 ? <div className="flex h-40 items-center justify-center text-sm text-muted">—</div>
            : <div className="space-y-2.5">
                {branchBars.map((d, i) => {
                  const pct = maxSales > 0 ? (Number(d.totals.totalSales) / maxSales) * 100 : 0;
                  return (
                    <div key={d.branch.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className={`h-2 w-2 rounded-full ${d.status === "OPEN" ? "bg-emerald-500" : "bg-gray-300"}`} />
                          <span className="font-medium truncate">{d.branch.name}</span>
                        </span>
                        <span className="font-bold text-muted shrink-0 ml-2">{formatCurrency(d.totals.totalSales)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + "%", background: COLORS_BAR[i % COLORS_BAR.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>}
        </Card>

        {/* ── PCS by Branch (small donut) ── */}
        <Card className="p-4 lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Distribusi PCS</p>
          <h3 className="text-base font-black mb-1">Per Cabang</h3>
          {loading ? <div className="erp-skeleton h-36 w-full rounded-2xl" />
            : pcsBranch.length === 0 ? <div className="flex h-36 items-center justify-center text-sm text-muted">—</div>
            : <div className="flex items-center gap-4">
                <ResponsiveContainer width="45%" height={150}>
                  <PieChart>
                    <Pie data={pcsBranch.map(b => ({ name: b.branch.name, value: Number(b.totals.totalPcs) }))}
                      cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                      {pcsBranch.map((_, i) => <Cell key={i} fill={COLORS_BAR[i % COLORS_BAR.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 min-w-0 space-y-1.5">
                  {pcsBranch.slice(0, 5).map((b, i) => (
                    <div key={b.branch.id} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: COLORS_BAR[i % COLORS_BAR.length] }} />
                      <span className="truncate text-muted">{b.branch.name}</span>
                      <span className="font-semibold ml-auto">{formatNumber(b.totals.totalPcs)}</span>
                    </div>
                  ))}
                </div>
              </div>}
        </Card>
      </div>

      {/* ═══════ BOTTOM ROW — GROWTH + SNAPSHOTS ═══════ */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* ── Weekly Growth ── */}
        <Card className="p-4 lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Pertumbuhan</p>
          <h3 className="text-base font-black mb-3">Mingguan</h3>
          {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="erp-skeleton h-10 w-full rounded-xl" />)}</div>
            : <>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted">Minggu ini</span>
                    <span className="font-bold">{formatCurrency(s.thisWeekSales)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: Math.min(100, (s.thisWeekSales / (s.prevWeekSales || 1)) * 100) + "%" }} />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted">Minggu lalu</span>
                    <span className="font-bold">{formatCurrency(s.prevWeekSales)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gray-400" style={{ width: "100%" }} />
                  </div>
                </div>
                {s.growthPercent !== null && (
                  <div className={`flex items-center justify-center gap-1.5 rounded-xl p-3 text-sm font-bold ${s.growthPercent >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {s.growthPercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {fmt(s.growthPercent)} vs minggu lalu
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-muted">Tertinggi</p>
                    <p className="text-sm font-black mt-0.5">
                      {daily.length > 0 ? formatCurrency(Math.max(...daily.map(d => d.sales))) : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-muted">Terendah</p>
                    <p className="text-sm font-black mt-0.5">
                      {daily.length > 0 ? formatCurrency(Math.min(...daily.map(d => d.sales))) : "—"}
                    </p>
                  </div>
                </div>
              </>}
        </Card>

        {/* ── Branch Snapshots ── */}
        <Card className="p-4 lg:col-span-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Status Cabang</p>
              <h3 className="text-base font-black">Real-time</h3>
            </div>
            {data?.refreshedAt && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted">{new Date(data.refreshedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
          </div>
          {loading ? <div className="grid grid-cols-2 gap-2">{[1,2,3,4].map(i => <div key={i} className="erp-skeleton h-20 w-full rounded-2xl" />)}</div>
            : snaps.length === 0 ? <div className="flex h-32 items-center justify-center text-sm text-muted">Belum ada data</div>
            : <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-semibold uppercase tracking-wider text-muted border-b border-border">
                      <th className="text-left py-2 px-2">Cabang</th>
                      <th className="text-right py-2 px-2">Sales</th>
                      <th className="text-right py-2 px-2">PCS</th>
                      <th className="text-right py-2 px-2">Tx</th>
                      <th className="text-right py-2 px-2 pr-4">Cash</th>
                      <th className="text-right py-2 px-2">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {snaps.map((s, i) => {
                      const pct = todaySales > 0 ? Math.round((Number(s.totals.totalSales) / todaySales) * 100) : 0;
                      return (
                        <tr key={s.branch.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full shrink-0 ${s.status === "OPEN" ? "bg-emerald-500" : "bg-gray-300"}`} />
                              <span className="font-medium truncate max-w-[130px]">{s.branch.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-2.5 px-2 font-bold">{formatCurrency(s.totals.totalSales)}</td>
                          <td className="text-right py-2.5 px-2">{formatNumber(s.totals.totalPcs)}</td>
                          <td className="text-right py-2.5 px-2">{formatNumber(s.totals.totalTransactions)}</td>
                          <td className="text-right py-2.5 px-2 pr-4 font-semibold">{formatCurrency(s.totals.totalCashEnd)}</td>
                          <td className="text-right py-2.5 px-2">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                                <div className="h-full rounded-full" style={{ width: pct + "%", background: COLORS_BAR[i % COLORS_BAR.length] }} />
                              </div>
                              <span className="text-[11px] text-muted w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>}
        </Card>
      </div>
    </ErpShell>
  );
}
