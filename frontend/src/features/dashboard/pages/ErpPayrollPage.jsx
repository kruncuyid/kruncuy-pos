import { DollarSign, PlusCircle, RefreshCw, Search, CheckCircle, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Modal, PageHeader, SectionHeader, Select, Alert } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { payrollApi } from "../services/payrollApi";
import { formatCurrency, formatNumber } from "../utils/reportFormatters";

function statusTone(s) { return s === "PAID" ? "success" : s === "APPROVED" ? "info" : "warning"; }

export default function ErpPayrollPage() {
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); const [payrolls, setPayrolls] = useState([]);
  const [search, setSearch] = useState(""); const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [modalOpen, setModalOpen] = useState(false); const [calcData, setCalcData] = useState(null);

  async function loadData() { setLoading(true); try { const res = await payrollApi.list({ periodMonth: month, periodYear: year }); setPayrolls(res.data?.data || []); } catch (err) { setError(err?.response?.data?.message); } finally { setLoading(false); } }
  useEffect(() => { loadData(); }, [month, year]);

  const filtered = useMemo(() => { const q = search.toLowerCase(); return payrolls.filter((p) => !q || p.user?.name?.toLowerCase().includes(q) || p.payrollNumber?.toLowerCase().includes(q)); }, [payrolls, search]);

  async function handleCalculate() {
    setSaving(true); setError("");
    try {
      const res = await payrollApi.calculate({ month: Number(month), year: Number(year) });
      setCalcData(res.data?.data || null);
      if (res.data?.data) await payrollApi.create(res.data.data);
      await loadData();
    } catch (err) { setError(err?.response?.data?.message); } finally { setSaving(false); }
  }

  const totalNet = useMemo(() => payrolls.reduce((s, p) => s + Number(p.netAmount || 0), 0), [payrolls]);

  const cols = useMemo(() => [
    { key: "user", label: "Karyawan", render: (r) => <span className="font-semibold">{r.user?.name}</span> },
    { key: "baseSalary", label: "Gaji Pokok", render: (r) => formatCurrency(r.baseSalary) },
    { key: "bonusAmount", label: "Bonus", render: (r) => formatCurrency(r.bonusAmount) },
    { key: "deductions", label: "Potongan", render: (r) => formatCurrency(r.deductions) },
    { key: "netAmount", label: "Take Home", render: (r) => <span className="font-bold text-primary">{formatCurrency(r.netAmount)}</span> },
    { key: "status", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    { key: "actions", label: "", render: (r) => (
      <div className="flex gap-1">
        {r.status === "DRAFT" ? <Button size="sm" variant="secondary" onClick={async () => { try { await payrollApi.approve(r.id); await loadData(); } catch (err) { setError(err?.response?.data?.message); } }}><CheckCircle size={14} /> Approve</Button> : null}
        {r.status === "APPROVED" ? <Button size="sm" onClick={async () => { try { await payrollApi.pay(r.id); await loadData(); } catch (err) { setError(err?.response?.data?.message); } }}><Wallet size={14} /> Bayar</Button> : null}
      </div>
    )},
  ], []);

  return (
    <ErpShell title="Payroll" description="Gaji crew dan bonus.">
      <PageHeader title="Payroll" description="Gaji crew, bonus, dan pembayaran." badge="New" onRefresh={loadData} loading={loading} />
      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <SectionHeader title={`Periode ${month}/${year}`} description={`${payrolls.length} payroll, total ${formatCurrency(totalNet)}`} />
          <div className="flex gap-2 items-end">
            <Input label="Bulan" type="month" value={`${year}-${month}`} onChange={(e) => { const [y, m] = e.target.value.split("-"); setYear(y); setMonth(m); }} className="w-auto" />
            <Button size="sm" onClick={handleCalculate} loading={saving}><RefreshCw size={14} /> Hitung & Generate</Button>
          </div>
        </div>
        <div className="mt-4"><ManagementTable columns={cols} rows={filtered} emptyText="Belum ada payroll untuk periode ini. Klik 'Hitung & Generate' untuk membuat." /></div>
      </Card>
    </ErpShell>
  );
}
