import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, RotateCcw, ShoppingCart, Package, AlertTriangle, History, ClipboardList, RefreshCw, Eye, Camera, Trash2 } from "lucide-react";
import CrewShell from "../components/CrewShell";
import { crewApi } from "../services/crewApi";
import { crewDepotTransferApi } from "../services/depotTransferApi";
import { inventoryApi } from "../../dashboard/services/inventoryApi";
import { purchasingApi } from "../../dashboard/services/purchasingApi";
import { Button, Modal } from "../../../components/ui";
import api from "../../../core/api/api";
import { formatCurrency, formatDateTime, formatNumber } from "../../dashboard/utils/reportFormatters";

const TABS = [
  { key: "terima", label: "Terima", icon: Package },
  { key: "retur", label: "Retur", icon: RotateCcw },
  { key: "belanja", label: "Beli", icon: ShoppingCart },
  { key: "kejadian", label: "Catat", icon: ClipboardList },
];

const EVENT_TYPES = [
  { value: "OIL_ADDED", label: "Tambah Minyak", needsItem: true },
  { value: "OIL_REPLACED", label: "Ganti Minyak", needsItem: true },
  { value: "GAS_CHANGED", label: "Ganti Gas", needsItem: true },
  { value: "DOUGH_OPENED", label: "Buka Adonan", needsItem: true },
  { value: "SAUCE_OPENED", label: "Buka Saus", needsItem: true },
  { value: "CLEANING", label: "Kebersihan", needsItem: false },
  { value: "OTHER", label: "Lainnya", needsItem: false },
];

