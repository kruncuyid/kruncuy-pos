import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import { erpOverviewApi } from "../services/erpOverviewApi";
import { StatCard, Badge, Card } from "../../../components/ui";
import { formatCurrency, formatNumber } from "../utils/reportFormatters";
import { Store, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Package } from "lucide-react";

export default function ErpCrossBranchPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await erpOverviewApi.getCrossBranch();
      setData(res.data.data);
    } catch (_) {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const summary = data?.summary || {};
  const rows = data?.rows || [];

  if (loading) return (
    <ErpShell title="Cross Branch" description="Perbandingan performa semua outlet">
      <div className="grid gap-3">{[1,2,3,4].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
    </ErpShell>
  );

  return (
    <ErpShell title="Cross Branch" description="Perbandingan performa semua outlet">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="Outlet Aktif" value={`${summary.activeBranches || 0}/${summary.totalBranches || 0}`} icon={<Store size={20} />} />
        <StatCard title="Total Sales Hari Ini" value={formatCurrency(summary.totalSales || 0)} icon={<DollarSign size={20} />} delta={`${(summary.totalPcs || 0)} PCS`} />
        <StatCard title="Total Transaksi" value={formatNumber(summary.totalTransactions || 0)} icon={<TrendingUp size={20} />} />
        <StatCard title="Outlet Stok Menipis" value={formatNumber(summary.branchesWithLowStock || 0)} icon={<AlertTriangle size={20} />} tone={summary.branchesWithLowStock > 0 ? "warning" : "success"} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-[var(--color-muted)]">
          Belum ada data branch.
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((b) => (
            <div key={b.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{b.name}</span>
                    {b.hasActiveSession ? <Badge tone="success">Buka</Badge> : <Badge tone="neutral">Tutup</Badge>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[var(--color-muted)]">Sales</p>
                      <p className="font-black">{formatCurrency(b.todaySales)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[var(--color-muted)]">PCS</p>
                      <p className="font-black">{formatNumber(b.todayPcs)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[var(--color-muted)]">Transaksi</p>
                      <p className="font-black">{formatNumber(b.transactionCount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[var(--color-muted)]">Growth</p>
                      <p className={`font-black flex items-center gap-1 ${b.growth > 0 ? "text-green-600" : b.growth < 0 ? "text-red-600" : ""}`}>
                        {b.growth > 0 ? <TrendingUp size={14} /> : b.growth < 0 ? <TrendingDown size={14} /> : null}
                        {b.growth > 0 ? "+" : ""}{b.growth}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-[var(--color-muted)]">
                    <span>💰 Cash: {formatCurrency(b.cashSales)}</span>
                    <span>📦 Stok menipis: {b.lowStockItems} item</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ErpShell>
  );
}
