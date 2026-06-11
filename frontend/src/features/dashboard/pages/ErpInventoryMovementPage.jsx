import { Boxes, Download, Eye, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  PageHeader,
  SectionHeader,
  StatCard,
  Alert,
} from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import { reportApi } from "../services/reportApi";
import { branchApi } from "../services/branchApi";
import { formatCurrency, formatDateTime, formatNumber, formatDateOnly } from "../utils/reportFormatters";

const MOVEMENT_TYPES = [
  { value: "ALL", label: "Semua tipe" },
  { value: "PURCHASE", label: "Pembelian", tone: "success" },
  { value: "SALE", label: "Penjualan", tone: "info" },
  { value: "CONSUMPTION", label: "Konsumsi", tone: "warning" },
  { value: "ADJUSTMENT", label: "Adjustment", tone: "info" },
  { value: "OPNAME", label: "Opname", tone: "neutral" },
  { value: "WASTE", label: "Waste", tone: "danger" },
  { value: "TRANSFER_IN", label: "Transfer Masuk", tone: "info" },
  { value: "TRANSFER_OUT", label: "Transfer Keluar", tone: "warning" },
];

function getMovementTone(type) {
  const found = MOVEMENT_TYPES.find((mt) => mt.value === type);
  return found?.tone || "neutral";
}

function formatQty(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? formatNumber(num) : num.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

function toDateValue(date) {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: toDateValue(start),
    endDate: toDateValue(now),
  };
}

