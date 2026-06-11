import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, RefreshCw, Search, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import CrewShell from "../components/CrewShell";
import { crewApi } from "../services/crewApi";
import { Button, Modal } from "../../../components/ui";
import { formatNumber } from "../../dashboard/utils/reportFormatters";

function formatQty(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? formatNumber(n) : n.toLocaleString("id-ID", { maximumFractionDigits: 3 });
}

function getStatus(currentStock, minStock) {
  const qty = Number(currentStock || 0);
  if (qty === 0) return { label: "Habis", tone: "danger", color: "text-red-600 bg-red-50 border-red-200" };
  if (minStock && qty <= Number(minStock)) return { label: "Hampir Habis", tone: "warning", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
  return { label: "Aman", tone: "success", color: "text-green-600 bg-green-50 border-green-200" };
}

// Manajemen atur item yang perlu opname via field isOpnameRequired di master item

export default function CrewStockOutletPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("SEMUA");
  const [opnameOpen, setOpnameOpen] = useState(false);
  const [opnameItems, setOpnameItems] = useState({});
  const [opnameSaving, setOpnameSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await crewApi.getOutletStockOverview({});
      setData(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const items = useMemo(() => {
    const all = data?.items || [];
    if (filter === "HAMPIR_HABIS") {
      return all.filter((i) => {
        const qty = Number(i.currentStock || 0);
        const min = Number(i.minStock || 0);
        return qty <= min || qty === 0;
      });
    }
    return all;
  }, [data?.items, filter]);

  const summary = data?.summary || {};

  function openOpname() {
    const opnameData = {};
    (data?.items || []).forEach((i) => {
      if (i.isOpnameRequired !== false) {
        opnameData[i.inventoryItemId || i.branchInventoryItemId] = { qty: String(i.currentStock || ""), notes: "" };
      }
    });
    setOpnameItems(opnameData);
    setOpnameOpen(true);
  }

  async function submitOpname() {
    setOpnameSaving(true);
    try {
      const itemsPayload = Object.entries(opnameItems).map(([inventoryItemId, val]) => ({
        inventoryItemId,
        countedQty: Number(val.qty || 0),
        notes: val.notes || "",
      }));
      await crewApi.completeStockOpname({ kind: "OPENING", items: itemsPayload, notes: "" });
      setOpnameOpen(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal simpan opname.");
    } finally {
      setOpnameSaving(false);
    }
  }

  return (
    <CrewShell title="Stok Outlet" compactHeader>
      <div className="grid gap-3 px-1">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={loadData} className="font-semibold underline">Coba lagi</button>
          </div>
        ) : null}

        {/* Summary bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setFilter("SEMUA")}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                filter === "SEMUA" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text)]"
              }`}
            >
              Semua ({formatNumber(data?.items?.length || 0)})
            </button>
            <button
              type="button"
              onClick={() => setFilter("HAMPIR_HABIS")}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                filter === "HAMPIR_HABIS" ? "bg-yellow-500 text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text)]"
              }`}
            >
              Hampir Habis
            </button>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={loadData}
              className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-surface-2)]"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <Button size="sm" onClick={openOpname}>
              <FileSpreadsheet size={14} /> Opname
            </Button>
          </div>
        </div>

        {/* Stock items */}
        {loading ? (
          <div className="grid gap-2">
            {[1,2,3,4,5].map((i) => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-[var(--color-muted)]">
            Tidak ada item stok.
          </div>
        ) : (
          <div className="grid gap-2">
            {items.map((item) => {
              const status = getStatus(item.currentStock, item.minStock);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.name || item.inventoryItem?.name || "-"}</p>
                    <p className="text-xs text-[var(--color-muted)]">{item.unit || item.inventoryItem?.unit || ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{formatQty(item.currentStock)}</p>
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Opname modal */}
      <Modal open={opnameOpen} title="Stock Opname" onClose={() => setOpnameOpen(false)} size="sm">
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-muted)]">Hitung stok aktual untuk item berikut:</p>
          {Object.entries(opnameItems).map(([id, val]) => {
            const item = (data?.items || []).find((i) => i.inventoryItemId === id);
            if (!item) return null;
            return (
              <div key={id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                <p className="text-sm font-semibold">{item.name || item.inventoryItem?.name || "-"}</p>
                <p className="text-xs text-[var(--color-muted)]">Sistem: {formatQty(item.currentStock)}</p>
                <input
                  type="number"
                  step="0.001"
                  className="kr-input mt-2 text-lg font-bold"
                  placeholder="Stok aktual"
                  value={val.qty}
                  onChange={(e) => setOpnameItems((prev) => ({ ...prev, [id]: { ...prev[id], qty: e.target.value } }))}
                  style={{ fontSize: 18, padding: "14px 16px" }}
                />
              </div>
            );
          })}
          <Button onClick={submitOpname} loading={opnameSaving} className="w-full" size="lg">
            Simpan Opname
          </Button>
        </div>
      </Modal>
    </CrewShell>
  );
}
