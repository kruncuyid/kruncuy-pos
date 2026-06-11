import ErpShell from "../components/ErpShell";
import { auditLogApi } from "../services/auditLogApi";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { formatDateTime } from "../utils/reportFormatters";

export default function ErpCompliancePage() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    auditLogApi.getAuditLogs({ page: 1, limit: 20 }).then(r => setLogs(r.data?.data || [])).catch(() => {});
  }, []);

  return (
    <ErpShell title="Compliance" description="Kepatuhan operasional">
      <div className="rounded-2xl border border-border bg-surface p-4 mb-4">
        <div className="flex items-center gap-3"><ShieldCheck size={20} className="text-green-600" />
          <div><p className="font-semibold">Audit Trail Aktif</p><p className="text-xs text-muted">Semua perubahan penting dicatat</p></div>
        </div>
      </div>
      <div className="grid gap-1">
        {logs.slice(0, 10).map((log) => (
          <div key={log.id} className="rounded-xl border border-border bg-surface p-3 text-sm flex justify-between">
            <span className="font-medium">{log.action}</span>
            <span className="text-xs text-muted">{formatDateTime(log.createdAt)}</span>
          </div>
        ))}
      </div>
    </ErpShell>
  );
}
