import { useEffect, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import ErpShell from "../components/ErpShell";
import { customerApi } from "../services/customerApi";
import { Button, Modal, Input, Card, EmptyState } from "../../../components/ui";
import { formatDateTime } from "../utils/reportFormatters";

export default function ErpCustomersPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const res = await customerApi.list(params);
      setData(res.data.data || []);
    } catch (_) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSearch(e) {
    e.preventDefault();
    load();
  }

  function openCreate() {
    setForm({ name: "", phone: "", email: "", notes: "" });
    setSelected(null);
    setShowForm(true);
  }

  function openEdit(customer) {
    setForm({ name: customer.name, phone: customer.phone || "", email: customer.email || "", notes: customer.notes || "" });
    setSelected(customer);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (selected) {
        await customerApi.update(selected.id, form);
      } else {
        await customerApi.create(form);
      }
      setShowForm(false);
      await load();
    } catch (_) { }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus customer ini?")) return;
    try {
      await customerApi.remove(id);
      await load();
    } catch (_) { }
  }

  return (
    <ErpShell title="Customer" description="Manajemen data pelanggan">
      <div className="flex items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="Cari nama, telepon, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary"><Search size={16} /> Cari</Button>
        </form>
        <Button onClick={openCreate}><Plus size={16} /> Tambah</Button>
      </div>

      {loading ? (
        <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada customer"
          description="Tambah customer pertama untuk mulai melacak riwayat pembelian."
          action={openCreate}
          actionLabel="Tambah Customer"
        />
      ) : (
        <div className="grid gap-2">
          {data.map((c) => (
            <div key={c.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[var(--color-muted)]">
                    {c.phone ? <span>📞 {c.phone}</span> : null}
                    {c.email ? <span>✉ {c.email}</span> : null}
                    {c.notes ? <span>📝 {c.notes}</span> : null}
                  </div>
                  <p className="text-[10px] text-[var(--color-muted)] mt-1">
                    Dibuat {formatDateTime(c.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(c)} className="text-xs text-[var(--color-primary)] underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} title={selected ? "Edit Customer" : "Tambah Customer"} onClose={() => setShowForm(false)} size="sm">
        <div className="grid gap-4">
          <Input label="Nama *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama pelanggan" />
          <Input label="Telepon" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0812xxxx" />
          <Input label="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          <Input label="Catatan" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Catatan (opsional)" />
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Batal</Button>
            <Button onClick={handleSave} loading={saving}>{selected ? "Simpan" : "Tambah"}</Button>
          </div>
        </div>
      </Modal>
    </ErpShell>
  );
}
