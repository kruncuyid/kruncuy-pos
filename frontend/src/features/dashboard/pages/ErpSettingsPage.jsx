import { Building2, RefreshCw, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { branchApi } from "../services/branchApi";
import { formatCurrency } from '../utils/reportFormatters';
import { settingsApi } from "../services/settingsApi";


function formatSettingValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  const numeric = Number(value);
  if (Number.isFinite(numeric) && String(value).trim() !== "") {
    return numeric.toLocaleString("id-ID");
  }
  return String(value);
}

function getSettingValue(settings, key, branchId = null) {
  const row =
    settings.find((item) => item.key === key && String(item.branchId || "") === String(branchId || "")) ||
    settings.find((item) => item.key === key && !item.branchId);
  return row?.value ?? "";
}

export default function ErpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [systemSettings, setSystemSettings] = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [minCashModalOpen, setMinCashModalOpen] = useState(false);
  const [minCashInput, setMinCashInput] = useState("0");
  const [modalMode, setModalMode] = useState("GLOBAL");
  const [form, setForm] = useState({
    branchId: "ALL",
    targetMinPcs: "25",
    bonusPerPcs: "250",
    bonusPerExtraSauce: "250",
    description: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [overviewResponse, branchesResponse] = await Promise.all([settingsApi.getOverview(), branchApi.getBranches()]);
      const overview = overviewResponse.data?.data || {};
      setSystemSettings(overview.systemSettings || []);
      setFeatureFlags(overview.featureFlags || []);
      setBranches(branchesResponse.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const bonusSummary = useMemo(() => {
    const globalTarget = getSettingValue(systemSettings, "crew_bonus_min_pcs") || "25";
    const globalPcs = getSettingValue(systemSettings, "crew_bonus_per_pcs") || "250";
    const globalExtra = getSettingValue(systemSettings, "crew_bonus_extra_sauce") || "250";
    const branchOverrides = systemSettings.filter((item) => item.key?.startsWith("crew_bonus_") && item.branchId);

    return [
      { title: "Target core", value: Number(globalTarget) || 0, icon: ShieldCheck },
      { title: "Bonus pcs", value: formatCurrency(globalPcs), icon: SlidersHorizontal },
      { title: "Bonus extra saos", value: formatCurrency(globalExtra), icon: Building2 },
      { title: "Override branch", value: branchOverrides.length, icon: RefreshCw },
    ];
  }, [systemSettings]);

  const relevantSettings = useMemo(() => {
    return systemSettings
      .filter((item) => item.key?.startsWith("crew_bonus_"))
      .map((item) => ({
        id: item.id,
        key: item.key,
        branchName: item.branch?.name || "Global",
        scope: item.scope,
        value: item.value,
        description: item.description || "-",
        isActive: item.isActive ? "Aktif" : "Nonaktif",
      }));
  }, [systemSettings]);

  function openModal(mode = "GLOBAL") {
    const globalTarget = getSettingValue(systemSettings, "crew_bonus_min_pcs");
    const globalPcs = getSettingValue(systemSettings, "crew_bonus_per_pcs");
    const globalExtra = getSettingValue(systemSettings, "crew_bonus_extra_sauce");
    const firstBranchId = branches[0]?.id || "ALL";

    setModalMode(mode);
    setForm({
      branchId: mode === "GLOBAL" ? "ALL" : firstBranchId,
      targetMinPcs: globalTarget || "25",
      bonusPerPcs: globalPcs || "250",
      bonusPerExtraSauce: globalExtra || "250",
      description: "",
    });
    setModalOpen(true);
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const minCashValue = useMemo(() => {
    const raw = getSettingValue(systemSettings, "cash_minimum_outlet");
    return Number(raw || 0);
  }, [systemSettings]);

  function openMinCashModal() {
    setMinCashInput(String(minCashValue));
    setMinCashModalOpen(true);
  }

  async function saveMinCash() {
    setSaving(true); setError("");
    try {
      await settingsApi.upsertSystemSetting("cash_minimum_outlet", {
        value: Number(minCashInput || 0),
        scope: "GLOBAL",
        description: "Batas minimal saldo kas yang harus dijaga di outlet",
        isActive: true,
      });
      setMinCashModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menyimpan.");
    } finally { setSaving(false); }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const scope = modalMode === "GLOBAL" ? "GLOBAL" : "BRANCH";
      const branchId = form.branchId === "ALL" ? null : form.branchId || null;

      if (modalMode === "BRANCH" && !branchId) {
        throw new Error("Branch override wajib memilih branch.");
      }

      await Promise.all([
        settingsApi.upsertSystemSetting("crew_bonus_min_pcs", {
          value: Number(form.targetMinPcs || 0),
          scope,
          branchId,
          description: form.description || "Aturan bonus minimal pcs core crew",
          isActive: true,
        }),
        settingsApi.upsertSystemSetting("crew_bonus_per_pcs", {
          value: Number(form.bonusPerPcs || 0),
          scope,
          branchId,
          description: form.description || "Bonus rupiah per pcs di atas target",
          isActive: true,
        }),
        settingsApi.upsertSystemSetting("crew_bonus_extra_sauce", {
          value: Number(form.bonusPerExtraSauce || 0),
          scope,
          branchId,
          description: form.description || "Bonus rupiah per extra sauce",
          isActive: true,
        }),
      ]);

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menyimpan setting bonus.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ErpShell title="Settings" description="Konfigurasi ERP, bonus crew, dan pengaturan sistem.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Settings</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Atur mekanisme bonus crew secara global atau per branch, plus setting sistem lainnya.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={() => openModal("GLOBAL")}>
            <Save size={16} />
            Edit bonus global
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {bonusSummary.map((item) => {
          const Icon = item.icon;
          return <StatCard key={item.title} title={item.title} value={loading ? "-" : item.value} icon={<Icon size={18} />} />;
        })}
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <SectionHeader
          title="Aturan bonus crew"
          description="Target minimum pcs core, bonus pcs, dan bonus extra saos bisa diatur global atau per branch."
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => openModal("GLOBAL")}>Edit bonus global</Button>
          <Button variant="secondary" onClick={() => openModal("BRANCH")}>
            Override branch
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
          Default global: minimal {bonusSummary[0]?.value} pcs core, bonus {bonusSummary[1]?.value} per pcs, bonus{" "}
          {bonusSummary[2]?.value} per extra saos.
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeader title="Setting aktif" description="Daftar key bonus crew yang tersimpan di database." />
        <ManagementTable
          columns={[
            { key: "key", label: "Kunci" },
            {
              key: "branchName",
              label: "Cabang",
              render: (row) => <span className="font-medium text-[var(--color-text)]">{row.branchName || "-"}</span>,
            },
            { key: "scope", label: "Scope" },
            {
              key: "value",
              label: "Nilai",
              render: (row) => <span className="font-semibold">{formatSettingValue(row.value)}</span>,
            },
            {
              key: "isActive",
              label: "Status",
              render: (row) => <Badge tone={row.isActive === "Aktif" ? "success" : "neutral"}>{row.isActive}</Badge>,
            },
            { key: "description", label: "Keterangan" },
          ]}
          rows={relevantSettings}
          emptyText="Belum ada setting bonus crew."
          stickyHeader
          maxHeightClass="max-h-[28rem]"
        />
      </Card>

      <Card className="p-5">
        <SectionHeader title="Minimum Kas Outlet" description="Batas minimal saldo kas yang harus dijaga di setiap branch." compact />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
          <div>
            <p className="text-sm font-semibold">Minimum kas</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">Saat penarikan, kas outlet tidak boleh kurang dari jumlah ini</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-black">{formatCurrency(minCashValue)}</span>
            <Button size="sm" onClick={() => openMinCashModal()}>Ubah</Button>
          </div>
        </div>
      </Card>

      {/* ── GPS Setting ── */}
      <Card className="p-5">
        <SectionHeader title="GPS Open Shift" description="Atur apakah crew wajib GPS untuk buka shift. Global + per branch override." compact />
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-border bg-surface-2 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Global: GPS Wajib</p>
              <p className="text-xs text-muted mt-0.5">Default semua branch</p>
            </div>
            <button onClick={async () => {
              const cur = getSettingValue(systemSettings, "gps_required_openshift");
              const next = cur === "false" ? "true" : "false";
              await settingsApi.upsertSystemSetting("gps_required_openshift", {
                value: next, scope: "GLOBAL",
                description: "GPS wajib untuk buka shift", isActive: true,
              });
              await loadData();
            }} className={`relative h-7 w-12 rounded-full transition-colors ${getSettingValue(systemSettings, "gps_required_openshift") !== "false" ? "bg-emerald-500" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${getSettingValue(systemSettings, "gps_required_openshift") !== "false" ? "translate-x-5" : ""}`} />
            </button>
          </div>
          {branches.filter(b => b.isActive !== false).map(b => {
            const bs = systemSettings.find(s => s.key === "gps_required_openshift" && s.branchId === b.id);
            const val = bs?.value;
            const isOn = val === undefined ? getSettingValue(systemSettings, "gps_required_openshift") !== "false" : val !== "false";
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-surface-2 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-muted mt-0.5">{val !== undefined ? "Override" : "Ikut global"}</p>
                </div>
                <button onClick={async () => {
                  const cur = systemSettings.find(s => s.key === "gps_required_openshift" && s.branchId === b.id);
                  const next = cur?.value === "false" ? "true" : "false";
                  await settingsApi.upsertSystemSetting("gps_required_openshift", {
                    value: next, scope: "BRANCH", branchId: b.id,
                    description: "GPS wajib buka shift — " + b.name, isActive: true,
                  });
                  await loadData();
                }} className={`relative h-6 w-10 rounded-full transition-colors ${isOn ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isOn ? "translate-x-4" : ""}`} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeader title="Feature flags" description="Ringkasan flag sistem yang tersedia di database." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {featureFlags.length ? (
            featureFlags.map((flag) => (
              <div key={flag.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{flag.name || flag.key}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{flag.description || "-"}</p>
                  </div>
                  <Badge tone={flag.enabled ? "success" : "neutral"}>{flag.enabled ? "ON" : "OFF"}</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-[var(--color-muted)]">Belum ada feature flag aktif.</div>
          )}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={modalMode === "GLOBAL" ? "Edit bonus global" : "Override bonus branch"}
        onClose={() => setModalOpen(false)}
        size="xl"
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Mode</span>
              <select
                className="kr-input"
                value={modalMode}
                onChange={(event) => setModalMode(event.target.value)}
              >
                <option value="GLOBAL">Global</option>
                <option value="BRANCH">Branch override</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Branch</span>
              <select
                className="kr-input"
                value={form.branchId}
                onChange={(event) => updateForm("branchId", event.target.value)}
                disabled={modalMode === "GLOBAL"}
              >
                <option value="ALL">Semua branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Target minimal pcs core"
              type="number"
              min={1}
              value={form.targetMinPcs}
              onChange={(event) => updateForm("targetMinPcs", event.target.value)}
            />
            <Input
              label="Bonus per pcs"
              type="number"
              min={0}
              value={form.bonusPerPcs}
              onChange={(event) => updateForm("bonusPerPcs", event.target.value)}
            />
            <Input
              label="Bonus extra saos"
              type="number"
              min={0}
              value={form.bonusPerExtraSauce}
              onChange={(event) => updateForm("bonusPerExtraSauce", event.target.value)}
            />
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Catatan</span>
            <textarea
              className="kr-input min-h-24"
              placeholder="Opsional"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
            />
          </label>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={minCashModalOpen} title="Atur Minimum Kas Outlet" onClose={() => setMinCashModalOpen(false)} size="sm">
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-muted)]">Saat penarikan cash, saldo kas outlet tidak boleh kurang dari jumlah ini.</p>
          <Input label="Minimum kas (Rp)" type="number" min="0" value={minCashInput} onChange={(e) => setMinCashInput(e.target.value)} placeholder="0" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setMinCashModalOpen(false)}>Batal</Button>
            <Button type="button" onClick={saveMinCash} loading={saving}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </ErpShell>
  );
}
