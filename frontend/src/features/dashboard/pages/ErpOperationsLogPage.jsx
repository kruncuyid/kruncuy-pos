import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import { auditLogApi } from "../services/auditLogApi";
import { Badge } from "../../../components/ui";
import { formatDateTime } from "../utils/reportFormatters";

export default function ErpOperationsLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await auditLogApi.getAuditLogs({ page: 1, limit: 30 });
      setLogs(res.data?.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <ErpShell title="Operations Log" description="Catatan aktivitas operasional">
      {loading ? <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Belum ada log operasional</div>
      ) : (
        <div className="grid gap-1">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-border bg-surface p-3 flex items-start gap-3">
              <Badge tone={log.action?.includes("CREATE") ? "success" : log.action?.includes("DELETE") ? "danger" : "info"}>{log.action?.slice(0, 12)}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{log.description || log.entity}</p>
                <p className="text-xs text-muted">{log.performedBy?.name} • {log.branch?.name} • {formatDateTime(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ErpShell>
  );
}
