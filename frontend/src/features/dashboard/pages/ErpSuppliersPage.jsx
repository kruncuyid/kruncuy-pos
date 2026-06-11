import { Building2, PlusCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Modal, PageHeader, SectionHeader, StatCard, Alert } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import ManagementTable from "../components/table/ManagementTable";
import { supplierApi } from "../services/supplierApi";

function initialForm() {
  return { id: "", code: "", name: "", contactPerson: "", phone: "", email: "", address: "", paymentTerms: "", isActive: true };
}

export default function ErpSuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await supplierApi.list();
      setSuppliers(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat suppliers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.code?.toLowerCase().includes(q) ||
      s.contactPerson?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  }, [suppliers, search]);

  const metrics = useMemo(() => [
    { title: "Total Supplier", value: suppliers.length, icon: Building2 },
    { title: "Aktif", value: suppliers.filter((s) => s.isActive !== false).length, icon: Building2 },
  ], [suppliers]);

  function openCreate() { setForm(initialForm()); setModalOpen(true); }
  function openEdit(supplier) { setForm({ ...supplier }); setModalOpen(true); }
  function updateForm(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code || !form.name) { setError("Kode dan nama wajib diisi"); return; }
    setSaving(true); setError("");
    try {
      if (form.id) await supplierApi.update(form.id, form);
      else await supplierApi.create(form);
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menyimpan.");
    } finally { setSaving(false); }
  }

  async function handleDelete(supplier) {
    if (!confirm("Nonaktifkan supplier ini?")) return;
    setError("");
    try {
      await supplierApi.remove(supplier.id);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menonaktifkan.");
    }
  }

  const columns = useMemo(() => [
    { key: "code", label: "Kode", render: (row) => <span className="font-semibold">{row.code}</span> },
    { key: "name", label: "Nama" },
    { key: "contactPerson", label: "Kontak" },
    { key: "phone", label: "Telepon" },
    { key: "email", label: "Email" },
    { key: "isActive", label: "Status", render: (row) => <Badge tone={row.isActive !== false ? "success" : "neutral"}>{row.isActive !== false ? "Aktif" : "Nonaktif"}</Badge> },
    { key: "actions", label: "", render: (row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
        {row.isActive !== false ? <Button size="sm" variant="ghost" onClick={() => handleDelete(row)}><Trash2 size={14} /></Button> : null}
      </div>
    )},
  ], []);

  return (
    <ErpShell title="Suppliers" description="Data pemasok barang untuk purchasing.">
      <PageHeader title="Suppliers" description="Kelola data pemasok barang untuk purchasing." badge="New"
        actions={<Button size="sm" onClick={openCreate}><PlusCircle size={16} />Tambah Supplier</Button>}
        onRefresh={loadData} loading={loading} />
      {error ? <Alert tone="danger" onDismiss={() => setError("")}>{error}</Alert> : null}
      <section className="grid gap-4 md:grid-cols-2">
        {metrics.map((m) => <StatCard key={m.title} title={m.title} value={loading ? "-" : m.value} icon={<m.icon size={18} />} />)}
      </section>
      <Card className="p-4 sm:p-5">
        <SectionHeader title="Daftar Supplier" description={loading ? "Memuat..." : `${filtered.length} supplier`} />
        <div className="mt-4 max-w-sm"><Input placeholder="Cari supplier..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} /></div>
        <div className="mt-4">
          <ManagementTable columns={columns} rows={filtered} emptyText="Belum ada supplier." resetKey={filtered.length} stickyHeader />
        </div>
      </Card>
      <Modal open={modalOpen} title={form.id ? "Edit Supplier" : "Tambah Supplier"} onClose={() => setModalOpen(false)} size="lg">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Kode supplier" value={form.code} onChange={(e) => updateForm("code", e.target.value.toUpperCase())} placeholder="SPL-001" required />
            <Input label="Nama supplier" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="PT. Sumber Pangan" required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Kontak person" value={form.contactPerson} onChange={(e) => updateForm("contactPerson", e.target.value)} placeholder="Budi" />
            <Input label="Telepon" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="0812-xxxx" />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="supplier@example.com" />
          <Input label="Alamat" value={form.address} onChange={(e) => updateForm("address", e.target.value)} placeholder="Jl. Merdeka No. 1" />
          <Input label="Syarat pembayaran" value={form.paymentTerms} onChange={(e) => updateForm("paymentTerms", e.target.value)} placeholder="30 hari" hint="Contoh: 30 hari, COD, 7 hari" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={saving}>{form.id ? "Update" : "Simpan"}</Button>
          </div>
        </form>
      </Modal>
    </ErpShell>
  );
}
