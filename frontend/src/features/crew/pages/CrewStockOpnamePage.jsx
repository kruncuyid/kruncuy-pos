import { ClipboardList, PackageCheck, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CrewShell from "../components/CrewShell";
import { crewApi } from "../services/crewApi";
import { Button, Card, Input, SectionHeader, StatCard } from "../../../components/ui";

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(value || 0));
}

function groupByType(items) {
  return items.reduce((groups, item) => {
    const type = item.type || "OTHER";
    if (!groups[type]) groups[type] = [];
    groups[type].push(item);
    return groups;
  }, {});
}

export default function CrewStockOpnamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kind = searchParams.get("kind") === "CLOSING" ? "CLOSING" : "OPENING";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [oilOpened, setOilOpened] = useState(null);
  const [oilLiters, setOilLiters] = useState("");
  const [gasChanged, setGasChanged] = useState(null);

  async function load() {
    setLoading(true); setError(""); setLocked(false);
    try {
      const response = await crewApi.getStockOpnameForm(kind);
      const form = response.data.data;
      setData(form);
      setItems((form?.items || []).map((item) => ({
        inventoryItemId: item.inventoryItemId,
        branchInventoryItemId: item.branchInventoryItemId,
        name: item.inventoryItem?.name || "-",
        unit: item.inventoryItem?.unit || "pcs",
        type: item.inventoryItem?.type || "OTHER",
        currentStock: Number(item.currentStock || 0),
        countedQty: item.countedQty === "" ? "" : Number(item.countedQty || 0),
        notes: item.notes || "",
      })));
      setNotes(form?.existing?.notes || "");
      if (form?.existing) {
        setOilOpened(form.existing.oilLitersOpened ? true : false);
        setOilLiters(form.existing.oilLitersOpened || "");
        setGasChanged(form.existing.gasChanged);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "";
      if (msg.includes("terkunci")) {
        setLocked(true);
        setError("Opening sudah selesai.");
      } else setError(msg || "Gagal memuat.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [kind]);

  const groupedItems = useMemo(() => groupByType(items), [items]);
  const totalItems = items.length;
  const readyCount = items.filter((item) => item.countedQty !== "" && item.countedQty !== null).length;

  function updateItem(index, key, value) {
    setItems((current) => current.map((item, i) => i !== index ? item : { ...item, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true); setError("");

    // Validasi: jika buka minyak baru, liter wajib
    if (kind === "CLOSING" && oilOpened === true && (!oilLiters || Number(oilLiters) <= 0)) {
      setError("Jika buka minyak baru, isi total liter minyak yang dibuka.");
      setSaving(false);
      return;
    }

    try {
      await crewApi.submitStockOpname({
        kind, notes,
        oilLitersOpened: kind === "CLOSING" && oilOpened ? Number(oilLiters) : null,
        gasChanged: kind === "CLOSING" ? gasChanged : null,
        items: items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          countedQty: Number(item.countedQty || 0),
          notes: item.notes || "",
        })),
      });
      await load();
      navigate("/crew", { replace: true });
    } catch (err) { setError(err?.response?.data?.message || "Gagal simpan."); }
    finally { setSaving(false); }
  }

  if (locked) {
    return (
      <CrewShell title="Stock Opname" compactHeader>
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center max-w-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-blue-600"><Lock size={28} /></div>
            <h2 className="mt-4 text-xl font-black">Opening Selesai</h2>
            <p className="mt-2 text-sm text-muted">Opening stock opname hari ini sudah selesai.</p>
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={() => navigate("/crew/stock-opname?kind=CLOSING")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
                style={{ minHeight: 48 }}>Buka Closing Opname</button>
              <button type="button" onClick={() => navigate("/crew")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold"
                style={{ minHeight: 48 }}>Ke Beranda</button>
            </div>
          </div>
        </div>
      </CrewShell>
    );
  }

  return (
    <CrewShell title={kind === "CLOSING" ? "Closing Opname" : "Opening Opname"} compactHeader>
      {error ? (<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>) : null}

      <section className="grid grid-cols-2 gap-2">
        <StatCard title="Total item" value={loading ? "-" : totalItems} icon={<ClipboardList size={14} />} />
        <StatCard title="Sudah diisi" value={loading ? "-" : readyCount} icon={<PackageCheck size={14} />} />
      </section>

      {loading ? (
        <div className="grid gap-2 px-1">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Tidak ada item yang perlu diopname hari ini.</div>
      ) : (
        <form className="grid gap-3" onSubmit={handleSubmit}>
          {Object.entries(groupedItems).map(([type, list]) => (
            <Card key={type} className="p-3">
              <SectionHeader title={type.replaceAll("_", " ")} compact />
              <div className="mt-3 grid gap-2">
                {list.map((item) => {
                  const index = items.findIndex((row) => row.inventoryItemId === item.inventoryItemId);
                  const diff = Number(item.countedQty || 0) - Number(item.currentStock || 0);
                  const isFilled = item.countedQty !== "" && item.countedQty !== null;
                  return (
                    <div key={item.inventoryItemId} className="rounded-2xl border border-border bg-surface p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-muted">{item.unit}</p></div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isFilled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>{isFilled ? "Diisi" : "Kosong"}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-surface-2 px-3 py-2 text-center"><p className="text-[10px] text-muted">Sistem</p><p className="mt-0.5 font-semibold text-sm">{formatNumber(item.currentStock)}</p></div>
                        <div className="rounded-xl bg-surface-2 px-3 py-2 text-center"><p className="text-[10px] text-muted">Selisih</p><p className="mt-0.5 font-semibold text-sm">{diff > 0 ? "+" : ""}{formatNumber(diff)}</p></div>
                      </div>
                      <input className="kr-input mt-2 text-base font-bold" type="number" step="0.001" min="0"
                        value={item.countedQty}
                        onChange={(e) => updateItem(index, "countedQty", e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder={`Hitung aktual (${item.unit})`}
                        style={{ fontSize: 16, padding: "14px 16px" }} />
                      <input className="kr-input mt-2 text-sm" value={item.notes}
                        onChange={(e) => updateItem(index, "notes", e.target.value)} placeholder="Catatan (opsional)" />
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          {kind === "CLOSING" ? (
            <Card className="p-4">
              <SectionHeader title="Minyak & Gas" description="Cukup jawab ya/tidak, tanpa mengukur sisa." compact />
              <div className="mt-3 grid gap-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Hari ini buka minyak baru?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setOilOpened(true); }}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold active:scale-[0.98] transition-all ${oilOpened === true ? "bg-primary text-white border-primary" : "bg-surface-2 border-border text-text"}`} style={{ minHeight: 48 }}>Ya</button>
                    <button type="button" onClick={() => { setOilOpened(false); setOilLiters(""); }}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold active:scale-[0.98] transition-all ${oilOpened === false ? "bg-primary text-white border-primary" : "bg-surface-2 border-border text-text"}`} style={{ minHeight: 48 }}>Tidak</button>
                  </div>
                  {oilOpened ? (
                    <input type="number" className="kr-input mt-2 text-lg font-bold" step="0.1" min="0"
                      value={oilLiters} onChange={e => setOilLiters(e.target.value)}
                      placeholder="Total liter minyak yang dibuka" style={{ fontSize: 16, padding: "14px 16px" }} />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Hari ini ganti tabung gas?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setGasChanged(true)}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold active:scale-[0.98] transition-all ${gasChanged === true ? "bg-primary text-white border-primary" : "bg-surface-2 border-border text-text"}`} style={{ minHeight: 48 }}>Ya</button>
                    <button type="button" onClick={() => setGasChanged(false)}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold active:scale-[0.98] transition-all ${gasChanged === false ? "bg-primary text-white border-primary" : "bg-surface-2 border-border text-text"}`} style={{ minHeight: 48 }}>Tidak</button>
                  </div>
                </div>
                <p className="text-xs text-muted">Crew hanya lapor kejadian. Sistem yang hitung konsumsi.</p>
              </div>
            </Card>
          ) : null}

          <Card className="p-3">
            <SectionHeader title="Catatan umum" compact />
            <Input className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan opname hari ini (opsional)" />
          </Card>

          <div className="flex gap-2">
            <Button type="submit" size="lg" disabled={saving || loading || !items.length} className="flex-1">
              {saving ? "Menyimpan..." : "Simpan opname"}
            </Button>
            <Button type="button" size="lg" variant="secondary" onClick={load} disabled={loading}>Muat ulang</Button>
          </div>
          <div className="h-4" />
        </form>
      )}
    </CrewShell>
  );
}
