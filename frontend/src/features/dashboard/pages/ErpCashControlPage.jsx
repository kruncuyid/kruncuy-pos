import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import { erpOverviewApi } from "../services/erpOverviewApi";
import { Card, Badge } from "../../../components/ui";
import { formatCurrency, formatDateTime } from "../utils/reportFormatters";

export default function ErpCashControlPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await erpOverviewApi.getCashSessions();
      setSessions(res.data?.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <ErpShell title="Cash Control" description="Monitor cash outlet">
      {loading ? <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Belum ada data cash session</div>
      ) : (
        <div className="grid gap-2">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{s.branch?.name || "-"}</p>
                  <p className="text-xs text-muted">{s.user?.name} • {formatDateTime(s.openedAt)}</p>
                </div>
                <Badge tone={s.status === "OPEN" ? "success" : "neutral"}>{s.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div><p className="text-[10px] font-semibold uppercase text-muted">Opening</p><p className="font-black">{formatCurrency(s.openingCash)}</p></div>
                <div><p className="text-[10px] font-semibold uppercase text-muted">Closing</p><p className="font-black">{formatCurrency(s.closingCash || 0)}</p></div>
                <div><p className="text-[10px] font-semibold uppercase text-muted">Expected</p><p className="font-black">{formatCurrency(s.expectedCash || 0)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ErpShell>
  );
}
