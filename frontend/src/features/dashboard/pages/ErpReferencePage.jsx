import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import api from "../../../core/api/api";
import { Card } from "../../../components/ui";

export default function ErpReferencePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/master-data/reference-data").then(r => setData(r.data?.data || r.data)).catch(() => {});
  }, []);

  return (
    <ErpShell title="Master Reference" description="Referensi sistem tambahan">
      {data ? Object.entries(data).slice(0, 5).map(([key, value]) => (
        <Card key={key} className="p-4 mb-3">
          <p className="text-xs font-semibold uppercase text-muted mb-1">{key}</p>
          <p className="text-sm">{Array.isArray(value) ? `${value.length} item` : String(value).slice(0, 100)}</p>
        </Card>
      )) : (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Data referensi belum tersedia.</div>
      )}
    </ErpShell>
  );
}
