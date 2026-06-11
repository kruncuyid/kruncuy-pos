import { Trash2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, PageHeader, SectionHeader, Alert } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { reportApi } from "../services/reportApi";
import { formatDateTime, formatNumber } from "../utils/reportFormatters";

function formatQty(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? formatNumber(num) : num.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

export default function ErpWastePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await reportApi.getReport("inventory-movement", { limit: 200 });
      setItems((res.data?.data?.rows || []).filter((m) => m.type === "WASTE"));
    } catch (err) { setError(err?.response?.data?.message); } finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((m) => !q || m.itemName?.toLowerCase().includes(q) || m.notes?.toLowerCase().includes(q));
  }, [items, search]);

  const cols = useMemo(() => [
    { key: "createdAt", label: "Tanggal", render: (r) => <span className="text-xs">{formatDateTime(r.createdAt)}</span> },
    { key: "itemName", label: "Item", render: (r) => <span className="font-medium">{r.itemName}</span> },
    { key: "quantity", label: "Qty", render: (r) => <span className="font-semibold text-red-600">{formatQty(Math.abs(Number(r.quantity || 0)))}</span> },
    { key: "branchName", label: "Branch" },
    { key: "notes", label: "Catatan" },
  ], []);

  return (
    <ErpShell title="Waste Management" description="Barang rusak dan terbuang.">
      <PageHeader title="Waste Management" description="Barang rusak, kadaluarsa, atau terbuang." badge="New"
        onRefresh={loadData} loading={loading} />
      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <SectionHeader title="Riwayat Waste" description={`${filtered.length} catatan`} />
          <Input placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} className="max-w-xs" />
        </div>
        <div className="mt-4"><ManagementTable columns={cols} rows={filtered} emptyText="Belum ada waste tercatat." /></div>
      </Card>
    </ErpShell>
  );
}
