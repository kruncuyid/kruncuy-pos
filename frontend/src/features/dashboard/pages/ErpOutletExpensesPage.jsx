import { CheckCircle2, RefreshCcw, Search, ShoppingCart, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { branchApi } from "../services/branchApi";
import { purchasingApi } from "../services/purchasingApi";
import { Badge, Button, Card, EmptyState, Input, Modal, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { formatCurrency } from "../utils/reportFormatters";


function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ErpOutletExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    branchId: "ALL",
    status: "ALL",
    search: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [detailExpense, setDetailExpense] = useState(null);
  const [approvalExpense, setApprovalExpense] = useState(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [approving, setApproving] = useState(false);

  async function loadBranches() {
    const response = await branchApi.getBranches();
    setBranches(response.data.data || []);
  }

  async function loadExpenses() {
    setLoading(true);
    setError("");

    try {
      const response = await purchasingApi.listOutletExpenses({
        branchId: filters.branchId === "ALL" ? "" : filters.branchId,
        status: filters.status,
        search: filters.search,
      });
      const data = response.data.data;
      setItems(Array.isArray(data) ? data : (data?.items || []));
      setSummary(!Array.isArray(data) ? (data?.summary || null) : null);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat outlet expense.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches().catch(() => {});
  }, []);

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const rows = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        expenseNumber: item.id.slice(0, 8).toUpperCase(),
        branchName: item.branch?.name || "-",
        createdByName: item.createdBy?.name || "-",
        amount: item.totalAmount,
        status: item.status,
        createdAt: item.expenseDate || item.createdAt,
        approvedByName: item.approvedBy?.name || "-",
        note: item.note || "-",
        item,
      })),
    [items]
  );

  async function handleApprove(item) {
    setApprovalExpense(item);
    setApprovalNote("");
  }

  async function confirmApprove() {
    if (!approvalExpense) return;

    setApproving(true);
    setError("");

    try {
      await purchasingApi.approveOutletExpense(approvalExpense.id, {
        approvalNote: approvalNote.trim(),
      });
      setApprovalExpense(null);
      setApprovalNote("");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal approve outlet expense.");
    } finally {
      setApproving(false);
    }
  }

  async function handleVoid(item) {
    setSavingId(item.id);
    setError("");

    try {
      await purchasingApi.voidOutletExpense(item.id, {});
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal membatalkan outlet expense.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <ErpShell title="Outlet Expenses" description="Belanja operasional outlet.">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              ERP Workspace
            </p>
            <h1 className="mt-1 text-2xl font-black">Outlet Expenses</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Belanja outlet menunggu approval owner. Status REQUESTED belum mengurangi cash outlet.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setRefreshKey((value) => value + 1)}>
            <RefreshCcw size={16} />
            Refresh
          </Button>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <StatCard title="Total" value={loading ? "-" : summary?.totalExpenses || 0} icon={<ShoppingCart size={18} />} />
        <StatCard title="Request" value={loading ? "-" : summary?.requestedExpenses || 0} icon={<ShoppingCart size={18} />} />
        <StatCard title="Approved" value={loading ? "-" : summary?.postedExpenses || 0} icon={<CheckCircle2 size={18} />} />
        <StatCard title="Void" value={loading ? "-" : summary?.voidedExpenses || 0} icon={<XCircle size={18} />} />
      </section>

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Branch</span>
            <select
              className="kr-input"
              value={filters.branchId}
              onChange={(event) => setFilters((current) => ({ ...current, branchId: event.target.value }))}
            >
              <option value="ALL">Semua branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Status</span>
            <select
              className="kr-input"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="ALL">Semua status</option>
              <option value="REQUESTED">Menunggu owner</option>
              <option value="POSTED">Approved</option>
              <option value="VOID">Void</option>
            </select>
          </label>

          <Input
            label="Search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            icon={<Search size={16} />}
            placeholder="Cari nomor / crew / catatan"
          />

          <div className="flex items-end gap-2">
            <Button onClick={() => setRefreshKey((value) => value + 1)}>Terapkan filter</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({
                  branchId: "ALL",
                  status: "ALL",
                  search: "",
                });
                setRefreshKey((value) => value + 1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <ManagementTable
        resetKey={refreshKey}
        defaultPageSize={10}
        pageSizeOptions={[10, 25, 50]}
        maxHeightClass="max-h-[38rem]"
        rows={rows}
        columns={[
          {
            key: "expenseNumber",
            label: "Request",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-semibold">{row.expenseNumber}</p>
                <p className="text-xs text-[var(--color-muted)]">{formatDate(row.createdAt)}</p>
              </div>
            ),
          },
          { key: "branchName", label: "Branch" },
          { key: "createdByName", label: "Crew" },
          {
            key: "amount",
            label: "Amount",
            render: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span>,
          },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge tone={row.status === "POSTED" ? "success" : row.status === "VOID" ? "danger" : "warning"}>
                {row.status}
              </Badge>
            ),
          },
          { key: "approvedByName", label: "Approved by" },
          {
            key: "actions",
            label: "Actions",
            cellClassName: "min-w-[220px]",
            render: (row) => {
              const item = row.item;
              return (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setDetailExpense(item)}>
                    Detail
                  </Button>
                  {item.status === "REQUESTED" ? (
                    <Button size="sm" onClick={() => handleApprove(item)} disabled={savingId === item.id}>
                      Approve
                    </Button>
                  ) : null}
                  {item.status !== "VOID" ? (
                    <Button size="sm" variant="secondary" onClick={() => handleVoid(item)} disabled={savingId === item.id}>
                      Void
                    </Button>
                  ) : null}
                </div>
              );
            },
          },
        ]}
        emptyText="Belum ada outlet expense."
      />

      <Modal
        open={Boolean(detailExpense)}
        title="Detail outlet expense"
        onClose={() => setDetailExpense(null)}
        size="2xl"
      >
        {detailExpense ? (
          <div className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Branch</p>
                <p className="mt-2 font-semibold">{detailExpense.branch?.name || "-"}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Status</p>
                <p className="mt-2 font-semibold">{detailExpense.status}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Total</p>
                <p className="mt-2 font-semibold">{formatCurrency(detailExpense.totalAmount)}</p>
              </Card>
            </div>
            <div className="rounded-3xl border border-[var(--color-border)] overflow-hidden">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {detailExpense.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium">{item.itemName}</td>
                      <td className="px-4 py-3">{item.qty}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(approvalExpense)}
        title="Approve outlet expense"
        onClose={() => {
          setApprovalExpense(null);
          setApprovalNote("");
        }}
      >
        {approvalExpense ? (
          <div className="grid gap-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm">
              <p className="font-semibold">{approvalExpense.branch?.name || "-"}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Approve agar outlet expense berubah jadi posted dan saldo outlet ikut berkurang.
              </p>
            </div>
            <Input
              label="Catatan approval"
              value={approvalNote}
              onChange={(event) => setApprovalNote(event.target.value)}
              placeholder="Opsional"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={confirmApprove} disabled={approving}>
                {approving ? "Menyetujui..." : "Approve"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setApprovalExpense(null);
                  setApprovalNote("");
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </ErpShell>
  );
}