export default function CrewOperationalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("terima");
  const [approvals, setApprovals] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [otpModal, setOtpModal] = useState(null);
  const [detailTransfer, setDetailTransfer] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ startDate: "", endDate: "" });
  const [eventLog, setEventLog] = useState([]);

  // Retur
  const [returItem, setReturItem] = useState("");
  const [returQty, setReturQty] = useState("");
  const [returReason, setReturReason] = useState("");
  const [returSaving, setReturSaving] = useState(false);

  // Belanja
  const [beliItems, setBeliItems] = useState([{ id: 1, inventoryItemId: "", qty: "1", amount: "" }]);
  const [beliSaving, setBeliSaving] = useState(false);
  const [beliPhoto, setBeliPhoto] = useState(null);
  const [beliPhotoPreview, setBeliPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const beliNextId = useMemo(() => Math.max(...beliItems.map(i => i.id), 0) + 1, [beliItems]);

  // Event
  const [evType, setEvType] = useState("");
  const [evItem, setEvItem] = useState("");
  const [evQty, setEvQty] = useState("");
  const [evNotes, setEvNotes] = useState("");
  const [evSaving, setEvSaving] = useState(false);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [appRes, , invRes] = await Promise.all([
        crewDepotTransferApi.getDepotApprovals({}).catch(() => null),
        crewApi.getAttendanceGate().catch(() => null),
        inventoryApi.getInventoryItems().catch(() => null),
      ]);
      setApprovals(appRes?.data?.data?.transfers || appRes?.data?.data?.items || []);
      setInventoryItems(invRes?.data?.data || []);
    } catch (err) { setError("Gagal memuat."); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const beliAvailable = useMemo(() => inventoryItems.filter(i => i.isPurchasable !== false), [inventoryItems]);

  async function handleRetur() {
    if (!returItem || !returQty || !returReason) { setError("Lengkapi semua field"); return; }
    setReturSaving(true); setError("");
    try {
      await crewApi.submitRetur({ inventoryItemId: returItem, qty: Math.abs(Number(returQty)), reason: returReason });
      setReturItem(""); setReturQty(""); setReturReason("");
    } catch (err) { setError(err?.response?.data?.message || "Gagal."); }
    finally { setReturSaving(false); }
  }

  async function handleBeli() {
    const valid = beliItems.filter(i => i.inventoryItemId && i.amount);
    if (!valid.length) { setError("Minimal 1 item dengan nominal"); return; }
    setBeliSaving(true); setError("");
    try {
      let url = "";
      if (beliPhoto) {
        setUploading(true);
        const reader = new FileReader();
        url = await new Promise((resolve) => {
          reader.onload = async () => {
            try { const r = await api.post("/upload/receipt", { image: reader.result }); resolve(r.data?.data?.url || ""); }
            catch { resolve(""); }
          };
          reader.readAsDataURL(beliPhoto);
        });
        setUploading(false);
      }
      const total = valid.reduce((s, i) => s + Number(i.amount || 0), 0);
      const names = valid.map(i => inventoryItems.find(x => x.id === i.inventoryItemId)?.name).filter(Boolean);
      await purchasingApi.createOutletExpense({
        items: valid.map(i => {
          const item = inventoryItems.find(x => x.id === i.inventoryItemId);
          return { inventoryItemId: i.inventoryItemId, itemName: item?.name || "", qty: Number(i.qty || 1), totalAmount: Number(i.amount) };
        }),
        totalAmount: total, receiptPhotoUrl: url, notes: "Beli: " + names.join(", "),
      });
      setBeliItems([{ id: 1, inventoryItemId: "", qty: "1", amount: "" }]);
      setBeliPhoto(null); setBeliPhotoPreview(null);
    } catch (err) { setError(err?.response?.data?.message || "Gagal."); }
    finally { setBeliSaving(false); setUploading(false); }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const params = {};
      if (historyFilter.startDate) params.startDate = historyFilter.startDate;
      if (historyFilter.endDate) params.endDate = historyFilter.endDate;
      const res = await purchasingApi.listOutletExpenses(params);
      setHistoryData(res.data?.data || []);
    } catch { setHistoryData([]); }
    finally { setHistoryLoading(false); }
  }

  async function handleEvent() {
    if (!evType) { setError("Pilih jenis"); return; }
    setEvSaving(true); setError("");
    try {
      const t = EVENT_TYPES.find(e => e.value === evType);
      if (t?.needsItem && evItem && evQty) {
        await crewApi.submitRetur({ inventoryItemId: evItem, qty: Math.abs(Number(evQty)), reason: `${t.label}: ${evNotes || ""}` });
      }
      setEventLog(p => [{ id: Date.now(), type: evType, label: t?.label || evType, notes: evNotes, time: new Date().toISOString() }, ...p]);
      setEvType(""); setEvItem(""); setEvQty(""); setEvNotes("");
    } catch (err) { setError(err?.response?.data?.message || "Gagal."); }
    finally { setEvSaving(false); }
  }

  // ─── RENDER ───
  function TabBar() {
    return (
      <div className="flex gap-1 rounded-2xl bg-gray-100 p-1 mb-3">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          const badge = t.key === "terima" ? approvals.length : t.key === "kejadian" ? eventLog.length : null;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 ${isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              <Icon size={14} />
              {t.label}
              {badge > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[9px] text-white">{badge}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <CrewShell title="Operasional" compactHeader>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between mb-2">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-semibold underline">Tutup</button>
        </div>
      )}

      <TabBar />

      {loading ? (
        <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-20 w-full rounded-2xl" />)}</div>
      ) : (
        <div className="grid gap-3 pb-4">
          {/* ═══ TAB: TERIMA ═══ */}
          {tab === "terima" && (
            approvals.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
                <CheckCircle2 size={28} className="mx-auto mb-2 opacity-40" />
                Tidak ada pengiriman menunggu konfirmasi
              </div>
            ) : approvals.map(item => (
              <div key={item.id} className="rounded-2xl border border-border bg-surface p-4">
                <button onClick={() => setDetailTransfer(item)} className="w-full text-left">
                  <p className="font-bold">{item.transferNumber || item.id?.slice(0,8)}</p>
                  <p className="text-xs text-muted mt-0.5">{item.sourceWarehouse?.name || item.sourceBranch?.name || "Gudang"} → {item.targetBranch?.name}</p>
                  <p className="text-xs text-muted mt-0.5">{item.items?.length || 0} item</p>
                </button>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={async () => {
                    try { await crewDepotTransferApi.approveDepotTransfer(item.id, {}); setOtpModal({ message: "Transfer dikonfirmasi." }); await loadData(); }
                    catch (err) { setError(err?.response?.data?.message || "Gagal."); }
                  }} className="rounded-xl bg-green-600 py-3 text-sm font-bold text-white active:scale-95 transition-transform" style={{ minHeight: 48 }}>
                    <CheckCircle2 size={16} className="inline mr-1" /> Sesuai
                  </button>
                  <button onClick={() => setDetailTransfer(item)} className="rounded-xl border py-3 text-sm font-bold active:scale-95 transition-transform" style={{ minHeight: 48 }}>
                    <Eye size={16} className="inline mr-1" /> Detail
                  </button>
                </div>
              </div>
            ))
          )}

          {/* ═══ TAB: RETUR ═══ */}
          {tab === "retur" && (
            <div className="grid gap-3">
              <select className="kr-input h-12 text-sm" value={returItem} onChange={e => setReturItem(e.target.value)}>
                <option value="">— Pilih barang —</option>
                {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
              <input type="number" className="kr-input text-lg" style={{ fontSize: 16, padding: "14px 16px" }}
                placeholder="Jumlah" value={returQty} onChange={e => setReturQty(e.target.value)} />
              <textarea className="kr-input min-h-[80px]" placeholder="Alasan retur (rusak/kadaluarsa/salah kirim)"
                value={returReason} onChange={e => setReturReason(e.target.value)} />
              <Button onClick={handleRetur} loading={returSaving} size="lg" className="w-full">
                <RotateCcw size={16} /> Retur Barang
              </Button>
            </div>
          )}

          {/* ═══ TAB: BELANJA ═══ */}
          {tab === "belanja" && (
            <div className="grid gap-3">
              {beliItems.length === 0 ? (
                <div className="text-sm text-muted text-center py-4">Tidak ada barang bisa dibeli</div>
              ) : (
                <>
                  <div className="grid gap-2">
                    {beliItems.map((row, idx) => (
                      <div key={row.id} className="flex gap-2 items-start">
                        <div className="flex-1 grid gap-1">
                          <select className="kr-input h-11 text-sm" value={row.inventoryItemId}
                            onChange={e => {
                              const next = [...beliItems];
                              next[idx] = { ...next[idx], inventoryItemId: e.target.value, amount: "" };
                              setBeliItems(next);
                            }}>
                            <option value="">— Pilih —</option>
                            {inventoryItems.filter(i => i.isPurchasable !== false).map(i => (
                              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                            ))}
                          </select>
                          {row.inventoryItemId && (
                            <div className="flex gap-1">
                              <input type="number" className="kr-input h-10 flex-[3] text-sm" placeholder="Qty" value={row.qty}
                                onChange={e => { const n = [...beliItems]; n[idx] = { ...n[idx], qty: e.target.value }; setBeliItems(n); }} />
                              <input type="number" className="kr-input h-10 flex-[4] text-sm" placeholder="Rp" value={row.amount}
                                onChange={e => { const n = [...beliItems]; n[idx] = { ...n[idx], amount: e.target.value }; setBeliItems(n); }} />
                              {idx > 0 && (
                                <button onClick={() => setBeliItems(p => p.filter((_, i) => i !== idx))}
                                  className="grid h-10 w-10 place-items-center rounded-xl border text-muted hover:bg-red-50 hover:text-red-600 active:scale-90">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setBeliItems(p => [...p, { id: beliNextId, inventoryItemId: "", qty: "1", amount: "" }])}
                      className="flex items-center justify-center gap-1 rounded-xl border border-dashed py-2.5 text-xs font-semibold text-muted active:scale-95">
                      + Tambah item
                    </button>
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3 cursor-pointer active:scale-[0.99]">
                    {beliPhotoPreview ? (
                      <img src={beliPhotoPreview} alt="Struk" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-gray-100 text-muted"><Camera size={18} /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{beliPhoto ? "Struk siap" : "Foto struk"}</p>
                      <p className="text-xs text-muted">Ketuk untuk foto/upload</p>
                    </div>
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setBeliPhoto(f); setBeliPhotoPreview(URL.createObjectURL(f)); }}} />
                  </label>

                  <Button onClick={handleBeli} loading={beliSaving || uploading} size="lg" className="w-full">
                    <ShoppingCart size={16} /> {uploading ? "Upload..." : "Catat Pembelian"}
                  </Button>
                </>
              )}
              <button onClick={() => { setHistoryOpen(true); loadHistory(); }}
                className="flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-semibold text-muted active:scale-95 transition-transform">
                <History size={14} /> Riwayat Belanja
              </button>
            </div>
          )}

          {/* ═══ TAB: KEJADIAN ═══ */}
          {tab === "kejadian" && (
            <div className="grid gap-3">
              <select className="kr-input h-12 text-sm" value={evType} onChange={e => { setEvType(e.target.value); setEvItem(""); setEvQty(""); }}>
                <option value="">— Pilih jenis kejadian —</option>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              {evType && (() => {
                const t = EVENT_TYPES.find(e => e.value === evType);
                return t?.needsItem ? (
                  <>
                    <select className="kr-input h-12 text-sm" value={evItem} onChange={e => setEvItem(e.target.value)}>
                      <option value="">— Pilih item —</option>
                      {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                    </select>
                    <input type="number" className="kr-input text-lg" style={{ fontSize: 16, padding: "14px 16px" }}
                      placeholder="Jumlah" value={evQty} onChange={e => setEvQty(e.target.value)} />
                  </>
                ) : null;
              })()}

              <textarea className="kr-input min-h-[80px]" placeholder="Catatan (opsional)"
                value={evNotes} onChange={e => setEvNotes(e.target.value)} />

              <Button onClick={handleEvent} loading={evSaving} size="lg" className="w-full">
                <ClipboardList size={16} /> Catat
              </Button>

              {eventLog.length > 0 && (
                <div className="border-t border-border pt-3 mt-2">
                  <p className="text-xs font-semibold uppercase text-muted mb-2">Log Kejadian</p>
                  <div className="grid gap-1.5">
                    {eventLog.map(ev => (
                      <div key={ev.id} className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-700">{ev.label}</span>
                          <span className="text-[10px] text-muted">{formatDateTime(ev.time)}</span>
                        </div>
                        {ev.notes && <p className="text-xs text-muted mt-0.5">{ev.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      <Modal open={Boolean(otpModal)} title="Konfirmasi" onClose={() => setOtpModal(null)} size="sm">
        <div className="grid gap-3 p-2">
          <p className="text-sm text-center">{otpModal?.message}</p>
          <Button variant="secondary" onClick={() => setOtpModal(null)} className="w-full">Tutup</Button>
        </div>
      </Modal>

      <Modal open={Boolean(detailTransfer)} title={detailTransfer?.transferNumber || "Detail"} onClose={() => setDetailTransfer(null)} size="md">
        {detailTransfer && (
          <div className="grid gap-4">
            <div className="rounded-2xl border p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted">Dari</span><span className="font-semibold">{detailTransfer.sourceWarehouse?.name || detailTransfer.sourceBranch?.name || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted">Ke</span><span className="font-semibold">{detailTransfer.targetBranch?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Status</span><span>{detailTransfer.status}</span></div>
            </div>
            <p className="text-sm font-bold">Item ({detailTransfer.items?.length || 0})</p>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {detailTransfer.items?.map((i, idx) => (
                <div key={idx} className="flex justify-between rounded-xl border p-3 text-sm">
                  <span className="font-medium">{i.itemName || i.inventoryItem?.name || "-"}</span>
                  <span className="font-bold">{Number(i.qty || 0)} {i.unit || "pcs"}</span>
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={() => setDetailTransfer(null)}>Tutup</Button>
          </div>
        )}
      </Modal>

      <Modal open={historyOpen} title="Riwayat Belanja" onClose={() => setHistoryOpen(false)} size="xl">
        <div className="grid gap-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase text-muted">Dari</label>
              <input type="date" className="kr-input h-10 text-sm w-full" value={historyFilter.startDate} onChange={e => setHistoryFilter(f => ({...f, startDate: e.target.value}))} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase text-muted">Sampai</label>
              <input type="date" className="kr-input h-10 text-sm w-full" value={historyFilter.endDate} onChange={e => setHistoryFilter(f => ({...f, endDate: e.target.value}))} />
            </div>
            <Button size="sm" onClick={loadHistory}><RefreshCw size={14} /></Button>
          </div>
          {historyLoading ? (
            <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-14 w-full rounded-2xl" />)}</div>
          ) : historyData.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Belum ada belanja</div>
          ) : (
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {historyData.map(e => (
                <div key={e.id} className="rounded-2xl border border-border bg-surface p-3 flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{e.note || "Belanja"}</p>
                    <p className="text-xs text-muted">{formatDateTime(e.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-black">{formatCurrency(e.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="secondary" onClick={() => setHistoryOpen(false)}>Tutup</Button>
        </div>
      </Modal>
    </CrewShell>
  );
}
