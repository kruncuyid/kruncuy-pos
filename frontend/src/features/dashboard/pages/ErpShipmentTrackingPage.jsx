import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import { depotTransferApi } from "../services/depotTransferApi";
import { Badge } from "../../../components/ui";
import { formatDateTime } from "../utils/reportFormatters";

export default function ErpShipmentTrackingPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await depotTransferApi.getDepotTransfers();
      setTransfers(res.data?.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <ErpShell title="Shipment Tracking" description="Lacak pengiriman barang">
      {loading ? <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      : transfers.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Belum ada pengiriman barang</div>
      ) : (
        <div className="grid gap-2">
          {transfers.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex justify-between items-start">
                <div><p className="font-semibold">{t.transferNumber || t.id.slice(0,8)}</p>
                  <p className="text-xs text-muted">{t.sourceBranch?.name || "Gudang"} → {t.targetBranch?.name}</p>
                </div>
                <Badge tone={t.status === "APPROVED" ? "success" : t.status === "PENDING_APPROVAL" ? "warning" : "neutral"}>{t.status}</Badge>
              </div>
              <p className="text-xs text-muted mt-2">{formatDateTime(t.createdAt)} • {t.items?.length || 0} item</p>
            </div>
          ))}
        </div>
      )}
    </ErpShell>
  );
}
