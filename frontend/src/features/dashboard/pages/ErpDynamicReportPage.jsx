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
import { ERP_REPORTS } from "../reportCatalog";
import { buildExportColumns, buildReportMetrics, getReportViewConfig } from "../reportViewConfig";
import { branchApi } from "../services/branchApi";
import { reportApi } from "../services/reportApi";
import { formatCellValue, getMonthToDateDefaults, paymentTone } from "../utils/reportFormatters";

const PAGE_SIZE = 10;

function BasicReportFiltersBar({ branchValue, startDateValue, endDateValue, branchOptions, onBranchChange, onStartDateChange, onEndDateChange, onApply, onReset, loading }) {
  return (
    <Card className="p-4">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Branch</span>
          <select className="kr-input" value={branchValue} onChange={onBranchChange}>
            {branchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Start date</span>
          <input className="kr-input" type="date" value={startDateValue} onChange={onStartDateChange} />
        </label>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">End date</span>
          <input className="kr-input" type="date" value={endDateValue} onChange={onEndDateChange} />
        </label>
        <div className="flex items-end gap-2">
          <Button onClick={onApply} disabled={loading} className="min-w-[110px]">
            Terapkan
          </Button>
          <Button variant="secondary" onClick={onReset} disabled={loading} className="min-w-[90px]">
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function ErpDynamicReportPage({ reportKey }) {
  const navigate = useNavigate();
  const defaultRange = useMemo(() => getMonthToDateDefaults(), []);
  const reportMeta = useMemo(() => ERP_REPORTS.find((report) => report.key === reportKey), [reportKey]);
  const viewConfig = useMemo(() => getReportViewConfig(reportKey), [reportKey]);

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

  const buildParams = (nextFilters) => ({
    branchId: nextFilters.branchId === "ALL" ? undefined : nextFilters.branchId,
    cashierId: nextFilters.cashierId === "ALL" ? undefined : nextFilters.cashierId,
    salesChannel: nextFilters.salesChannel,
    paymentMethod: nextFilters.paymentMethod,
    startDate: nextFilters.startDate,
    endDate: nextFilters.endDate,
  });

  const loadReport = async (nextFilters = filters) => {
    setReportLoading(true);
    setError("");

    try {
      const response = await reportApi.getReport(reportKey, buildParams(nextFilters));
      setReport(response.data?.data || null);
      setCurrentPage(1);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal memuat report");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const response = await branchApi.getBranches();
        const branchData = Array.isArray(response.data?.data) ? response.data.data : [];
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
  }, [reportKey]);

  useEffect(() => {
    const rowCount = report?.rows?.length || 0;
    if (!rowCount) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }

    const totalPages = Math.max(1, Math.ceil(rowCount / PAGE_SIZE));
    if (currentPage > totalPages) setCurrentPage(totalPages);
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

  const rows = report?.rows || [];
  const summary = report?.summary || {};
  const selectedBranchLabel = report?.selectedBranch
    ? `${report.selectedBranch.name} (${report.selectedBranch.code})`
    : "All branches";
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const tableColumns = useMemo(
    () =>
      (viewConfig.columns || []).map((column) => ({
        key: column.key,
        label: column.label,
        cellClassName: column.type === "currency" ? "font-semibold" : undefined,
        render: (row) => {
          const value = row[column.key];
          if (column.type === "badge") {
            const tone = column.badgeTone ? column.badgeTone(value) : paymentTone(value);
            return <Badge tone={tone}>{formatCellValue(value)}</Badge>;
          }
          return formatCellValue(value, column.type);
        },
        exportValue: (row) => formatCellValue(row[column.key], column.type),
      })),
    [viewConfig.columns]
  );

  const metrics = useMemo(() => buildReportMetrics(summary, reportKey), [summary, reportKey]);
  const exportColumns = useMemo(() => buildExportColumns(reportKey), [reportKey]);
  const summaryRows = useMemo(
    () =>
      metrics.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    [metrics]
  );

  const title = reportMeta?.title || "ERP Report";
  const description = reportMeta?.description || "Laporan operasional KRUNCUY POS.";

  const handleExportExcel = () => {
    exportReportToExcel({
      fileName: `${reportKey}-${filters.startDate}-${filters.endDate}`,
      title,
      summaryRows,
      detailColumns: exportColumns,
      detailRows: rows,
    });
  };

  const handleExportPdf = () => {
    exportReportToPdf({
      fileName: `${reportKey}-${filters.startDate}-${filters.endDate}`,
      title,
      description: `${selectedBranchLabel} | ${filters.startDate} s/d ${filters.endDate}`,
      summaryRows,
      detailColumns: exportColumns,
      detailRows: rows,
    });
  };

  return (
    <ErpShell title={title} description={description}>
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
            {reportMeta?.groupTitle || "ERP Reports"}
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate("/erp/reports")}>
            <ArrowLeft size={16} />
            Reports
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

      {viewConfig.filterProfile === "sales" ? (
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
      ) : (
        <BasicReportFiltersBar
          branchValue={draftFilters.branchId}
          startDateValue={draftFilters.startDate}
          endDateValue={draftFilters.endDate}
          branchOptions={branchOptions}
          onBranchChange={(event) => setDraftFilters((prev) => ({ ...prev, branchId: event.target.value }))}
          onStartDateChange={(event) => setDraftFilters((prev) => ({ ...prev, startDate: event.target.value }))}
          onEndDateChange={(event) => setDraftFilters((prev) => ({ ...prev, endDate: event.target.value }))}
          onApply={handleApply}
          onReset={handleReset}
          loading={reportLoading}
        />
      )}

      {loading ? (
        <Card className="p-6 text-sm text-[var(--color-muted)]">Memuat report...</Card>
      ) : error ? (
        <Card className="p-6 text-sm text-red-600">{error}</Card>
      ) : (
        <>
          <ReportMetricGrid metrics={metrics} />

          <Card className="p-5">
            <SectionHeader
              title="Report detail"
              description={`Periode ${filters.startDate} s/d ${filters.endDate} • ${selectedBranchLabel}`}
              compact
            />

            <div className="mt-4">
              <ReportTable
                columns={tableColumns}
                rows={pagedRows}
                emptyText="Tidak ada data yang cocok dengan filter yang dipilih."
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

          {!rows.length ? (
            <Card className="p-5">
              <EmptyState
                title="Belum ada data"
                description="Coba ubah rentang tanggal atau filter branch untuk melihat hasil report."
              />
            </Card>
          ) : null}
        </>
      )}
    </ErpShell>
  );
}
