import { ClipboardCheck, ClipboardList, Search, Eye, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Drawer, Input, PageHeader, SectionHeader, StatCard, Alert, Tabs } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import { branchApi } from "../services/branchApi";
import { reportApi } from "../services/reportApi";
import { formatDateTime, formatNumber, formatDateOnly } from "../utils/reportFormatters";

function formatQty(v) {
  const n = Number(v || 0);
  return Number.isInteger(n) ? formatNumber(n) : n.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

function varianceTone(v) {
  if (v === 0) return "neutral";
  return v > 0 ? "warning" : "danger";
}

export default function ErpStockOpnamePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [activeTab, setActiveTab] = useState("opening");
  const [openingRows, setOpeningRows] = useState([]);
  const [closingRows, setClosingRows] = useState([]);
  const [varianceRows, setVarianceRows] = useState([]);
  const [openingSummary, setOpeningSummary] = useState(null);
  const [closingSummary, setClosingSummary] = useState(null);
  const [varianceSummary, setVarianceSummary] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    branchId: "ALL",
    search: "",
  });
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [opnameDetail, setOpnameDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function getDefaultRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10),
    };
  }

  async function loadBranches() {
    try {
      const res = await branchApi.getBranches();
      setBranches(res.data?.data || []);
    } catch (_) {}
  }

  async function loadAll(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = { startDate: nextFilters.startDate, endDate: nextFilters.endDate };
      if (nextFilters.branchId !== "ALL") params.branchId = nextFilters.branchId;

      const [openRes, closeRes, varRes] = await Promise.all([
        reportApi.getReport("stock-opname-opening", params),
        reportApi.getReport("stock-opname-closing", params),
        reportApi.getReport("stock-opname-variance", params),
      ]);

      setOpeningRows(openRes.data?.data?.rows || []);
      setOpeningSummary(openRes.data?.data?.summary || null);
      setClosingRows(closeRes.data?.data?.rows || []);
      setClosingSummary(closeRes.data?.data?.summary || null);
      setVarianceRows(varRes.data?.data?.rows || []);
      setVarianceSummary(varRes.data?.data?.summary || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat stock opname.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBranches(); }, []);
  useEffect(() => { loadAll(); }, []);

  const currentRows = useMemo(() => {
    const rows = activeTab === "opening" ? openingRows : activeTab === "closing" ? closingRows : varianceRows;
    const q = filters.search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.branchName || "").toLowerCase().includes(q) ||
      (r.performedBy || "").toLowerCase().includes(q) ||
      (r.itemName || "").toLowerCase().includes(q) ||
      (r.kind || "").toLowerCase().includes(q)
    );
  }, [activeTab, openingRows, closingRows, varianceRows, filters.search]);

  const currentSummary = activeTab === "opening" ? openingSummary : activeTab === "closing" ? closingSummary : varianceSummary;

  const metrics = useMemo(() => {
    if (activeTab === "variance") {
      const s = varianceSummary || {};
      return [
        { title: "Item diopname", value: loading ? "-" : formatNumber(s.itemCount || 0), icon: ClipboardList },
        { title: "Selisih positif", value: loading ? "-" : formatNumber(s.positiveVariance || 0), icon: AlertTriangle },
        { title: "Selisih negatif", value: loading ? "-" : formatNumber(s.negativeVariance || 0), icon: AlertTriangle },
        { title: "Total abs. selisih", value: loading ? "-" : formatQty(s.totalAbsVariance || 0), icon: ClipboardCheck },
      ];
    }
    const s = currentSummary || {};
    return [
      { title: `${activeTab === "opening" ? "Opening" : "Closing"} opname`, value: loading ? "-" : formatNumber(s.opnameCount || 0), icon: ClipboardList },
      { title: "Selesai", value: loading ? "-" : formatNumber(s.completedCount || 0), icon: CheckCircle2 },
      { title: "Total variance", value: loading ? "-" : formatQty(s.totalVariance || 0), icon: AlertTriangle },
    ];
  }, [activeTab, loading, currentSummary, varianceSummary]);

  async function openDetail(row) {
    setSelectedOpname(row);
    setDetailLoading(true);
    // Fetch detail from report endpoints — we use the report API with the specific opname date filter
    try {
      const params = { startDate: filters.startDate, endDate: filters.endDate };
      if (filters.branchId !== "ALL") params.branchId = filters.branchId;
      const res = await reportApi.getReport("stock-opname-variance", params);
      const items = (res.data?.data?.rows || []).filter((i) =>
        i.opnameDate === row.opnameDate && i.kind === row.kind && i.branchName === row.branchName
      );
      setOpnameDetail({ ...row, items });
    } catch (_) {
      setOpnameDetail(row);
    } finally {
      setDetailLoading(false);
    }
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleApply() { loadAll(filters); }

  function handleReset() {
    const reset = { ...getDefaultRange(), branchId: "ALL", search: "" };
    setFilters(reset);
    loadAll(reset);
  }

  const openingColumns = [
    { key: "opnameDate", label: "Tanggal", render: (r) => <span className="font-semibold">{formatDateOnly(r.opnameDate)}</span> },
    { key: "branchName", label: "Branch" },
    { key: "performedBy", label: "Oleh" },
    { key: "itemCount", label: "Item", render: (r) => formatNumber(r.itemCount) },
    { key: "isCompleted", label: "Status", render: (r) => <Badge tone={r.isCompleted === "Completed" ? "success" : "warning"}>{r.isCompleted}</Badge> },
    { key: "totalVariance", label: "Variance", render: (r) => <span className="font-semibold">{formatQty(r.totalVariance)}</span> },
    { key: "oilLitersOpened", label: "Minyak", render: (r) => r.oilLitersOpened != null ? `${r.oilLitersOpened} L` : "-" },
    { key: "gasChanged", label: "Gas", render: (r) => r.gasChanged === true ? "Ya" : r.gasChanged === false ? "Tidak" : "-" },
    { key: "notes", label: "Catatan" },
    { key: "actions", label: "", render: (r) => <Button size="sm" variant="ghost" onClick={() => openDetail(r)}><Eye size={14} /></Button> },
  ];

  const varianceColumns = [
    { key: "opnameDate", label: "Tanggal", render: (r) => <span className="text-sm">{formatDateOnly(r.opnameDate)}</span> },
    { key: "branchName", label: "Branch" },
    { key: "kind", label: "Jenis", render: (r) => <Badge tone={r.kind === "OPENING" ? "info" : "warning"}>{r.kind}</Badge> },
    { key: "itemName", label: "Item", render: (r) => <span className="font-medium">{r.itemName}</span> },
    { key: "systemQty", label: "Sistem", render: (r) => formatQty(r.systemQty) },
    { key: "countedQty", label: "Hitung", render: (r) => <span className="font-semibold">{formatQty(r.countedQty)}</span> },
    { key: "varianceQty", label: "Selisih", render: (r) => <Badge tone={varianceTone(Number(r.varianceQty))}>{Number(r.varianceQty) > 0 ? "+" : ""}{formatQty(r.varianceQty)}</Badge> },
    { key: "performedBy", label: "Oleh" },
  ];

  const tabs = [
    { key: "opening", label: "Opening Opname", badge: openingRows.length, content: null },
    { key: "closing", label: "Closing Opname", badge: closingRows.length, content: null },
    { key: "variance", label: "Variance per Item", badge: varianceRows.length, content: null },
  ];

  return (
    <ErpShell title="Stock Opname" description="Monitor dan audit hasil opname stok harian.">
      <PageHeader
        title="Stock Opname"
        description="Pantau hasil opening/closing opname, selisih stok sistem vs aktual, dan histori opname per branch."
        onRefresh={handleApply}
        loading={loading}
      />

      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return <StatCard key={m.title} title={m.title} value={m.value} icon={<Icon size={18} />} />;
        })}
      </section>

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Tanggal awal" type="date" value={filters.startDate} onChange={(e) => updateFilter("startDate", e.target.value)} />
          <Input label="Tanggal akhir" type="date" value={filters.endDate} onChange={(e) => updateFilter("endDate", e.target.value)} />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Branch</span>
            <select className="kr-input" value={filters.branchId} onChange={(e) => updateFilter("branchId", e.target.value)}>
              <option value="ALL">Semua branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <Input label="Cari" icon={<Search size={16} />} placeholder="Branch, petugas..." value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleApply}>Terapkan</Button>
          <Button size="sm" variant="secondary" onClick={handleReset}>Reset</Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <Tabs tabs={tabs.map((t) => ({
          ...t,
          content: (
            <div>
              {loading ? (
                <div className="grid gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="erp-skeleton h-12 w-full rounded-xl" />)}
                </div>
              ) : currentRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted mt-2">
                  Belum ada data opname untuk filter yang dipilih.
                </div>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted">
                        {(activeTab === "variance" ? varianceColumns : openingColumns).map((col) => (
                          <th key={col.key} className="px-3 py-3">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(activeTab === "variance" ? currentRows : currentRows).map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-surface-2/60 transition-colors">
                          {(activeTab === "variance" ? varianceColumns : openingColumns).map((col) => (
                            <td key={col.key} className="px-3 py-3">{col.render ? col.render(row) : row[col.key] ?? "-"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ),
        }))} defaultTab="opening" onChange={setActiveTab} />
      </Card>

      <Drawer
        open={Boolean(selectedOpname)}
        title={`Detail Opname — ${selectedOpname?.branchName || ""}`}
        description={`${selectedOpname?.kind || ""} • ${selectedOpname?.opnameDate ? formatDateOnly(selectedOpname.opnameDate) : ""}`}
        onClose={() => { setSelectedOpname(null); setOpnameDetail(null); }}
        size="lg"
      >
        {detailLoading ? (
          <div className="grid gap-2">{[1,2,3].map((i) => <div key={i} className="erp-skeleton h-10 w-full" />)}</div>
        ) : opnameDetail ? (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-2xl border bg-surface-2 p-4 text-sm">
              <div className="flex justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Status</span>
                <Badge tone={opnameDetail.isCompleted === "Completed" ? "success" : "warning"}>{opnameDetail.isCompleted}</Badge>
              </div>
              <div className="flex justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Petugas</span><span>{opnameDetail.performedBy || "-"}</span></div>
              <div className="flex justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Tanggal</span><span>{formatDateOnly(opnameDetail.opnameDate)}</span></div>
              <div className="flex justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-muted">Total variance</span><span className="font-bold">{formatQty(opnameDetail.totalVariance)}</span></div>
              {opnameDetail.notes && opnameDetail.notes !== "-" ? (
                <div><span className="text-xs font-semibold uppercase tracking-wider text-muted">Catatan</span><p className="mt-1">{opnameDetail.notes}</p></div>
              ) : null}
            </div>

            {opnameDetail.items && opnameDetail.items.length > 0 ? (
              <div>
                <SectionHeader title="Detail Item" description="Per item variance" compact />
                <div className="mt-3 overflow-hidden rounded-2xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2 text-xs uppercase text-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-right">Sistem</th>
                        <th className="px-3 py-2 text-right">Hitung</th>
                        <th className="px-3 py-2 text-right">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {opnameDetail.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium">{item.itemName || "-"}</td>
                          <td className="px-3 py-2 text-right">{formatQty(item.systemQty)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatQty(item.countedQty)}</td>
                          <td className="px-3 py-2 text-right">
                            <Badge tone={varianceTone(Number(item.varianceQty))}>
                              {Number(item.varianceQty) > 0 ? "+" : ""}{formatQty(item.varianceQty)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-2xl border bg-surface-2 p-3 text-xs text-muted">
                  <p className="font-semibold">Akuntabilitas:</p>
                  <ul className="mt-1 list-disc pl-4 grid gap-0.5">
                    <li>Opname dicatat oleh {opnameDetail.performedBy}</li>
                    <li>Setiap item memiliki variance yang tercatat untuk audit</li>
                    <li>Gunakan laporan variance untuk investigasi selisih besar</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted">
                Detail item tidak tersedia untuk periode ini.
              </div>
            )}
          </div>
        ) : null}
      </Drawer>
    </ErpShell>
  );
}
