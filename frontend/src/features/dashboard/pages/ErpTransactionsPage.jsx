import { CalendarClock, CheckCircle2, Eye, Filter, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import { formatCurrency, formatDateTime, buildChannelLabel, paymentTone } from "../utils/reportFormatters";
import { getStoredAccess } from "../../../core/auth/session";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { transactionApi } from "../services/transactionApi";

export default function ErpTransactionsPage() {
  const access = getStoredAccess();
  const canVoid = access?.permissions?.includes("transactions:write");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    branchId: "ALL",
    status: "ALL",
    channel: "ALL",
  });
  const [selected, setSelected] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [transactionsResponse, branchesResponse] = await Promise.all([
        transactionApi.getTransactions(),
        branchApi.getBranches(),
      ]);

      setTransactions(transactionsResponse.data?.data || []);
      setBranches(branchesResponse.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat transaksi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => {
    const totalTransactions = transactions.length;
    const totalSales = transactions.reduce((sum, trx) => sum + Number(trx.totalAmount || 0), 0);
    const voidTransactions = transactions.filter((trx) => trx.status === "VOID").length;
    const completedTransactions = transactions.filter((trx) => trx.status === "COMPLETED").length;

    return [
      { title: "Total transaksi", value: loading ? "-" : totalTransactions, icon: CalendarClock },
      { title: "Transaksi selesai", value: loading ? "-" : completedTransactions, icon: CheckCircle2 },
      { title: "Transaksi void", value: loading ? "-" : voidTransactions, icon: Trash2 },
      { title: "Total sales", value: loading ? "-" : formatCurrency(totalSales), icon: RefreshCw },
    ];
  }, [transactions, loading]);

  const branchMap = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches]);

  const filteredTransactions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return transactions.filter((trx) => {
      const channelLabel = buildChannelLabel(trx).toLowerCase();
      const cashierLabel = String(
        trx.cashierFullNameSnapshot || trx.cashierUsernameSnapshot || trx.cashier?.name || trx.cashier?.username || ""
      ).toLowerCase();
      const branchLabel = String(trx.branch?.name || branchMap.get(trx.branchId) || "").toLowerCase();
      const invoiceLabel = String(trx.invoiceNumber || "").toLowerCase();

      if (filters.branchId !== "ALL" && trx.branchId !== filters.branchId) return false;
      if (filters.status !== "ALL" && trx.status !== filters.status) return false;
      if (filters.channel !== "ALL" && trx.salesChannel !== filters.channel) return false;
      if (
        search &&
        !invoiceLabel.includes(search) &&
        !cashierLabel.includes(search) &&
        !channelLabel.includes(search) &&
        !branchLabel.includes(search)
      ) {
        return false;
      }

      return true;
    });
  }, [transactions, filters, branchMap]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function openDetail(row) {
    setSelected(row);
    setVoidReason("");
  }

  async function handleVoid() {
    if (!selected) return;
    setSaving(true);
    setError("");

    try {
      await transactionApi.voidTransaction(selected.id, {
        reason: voidReason.trim() || "Dibatalkan melalui ERP",
      });
      setSelected(null);
      setVoidReason("");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal void transaksi.");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: "invoiceNumber",
        label: "Invoice",
        render: (row) => (
          <button type="button" className="text-left" onClick={() => openDetail(row)}>
            <p className="font-semibold text-[var(--color-text)]">{row.invoiceNumber}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDateTime(row.createdAt)}</p>
          </button>
        ),
      },
      {
        key: "branch",
        label: "Branch",
        render: (row) => <span className="text-sm text-[var(--color-muted)]">{row.branch?.name || "-"}</span>,
      },
      {
        key: "cashier",
        label: "Cashier",
        render: (row) => (
          <div>
            <p className="font-medium text-[var(--color-text)]">
              {row.cashierFullNameSnapshot || row.cashier?.name || row.cashierUsernameSnapshot || "-"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {row.cashierUsernameSnapshot || row.cashier?.username || "-"}
            </p>
          </div>
        ),
      },
      {
        key: "channel",
        label: "Channel",
        render: (row) => <Badge tone={row.salesChannel === "ONLINE" ? "info" : "neutral"}>{buildChannelLabel(row)}</Badge>,
      },
      {
        key: "paymentMethod",
        label: "Payment",
        render: (row) => <span className="text-sm font-medium">{row.paymentMethod || "-"}</span>,
      },
      {
        key: "totalPcs",
        label: "Pcs",
        render: (row) => <span className="font-semibold">{row.totalPcs || 0}</span>,
      },
      {
        key: "totalAmount",
        label: "Total",
        render: (row) => <span className="font-semibold">{formatCurrency(row.totalAmount)}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <Badge tone={row.status === "VOID" ? "danger" : "success"}>{row.status === "VOID" ? "VOID" : "COMPLETED"}</Badge>
        ),
      },
      {
        key: "action",
        label: "Aksi",
        render: (row) => (
          <Button type="button" variant="secondary" onClick={() => openDetail(row)} className="px-3 py-2">
            <Eye size={16} />
            Detail
          </Button>
        ),
      },
    ],
    []
  );

  const selectedItems = selected?.items || [];

  return (
    <ErpShell title="Transactions" description="Histori transaksi, detail item, dan aksi void transaksi.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Transactions</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Pantau transaksi harian, siapa yang jual, dan lakukan void jika ada input yang salah.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return <StatCard key={item.title} title={item.title} value={item.value} icon={<Icon size={18} />} />;
        })}
      </section>

      <Card className="p-5">
        <SectionHeader
          title="Filter transaksi"
          description="Cari berdasarkan invoice, branch, channel, dan status transaksi."
        />

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <Input
            label="Cari transaksi"
            placeholder="Invoice, cashier, branch"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Branch</span>
            <select className="kr-input" value={filters.branchId} onChange={(event) => updateFilter("branchId", event.target.value)}>
              <option value="ALL">Semua branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Channel</span>
            <select className="kr-input" value={filters.channel} onChange={(event) => updateFilter("channel", event.target.value)}>
              <option value="ALL">Semua channel</option>
              <option value="OFFLINE">Offline</option>
              <option value="ONLINE">Online</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Status</span>
            <select className="kr-input" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="ALL">Semua status</option>
              <option value="COMPLETED">Completed</option>
              <option value="VOID">Void</option>
            </select>
          </label>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-5">
          <ManagementTable
            columns={columns}
            rows={filteredTransactions}
            emptyText="Belum ada transaksi yang cocok dengan filter."
            stickyHeader
            maxHeightClass="max-h-[34rem]"
          />
        </div>
      </Card>

      <Modal open={Boolean(selected)} title={selected?.invoiceNumber || "Detail transaksi"} onClose={() => setSelected(null)} size="xl">
        {selected ? (
          <div className="grid gap-5">
            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">Info transaksi</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <p><span className="font-medium">Invoice:</span> {selected.invoiceNumber}</p>
                  <p><span className="font-medium">Tanggal:</span> {formatDateTime(selected.createdAt)}</p>
                  <p><span className="font-medium">Branch:</span> {selected.branch?.name || "-"}</p>
                  <p><span className="font-medium">Cashier:</span> {selected.cashierFullNameSnapshot || selected.cashier?.name || "-"}</p>
                  <p><span className="font-medium">Username:</span> {selected.cashierUsernameSnapshot || selected.cashier?.username || "-"}</p>
                </div>
              </Card>
              <Card className="p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">Pembayaran</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <p><span className="font-medium">Channel:</span> {buildChannelLabel(selected)}</p>
                  <p><span className="font-medium">Payment:</span> {selected.paymentMethod || "-"}</p>
                  <p><span className="font-medium">Total pcs:</span> {selected.totalPcs || 0}</p>
                  <p><span className="font-medium">Total amount:</span> {formatCurrency(selected.totalAmount)}</p>
                  <div className="pt-1">
                    <Badge tone={selected.status === "VOID" ? "danger" : "success"}>{selected.status}</Badge>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <SectionHeader title="Item transaksi" description={`${selectedItems.length} item pada invoice ini.`} />
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)]">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[var(--color-surface)]">
                    <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      <th className="px-3 py-2">Menu</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Pcs</th>
                      <th className="px-3 py-2">Harga</th>
                      <th className="px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item) => (
                      <tr key={item.id} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2">
                          <p className="font-medium text-[var(--color-text)]">{item.productName}</p>
                        </td>
                        <td className="px-3 py-2">{item.qty}</td>
                        <td className="px-3 py-2">{item.pcs}</td>
                        <td className="px-3 py-2">{formatCurrency(item.price)}</td>
                        <td className="px-3 py-2 font-semibold">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="flex flex-wrap justify-between gap-3">
              <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
                Tutup
              </Button>
              {canVoid && selected.status !== "VOID" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    label="Alasan void"
                    placeholder="Contoh: salah menu / salah qty"
                    value={voidReason}
                    onChange={(event) => setVoidReason(event.target.value)}
                    className="min-w-[18rem]"
                  />
                  <Button type="button" variant="danger" onClick={handleVoid} disabled={saving}>
                    {saving ? "Memproses..." : "Void transaksi"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </ErpShell>
  );
}
