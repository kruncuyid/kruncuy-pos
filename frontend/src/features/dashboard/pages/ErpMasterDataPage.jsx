import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import api from "../../../core/api/api";
import { Card, Badge } from "../../../components/ui";

export default function ErpMasterDataPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/master-data/reference-data");
      setData(res.data?.data || res.data);
    } catch (_) {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <ErpShell title="Master Data" description="Referensi sistem">
      {loading ? <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      : data ? (
        <div className="grid gap-3">
          {Object.entries(data).map(([key, value]) => (
            <Card key={key} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{key}</p>
              {Array.isArray(value) ? value.slice(0, 10).map((item, i) => (
                <div key={i} className="flex justify-between py-1 text-sm border-b border-border last:border-0">
                  <span>{item.name || item.code || item}</span>
                  <span className="text-muted">{item.code || ""}</span>
                </div>
              )) : <pre className="text-xs text-muted">{JSON.stringify(value, null, 2).slice(0, 500)}</pre>}
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">
          Data referensi belum tersedia. Tambahkan data master terlebih dahulu.
        </div>
      )}
    </ErpShell>
  );
}
