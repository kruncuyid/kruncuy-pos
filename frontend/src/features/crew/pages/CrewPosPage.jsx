import { ArrowLeft, Banknote, CheckCircle2, CreditCard, HandCoins, Minus, Plus, ShoppingBag, Store, Trash2, Search, X, Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../dashboard/utils/reportFormatters";
import CrewShell from "../components/CrewShell";
import { cashSessionApi } from "../services/cashSessionApi";
import { posApi } from "../services/posApi";

const platforms = [
  { value: "GRABFOOD", label: "GrabFood" },
  { value: "GOFOOD", label: "GoFood" },
  { value: "SHOPEEFOOD", label: "ShopeeFood" },
];
const cashQuick = [0, 5000, 10000, 20000, 50000, 100000];

export default function CrewPosPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("menu");
  const [channel, setChannel] = useState("OFFLINE");
  const [platform, setPlatform] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const [activeCat, setActiveCat] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [cashVal, setCashVal] = useState("");
  const [splitC, setSplitC] = useState("");
  const [splitQ, setSplitQ] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [shiftOk, setShiftOk] = useState(false);
  const [noShift, setNoShift] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");
  const [extraSauce, setExtraSauce] = useState(false);
  const [onlineMode, setOnlineMode] = useState(false);

  useEffect(() => {
    cashSessionApi.getActiveSession().then(r => {
      if (r.data.data) setShiftOk(true);
      else setNoShift(true);
    }).catch(() => setNoShift(true));
  }, []);

  useEffect(() => {
    if (step === "menu") loadMenu();
  }, [step, channel, platform]);

  async function loadMenu() {
    setLoading(true); setError("");
    try {
      const r = await posApi.getCatalog({ channel, platform });
      const d = r.data.data;
      setCatalog(d);
      if (d?.categories?.length) {
        setActiveCat(prev => d.categories.some(c => c.code === prev) ? prev : d.categories[0].code);
      }
    } catch (_) { setError("Gagal memuat menu."); }
    finally { setLoading(false); }
  }

  const total = useMemo(() => cart.reduce((s, i) => s + i.qty * i.price, 0), [cart]);
  const totalQty = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const change = Math.max(0, Number(cashVal || 0) - total);

  function resetTransaction() {
    setCart([]); setPayMethod("CASH"); setCashVal(""); setReceipt(null);
    setShowCart(false); setSplitC(""); setSplitQ("");
    setNote(""); setExtraSauce(false); setSearch(""); setError("");
  }

  function switchMode() {
    if (cart.length > 0) {
      const ok = confirm("Ganti mode akan mengosongkan keranjang. Lanjutkan?");
      if (!ok) return;
      setCart([]);
    }
    if (onlineMode) {
      setOnlineMode(false); setChannel("OFFLINE"); setPlatform(null);
    } else {
      setOnlineMode(true); setChannel("ONLINE"); setPlatform(null);
    }
    setSearch(""); setError(""); setShowCart(false);
  }

  function selectPlatform(pl) {
    if (cart.length > 0) {
      if (!confirm("Ganti mode akan mengosongkan keranjang. Lanjutkan?")) return;
      setCart([]);
    }
    setPlatform(pl); setChannel("ONLINE"); setOnlineMode(true);
    setSearch(""); setError("");
  }

  const products = useMemo(() => {
    if (!catalog?.categories) return [];
    const cat = catalog.categories.find(c => c.code === activeCat);
    if (!cat) return [];
    const q = search.toLowerCase().trim();
    return cat.products.filter(p => !q || p.name.toLowerCase().includes(q) || (p.code || "").toLowerCase().includes(q));
  }, [catalog, activeCat, search]);

  const showPlatformPicker = onlineMode && !platform;

  return (
    <CrewShell title="POS" hideMobileHeader hideHeader>
      {/* ═══ LAYOUT: FULLSCREEN — keluar dari flow CrewShell ═══ */}
      <div className="fixed inset-0 z-40 flex flex-col bg-gray-50">
        {/* ── HEADER ── */}
        <div className="shrink-0 bg-white border-b flex items-center justify-between px-3 py-2.5 z-20">
          <button onClick={() => navigate("/crew")} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-gray-100 active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${onlineMode ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
              {onlineMode ? <Globe size={14} /> : <Store size={14} />}
              {onlineMode ? (platform || "Online") : "Offline"}
            </span>
            <button onClick={switchMode}
              className="rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 active:scale-90 transition-transform">
              {onlineMode ? "Offline" : "Online"}
            </button>
          </div>
          <button onClick={() => setShowCart(true)} className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-gray-100 active:scale-90">
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">{cart.length}</span>
            )}
          </button>
        </div>

        {/* ── WARNING: NO SHIFT ── */}
        {noShift && (
          <div className="shrink-0 mx-3 mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-center justify-between">
            <span>Shift belum dibuka.</span>
            <button onClick={() => navigate("/crew")} className="font-bold underline">Buka Shift</button>
          </div>
        )}

        {/* ── ONLINE PLATFORM SELECTOR ── */}
        {showPlatformPicker && (
          <div className="shrink-0 mx-3 mt-3">
            <p className="text-sm font-bold mb-2">Pilih platform:</p>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map(p => (
                <button key={p.value} onClick={() => selectPlatform(p.value)}
                  className="rounded-2xl border-2 border-gray-100 bg-white py-4 text-center active:scale-95 transition-transform font-bold text-sm"
                  style={{ minHeight: 64 }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div className="shrink-0 mx-3 mt-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── MENU (scrollable) ── */}
        {step === "menu" && (platform || !onlineMode) && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search */}
            <div className="shrink-0 px-3 pt-2 pb-1.5">
              <div className="flex items-center gap-2 rounded-xl bg-white border px-3 py-2.5">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input className="flex-1 text-sm outline-none bg-transparent" placeholder="Cari menu..." value={search}
                  onChange={e => setSearch(e.target.value)} />
                {search && <X size={16} className="text-gray-400 shrink-0" onClick={() => setSearch("")} />}
              </div>
            </div>

            {/* Categories */}
            <div className="shrink-0 px-3 pb-1.5 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5">
                {(catalog?.categories || []).map(c => (
                  <button key={c.code} onClick={() => { setActiveCat(c.code); setSearch(""); }}
                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors active:scale-95 ${
                      activeCat === c.code ? "bg-gray-900 text-white" : "bg-white text-gray-600 border"
                    }`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {loading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1,2,3,4].map(i => <div key={i} className="erp-skeleton h-28 w-full rounded-2xl" />)}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 text-sm text-gray-400">Menu tidak ditemukan</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {products.map(p => {
                    const inCart = cart.find(i => i.productId === p.id)?.qty || 0;
                    return (
                      <button key={p.id} onClick={() => {
                        const ex = cart.find(i => i.productId === p.id);
                        if (ex) setCart(c => c.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
                        else setCart(c => [...c, { productId: p.id, name: p.name, price: Number(p.price || 0), qty: 1, pcs: p.pcs || 0 }]);
                      }}
                        className={`relative rounded-2xl border-2 bg-white p-4 text-left active:scale-[0.97] transition-all min-h-[88px] ${
                          inCart > 0 ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100"
                        }`}>
                        <p className="font-bold text-sm leading-tight">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatCurrency(p.price)}</p>
                        {inCart > 0 && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-600 text-white text-xs font-bold px-2.5 py-1">
                            <Plus size={12} /> {inCart}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STICKY BOTTOM BAR ── */}
        <div className="shrink-0 bg-white border-t px-3 py-2">
          <button onClick={() => setShowCart(true)}
            className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
            disabled={!cart.length} style={{ minHeight: 52 }}>
            <ShoppingBag size={18} />
            {cart.length > 0 ? `${totalQty} item • ${formatCurrency(total)}` : "Keranjang kosong"}
          </button>
        </div>
      </div>

      {/* ═══ CART DRAWER ── FULL SCREEN ═══ */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="shrink-0 flex items-center justify-between border-b px-4 py-3">
            <p className="font-bold text-lg">Keranjang ({totalQty})</p>
            <button onClick={() => setShowCart(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-gray-100"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {cart.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-2xl border p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{i.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(i.price)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <button onClick={() => setCart(c => c.map(x => x.productId === i.productId ? { ...x, qty: Math.max(1, x.qty - 1) } : x).filter(x => x.qty > 0))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 active:scale-90"><Minus size={16} /></button>
                  <span className="font-bold text-base w-6 text-center">{i.qty}</span>
                  <button onClick={() => setCart(c => c.map(x => x.productId === i.productId ? { ...x, qty: x.qty + 1 } : x))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 active:scale-90"><Plus size={16} /></button>
                </div>
              </div>
            ))}
            {!cart.length && <p className="text-center text-sm text-gray-400 py-12">Keranjang kosong</p>}
          </div>
          <div className="shrink-0 border-t px-4 py-3 space-y-2">
            {onlineMode && <input className="kr-input text-sm" placeholder="Catatan (opsional)" value={note} onChange={e => setNote(e.target.value)} />}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Extra sauce</span>
              <button onClick={() => setExtraSauce(!extraSauce)}
                className={`relative h-7 w-12 rounded-full transition-colors ${extraSauce ? "bg-blue-600" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${extraSauce ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <button onClick={() => {
              if (onlineMode) {
                setSaving(true); setError("");
                posApi.checkout({
                  salesChannel: "ONLINE", onlinePlatform: platform,
                  paymentMethod: platform, paymentDetails: { type: "ONLINE_PLATFORM", platform, note, extraSauce },
                  items: cart.map(i => ({ productId: i.productId, qty: i.qty, price: i.price, pcs: i.pcs || 0 })),
                }).then(r => { setReceipt(r.data.data); setStep("done"); setShowCart(false); })
                  .catch(e => setError(e?.response?.data?.message || "Gagal."))
                  .finally(() => setSaving(false));
              } else {
                setShowCart(false); setStep("payment");
              }
            }} disabled={!cart.length || saving}
              className="w-full rounded-xl bg-gray-900 py-4 text-base font-bold text-white active:scale-95 transition-transform disabled:opacity-40"
              style={{ minHeight: 54 }}>
              {saving ? "..." : onlineMode ? "Pesanan Selesai" : `Bayar • ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      )}

      {/* ═══ PAYMENT SCREEN ═══ */}
      {step === "payment" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="shrink-0 flex items-center justify-between border-b px-4 py-3">
            <button onClick={() => setStep("menu")} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-gray-100 active:scale-90"><ArrowLeft size={20} /></button>
            <p className="font-bold text-lg">Pembayaran</p>
            <div className="w-10" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-3">
            <p className="text-center text-3xl font-black">{formatCurrency(total)}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "CASH", label: "Tunai", icon: Banknote },
                { key: "QRIS", label: "QRIS", icon: CreditCard },
                { key: "SPLIT", label: "Split", icon: HandCoins },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <button key={m.key} onClick={() => setPayMethod(m.key)}
                    className={`rounded-2xl border-2 py-3 text-center active:scale-95 transition-all ${payMethod === m.key ? "border-gray-900 bg-gray-50" : "border-gray-100"}`}
                    style={{ minHeight: 60 }}>
                    <Icon size={22} className="mx-auto" />
                    <p className="text-sm font-bold mt-0.5">{m.label}</p>
                  </button>
                );
              })}
            </div>

            {payMethod === "CASH" && (
              <>
                <input type="number" className="kr-input text-2xl font-black text-center" style={{ fontSize: 22, padding: 14 }}
                  placeholder="Jumlah dibayar" value={cashVal} onChange={e => setCashVal(e.target.value)} autoFocus
                  onFocus={() => setTimeout(() => document.getElementById("pay-button")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300)} />
                <div className="grid grid-cols-3 gap-1.5">
                  {cashQuick.map(v => (
                    <button key={v} onClick={() => setCashVal(String(total + (v || 0)))}
                      className="rounded-xl border bg-gray-50 py-2.5 text-xs font-bold active:scale-95" style={{ minHeight: 40 }}>
                      {v === 0 ? "Uang pas" : formatCurrency(total + v)}
                    </button>
                  ))}
                </div>
                {Number(cashVal || 0) >= total && (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                    <p className="text-xs text-green-700">Kembalian</p>
                    <p className="text-2xl font-black text-green-700">{formatCurrency(change)}</p>
                  </div>
                )}
              </>
            )}

            {payMethod === "QRIS" && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-5 text-center">
                <p className="text-sm font-bold">QRIS</p>
                <p className="text-2xl font-black mt-1">{formatCurrency(total)}</p>
                <p className="text-xs text-blue-600 mt-1">Tampilkan QRIS ke pembeli</p>
              </div>
            )}

            {payMethod === "SPLIT" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs font-bold mb-1">Cash</p>
                    <input type="number" className="kr-input text-base font-bold" placeholder="0" value={splitC} onChange={e => setSplitC(e.target.value)} />
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1">QRIS</p>
                    <input type="number" className="kr-input text-base font-bold" placeholder="0" value={splitQ} onChange={e => setSplitQ(e.target.value)} />
                  </div>
                </div>
                <button onClick={() => { const half = Math.round(total / 2); setSplitC(String(half)); setSplitQ(String(total - half)); }}
                  className="w-full rounded-xl border py-2.5 text-sm font-bold active:scale-95">50:50</button>
                <p className="text-xs text-gray-500 text-center">Sisa: {formatCurrency(total - Number(splitC || 0) - Number(splitQ || 0))}</p>
              </div>
            )}
          </div>

          {/* ⬇️ PAY BUTTON — ALWAYS VISIBLE ⬇️ */}
          <div id="pay-button" className="shrink-0 border-t bg-white px-4 py-3 sticky bottom-0">
            {onlineMode && <input className="kr-input text-sm mb-2" placeholder="Catatan (opsional)" value={note} onChange={e => setNote(e.target.value)} />}
            <button onClick={async () => {
              setSaving(true); setError("");
              try {
                const details = payMethod === "CASH"
                  ? { type: "CASH", receivedAmount: Number(cashVal || 0), changeAmount: change, note, extraSauce }
                  : payMethod === "QRIS" ? { type: "QRIS", amount: total, note, extraSauce }
                  : { type: "SPLIT", cashAmount: Number(splitC || 0), qrisAmount: Number(splitQ || 0), note, extraSauce };
                const r = await posApi.checkout({
                  salesChannel: "OFFLINE", paymentMethod: payMethod, paymentDetails: details,
                  items: cart.map(i => ({ productId: i.productId, qty: i.qty, price: i.price, pcs: i.pcs || 0 })),
                });
                setReceipt(r.data.data); setStep("done");
              } catch (e) { setError(e?.response?.data?.message || "Gagal."); }
              finally { setSaving(false); }
            }} disabled={saving || (payMethod === "CASH" && Number(cashVal || 0) < total)}
              className="w-full rounded-xl bg-gray-900 py-4 text-base font-bold text-white active:scale-95 transition-transform disabled:opacity-40"
              style={{ minHeight: 54 }}>
              {saving ? "Memproses..." : `Bayar ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      )}

      {/* ═══ DONE / RECEIPT ═══ */}
      {step === "done" && receipt && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto px-4 py-8">
            <div className="text-center mb-6">
              <CheckCircle2 size={56} className="mx-auto text-green-500" />
              <p className="text-xl font-black mt-4">Pembayaran Berhasil</p>
              <p className="text-sm text-gray-500 mt-1 font-mono">{receipt.invoiceNumber}</p>
              <button onClick={() => navigator.clipboard?.writeText(receipt.invoiceNumber)}
                className="text-xs text-blue-600 underline mt-1">Salin nomor invoice</button>
            </div>
            <div className="rounded-2xl border p-4 space-y-2 text-sm">
              {receipt.items?.map((item, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span>{item.productName} x{item.qty}</span>
                  <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-black text-lg">
                <span>Total</span><span>{formatCurrency(receipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pt-1">
                <span>{receipt.paymentMethod}</span>
                <span>{receipt.totalPcs} pcs</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t p-4 space-y-2">
            <button onClick={() => window.print()}
              className="w-full rounded-xl border py-3.5 text-sm font-bold active:scale-95" style={{ minHeight: 50 }}>Cetak Struk</button>
            <button onClick={() => { resetTransaction(); setStep("menu"); }}
              className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white active:scale-95" style={{ minHeight: 50 }}>
              Pesanan Baru
            </button>
          </div>
        </div>
      )}
    </CrewShell>
  );
}
