import { Package, PlusCircle, Search, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Drawer, Input, Modal, PageHeader, SectionHeader, Alert, Select } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { goodsReceiptApi } from "../services/goodsReceiptApi";
import { purchaseOrderApi } from "../services/purchaseOrderApi";
import { inventoryApi } from "../services/inventoryApi";
import { formatCurrency, formatDateTime, formatNumber } from "../utils/reportFormatters";

export default function ErpGoodsReceiptPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [receipts, setReceipts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [grItems, setGrItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [grRes, poRes, invRes] = await Promise.all([
        goodsReceiptApi.list(), purchaseOrderApi.list({ status: "APPROVED" }), inventoryApi.getInventoryItems(),
      ]);
      setReceipts(grRes.data?.data || []);
      setPurchaseOrders(poRes.data?.data || []);
      setInventoryItems(invRes.data?.data || []);
    } catch (err) { setError(err?.response?.data?.message); } finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return receipts.filter((r) => !q || r.grNumber?.toLowerCase().includes(q) || r.purchaseOrder?.poNumber?.toLowerCase().includes(q));
  }, [receipts, search]);

  function openCreate() {
    setSelectedPO(null); setGrItems([]); setModalOpen(true); setError("");
  }

  function selectPO(poId) {
    const po = purchaseOrders.find((p) => p.id === poId);
    setSelectedPO(po);
    if (po) {
      setGrItems(po.items?.map((i) => ({
        purchaseOrderItemId: i.id, inventoryItemId: i.inventoryItemId,
        itemName: i.inventoryItem?.name || "",
        qtyOrdered: Number(i.qty || 0),
        qtyReceivedBefore: Number(i.qtyReceived || 0),
        qtyReceived: "",
        unitCost: i.unitPrice || "", unit: i.unit || "pcs",
      })) || []);
    }
  }

  function updateGRItem(idx, key, value) {
    const items = [...grItems];
    items[idx] = { ...items[idx], [key]: value };
    setGrItems(items);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPO || !grItems.length) { setError("Pilih PO dan isi item"); return; }
    setSaving(true);
    try {
      await goodsReceiptApi.create({
        purchaseOrderId: selectedPO.id,
        items: grItems.filter((i) => Number(i.qtyReceived) > 0).map((i) => ({
          purchaseOrderItemId: i.purchaseOrderItemId,
          inventoryItemId: i.inventoryItemId,
          qtyReceived: Number(i.qtyReceived) || 0,
          unitCost: Number(i.unitCost) || 0,
          unit: i.unit,
        })),
      });
      setModalOpen(false); await loadData();
    } catch (err) { setError(err?.response?.data?.message); } finally { setSaving(false); }
  }

  const columns = useMemo(() => [
    { key: "grNumber", label: "No. GR", render: (r) => <span className="font-semibold cursor-pointer" onClick={() => setDetail(r)}>{r.grNumber}</span> },
    { key: "purchaseOrder", label: "PO", render: (r) => r.purchaseOrder?.poNumber },
    { key: "purchaseOrder.supplier", label: "Supplier", render: (r) => r.purchaseOrder?.supplier?.name },
    { key: "items", label: "Item", render: (r) => `${r.items?.length || 0} item` },
    { key: "receivedDate", label: "Diterima", render: (r) => <span className="text-xs">{formatDateTime(r.receivedDate)}</span> },
    { key: "receivedBy", label: "Oleh", render: (r) => r.receivedBy?.name },
  ], []);

  return (
    <ErpShell title="Goods Receipt" description="Penerimaan barang dari supplier.">
      <PageHeader title="Goods Receipt" description="Catat penerimaan barang dari supplier." badge="New" onRefresh={loadData} loading={loading}
        actions={<Button size="sm" onClick={openCreate}><PlusCircle size={16} />Buat GR</Button>} />
      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <SectionHeader title="Riwayat Penerimaan" description={loading ? "" : `${filtered.length} receipt`} />
          <Input placeholder="Cari GR..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} className="max-w-xs" />
        </div>
        <div className="mt-4"><ManagementTable columns={columns} rows={filtered} emptyText="Belum ada GR." /></div>
      </Card>
      <Modal open={modalOpen} title="Catat Penerimaan Barang" onClose={() => setModalOpen(false)} size="xl">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Select label="Pilih Purchase Order" options={purchaseOrders.map((po) => ({ value: po.id, label: `${po.poNumber} - ${po.supplier?.name || ""}` }))}
            placeholder="Pilih PO yang sudah diapprove" value={selectedPO?.id || ""} onChange={(e) => selectPO(e.target.value)} />
          {grItems.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium">Items</p>
              {grItems.map((item, idx) => {
                const remaining = item.qtyOrdered - item.qtyReceivedBefore;
                return (
                  <div key={idx} className="flex gap-2 items-end rounded-2xl border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted">Dipesan: {formatNumber(item.qtyOrdered)} {item.unit}
                        {item.qtyReceivedBefore > 0 ? ` (${formatNumber(item.qtyReceivedBefore)} sudah diterima, sisa ${formatNumber(remaining)})` : ""}
                      </p>
                    </div>
                    <Input label="Qty diterima" type="number" className="w-24" value={item.qtyReceived}
                      onChange={(e) => updateGRItem(idx, "qtyReceived", e.target.value)}
                      hint={remaining > 0 ? `Maks ${formatNumber(remaining)}` : "Sudah penuh"} />
                    <Input label="Harga satuan" type="number" className="w-28" value={item.unitCost}
                      onChange={(e) => updateGRItem(idx, "unitCost", e.target.value)} />
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan GR</Button>
          </div>
        </form>
      </Modal>
      <Drawer open={Boolean(detail)} title={detail?.grNumber} onClose={() => setDetail(null)} size="md">
        {detail ? (
          <div className="grid gap-4">
            <div className="grid gap-2 rounded-2xl border p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">PO</span><span>{detail.purchaseOrder?.poNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted">Supplier</span><span>{detail.purchaseOrder?.supplier?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Diterima</span><span>{formatDateTime(detail.receivedDate)}</span></div>
            </div>
            <SectionHeader title="Items" />
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full text-sm"><thead className="bg-surface-2 text-xs uppercase text-muted">
                <tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Harga</th><th className="px-3 py-2 text-right">Total</th></tr>
              </thead><tbody className="divide-y">
                {detail.items?.map((i) => (
                  <tr key={i.id}><td className="px-3 py-2">{i.inventoryItem?.name || "-"}</td><td className="px-3 py-2 text-right">{formatNumber(i.qtyReceived)}</td><td className="px-3 py-2 text-right">{formatCurrency(i.unitCost)}</td><td className="px-3 py-2 text-right font-semibold">{formatCurrency(i.totalCost)}</td></tr>
                ))}
              </tbody></table>
            </div>
          </div>
        ) : null}
      </Drawer>
    </ErpShell>
  );
}
