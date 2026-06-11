import {
  CircleDollarSign,
  Edit3,
  Eye,
  PlusCircle,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { formatCurrency } from "../utils/reportFormatters";
import { branchPricingApi } from "../services/branchPricingApi";

const ONLINE_PLATFORMS = [
  { value: "GOFOOD", label: "GoFood" },
  { value: "GRABFOOD", label: "GrabFood" },
  { value: "SHOPEEFOOD", label: "ShopeeFood" },
];

function initialOfflineForm() {
  return {
    id: "",
    productId: "",
    price: "",
    isAvailable: true,
    isActive: true,
  };
}

function initialOnlineForm() {
  return {
    id: "",
    productId: "",
    salesChannel: "ONLINE",
    onlinePlatform: "GOFOOD",
    displayName: "",
    price: "",
    pcs: "",
    promoLabel: "",
    sortOrder: "0",
    isAvailable: true,
    isActive: true,
  };
}

function OfflineCard({ item, onEdit, onDeactivate }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.product?.name || "-"}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{item.product?.code || "-"}</p>
        </div>
        <Badge tone={item.isActive ? "success" : "danger"}>{item.isActive ? "Active" : "Inactive"}</Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-[var(--color-muted)]">
        <div className="flex items-center justify-between gap-3">
          <span>Branch</span>
          <span className="font-medium text-[var(--color-text)]">{item.branch?.name || "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Harga branch</span>
          <span className="font-medium text-[var(--color-text)]">{formatCurrency(item.price)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Tersedia</span>
          <span className="font-medium text-[var(--color-text)]">{item.isAvailable ? "Ya" : "Tidak"}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
          <Edit3 size={14} />
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDeactivate(item)} disabled={!item.isActive}>
          <Trash2 size={14} />
          Nonaktifkan
        </Button>
      </div>
    </div>
  );
}

function OnlineCard({ item, onEdit, onDeactivate }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.displayName || item.product?.name || "-"}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {item.product?.code || "-"} - {getPlatformLabel(item.onlinePlatform)}
          </p>
        </div>
        <Badge tone={item.isActive ? "success" : "danger"}>{item.isActive ? "Active" : "Inactive"}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="info">{item.salesChannel}</Badge>
        <Badge tone="neutral">{getPlatformLabel(item.onlinePlatform)}</Badge>
        <Badge tone={item.isAvailable ? "success" : "warning"}>{item.isAvailable ? "Available" : "Hidden"}</Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-[var(--color-muted)]">
        <div className="flex items-center justify-between gap-3">
          <span>Harga online</span>
          <span className="font-medium text-[var(--color-text)]">{formatCurrency(item.price)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Isi paket</span>
          <span className="font-medium text-[var(--color-text)]">
            {item.pcs && Number(item.pcs) > 0 ? item.pcs : item.product?.pcs || "-"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Promo label</span>
          <span className="font-medium text-[var(--color-text)]">{item.promoLabel || "-"}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
          <Edit3 size={14} />
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDeactivate(item)} disabled={!item.isActive}>
          <Trash2 size={14} />
          Nonaktifkan
        </Button>
      </div>
    </div>
  );
}

function OfflineFormBody({
  value,
  products,
  onChange,
  onSubmit,
  onReset,
  saving,
  targetSummary,
  branchLabel,
}) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="md:col-span-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-muted)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-[var(--color-text)]">Target outlet</span>
            <span>{targetSummary}</span>
          </div>
          {branchLabel ? <div className="mt-1 text-xs">Mode spesifik: {branchLabel}</div> : null}
        </div>
      </div>
      <div className="md:col-span-2">
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Menu</span>
          <select className="kr-input" value={value.productId} onChange={(e) => onChange({ ...value, productId: e.target.value })}>
            <option value="">Pilih menu</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.code})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <Input
          label="Harga offline"
          type="number"
          value={value.price}
          onChange={(event) => onChange({ ...value, price: event.target.value })}
          placeholder="5000"
        />
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Tersedia?</span>
          <select
            className="kr-input"
            value={value.isAvailable ? "true" : "false"}
            onChange={(event) => onChange({ ...value, isAvailable: event.target.value === "true" })}
          >
            <option value="true">Ya</option>
            <option value="false">Tidak</option>
          </select>
        </label>
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Status aktif</span>
          <select
            className="kr-input"
            value={value.isActive ? "true" : "false"}
            onChange={(event) => onChange({ ...value, isActive: event.target.value === "true" })}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          <PlusCircle size={16} />
          {saving ? "Menyimpan..." : value.id ? "Update offline pricing" : "Simpan offline pricing"}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}

