import { History, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
  SectionHeader,
  Alert,
} from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import { auditLogApi } from "../services/auditLogApi";
import { formatDateTime } from "../utils/reportFormatters";

function getActionTone(action) {
  const upper = (action || "").toUpperCase();
  if (upper === "CREATE") return "success";
  if (upper === "UPDATE" || upper === "ISSUE_OTP") return "info";
  if (upper === "DELETE" || upper === "CANCEL" || upper === "VOID") return "danger";
  if (upper === "COMPLETE" || upper === "APPROVE") return "success";
  if (upper === "LOGIN") return "neutral";
  return "neutral";
}

export default function ErpAuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const response = await auditLogApi.getAuditLogs({ limit: 200 });
      setLogs(response.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(
      (log) =>
        (log.action || "").toLowerCase().includes(q) ||
        (log.entity || "").toLowerCase().includes(q) ||
        (log.description || "").toLowerCase().includes(q) ||
        (log.performedBy?.name || "").toLowerCase().includes(q) ||
        (log.branch?.name || "").toLowerCase().includes(q) ||
        (log.entityId || "").toLowerCase().includes(q)
    );
  }, [logs, search]);

  const entities = useMemo(() => {
    const set = new Set(logs.map((log) => log.entity).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const actions = useMemo(() => {
    const set = new Set(logs.map((log) => log.action).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  return (
    <ErpShell title="Audit Logs" description="Jejak aktivitas perubahan penting di sistem.">
      <PageHeader
        title="Audit Logs"
        description="Catatan setiap perubahan penting di sistem ERP — siapa melakukan apa, kapan, dan di branch mana."
        badge="Read-only"
        onRefresh={loadData}
        loading={loading}
      />

      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeader
            title="Aktivitas sistem"
            description={loading ? "Memuat..." : `${filteredLogs.length} log ditemukan`}
          />
          <div className="flex flex-wrap gap-2">
            {entities.length > 0 ? (
              <select
                className="kr-input w-auto text-xs"
                value=""
                onChange={(event) => {
                  if (event.target.value) setSearch(event.target.value);
                }}
              >
                <option value="">Semua entity</option>
                {entities.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            ) : null}
            <Input
              placeholder="Cari log..."
              icon={<Search size={16} />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="erp-skeleton h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Belum ada log"
              description="Tidak ada aktivitas yang tercatat. Log akan muncul saat ada perubahan data di sistem."
              icon={<History size={20} />}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-2)]/80"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-surface)]">
                  <ShieldCheck size={16} className="text-[var(--color-muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={getActionTone(log.action)}>{log.action}</Badge>
                    <span className="text-sm font-medium">{log.entity}</span>
                    {log.entityId ? (
                      <span className="text-xs text-[var(--color-muted)]">#{log.entityId.slice(0, 8)}</span>
                    ) : null}
                  </div>
                  {log.description ? (
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{log.description}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                    <span>{log.performedBy?.name || log.performedBy?.username || "System"}</span>
                    {log.branch ? <span>• {log.branch.name}</span> : null}
                    <span>• {formatDateTime(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </ErpShell>
  );
}
