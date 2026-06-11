import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import { notificationApi } from "../services/notificationApi";
import { Badge } from "../../../components/ui";
import { AlertTriangle, DollarSign, ShoppingCart, Bell } from "lucide-react";
import { formatDateTime, formatCurrency } from "../utils/reportFormatters";

const ICONS = {
  stock_alert: <AlertTriangle size={16} />,
  withdrawal_pending: <DollarSign size={16} />,
  expense_pending: <ShoppingCart size={16} />,
};

const SEVERITY_COLORS = {
  critical: "danger",
  warning: "warning",
  info: "info",
};

export default function ErpNotificationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      setData(res.data.data);
    } catch (_) {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const items = data?.items || [];
  const byType = data?.byType || {};

  return (
    <ErpShell title="Notification Center" description="Notifikasi dan alert operasional">
      {loading ? (
        <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-xs font-semibold text-red-700">Stok Alert</p>
              <p className="text-2xl font-black text-red-800">{byType.stock_alert || 0}</p>
            </div>
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-center">
              <p className="text-xs font-semibold text-yellow-700">Pending Withdrawal</p>
              <p className="text-2xl font-black text-yellow-800">{byType.withdrawal_pending || 0}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-xs font-semibold text-blue-700">Pending Expense</p>
              <p className="text-2xl font-black text-blue-800">{byType.expense_pending || 0}</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-[var(--color-muted)]">
              <Bell size={24} className="mx-auto mb-2 opacity-50" />
              Tidak ada notifikasi.
            </div>
          ) : (
            <div className="grid gap-2">
              {items.map((n, i) => (
                <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex items-start gap-3">
                  <div className={`mt-0.5 ${n.severity === "critical" ? "text-red-500" : n.severity === "warning" ? "text-yellow-500" : "text-blue-500"}`}>
                    {ICONS[n.type] || <Bell size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{n.title}</span>
                      <Badge tone={SEVERITY_COLORS[n.severity] || "info"}>{n.severity}</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">{n.description}</p>
                    <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{formatDateTime(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </ErpShell>
  );
}
