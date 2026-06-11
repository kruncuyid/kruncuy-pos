import {
  ArrowRightLeft,
  CheckCircle2,
  Package,
  PlusCircle,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import { authApi } from "../../auth/services/authApi";
import { getStoredAccess, updateStoredAccess } from "../../../core/auth/session";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { depotTransferApi } from "../services/depotTransferApi";
import { inventoryApi } from "../services/inventoryApi";
import { warehouseApi } from "../services/warehouseApi";

function emptyItem() {
  return {
    inventoryItemId: "",
    qty: "",
    notes: "",
  };
}

function emptyForm() {
  return {
    id: "",
    sourceWarehouseId: "",
    targetBranchId: "",
    note: "",
    items: [emptyItem()],
  };
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatQty(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "-";
  return Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(3);
}

function TransferItemForm({ items, inventoryItems, onAdd, onRemove, onChange }) {
  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div
          key={`${index}-${item.inventoryItemId || "empty"}`}
          className="grid gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 lg:grid-cols-[minmax(0,1.5fr)_140px_minmax(0,1fr)_auto] lg:items-end"
        >
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Item stok</span>
            <select
              className="kr-input"
              value={item.inventoryItemId}
              onChange={(event) => onChange(index, { inventoryItemId: event.target.value })}
            >
              <option value="">Pilih item</option>
              {inventoryItems.map((inventoryItem) => (
                <option key={inventoryItem.id} value={inventoryItem.id}>
                  {inventoryItem.name} ({inventoryItem.unit})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Qty</span>
            <input
              className="kr-input"
              type="number"
              step="0.001"
              min="0"
              value={item.qty}
              onChange={(event) => onChange(index, { qty: event.target.value })}
              placeholder="0"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Catatan item</span>
            <input
              className="kr-input"
              value={item.notes}
              onChange={(event) => onChange(index, { notes: event.target.value })}
              placeholder="Opsional"
            />
          </label>

          <div className="flex items-center justify-end lg:self-end">
            <Button variant="danger" type="button" size="sm" onClick={() => onRemove(index)} disabled={items.length <= 1}>
              <Trash2 size={14} />
              Hapus
            </Button>
          </div>
        </div>
      ))}

      <div>
        <Button variant="secondary" type="button" onClick={onAdd}>
          <PlusCircle size={16} />
          Tambah item
        </Button>
      </div>
    </div>
  );
}

function TransferForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  saving,
  warehouses,
  branches,
  inventoryItems,
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Depot / source warehouse</span>
          <select
            className="kr-input"
            value={value.sourceWarehouseId}
            onChange={(event) => onChange({ ...value, sourceWarehouseId: event.target.value })}
          >
            <option value="">Pilih source warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
                {warehouse.branch ? ` - ${warehouse.branch.name}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Target outlet</span>
          <select
            className="kr-input"
            value={value.targetBranchId}
            onChange={(event) => onChange({ ...value, targetBranchId: event.target.value })}
          >
            <option value="">Pilih target branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({branch.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <Input
          label="Catatan transfer"
          value={value.note}
          onChange={(event) => onChange({ ...value, note: event.target.value })}
          placeholder="Opsional"
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <SectionHeader
          title="Daftar item transfer"
          description="Pilih barang yang akan dikirim dari depo ke outlet. Hanya item stock opname yang bisa ditransfer."
          compact
        />

        <div className="mt-4">
          <TransferItemForm
            items={value.items}
            inventoryItems={inventoryItems}
            onAdd={() =>
              onChange({
                ...value,
                items: [...value.items, emptyItem()],
              })
            }
            onRemove={(index) =>
              onChange({
                ...value,
                items: value.items.filter((_, itemIndex) => itemIndex !== index),
              })
            }
            onChange={(index, patch) =>
              onChange({
                ...value,
                items: value.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
              })
            }
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
        Transfer yang dibuat akan menunggu approval cashier yang sedang open shift di target outlet. Setelah
        di-approve, stok branch sumber berkurang dan stok branch tujuan bertambah, lalu otomatis masuk ke
        histori stock opname.
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          <PlusCircle size={16} />
          {saving ? "Menyimpan..." : "Buat transfer"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export default function ErpDepotTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    draft: 0,
    pendingApproval: 0,
    approved: 0,
    voided: 0,
  });
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailTransfer, setDetailTransfer] = useState(null);
  const [busyTransferId, setBusyTransferId] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [formShakeTick, setFormShakeTick] = useState(0);
  const [access, setAccess] = useState(() => getStoredAccess());
  const permissions = access?.permissions || [];
  const canCreateTransfer = useMemo(
    () =>
      permissions.includes("depot-transfers:write") &&
      permissions.includes("branches:read") &&
      permissions.includes("inventory:read"),
    [permissions]
  );

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const transferResponse = await depotTransferApi.getDepotTransfers();

      setTransfers(transferResponse.data?.data?.transfers || []);
      setSummary(transferResponse.data?.data?.summary || summary);

      if (canCreateTransfer) {
        const [branchResponse, warehouseResponse, inventoryResponse] = await Promise.all([
          branchApi.getBranches(),
          warehouseApi.getWarehouses(),
          inventoryApi.getInventoryItems(),
        ]);

        setBranches((branchResponse.data?.data || []).filter((branch) => branch.isActive));
        setWarehouses((warehouseResponse.data?.data || []).filter((warehouse) => warehouse.isActive));
        setInventoryItems(
          (inventoryResponse.data?.data || []).filter((item) => item.isActive && item.isOpnameRequired)
        );
      } else {
        setBranches([]);
        setWarehouses([]);
        setInventoryItems([]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data transfer depo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreateTransfer]);

  useEffect(() => {
    let cancelled = false;

    async function refreshAccess() {
      try {
        const response = await authApi.me();
        if (cancelled) return;

        const nextAccess = response.data?.data?.access;
        if (nextAccess) {
          updateStoredAccess(nextAccess);
          setAccess(nextAccess);
        }
      } catch {
        // Keep cached access when refresh is not available.
      }
    }

    refreshAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  const defaultSourceWarehouseId = useMemo(() => {
    const depotWarehouse =
      warehouses.find((warehouse) => /gondokusuman/i.test(warehouse.name) || /gondokusuman/i.test(warehouse.code)) ||
      warehouses[0];
    return depotWarehouse?.id || "";
  }, [warehouses]);

  const filteredTransfers = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const matchesStatus =
        statusFilter === "ALL" || String(transfer.status || "").toUpperCase() === statusFilter;

      const matchesKeyword =
        !keyword ||
        [
          transfer.transferNumber,
          transfer.note,
          transfer.approvalNote,
          transfer.sourceBranch?.name,
          transfer.targetBranch?.name,
          transfer.createdBy?.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      return matchesStatus && matchesKeyword;
    });
  }, [query, statusFilter, transfers]);

  const metrics = useMemo(
    () => [
      { title: "Total transfer", value: summary.total, icon: ArrowRightLeft },
      { title: "Pending approval", value: summary.pendingApproval, icon: Package },
      { title: "Approved", value: summary.approved, icon: CheckCircle2 },
      { title: "Voided", value: summary.voided, icon: XCircle },
    ],
    [summary]
  );

  function resetForm() {
    setForm({
      ...emptyForm(),
      sourceWarehouseId: defaultSourceWarehouseId,
    });
  }

  function openCreateModal() {
    setError("");
    setFormError("");
    setForm({
      ...emptyForm(),
      sourceWarehouseId: defaultSourceWarehouseId,
    });
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    setIsCreateOpen(false);
    setFormError("");
    resetForm();
  }

  function openDetail(transfer) {
    setDetailTransfer(transfer);
  }

  function closeDetail() {
    setDetailTransfer(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFormError("");

    try {
      if (!form.sourceWarehouseId || !form.targetBranchId) {
        setFormError("Depot source dan target outlet wajib dipilih.");
        setFormShakeTick((value) => value + 1);
        return;
      }

      const hasInvalidRow = form.items.some((item) => item.inventoryItemId && Number(item.qty || 0) <= 0);
      if (hasInvalidRow) {
        setFormError("Ada item dengan qty 0. Lengkapi qty atau hapus item tersebut.");
        setFormShakeTick((value) => value + 1);
        return;
      }

      const items = form.items
        .map((item) => ({
          inventoryItemId: item.inventoryItemId,
          qty: Number(item.qty || 0),
          notes: item.notes?.trim() || "",
        }))
        .filter((item) => item.inventoryItemId && item.qty > 0);

      if (!items.length) {
        setFormError("Minimal ada 1 item transfer dengan qty lebih besar dari 0.");
        setFormShakeTick((value) => value + 1);
        return;
      }

      await depotTransferApi.createDepotTransfer({
        sourceWarehouseId: form.sourceWarehouseId,
        targetBranchId: form.targetBranchId,
        note: form.note.trim(),
        items,
      });

      await loadData();
      closeCreateModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan transfer depo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(transfer) {
    const approvalNote = window.prompt("Catatan approval (opsional)", "") || "";
    const confirmed = window.confirm(`Approve transfer ${transfer.transferNumber}?`);
    if (!confirmed) return;

    setBusyTransferId(transfer.id);
    setError("");

    try {
      await depotTransferApi.approveDepotTransfer(transfer.id, {
        approvalNote: approvalNote.trim(),
      });
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal approve transfer depo.");
    } finally {
      setBusyTransferId("");
    }
  }

  async function handleVoid(transfer) {
    const reason = window.prompt(`Alasan void untuk ${transfer.transferNumber}`, "") || "";
    if (!reason.trim()) return;

    const confirmed = window.confirm(`Void transfer ${transfer.transferNumber}?`);
    if (!confirmed) return;

    setBusyTransferId(transfer.id);
    setError("");

    try {
      await depotTransferApi.voidDepotTransfer(transfer.id, {
        reason: reason.trim(),
      });
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal void transfer depo.");
    } finally {
      setBusyTransferId("");
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "transferNumber",
        label: "Transfer",
        render: (transfer) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{transfer.transferNumber}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{transfer.note || "-"}</p>
          </div>
        ),
      },
      {
        key: "route",
        label: "Route",
        render: (transfer) => (
          <div className="text-sm">
            <p className="font-medium text-[var(--color-text)]">{transfer.sourceWarehouse?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {transfer.sourceWarehouse?.branch?.name || transfer.sourceBranch?.name || "-"} {"\u2192"}{" "}
              {transfer.targetBranch?.name || "-"}
            </p>
          </div>
        ),
      },
      {
        key: "items",
        label: "Items",
        render: (transfer) => {
          const firstItems = (transfer.items || []).slice(0, 2).map((item) => item.itemName).join(", ");
          const moreCount = Math.max((transfer.items || []).length - 2, 0);

          return (
            <div className="min-w-0">
              <p className="font-medium text-[var(--color-text)]">{transfer.items?.length || 0} item</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {firstItems || "-"}
                {moreCount ? ` +${moreCount} lagi` : ""}
              </p>
            </div>
          );
        },
      },
      {
        key: "transferDate",
        label: "Tanggal",
        render: (transfer) => <span className="text-sm text-[var(--color-text)]">{formatDateTime(transfer.transferDate)}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (transfer) => {
          const toneMap = {
            DRAFT: "neutral",
            PENDING_APPROVAL: "warning",
            APPROVED: "success",
            VOID: "danger",
          };

          const labelMap = {
            DRAFT: "Draft",
            PENDING_APPROVAL: "Pending",
            APPROVED: "Approved",
            VOID: "Void",
          };

          return <Badge tone={toneMap[transfer.status] || "neutral"}>{labelMap[transfer.status] || transfer.status}</Badge>;
        },
      },
      {
        key: "approval",
        label: "Approval",
        render: (transfer) => (
          <div className="text-sm">
            <p className="font-medium">{transfer.approvedBy?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{transfer.approvedCashSession ? "Shift aktif" : "Belum approve"}</p>
          </div>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (transfer) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => openDetail(transfer)}>
              Detail
            </Button>
            {transfer.status === "PENDING_APPROVAL" ? (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(transfer)}
                  disabled={busyTransferId === transfer.id}
                >
                  <CheckCircle2 size={14} />
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleVoid(transfer)}
                  disabled={busyTransferId === transfer.id}
                >
                  <Trash2 size={14} />
                  Void
                </Button>
              </>
            ) : null}
          </div>
        ),
        cellClassName: "min-w-[240px]",
      },
    ],
    [busyTransferId]
  );

  const currentBranchOptions = useMemo(() => branches.filter(Boolean), [branches]);
  const currentWarehouseOptions = useMemo(() => warehouses.filter(Boolean), [warehouses]);
  const activeInventoryOptions = useMemo(() => inventoryItems.filter((item) => item.isActive && item.isOpnameRequired), [inventoryItems]);

  return (
    <ErpShell title="Depot transfers" description="Transfer barang dari depo ke outlet dengan approval cashier shift aktif.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Depot transfers</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Buat transfer stok dari depo ke outlet, lalu cashier di shift aktif melakukan approval supaya stok langsung
            masuk ke stock opname branch tujuan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadData}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          {canCreateTransfer ? (
            <Button onClick={openCreateModal}>
              <PlusCircle size={16} />
              Buat transfer
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <StatCard key={metric.title} title={metric.title} value={loading ? "-" : metric.value} icon={<Icon size={18} />} />;
        })}
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="grid gap-6">
        <Card className="p-5">
          <SectionHeader
            title="Daftar transfer"
            description="Pantau transfer yang menunggu approval, sudah approved, atau di-void."
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              label="Search transfer"
              icon={<ArrowRightLeft size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nomor transfer, outlet, atau catatan"
            />
            <label className="grid gap-2 text-sm text-[var(--color-text)]">
              <span className="font-medium">Filter status</span>
              <select className="kr-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">All status</option>
                <option value="PENDING_APPROVAL">Pending approval</option>
                <option value="APPROVED">Approved</option>
                <option value="VOID">Void</option>
                <option value="DRAFT">Draft</option>
              </select>
            </label>
          </div>

          {!canCreateTransfer ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Akses create transfer belum aktif di sesi browser ini. Kalau menu branch / depot belum muncul, logout lalu
              login ulang supaya permission terbaru ikut ter-refresh.
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
              Memuat transfer depo...
            </div>
          ) : filteredTransfers.length ? (
            <div className="mt-5">
              <ManagementTable
                columns={columns}
                rows={filteredTransfers}
                emptyText="Belum ada transfer untuk filter yang dipilih."
                resetKey={`${query}-${statusFilter}-${filteredTransfers.length}`}
                maxHeightClass="max-h-[38rem]"
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Belum ada transfer"
                description="Buat transfer pertama untuk mulai mendistribusikan stok depo ke outlet."
                actionLabel="Buat transfer"
                onAction={openCreateModal}
              />
            </div>
          )}
        </Card>
      </section>

      {canCreateTransfer ? (
        <Modal open={isCreateOpen} title="Buat transfer depo" onClose={closeCreateModal} size="2xl">
          <div key={formShakeTick} className={formError ? "erp-shake" : ""}>
            {formError ? (
              <div className="mb-4 rounded-2xl border border-[rgba(220,38,38,0.25)] bg-[rgba(220,38,38,0.08)] px-4 py-3 text-sm text-[var(--color-danger)]">
                {formError}
              </div>
            ) : null}
            <TransferForm
              value={form}
              onChange={setForm}
              onSubmit={handleSubmit}
              onCancel={closeCreateModal}
              saving={saving}
              warehouses={currentWarehouseOptions}
              branches={currentBranchOptions}
              inventoryItems={activeInventoryOptions}
            />
          </div>
        </Modal>
      ) : null}

      <Modal
        open={Boolean(detailTransfer)}
        title={detailTransfer ? `Detail transfer ${detailTransfer.transferNumber}` : "Detail transfer"}
        onClose={closeDetail}
        size="2xl"
      >
        {detailTransfer ? (
          <div className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Route</p>
                <p className="mt-2 text-sm font-semibold">{detailTransfer.sourceWarehouse?.name || "-"}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {detailTransfer.sourceWarehouse?.branch?.name || detailTransfer.sourceBranch?.name || "-"} {"\u2192"} {detailTransfer.targetBranch?.name || "-"}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Status</p>
                <div className="mt-2">
                  <Badge
                    tone={{
                      DRAFT: "neutral",
                      PENDING_APPROVAL: "warning",
                      APPROVED: "success",
                      VOID: "danger",
                    }[detailTransfer.status] || "neutral"}
                  >
                    {detailTransfer.status}
                  </Badge>
                </div>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Tanggal</p>
                <p className="mt-2 text-sm font-semibold">{formatDateTime(detailTransfer.transferDate)}</p>
              </Card>
            </div>

            <Card className="p-4">
              <SectionHeader title="Items transfer" description="Daftar item yang ikut dikirim dari depo ke outlet." compact />
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)]">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    <tr>
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-left">Unit</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {detailTransfer.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium">{item.itemName}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">{item.unit}</td>
                        <td className="px-4 py-3 text-right">{formatQty(item.qty)}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">{item.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-4">
              <SectionHeader title="Approval" description="Approval akan menyimpan cashier shift aktif sebagai penanggung jawab penerimaan." compact />
              <div className="mt-4 grid gap-3 text-sm text-[var(--color-muted)] lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em]">Approved by</p>
                  <p className="mt-2 font-semibold text-[var(--color-text)]">{detailTransfer.approvedBy?.name || "-"}</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em]">Cash session</p>
                  <p className="mt-2 font-semibold text-[var(--color-text)]">
                    {detailTransfer.approvedCashSession ? "Shift aktif terhubung" : "Belum ada approval"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </Modal>
    </ErpShell>
  );
}
