import { Banknote, PlusCircle, ShieldCheck, Wallet, CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { branchApi } from "../services/branchApi";
import { cashWithdrawalApi } from "../../crew/services/cashWithdrawalApi";
import { Button, Card, Input, Modal, StatCard, Badge, Alert, PageHeader, Select } from "../../../components/ui";
import { formatCurrency, formatDateTime } from "../utils/reportFormatters";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";

function statusTone(s) {
  if (s === "COMPLETED") return "success";
  if (s === "OTP_ISSUED") return "warning";
  if (s === "CANCELLED" || s === "EXPIRED") return "danger";
  if (s === "REQUESTED") return "info";
  return "neutral";
}
function statusLabel(s) {
  const map = { REQUESTED: "Menunggu", OTP_ISSUED: "OTP tersedia", COMPLETED: "Selesai", CANCELLED: "Batal", EXPIRED: "Kedaluwarsa" };
  return map[s] || s;
}

export default function ErpCashWithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ branchId: "ALL", status: "ALL", search: "" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(null);
  const [otpInput, setOtpInput] = useState({});

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ branchId: "", amount: "", note: "" });
  const [branchCashInfo, setBranchCashInfo] = useState(null);
  const [cashInfoLoading, setCashInfoLoading] = useState(false);

  async function loadBranchCash(branchId) {
    if (!branchId) { setBranchCashInfo(null); return; }
    setCashInfoLoading(true);
    try {
      const res = await cashWithdrawalApi.getBranchCashInfo(branchId);
      setBranchCashInfo(res.data.data);
    } catch (_) { setBranchCashInfo(null); }
    finally { setCashInfoLoading(false); }
  }

  // Verify modal
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");

  async function loadBranches() {
    const res = await branchApi.getBranches();
    setBranches(res.data.data || []);
  }

  async function loadWithdrawals() {
    setLoading(true); setError("");
    try {
      const res = await cashWithdrawalApi.list({
        branchId: filters.branchId === "ALL" ? "" : filters.branchId,
        status: filters.status,
        search: filters.search,
      });
      const data = res.data.data;
      setItems(data?.items || []);
      setSummary(data?.summary || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadBranches().catch(() => {}); }, []);
  useEffect(() => { loadWithdrawals(); }, [refreshKey]);

  const rows = useMemo(() => items.map((item) => ({
    id: item.id,
    withdrawalNumber: item.withdrawalNumber,
    branchName: item.branch?.name || "-",
    amount: item.amount,
    status: item.status,
    createdAt: item.createdAt,
    requestedByName: item.requestedBy?.name || "-",
    issuedByName: item.issuedBy?.name || "-",
    verifiedByName: item.verifiedBy?.name || "-",
    note: item.note || "-",
    otpExpiresAt: item.otpExpiresAt,
    item,
  })), [items]);

  async function handleCreateFromErp(e) {
    e.preventDefault();
    if (!createForm.branchId || !createForm.amount) { setError("Branch dan nominal wajib"); return; }
    setSaving(true); setError("");
    try {
      const res = await cashWithdrawalApi.createFromErp({
        branchId: createForm.branchId,
        amount: Number(createForm.amount),
        note: createForm.note,
      });
      setShowOtp(res.data.data);
      setCreateOpen(false);
      setCreateForm({ branchId: "", amount: "", note: "" });
      setRefreshKey((k) => k + 1);
    } catch (err) { setError(err?.response?.data?.message || "Gagal membuat penarikan."); } finally { setSaving(false); }
  }

  async function handleVerifySubmit() {
    if (!verifyModal || !verifyCode) return;
    setSaving(true); setError("");
    try {
      await cashWithdrawalApi.verify(verifyModal.id, { otp: verifyCode });
      setVerifyModal(null);
      setVerifyCode("");
      setRefreshKey((k) => k + 1);
    } catch (err) { setError(err?.response?.data?.message || "OTP tidak valid."); } finally { setSaving(false); }
  }

  async function handleCancel(item) {
    if (!confirm("Batalkan penarikan ini?")) return;
    try {
      await cashWithdrawalApi.cancel(item.id);
      setRefreshKey((k) => k + 1);
    } catch (err) { setError(err?.response?.data?.message); }
  }

  const cols = useMemo(() => [
    { key: "withdrawalNumber", label: "No.", render: (r) => <span className="font-semibold text-sm">{r.withdrawalNumber}</span> },
    { key: "branchName", label: "Branch" },
    { key: "amount", label: "Nominal", render: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { key: "status", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge> },
    { key: "requestedByName", label: "Pemohon" },
    { key: "createdAt", label: "Tanggal", render: (r) => <span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span> },
    { key: "actions", label: "", render: (r) => {
      const item = r.item;
      return (
        <div className="flex gap-1">
          {item.status === "OTP_ISSUED" ? (
            <Button size="sm" onClick={() => { setVerifyModal(item); setVerifyCode(""); }}><CheckCircle size={14} /> Verifikasi</Button>
          ) : null}
          {item.status === "OTP_ISSUED" || item.status === "REQUESTED" ? (
            <Button size="sm" variant="ghost" onClick={() => handleCancel(item)}>Batal</Button>
          ) : null}
        </div>
      );
    }},
  ], []);

  return (
    <ErpShell title="Cash Withdrawals" description="Penarikan cash outlet.">
      <PageHeader title="Cash Withdrawals" description="Penarikan cash outlet. Buat penarikan → OTP ke crew → verifikasi OTP → cash terpotong."
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}><PlusCircle size={16} />Buat Penarikan</Button>}
        onRefresh={() => setRefreshKey((k) => k + 1)} loading={loading} />
      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Total" value={loading ? "-" : summary?.totalCount || 0} icon={<Wallet size={18} />} />
        <StatCard title="Requested" value={loading ? "-" : summary?.byStatus?.REQUESTED || 0} icon={<Banknote size={18} />} />
        <StatCard title="OTP tersedia" value={loading ? "-" : summary?.byStatus?.OTP_ISSUED || 0} icon={<ShieldCheck size={18} />} />
        <StatCard title="Selesai" value={loading ? "-" : summary?.byStatus?.COMPLETED || 0} icon={<CheckCircle size={18} />} />
      </section>
      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm grid gap-1"><span className="font-medium">Branch</span>
            <select className="kr-input" value={filters.branchId} onChange={(e) => setFilters((f) => ({ ...f, branchId: e.target.value }))}>
              <option value="ALL">Semua</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="text-sm grid gap-1"><span className="font-medium">Status</span>
            <select className="kr-input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="ALL">Semua</option>
              <option value="OTP_ISSUED">OTP tersedia</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Batal</option>
            </select>
          </label>
          <Input label="Cari" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Nomor / crew" />
        </div>
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={() => setRefreshKey((k) => k + 1)}>Terapkan</Button>
          <Button size="sm" variant="secondary" onClick={() => { setFilters({ branchId: "ALL", status: "ALL", search: "" }); setRefreshKey((k) => k + 1); }}>Reset</Button>
        </div>
      </Card>
      <ManagementTable resetKey={refreshKey} defaultPageSize={10} pageSizeOptions={[10, 25, 50]}
        rows={rows} columns={cols} emptyText="Belum ada penarikan cash." />

      {/* Create Modal */}
      <Modal open={createOpen} title="Buat Penarikan Cash" onClose={() => setCreateOpen(false)} size="md">
        <form className="grid gap-4" onSubmit={handleCreateFromErp}>
          <div className="grid gap-2">
            <p className="text-sm text-muted">Pilih branch dan tentukan nominal yang akan ditarik. Crew akan generate OTP sebagai persetujuan.</p>
          </div>
          <Select label="Branch" options={branches.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` }))}
            placeholder="Pilih branch" value={createForm.branchId}
            onChange={(e) => { setCreateForm((f) => ({ ...f, branchId: e.target.value, amount: "" })); loadBranchCash(e.target.value); }} />
          {branchCashInfo && createForm.branchId ? (
            <div className="rounded-2xl border bg-[var(--color-surface-2)] p-3 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-muted)]">Kas tersedia</span><span className="font-semibold">{formatCurrency(branchCashInfo.available || 0)}</span></div>
              <div className="flex justify-between mt-1"><span className="text-[var(--color-muted)]">Minimal kas</span><span className="font-semibold">{formatCurrency(branchCashInfo.minCash)}</span></div>
              <div className="flex justify-between mt-1 border-t pt-1"><span className="text-[var(--color-muted)]">Maks. penarikan</span><span className="font-bold">{formatCurrency(branchCashInfo.withdrawable || 0)}</span></div>
            </div>
          ) : createForm.branchId && cashInfoLoading ? (
            <div className="rounded-2xl border bg-[var(--color-surface-2)] p-3 text-sm text-[var(--color-muted)]">Memeriksa kas...</div>
          ) : null}
          <Input label="Nominal penarikan" type="number" min="0" max={branchCashInfo?.withdrawable || undefined}
            value={createForm.amount}
            onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Rp"
            hint={branchCashInfo?.withdrawable ? `Maksimal penarikan: ${formatCurrency(branchCashInfo.withdrawable)}` : ""} />
          <Input label="Catatan" value={createForm.note} onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))} placeholder="Opsional" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Buat Penarikan</Button>
          </div>
        </form>
      </Modal>

      {/* Verify OTP Modal */}
      <Modal open={Boolean(verifyModal)} title="Verifikasi OTP" onClose={() => setVerifyModal(null)} size="sm">
        {verifyModal ? (
          <div className="grid gap-4">
            <div className="rounded-2xl border bg-surface-2 p-4 text-sm">
              <p className="font-semibold">{verifyModal.branchName}</p>
              <p className="mt-1 text-lg font-black">{formatCurrency(verifyModal.amount)}</p>
              <p className="text-xs text-muted mt-1">{verifyModal.withdrawalNumber}</p>
            </div>
            <p className="text-sm text-muted">Masukkan OTP yang didapat dari crew untuk menyelesaikan penarikan cash.</p>
            <Input label="Kode OTP" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="000000" maxLength={6} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setVerifyModal(null)}>Batal</Button>
              <Button onClick={handleVerifySubmit} disabled={!verifyCode || saving} loading={saving}>Verifikasi & Selesaikan</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </ErpShell>
  );
}
