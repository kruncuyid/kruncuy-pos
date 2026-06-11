import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import { purchaseRequestApi } from "../services/purchaseRequestApi";
import { purchaseOrderApi } from "../services/purchaseOrderApi";
import { Badge, Tabs } from "../../../components/ui";
import { formatCurrency, formatDateTime } from "../utils/reportFormatters";

export default function ErpPurchasingQueuePage() {
  const [prs, setPrs] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [prRes, poRes] = await Promise.all([
        purchaseRequestApi.list({ status: "SUBMITTED" }).catch(() => null),
        purchaseOrderApi.list({ status: "SENT" }).catch(() => null),
      ]);
      setPrs(prRes?.data?.data || []);
      setPos(poRes?.data?.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const tabs = [
    { key: "pr", label: `Purchase Request (${prs.length})`, content: (
      <div className="grid gap-2">
        {prs.length === 0 ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Tidak ada PR menunggu approval</div>
        : prs.map((pr) => (
          <div key={pr.id} className="rounded-2xl border border-border bg-surface p-3 flex justify-between items-center">
            <div><p className="font-semibold text-sm">{pr.prNumber}</p><p className="text-xs text-muted">{pr.branch?.name} • {formatDateTime(pr.createdAt)}</p></div>
            <Badge tone={pr.status === "SUBMITTED" ? "warning" : "success"}>{pr.status}</Badge>
          </div>
        ))}
      </div>
    )},
    { key: "po", label: `Purchase Order (${pos.length})`, content: (
      <div className="grid gap-2">
        {pos.length === 0 ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Tidak ada PO menunggu</div>
        : pos.map((po) => (
          <div key={po.id} className="rounded-2xl border border-border bg-surface p-3 flex justify-between items-center">
            <div><p className="font-semibold text-sm">{po.poNumber}</p><p className="text-xs text-muted">{po.branch?.name} • {formatCurrency(po.totalAmount || 0)}</p></div>
            <Badge tone={po.status === "APPROVED" ? "success" : "warning"}>{po.status}</Badge>
          </div>
        ))}
      </div>
    )},
  ];

  return (
    <ErpShell title="Purchasing Queue" description="Antrian approval">
      {loading ? <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      : <Tabs tabs={tabs} defaultTab="pr" />}
    </ErpShell>
  );
}
