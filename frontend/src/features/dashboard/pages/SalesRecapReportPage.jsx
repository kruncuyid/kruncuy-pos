import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileDown, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, EmptyState, SectionHeader } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ReportFiltersBar from "../components/report/ReportFiltersBar";
import ReportMetricGrid from "../components/report/ReportMetricGrid";
import ReportPagination from "../components/report/ReportPagination";
import ReportTable from "../components/report/ReportTable";
import { exportReportToExcel, exportReportToPdf } from "../components/report/reportExport";
import { formatCurrency, formatDateTime, getMonthToDateDefaults, paymentTone } from "../utils/reportFormatters";
import { branchApi } from "../services/branchApi";
import { reportApi } from "../services/reportApi";

const PAGE_SIZE = 10;
function exportPaymentLabel(value) {
  const upper = String(value || "").toUpperCase();
  return upper === "SPLIT" ? "Split bill" : upper;
}


export default function SalesRecapReportPage() {
  const navigate = useNavigate();
  const defaultRange = useMemo(() => getMonthToDateDefaults(), []);

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    branchId: "ALL",
    cashierId: "ALL",
    salesChannel: "ALL",
    paymentMethod: "ALL",
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
  });
  const [draftFilters, setDraftFilters] = useState(filters);

  const branchOptions = useMemo(
    () => [
      { value: "ALL", label: "All branches" },
      ...branches.map((branch) => ({
        value: branch.id,
        label: `${branch.name} (${branch.code})`,
      })),
    ],
    [branches]
  );

  const cashierOptions = useMemo(() => {
    const source = Array.isArray(report?.cashierOptions) ? report.cashierOptions : [];
    return [
      { value: "ALL", label: "All cashiers" },
      ...source.map((cashier) => ({
        value: cashier.id,
        label: cashier.displayName || cashier.name,
      })),
    ];
  }, [report?.cashierOptions]);

  const channelOptions = useMemo(
    () => [
      { value: "ALL", label: "All channels" },
      { value: "OFFLINE", label: "Offline" },
      { value: "ONLINE", label: "Online" },
    ],
    []
  );

  const paymentOptions = useMemo(
    () => [
      { value: "ALL", label: "All payment methods" },
      { value: "CASH", label: "Cash" },
      { value: "QRIS", label: "QRIS" },
      { value: "SPLIT", label: "Split bill" },
      { value: "GOFOOD", label: "GoFood" },
      { value: "GRABFOOD", label: "GrabFood" },
      { value: "SHOPEEFOOD", label: "ShopeeFood" },
    ],
    []
  );

  const loadBranches = async () => {
    const response = await branchApi.getBranches();
    return Array.isArray(response.data?.data) ? response.data.data : [];
  };

  const loadReport = async (nextFilters = filters) => {
    setReportLoading(true);
    setError("");

    try {
      const params = {
        branchId: nextFilters.branchId === "ALL" ? undefined : nextFilters.branchId,
        cashierId: nextFilters.cashierId === "ALL" ? undefined : nextFilters.cashierId,
        salesChannel: nextFilters.salesChannel,
        paymentMethod: nextFilters.paymentMethod,
        startDate: nextFilters.startDate,
        endDate: nextFilters.endDate,
      };

      const response = await reportApi.getSalesRecap(params);
      setReport(response.data?.data || null);
      setCurrentPage(1);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal memuat sales recap");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const branchData = await loadBranches();
        setBranches(branchData);
        await loadReport(filters);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Gagal memuat data report");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!report?.rows?.length) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    const totalPages = Math.max(1, Math.ceil(report.rows.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, report?.rows?.length]);

  const handleApply = async () => {
    setFilters(draftFilters);
    await loadReport(draftFilters);
  };

  const handleReset = async () => {
    const resetFilters = {
      branchId: "ALL",
      cashierId: "ALL",
      salesChannel: "ALL",
      paymentMethod: "ALL",
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
    };

    setDraftFilters(resetFilters);
    setFilters(resetFilters);
    await loadReport(resetFilters);
  };

  const summary = report?.summary || {};
  const rows = report?.rows || [];
  const selectedBranchLabel = report?.selectedBranch
    ? `${report.selectedBranch.name} (${report.selectedBranch.code})`
    : "All branches";

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns = [
    {
      key: "invoiceNumber",
      label: "Invoice",
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--color-text)]">{row.invoiceNumber}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
      exportValue: (row) => row.invoiceNumber,
    },
    {
      key: "branchName",
      label: "Branch",
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--color-text)]">{row.branchName}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{row.branchCode}</p>
        </div>
      ),
      exportValue: (row) => `${row.branchName} (${row.branchCode})`,
    },
    {
      key: "cashierName",
      label: "Cashier",
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--color-text)]">{row.cashierDisplayName || row.cashierName}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{row.cashierUsername || "-"}</p>
        </div>
      ),
      exportValue: (row) => row.cashierDisplayName || row.cashierName,
    },
    {
      key: "salesChannel",
      label: "Channel",
      render: (row) => <Badge tone={row.salesChannel === "ONLINE" ? "info" : "neutral"}>{row.salesChannel}</Badge>,
      exportValue: (row) => row.salesChannel,
    },
    {
      key: "paymentMethod",
      label: "Payment",
      render: (row) => <Badge tone={paymentTone(row.paymentMethod)}>{row.paymentMethod}</Badge>,
      exportValue: (row) => exportPaymentLabel(row.paymentMethod),
    },
    {
      key: "itemCount",
      label: "Items",
      render: (row) => `${row.itemCount} item`,
      exportValue: (row) => row.itemCount,
    },
    {
      key: "totalPcs",
      label: "Pcs",
      render: (row) => row.totalPcs.toLocaleString("id-ID"),
      exportValue: (row) => row.totalPcs,
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (row) => formatCurrency(row.totalAmount),
      exportValue: (row) => row.totalAmount,
      cellClassName: "font-semibold",
    },
  ];

  const summaryRows = [
    { label: "Total sales", value: formatCurrency(summary.totalSales) },
    { label: "Total transactions", value: summary.totalTransactions || 0 },
    { label: "Total pcs", value: summary.totalPcs || 0 },
    { label: "Average ticket", value: formatCurrency(summary.averageTicket || 0) },
    { label: "Cash total", value: formatCurrency(summary.cashTotal || 0) },
    { label: "QRIS total", value: formatCurrency(summary.qrisTotal || 0) },
    { label: "Online total", value: formatCurrency(summary.onlineTotal || 0) },
  ];

  const metrics = [
    {
      label: "Total sales",
      value: formatCurrency(summary.totalSales),
      hint: `${summary.totalTransactions || 0} transaksi`,
      badge: selectedBranchLabel,
      tone: "primary",
    },
    {
      label: "Total transactions",
      value: (summary.totalTransactions || 0).toLocaleString("id-ID"),
      hint: "Jumlah invoice yang masuk",
      badge: "Sales recap",
      tone: "neutral",
    },
    {
      label: "Total pcs",
      value: (summary.totalPcs || 0).toLocaleString("id-ID"),
      hint: "Qty barang yang terjual",
      badge: "Pcs sold",
      tone: "success",
    },
    {
      label: "Average ticket",
      value: formatCurrency(summary.averageTicket || 0),
      hint: "Rata-rata nilai transaksi",
      badge: "AOV",
      tone: "warning",
    },
    {
      label: "Cash total",
      value: formatCurrency(summary.cashTotal || 0),
      hint: "Total transaksi cash",
      badge: "Cash",
      tone: "success",
    },
    {
      label: "QRIS total",
      value: formatCurrency(summary.qrisTotal || 0),
      hint: "Total transaksi QRIS",
      badge: "QRIS",
      tone: "info",
    },
  ];

  const handleExportExcel = () => {
    exportReportToExcel({
      fileName: `sales-recap-${filters.startDate}-${filters.endDate}`,
      title: "Sales Recapitulation",
      summaryRows,
      detailColumns: columns,
      detailRows: rows,
    });
  };

  const handleExportPdf = () => {
    exportReportToPdf({
      fileName: `sales-recap-${filters.startDate}-${filters.endDate}`,
      title: "Sales Recapitulation",
      description: `Branch: ${selectedBranchLabel} | Payment: ${filters.paymentMethod} | Channel: ${filters.salesChannel} | Cashier: ${filters.cashierId === "ALL" ? "All cashiers" : filters.cashierId}`,
      summaryRows,
      detailColumns: columns,
      detailRows: rows,
    });
  };

  return (
    <ErpShell
      title="Sales Recapitulation"
      description="Report sales yang bisa difilter per branch, cashier, channel, payment, dan rentang tanggal."
    >
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
            ERP workspace
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Sales Recapitulation</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Default-nya semua branch, cashier, channel, dan payment. Kamu bisa custom range tanggal dan filter spesifik sesuai kebutuhan.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
          <Button variant="secondary" onClick={() => loadReport(filters)} disabled={reportLoading}>
            <RefreshCw size={16} className={reportLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExportExcel} disabled={!rows.length}>
            <FileSpreadsheet size={16} />
            Excel
          </Button>
          <Button variant="secondary" onClick={handleExportPdf} disabled={!rows.length}>
            <FileDown size={16} />
            PDF
          </Button>
        </div>
      </header>

      <ReportFiltersBar
        branchValue={draftFilters.branchId}
        cashierValue={draftFilters.cashierId}
        channelValue={draftFilters.salesChannel}
        paymentValue={draftFilters.paymentMethod}
        startDateValue={draftFilters.startDate}
        endDateValue={draftFilters.endDate}
        branchOptions={branchOptions}
        cashierOptions={cashierOptions}
        channelOptions={channelOptions}
        paymentOptions={paymentOptions}
        onBranchChange={(event) => setDraftFilters((prev) => ({ ...prev, branchId: event.target.value }))}
        onCashierChange={(event) => setDraftFilters((prev) => ({ ...prev, cashierId: event.target.value }))}
        onChannelChange={(event) => setDraftFilters((prev) => ({ ...prev, salesChannel: event.target.value }))}
        onPaymentChange={(event) => setDraftFilters((prev) => ({ ...prev, paymentMethod: event.target.value }))}
        onStartDateChange={(event) => setDraftFilters((prev) => ({ ...prev, startDate: event.target.value }))}
        onEndDateChange={(event) => setDraftFilters((prev) => ({ ...prev, endDate: event.target.value }))}
        onApply={handleApply}
        onReset={handleReset}
        loading={reportLoading}
      />

      {loading ? (
        <Card className="p-6 text-sm text-[var(--color-muted)]">Memuat report...</Card>
      ) : error ? (
        <Card className="p-6 text-sm text-red-600">{error}</Card>
      ) : (
        <>
          <ReportMetricGrid metrics={metrics} />

          <Card className="p-5">
            <SectionHeader
              title="Sales detail table"
              description={`Periode ${filters.startDate} s/d ${filters.endDate} • ${selectedBranchLabel} • ${
                filters.salesChannel === "ALL" ? "All channels" : filters.salesChannel
              } • ${filters.paymentMethod === "ALL" ? "All payment methods" : filters.paymentMethod}`}
              compact
            />

            <div className="mt-4">
              <ReportTable
                columns={columns}
                rows={pagedRows}
                emptyText="Tidak ada transaksi yang cocok dengan filter yang dipilih."
                maxHeightClass="max-h-[28rem]"
                stickyHeader
              />
            </div>
          </Card>

          <ReportPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRows={rows.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />

          <Card className="p-5">
            <SectionHeader
              title="Transaction item preview"
              description="Preview item dari transaksi terpilih untuk membantu audit cepat."
              compact
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pagedRows.slice(0, 6).map((row) => (
                <div key={row.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{row.invoiceNumber}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">{row.branchName}</p>
                    </div>
                    <Badge tone={paymentTone(row.paymentMethod)}>{row.paymentMethod}</Badge>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-[var(--color-muted)]">
                    {row.items.slice(0, 3).map((item, index) => (
                      <div key={`${row.id}-${index}`} className="flex items-center justify-between gap-3">
                        <span className="truncate">{item.productName}</span>
                        <span className="font-semibold text-[var(--color-text)]">
                          {item.qty} x {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                    {!row.items.length ? <div>Item tidak tersedia.</div> : null}
                  </div>
                </div>
              ))}
              {!pagedRows.length ? (
                <div className="md:col-span-2 xl:col-span-3">
                  <EmptyState
                    title="Belum ada transaksi"
                    description="Coba ubah range tanggal atau pilih branch/cashier/payment/channel yang berbeda."
                  />
                </div>
              ) : null}
            </div>
          </Card>
        </>
      )}
    </ErpShell>
  );
}
