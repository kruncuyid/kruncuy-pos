import { Boxes, PencilLine, PlusCircle, RefreshCw, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  SectionHeader,
  StatCard,
} from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { inventoryApi } from "../services/inventoryApi";

const ITEM_TYPES = [
  {
    value: "RAW_MATERIAL",
    label: "Raw material",
    tone: "success",
    description: "Bahan baku utama untuk menu jualan.",
  },
  {
    value: "PACKAGING",
    label: "Packaging",
    tone: "info",
    description: "Kemasan, paper bag, sauce cup, dan sejenisnya.",
  },
  {
    value: "UTILITY",
    label: "Utility",
    tone: "warning",
    description: "Barang pendukung operasional seperti gas atau alat bantu.",
  },
  {
    value: "SUPPLY",
    label: "Supply",
    tone: "neutral",
    description: "Barang penunjang operasional yang tidak selalu dihitung harian.",
  },
];

function initialForm() {
  return {
    id: "",
    name: "",
    code: "",
    unit: "",
    type: "RAW_MATERIAL",
    description: "",
    isActive: true,
    isPurchasable: true,
    isOpnameRequired: true,
  };
}

function getTypeMeta(type) {
  return ITEM_TYPES.find((item) => item.value === type) || ITEM_TYPES[0];
}