export default function ErpInventoryMovementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedMovement, setSelectedMovement] = useState(null);

  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [filters, setFilters] = useState({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    branchId: "ALL",
    type: "ALL",
    search: "",
  });

  async function loadData(nextFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const params = {
        startDate: nextFilters.startDate,
        endDate: nextFilters.endDate,
      };
      if (nextFilters.branchId !== "ALL") params.branchId = nextFilters.branchId;
      if (nextFilters.type !== "ALL") params.type = nextFilters.type;

      const [reportResponse, branchResponse] = await Promise.all([
        reportApi.getReport("inventory-movement", params),
        branchApi.getBranches(),
      ]);

      const data = reportResponse.data?.data || {};
      setRows(data.rows || []);
      setSummary(data.summary || null);
      setBranches(branchResponse.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data inventory movement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter(
      (row) =>
        (row.itemName || "").toLowerCase().includes(search) ||
        (row.branchName || "").toLowerCase().includes(search) ||
        (row.type || "").toLowerCase().includes(search) ||
        (row.performedBy || "").toLowerCase().includes(search) ||
        (row.referenceType || "").toLowerCase().includes(search)
    );
  }, [rows, filters.search]);

  const metrics = useMemo(() => {
    const s = summary || {};
    return [
      { title: "Total movements", value: loading ? "-" : formatNumber(s.movementCount || filteredRows.length), icon: Boxes },
      { title: "Inbound", value: loading ? "-" : formatQty(s.inboundQty || 0), icon: Boxes },
      { title: "Outbound", value: loading ? "-" : formatQty(s.outboundQty || 0), icon: Boxes },
    ];
  }, [summary, filteredRows.length, loading]);

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        label: "Tanggal",
        render: (row) => (
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">{formatDateTime(row.createdAt)}</p>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">{row.referenceType}</p>
          </div>
        ),
      },
      {
        key: "branchName",
        label: "Branch",
        render: (row) => <span className="text-sm font-medium">{row.branchName}</span>,
      },
      {
        key: "itemName",
        label: "Item",
        render: (row) => (
          <div>
            <p className="font-medium text-[var(--color-text)]">{row.itemName}</p>
          </div>
        ),
      },
      {
        key: "type",
        label: "Tipe",
        render: (row) => <Badge tone={getMovementTone(row.type)}>{row.type}</Badge>,
      },
      {
        key: "quantity",
        label: "Qty",
        render: (row) => (
          <span className={`font-semibold ${Number(row.quantity) > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
            {Number(row.quantity) > 0 ? "+" : ""}
            {formatQty(row.quantity)}
          </span>
        ),
      },
      {
        key: "performedBy",
        label: "Oleh",
        render: (row) => <span className="text-sm text-[var(--color-muted)]">{row.performedBy || "-"}</span>,
      },
      {
        key: "notes",
        label: "Catatan",
        render: (row) => <span className="text-sm text-[var(--color-muted)]">{row.notes || "-"}</span>,
      },
      {
        key: "actions",
        label: "",
        render: (row) => (
          <Button variant="ghost" size="sm" onClick={() => setSelectedMovement(row)}>
            <Eye size={16} />
          </Button>
        ),
      },
    ],
    []
  );

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    loadData(filters);
  }

  function handleReset() {
    const reset = { ...getDefaultRange(), branchId: "ALL", type: "ALL", search: "" };
    setFilters(reset);
    loadData(reset);
  }

  return (
    <ErpShell title="Inventory Movement" description="Mutasi barang masuk, keluar, waste, dan adjustment.">
      <PageHeader
        title="Inventory Movement"
        description="Riwayat pergerakan stok barang di semua branch — pembelian, penjualan, konsumsi, waste, transfer, dan adjustment."
        onRefresh={() => loadData(filters)}
        loading={loading}
      />

      {error ? (
        <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <StatCard key={metric.title} title={metric.title} value={metric.value} icon={<Icon size={18} />} />;
        })}
      </section>

      <Card className="p-4 sm:p-5">
        <SectionHeader title="Filter" description="Filter movement berdasarkan periode, branch, dan tipe." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Tanggal awal"
            type="date"
            value={filters.startDate}
            onChange={(event) => updateFilter("startDate", event.target.value)}
          />
          <Input
            label="Tanggal akhir"
            type="date"
            value={filters.endDate}
            onChange={(event) => updateFilter("endDate", event.target.value)}
          />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Branch</span>
            <select className="kr-input" value={filters.branchId} onChange={(event) => updateFilter("branchId", event.target.value)}>
              <option value="ALL">Semua branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Tipe movement</span>
            <select className="kr-input" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
              {MOVEMENT_TYPES.map((mt) => (
                <option key={mt.value} value={mt.value}>{mt.label}</option>
              ))}
            </select>
          </label>
          <Input
            label="Cari"
            icon={<Search size={16} />}
            placeholder="Item, branch, catatan..."
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
            <Button size="sm" onClick={handleApply}>Terapkan</Button>
            <Button size="sm" variant="secondary" onClick={handleReset}>Reset</Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionHeader
          title="Daftar movement"
          description={loading ? "Memuat data..." : `${filteredRows.length} movement ditemukan`}
        />

        {loading ? (
          <div className="mt-4 grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="erp-skeleton h-12 w-full" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Belum ada movement"
              description="Tidak ada data inventory movement untuk filter yang dipilih. Coba ubah periode atau branch."
              icon={<Boxes size={20} />}
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {columns.map((col) => (
                    <th key={col.key} className="px-3 py-3">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-[var(--color-surface-2)]/60 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-3">
                        {col.render ? col.render(row) : row[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={Boolean(selectedMovement)}
        title="Detail Movement"
        description="Informasi lengkap pergerakan stok"
        onClose={() => setSelectedMovement(null)}
        size="md"
      >
        {selectedMovement ? (
          <div className="grid gap-4">
            <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Item</span>
                <span className="text-sm font-semibold">{selectedMovement.itemName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Tipe</span>
                <Badge tone={getMovementTone(selectedMovement.type)}>{selectedMovement.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Branch</span>
                <span className="text-sm">{selectedMovement.branchName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Qty</span>
                <span className="text-sm font-bold">{formatQty(selectedMovement.quantity)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Tanggal</span>
                <span className="text-sm">{formatDateTime(selectedMovement.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Oleh</span>
                <span className="text-sm">{selectedMovement.performedBy || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Referensi</span>
                <span className="text-sm">{selectedMovement.referenceType || "-"}</span>
              </div>
            </div>
            {selectedMovement.notes && selectedMovement.notes !== "-" ? (
              <div className="rounded-2xl border border-[var(--color-border)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Catatan</p>
                <p className="mt-2 text-sm">{selectedMovement.notes}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </ErpShell>
  );
}