function OnlineFormBody({
  value,
  products,
  onChange,
  onSubmit,
  onReset,
  saving,
  targetSummary,
  branchLabel,
}) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="md:col-span-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-muted)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-[var(--color-text)]">Target outlet</span>
            <span>{targetSummary}</span>
          </div>
          {branchLabel ? <div className="mt-1 text-xs">Mode spesifik: {branchLabel}</div> : null}
        </div>
      </div>
      <div className="md:col-span-2">
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Menu</span>
          <select className="kr-input" value={value.productId} onChange={(e) => onChange({ ...value, productId: e.target.value })}>
            <option value="">Pilih menu</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.code})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Platform</span>
          <select
            className="kr-input"
            value={value.onlinePlatform}
            onChange={(event) => onChange({ ...value, onlinePlatform: event.target.value })}
          >
            {ONLINE_PLATFORMS.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <Input
          label="Display name"
          value={value.displayName}
          onChange={(event) => onChange({ ...value, displayName: event.target.value })}
          placeholder="Kosongkan jika sama dengan nama menu"
        />
      </div>
      <div>
        <Input
          label="Harga online"
          type="number"
          value={value.price}
          onChange={(event) => onChange({ ...value, price: event.target.value })}
          placeholder="7500"
        />
      </div>
      <div>
        <Input
          label="Isi paket / pcs"
          type="number"
          value={value.pcs}
          onChange={(event) => onChange({ ...value, pcs: event.target.value })}
          placeholder="5"
        />
      </div>
      <div>
        <Input
          label="Promo label"
          value={value.promoLabel}
          onChange={(event) => onChange({ ...value, promoLabel: event.target.value })}
          placeholder="Contoh: Promo Bundling"
        />
      </div>
      <div>
        <Input
          label="Sort order"
          type="number"
          value={value.sortOrder}
          onChange={(event) => onChange({ ...value, sortOrder: event.target.value })}
          placeholder="0"
        />
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Tersedia?</span>
          <select
            className="kr-input"
            value={value.isAvailable ? "true" : "false"}
            onChange={(event) => onChange({ ...value, isAvailable: event.target.value === "true" })}
          >
            <option value="true">Ya</option>
            <option value="false">Tidak</option>
          </select>
        </label>
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Status aktif</span>
          <select
            className="kr-input"
            value={value.isActive ? "true" : "false"}
            onChange={(event) => onChange({ ...value, isActive: event.target.value === "true" })}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </div>
      <div className="md:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-6 text-[var(--color-muted)]">
        Variant ini dipakai POS saat crew memilih channel online. Harga dan isi paket bisa berbeda per platform.
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          <PlusCircle size={16} />
          {saving ? "Menyimpan..." : value.id ? "Update online variant" : "Simpan online variant"}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export default function ErpBranchPricingPage() {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [offlineRows, setOfflineRows] = useState([]);
  const [onlineRows, setOnlineRows] = useState([]);
  const [targetMode, setTargetMode] = useState("ALL");
  const [targetBranchId, setTargetBranchId] = useState("");
  const [targetBranchIds, setTargetBranchIds] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [activeTab, setActiveTab] = useState("OFFLINE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [offlineForm, setOfflineForm] = useState(initialOfflineForm());
  const [onlineForm, setOnlineForm] = useState(initialOnlineForm());
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await branchPricingApi.getCatalog();
      const payload = response.data?.data || {};

      const branchList = payload.branches || [];
      const productList = payload.products || [];
      const offlineList = payload.branchProducts || [];
      const onlineList = payload.branchMenuVariants || [];

      setBranches(branchList);
      setProducts(productList);
      setOfflineRows(offlineList);
      setOnlineRows(onlineList);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat data branch pricing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeBranches = useMemo(() => {
    return branches.filter((branch) => branch.isActive !== false);
  }, [branches]);

  useEffect(() => {
    if (!branches.length) return;

    if (targetMode === "SINGLE") {
      setTargetBranchId((current) => {
        if (current && activeBranches.some((branch) => branch.id === current)) {
          return current;
        }
        return activeBranches[0]?.id || "";
      });
      setTargetBranchIds([]);
      return;
    }

    if (targetMode === "MULTI") {
      setTargetBranchIds((current) => {
        const filteredCurrent = current.filter((branchId) => activeBranches.some((branch) => branch.id === branchId));
        return filteredCurrent.length ? filteredCurrent : activeBranches.map((branch) => branch.id);
      });
      setTargetBranchId("");
      return;
    }

    setTargetBranchId("");
    setTargetBranchIds([]);
  }, [activeBranches, branches, targetMode]);

  const targetBranchMap = useMemo(() => {
    return new Map(branches.map((branch) => [branch.id, branch]));
  }, [branches]);

  const scopedBranchIds = useMemo(() => {
    if (targetMode === "SINGLE") {
      return targetBranchId ? [targetBranchId] : [];
    }

    if (targetMode === "MULTI") {
      return targetBranchIds;
    }

    return [];
  }, [targetBranchId, targetBranchIds, targetMode]);

  const selectedOfflineRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return offlineRows.filter((row) => {
      if (targetMode !== "ALL" && (!scopedBranchIds.length || !scopedBranchIds.includes(row.branchId))) return false;
      const matchesQuery =
        !keyword ||
        [row.product?.name, row.product?.code, row.branch?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesQuery;
    });
  }, [offlineRows, query, scopedBranchIds, targetMode]);

  const selectedOnlineRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return onlineRows.filter((row) => {
      if (targetMode !== "ALL" && (!scopedBranchIds.length || !scopedBranchIds.includes(row.branchId))) return false;
      const matchesQuery =
        !keyword ||
        [row.displayName, row.product?.name, row.product?.code, row.onlinePlatform, row.promoLabel]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesQuery;
    });
  }, [onlineRows, query, scopedBranchIds, targetMode]);

  const metrics = useMemo(() => {
    const offlineCount = selectedOfflineRows.length;
    const onlineCount = selectedOnlineRows.length;
    const activeCount = [...selectedOfflineRows, ...selectedOnlineRows].filter((row) => row.isActive).length;
    const availableCount = [...selectedOfflineRows, ...selectedOnlineRows].filter((row) => row.isAvailable).length;

    return [
      { title: "Offline pricing", value: offlineCount, icon: Store },
      { title: "Online variants", value: onlineCount, icon: ShoppingBag },
      { title: "Active records", value: activeCount, icon: Eye },
      { title: "Available records", value: availableCount, icon: CircleDollarSign },
    ];
  }, [selectedOfflineRows, selectedOnlineRows]);

  function resetOfflineForm() {
    setOfflineForm(initialOfflineForm());
  }

  function resetOnlineForm() {
    setOnlineForm(initialOnlineForm());
  }

  function openCreateOffline() {
    setActiveTab("OFFLINE");
    setOfflineForm(initialOfflineForm());
    setIsModalOpen(true);
  }

  function openCreateOnline() {
    setActiveTab("ONLINE");
    setOnlineForm(initialOnlineForm());
    setIsModalOpen(true);
  }

  function handleEditOffline(row) {
    setActiveTab("OFFLINE");
    setOfflineForm({
      id: row.id,
      branchId: row.branchId,
      productId: row.productId,
      price: row.price !== undefined ? String(row.price) : "",
      isAvailable: row.isAvailable ?? true,
      isActive: row.isActive ?? true,
    });
    setIsModalOpen(true);
  }

  function handleEditOnline(row) {
    setActiveTab("ONLINE");
    setOnlineForm({
      id: row.id,
      branchId: row.branchId,
      productId: row.productId,
      salesChannel: row.salesChannel || "ONLINE",
      onlinePlatform: row.onlinePlatform || "GOFOOD",
      displayName: row.displayName || "",
      price: row.price !== undefined && row.price !== null ? String(row.price) : "",
      pcs: row.pcs !== undefined && row.pcs !== null && Number(row.pcs) > 0 ? String(row.pcs) : "",
      promoLabel: row.promoLabel || "",
      sortOrder: row.sortOrder !== undefined ? String(row.sortOrder) : "0",
      isAvailable: row.isAvailable ?? true,
      isActive: row.isActive ?? true,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function handleSubmitOffline(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        productId: offlineForm.productId,
        price: Number(offlineForm.price || 0),
        isAvailable: offlineForm.isAvailable,
        isActive: offlineForm.isActive,
      };

      if (!payload.productId) {
        throw new Error("Menu wajib dipilih");
      }

      if (offlineForm.id) {
        await branchPricingApi.updateBranchProduct(offlineForm.id, payload);
      } else {
        await branchPricingApi.bulkApplyBranchProducts({
          ...payload,
          targetMode,
          branchId: targetMode === "SINGLE" ? targetBranchId : undefined,
          branchIds: targetMode === "MULTI" ? targetBranchIds : undefined,
        });
      }

      await loadData();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan pricing offline.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitOnline(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        productId: onlineForm.productId,
        salesChannel: onlineForm.salesChannel,
        onlinePlatform: onlineForm.onlinePlatform,
        displayName: onlineForm.displayName.trim(),
        price: Number(onlineForm.price || 0),
        pcs: onlineForm.pcs.trim() ? Number(onlineForm.pcs) : null,
        promoLabel: onlineForm.promoLabel.trim(),
        sortOrder: Number(onlineForm.sortOrder || 0),
        isAvailable: onlineForm.isAvailable,
        isActive: onlineForm.isActive,
      };

      if (!payload.productId || !payload.onlinePlatform) {
        throw new Error("Menu dan platform wajib dipilih");
      }

      if (onlineForm.id) {
        await branchPricingApi.updateBranchMenuVariant(onlineForm.id, payload);
      } else {
        await branchPricingApi.bulkApplyBranchMenuVariants({
          ...payload,
          targetMode,
          branchId: targetMode === "SINGLE" ? targetBranchId : undefined,
          branchIds: targetMode === "MULTI" ? targetBranchIds : undefined,
        });
      }

      await loadData();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan online variant.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateOffline(row) {
    const confirmed = window.confirm(`Nonaktifkan pricing offline untuk ${row.product?.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await branchPricingApi.updateBranchProduct(row.id, {
        price: row.price,
        isAvailable: row.isAvailable,
        isActive: false,
      });
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menonaktifkan pricing offline.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateOnline(row) {
    const confirmed = window.confirm(`Nonaktifkan online variant untuk ${row.product?.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await branchPricingApi.updateBranchMenuVariant(row.id, {
        salesChannel: row.salesChannel,
        onlinePlatform: row.onlinePlatform,
        displayName: row.displayName,
        price: row.price,
        pcs: row.pcs,
        promoLabel: row.promoLabel,
        sortOrder: row.sortOrder,
        isAvailable: row.isAvailable,
        isActive: false,
      });
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menonaktifkan online variant.");
    } finally {
      setSaving(false);
    }
  }

  function toggleMultiBranch(branchId) {
    setTargetBranchIds((current) =>
      current.includes(branchId) ? current.filter((value) => value !== branchId) : [...current, branchId]
    );
  }

  function selectAllMultiBranches() {
    setTargetBranchIds(activeBranches.map((branch) => branch.id));
  }

  function clearMultiBranches() {
    setTargetBranchIds([]);
  }

  const filteredTargetBranches = useMemo(() => {
    const keyword = branchSearch.trim().toLowerCase();
    return activeBranches.filter((branch) => {
      if (!keyword) return true;
      return [branch.name, branch.code].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [activeBranches, branchSearch]);

  const targetSummary = useMemo(() => {
    if (targetMode === "ALL") {
      return `Akan diterapkan ke ${activeBranches.length} outlet aktif`;
    }

    if (targetMode === "SINGLE") {
      return targetBranchMap.get(targetBranchId)?.name || "Pilih 1 outlet spesifik";
    }

    return `${targetBranchIds.length} outlet dipilih`;
  }, [activeBranches.length, targetBranchId, targetBranchIds.length, targetMode, targetBranchMap]);

  const offlineColumns = useMemo(
    () => [
      {
        key: "product",
        label: "Menu",
        render: (row) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{row.product?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{row.product?.code || "-"}</p>
          </div>
        ),
      },
      {
        key: "branch",
        label: "Branch",
        render: (row) => <span className="font-medium">{row.branch?.name || "-"}</span>,
      },
      {
        key: "price",
        label: "Harga offline",
        render: (row) => <span className="font-medium">{formatCurrency(row.price)}</span>,
      },
      {
        key: "availability",
        label: "Available",
        render: (row) => (
          <Badge tone={row.isAvailable ? "success" : "warning"}>{row.isAvailable ? "Yes" : "No"}</Badge>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <Badge tone={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Inactive"}</Badge>,
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleEditOffline(row)}>
              <Edit3 size={14} />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDeactivateOffline(row)} disabled={!row.isActive}>
              <Trash2 size={14} />
              Nonaktifkan
            </Button>
          </div>
        ),
        cellClassName: "min-w-[220px]",
      },
    ],
    []
  );

  const onlineColumns = useMemo(
    () => [
      {
        key: "product",
        label: "Menu",
        render: (row) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{row.displayName || row.product?.name || "-"}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{row.product?.code || "-"}</p>
          </div>
        ),
      },
      {
        key: "branch",
        label: "Branch",
        render: (row) => <span className="font-medium">{row.branch?.name || "-"}</span>,
      },
      {
        key: "platform",
        label: "Platform",
        render: (row) => <Badge tone="neutral">{getPlatformLabel(row.onlinePlatform)}</Badge>,
      },
      {
        key: "price",
        label: "Harga online",
        render: (row) => <span className="font-medium">{formatCurrency(row.price)}</span>,
      },
      {
        key: "pcs",
        label: "PCS",
        render: (row) => (
          <span className="font-medium">{row.pcs && Number(row.pcs) > 0 ? row.pcs : row.product?.pcs || "-"}</span>
        ),
      },
      {
        key: "promo",
        label: "Promo",
        render: (row) => <span className="font-medium">{row.promoLabel || "-"}</span>,
      },
      {
        key: "availability",
        label: "Available",
        render: (row) => (
          <Badge tone={row.isAvailable ? "success" : "warning"}>{row.isAvailable ? "Yes" : "No"}</Badge>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <Badge tone={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Inactive"}</Badge>,
      },
      {
        key: "actions",
        label: "Actions",
        render: (row) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleEditOnline(row)}>
              <Edit3 size={14} />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDeactivateOnline(row)} disabled={!row.isActive}>
              <Trash2 size={14} />
              Nonaktifkan
            </Button>
          </div>
        ),
        cellClassName: "min-w-[220px]",
      },
    ],
    []
  );

  return (
    <ErpShell title="Branch Pricing" description="Atur harga menu per branch, channel, dan platform online.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">ERP workspace</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Branch Pricing</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Satu menu bisa punya harga dan isi paket berbeda per branch, offline, dan platform online.
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <StatCard
              key={metric.title}
              title={metric.title}
              value={loading ? "-" : metric.value}
              icon={<Icon size={18} />}
            />
          );
        })}
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <Card className="p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-start">
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">Target outlet</p>
              <h3 className="mt-1 text-xl font-black tracking-tight">Terapkan pricing ke outlet yang dipilih</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Pilih semua outlet, beberapa outlet, atau satu outlet spesifik. Mode ini dipakai saat menambah pricing baru.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={targetMode === "ALL" ? "primary" : "secondary"}
                onClick={() => setTargetMode("ALL")}
              >
                Semua outlet
              </Button>
              <Button
                type="button"
                variant={targetMode === "MULTI" ? "primary" : "secondary"}
                onClick={() => setTargetMode("MULTI")}
              >
                Pilih beberapa outlet
              </Button>
              <Button
                type="button"
                variant={targetMode === "SINGLE" ? "primary" : "secondary"}
                onClick={() => setTargetMode("SINGLE")}
              >
                1 outlet spesifik
              </Button>
            </div>

            {targetMode === "ALL" ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-muted)]">
                Pricing akan diterapkan ke semua outlet aktif. Cocok untuk default pricing yang sama di seluruh branch.
              </div>
            ) : null}

            {targetMode === "SINGLE" ? (
              <label className="grid gap-2 text-sm text-[var(--color-text)]">
                <span className="font-medium">Outlet spesifik</span>
                <select className="kr-input" value={targetBranchId} onChange={(event) => setTargetBranchId(event.target.value)}>
                  <option value="">Pilih outlet</option>
                  {activeBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {targetMode === "MULTI" ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={selectAllMultiBranches}>
                    Pilih semua
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={clearMultiBranches}>
                    Kosongkan
                  </Button>
                </div>
                <Input
                  label="Cari outlet"
                  icon={<Search size={16} />}
                  value={branchSearch}
                  onChange={(event) => setBranchSearch(event.target.value)}
                  placeholder="Cari nama outlet / kode"
                />
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    {filteredTargetBranches.map((branch) => {
                      const checked = targetBranchIds.includes(branch.id);
                      return (
                        <label
                          key={branch.id}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                            checked
                              ? "border-[var(--color-primary)] bg-[rgba(215,25,32,0.06)]"
                              : "border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-3)]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{branch.name}</p>
                            <p className="text-xs text-[var(--color-muted)]">{branch.code}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMultiBranch(branch.id)}
                            className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                          />
                        </label>
                      );
                    })}
                  </div>
                  {!filteredTargetBranches.length ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-muted)]">
                      Tidak ada outlet yang cocok dengan pencarian.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            <Input
              label="Search menu / platform"
              icon={<Search size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama menu, kode, platform"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeTab === "OFFLINE" ? "primary" : "secondary"}
                onClick={() => setActiveTab("OFFLINE")}
              >
                <Store size={14} />
                Offline
              </Button>
              <Button
                type="button"
                variant={activeTab === "ONLINE" ? "primary" : "secondary"}
                onClick={() => setActiveTab("ONLINE")}
              >
                <ShoppingBag size={14} />
                Online
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeTab === "OFFLINE" ? (
                <Button
                  onClick={openCreateOffline}
                  disabled={targetMode === "SINGLE" ? !targetBranchId : targetMode === "MULTI" ? !targetBranchIds.length : false}
                >
                  <PlusCircle size={14} />
                  Terapkan pricing
                </Button>
              ) : (
                <Button
                  onClick={openCreateOnline}
                  disabled={targetMode === "SINGLE" ? !targetBranchId : targetMode === "MULTI" ? !targetBranchIds.length : false}
                >
                  <PlusCircle size={14} />
                  Terapkan variant
                </Button>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-muted)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-[var(--color-text)]">Scope sekarang</span>
                <span>{targetSummary}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-6">
        <Card className="p-5">
          <SectionHeader
            title={activeTab === "OFFLINE" ? "Offline pricing list" : "Online variants list"}
            description={
              activeTab === "OFFLINE"
                ? "Harga branch untuk transaksi langsung di outlet."
                : "Variasi harga, isi paket, dan display name untuk channel online."
            }
          />

          {loading ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
              Memuat branch pricing...
            </div>
          ) : activeTab === "OFFLINE" ? (
            selectedOfflineRows.length ? (
              <div className="mt-5">
                <ManagementTable
                  columns={offlineColumns}
                  rows={selectedOfflineRows}
                  emptyText="Tambahkan pricing offline untuk scope outlet yang dipilih."
                  resetKey={`${activeTab}-${query}-${targetMode}-${targetBranchId}-${targetBranchIds.join(",")}-${selectedOfflineRows.length}`}
                  maxHeightClass="max-h-[38rem]"
                />
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="Belum ada offline pricing"
                  description="Tambahkan pricing offline untuk scope outlet yang dipilih."
                />
              </div>
            )
          ) : selectedOnlineRows.length ? (
            <div className="mt-5">
              <ManagementTable
                columns={onlineColumns}
                rows={selectedOnlineRows}
                emptyText="Tambahkan variant online untuk platform delivery pada scope outlet yang dipilih."
                resetKey={`${activeTab}-${query}-${targetMode}-${targetBranchId}-${targetBranchIds.join(",")}-${selectedOnlineRows.length}`}
                maxHeightClass="max-h-[38rem]"
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Belum ada online variant"
                description="Tambahkan variant online untuk platform delivery pada scope outlet yang dipilih."
              />
            </div>
          )}
        </Card>
      </section>

      <Modal
        open={isModalOpen}
        title={activeTab === "OFFLINE" ? (offlineForm.id ? "Edit offline pricing" : "Tambah offline pricing") : onlineForm.id ? "Edit online variant" : "Tambah online variant"}
        onClose={closeModal}
        size="2xl"
      >
        <div className="mb-4 text-sm text-[var(--color-muted)]">
          {activeTab === "OFFLINE"
            ? "Harga branch untuk transaksi langsung di outlet."
            : "Atur harga, isi paket, dan display name khusus untuk GoFood / GrabFood / ShopeeFood."}
        </div>
        {activeTab === "OFFLINE" ? (
          <OfflineFormBody
            value={offlineForm}
            products={products}
            onChange={setOfflineForm}
            onSubmit={handleSubmitOffline}
            onReset={closeModal}
            saving={saving}
            targetSummary={targetSummary}
            branchLabel={targetMode === "SINGLE" ? targetBranchMap.get(targetBranchId)?.name || "" : offlineForm.branchId ? targetBranchMap.get(offlineForm.branchId)?.name || "" : ""}
          />
        ) : (
          <OnlineFormBody
            value={onlineForm}
            products={products}
            onChange={setOnlineForm}
            onSubmit={handleSubmitOnline}
            onReset={closeModal}
            saving={saving}
            targetSummary={targetSummary}
            branchLabel={targetMode === "SINGLE" ? targetBranchMap.get(targetBranchId)?.name || "" : onlineForm.branchId ? targetBranchMap.get(onlineForm.branchId)?.name || "" : ""}
          />
        )}
      </Modal>
    </ErpShell>
  );
}