function ItemFormBody({ value, onChange, onSubmit, onReset, saving }) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div>
        <Input
          label="Nama item"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Contoh: Tahu Pong"
        />
      </div>
      <div>
        <Input
          label="Kode item"
          value={value.code}
          onChange={(event) => onChange({ ...value, code: event.target.value.toUpperCase() })}
          placeholder="Contoh: BAHAN-TAHU-PONG"
          hint="Kode unik untuk identifikasi item."
        />
      </div>
      <div>
        <Input
          label="Satuan"
          value={value.unit}
          onChange={(event) => onChange({ ...value, unit: event.target.value })}
          placeholder="Contoh: pcs, kg, liter, tabung"
        />
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Tipe item</span>
          <select
            className="kr-input"
            value={value.type}
            onChange={(event) => onChange({ ...value, type: event.target.value })}
          >
            {ITEM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="md:col-span-2">
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Deskripsi</span>
          <textarea
            className="kr-input min-h-[110px] resize-y"
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
            placeholder="Catatan singkat tentang item ini."
          />
        </label>
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Bisa dibeli crew?</span>
          <select
            className="kr-input"
            value={value.isPurchasable ? "true" : "false"}
            onChange={(event) => onChange({ ...value, isPurchasable: event.target.value === "true" })}
          >
            <option value="true">Ya</option>
            <option value="false">Tidak</option>
          </select>
        </label>
      </div>
      <div>
        <label className="grid gap-2 text-sm text-[var(--color-text)]">
          <span className="font-medium">Wajib stock opname?</span>
          <select
            className="kr-input"
            value={value.isOpnameRequired ? "true" : "false"}
            onChange={(event) => onChange({ ...value, isOpnameRequired: event.target.value === "true" })}
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
        Item yang wajib opname akan dipakai sebagai daftar raw material crew saat closing/opening stok.
      </div>

      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          <PlusCircle size={16} />
          {saving ? "Menyimpan..." : value.id ? "Update item" : "Simpan item"}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export default function ErpInventoryItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [form, setForm] = useState(initialForm());
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const response = await inventoryApi.getInventoryItems();
      setItems(response.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat daftar item inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const metrics = useMemo(() => {
    const rawMaterial = items.filter((item) => item.type === "RAW_MATERIAL").length;
    const opname = items.filter((item) => item.isOpnameRequired).length;
    const purchasable = items.filter((item) => item.isPurchasable).length;

    return [
      { title: "Total item", value: items.length, icon: Boxes },
      { title: "Raw material", value: rawMaterial, icon: ShoppingCart },
      { title: "Item opname", value: opname, icon: Boxes },
      { title: "Bisa dibeli", value: purchasable, icon: ShoppingCart },
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !keyword ||
        [item.name, item.code, item.unit, item.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [items, query, typeFilter]);

  const itemColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Item",
        render: (item) => (
          <div className="min-w-0">
            <p className="font-semibold text-[var(--color-text)]">{item.name}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{item.code}</p>
          </div>
        ),
      },
      {
        key: "type",
        label: "Type",
        render: (item) => {
          const typeMeta = getTypeMeta(item.type);
          return <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>;
        },
      },
      {
        key: "unit",
        label: "Unit",
        render: (item) => <span className="font-medium">{item.unit || "-"}</span>,
      },
      {
        key: "opname",
        label: "Opname",
        render: (item) => (
          <Badge tone={item.isOpnameRequired ? "success" : "neutral"}>
            {item.isOpnameRequired ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "purchasable",
        label: "Purchasable",
        render: (item) => (
          <Badge tone={item.isPurchasable ? "info" : "neutral"}>
            {item.isPurchasable ? "Yes" : "No"}
          </Badge>
        ),
      },
      {
        key: "coverage",
        label: "Coverage",
        render: (item) => (
          <div className="text-sm text-[var(--color-text)]">
            <p>{item.branchInventoryItems?.length || 0} branch</p>
            <p className="text-xs text-[var(--color-muted)]">{item.recipeItems?.length || 0} menu</p>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (item) => (
          <Badge tone={item.isActive ? "success" : "danger"}>{item.isActive ? "Active" : "Inactive"}</Badge>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (item) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
              <PencilLine size={14} />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDeactivate(item)} disabled={!item.isActive}>
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

  function resetForm() {
    setForm(initialForm());
  }

  function openCreateModal() {
    setForm(initialForm());
    setIsModalOpen(true);
  }

  function handleEdit(item) {
    setForm({
      id: item.id,
      name: item.name || "",
      code: item.code || "",
      unit: item.unit || "",
      type: item.type || "RAW_MATERIAL",
      description: item.description || "",
      isActive: item.isActive ?? true,
      isPurchasable: item.isPurchasable ?? true,
      isOpnameRequired: item.isOpnameRequired ?? true,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        unit: form.unit.trim(),
        type: form.type,
        description: form.description.trim(),
        isActive: form.isActive,
        isPurchasable: form.isPurchasable,
        isOpnameRequired: form.isOpnameRequired,
      };

      if (!payload.name || !payload.code || !payload.unit) {
        throw new Error("Nama, kode, dan satuan item wajib diisi");
      }

      if (form.id) {
        await inventoryApi.updateInventoryItem(form.id, payload);
      } else {
        await inventoryApi.createInventoryItem(payload);
      }

      await loadItems();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal menyimpan item inventory.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(item) {
    const confirmed = window.confirm(`Nonaktifkan item ${item.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await inventoryApi.updateInventoryItem(item.id, {
        name: item.name,
        code: item.code,
        unit: item.unit,
        type: item.type,
        description: item.description,
        isActive: false,
        isPurchasable: item.isPurchasable,
        isOpnameRequired: item.isOpnameRequired,
      });

      await loadItems();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menonaktifkan item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ErpShell title="Inventory Items" description="Atur raw material, packaging, utility, dan item yang dipakai stock opname.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
            ERP workspace
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Inventory Items</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            Kelola item stok yang akan dipakai untuk stock opname crew, purchasing, recipe, dan expense outlet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadItems} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <PlusCircle size={16} />
            Tambah raw material
          </Button>
        </div>
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

      <section className="grid gap-6">
        <Card className="p-5">
          <SectionHeader
            title="Daftar raw material"
            description="Edit item yang akan dipakai untuk stock opname, atau tandai item yang tidak perlu dihitung harian."
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              label="Search item"
              icon={<Search size={16} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama / kode / satuan"
            />
            <label className="grid gap-2 text-sm text-[var(--color-text)]">
              <span className="font-medium">Filter tipe</span>
              <select
                className="kr-input"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="ALL">All types</option>
                {ITEM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
              Memuat item inventory...
            </div>
          ) : filteredItems.length ? (
            <div className="mt-5">
              <ManagementTable
                columns={itemColumns}
                rows={filteredItems}
                emptyText="Tambahkan item raw material atau packaging dari tombol di atas."
                resetKey={`${query}-${typeFilter}-${filteredItems.length}`}
                maxHeightClass="max-h-[38rem]"
              />
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Belum ada item inventory"
                description="Tambahkan item raw material atau packaging dari tombol di atas."
              />
            </div>
          )}
        </Card>
      </section>

      <Modal
        open={isModalOpen}
        title={form.id ? "Edit raw material" : "Tambah raw material"}
        onClose={closeModal}
        size="xl"
      >
        <div className="mb-4 text-sm text-[var(--color-muted)]">
          Atur item stok yang dipakai untuk stock opname crew, purchasing, dan recipe menu.
        </div>
        <ItemFormBody
          value={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onReset={closeModal}
          saving={saving}
        />
      </Modal>
    </ErpShell>
  );
}
