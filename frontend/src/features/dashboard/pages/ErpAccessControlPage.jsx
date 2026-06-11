import { CheckSquare2, Loader2, RefreshCcw, ShieldCheck, Square, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, EmptyState, SectionHeader, StatCard } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import { accessControlApi } from "../services/accessControlApi";

function getRolePermissionCodes(role) {
  return new Set(
    (role?.rolePermissions || [])
      .map((item) => item?.permission?.code)
      .filter(Boolean)
  );
}

function PermissionCell({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
        checked
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-primary)]"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      aria-label={checked ? "Aktif" : "Nonaktif"}
    >
      {checked ? <CheckSquare2 size={16} /> : <Square size={16} />}
    </button>
  );
}

export default function ErpAccessControlPage() {
  const [matrix, setMatrix] = useState({
    roles: [],
    modules: [],
    permissions: [],
    rolePermissions: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  async function loadMatrix() {
    setLoading(true);
    setError("");

    try {
      const response = await accessControlApi.getMatrix();
      setMatrix(response.data.data || { roles: [], modules: [], permissions: [], rolePermissions: [] });
      setDirty(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat matrix access control.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatrix();
  }, []);

  const rolePermissionMap = useMemo(() => {
    const map = new Map();

    for (const role of matrix.roles || []) {
      map.set(role.code, getRolePermissionCodes(role));
    }

    return map;
  }, [matrix.roles]);

  const metrics = useMemo(() => {
    const totalRoles = matrix.roles?.length || 0;
    const totalModules = matrix.modules?.length || 0;
    const totalPermissions = matrix.permissions?.length || 0;
    return [
      { title: "Roles", value: totalRoles },
      { title: "Modules", value: totalModules },
      { title: "Features", value: totalPermissions },
    ];
  }, [matrix.modules, matrix.permissions, matrix.roles]);

  function togglePermission(roleCode, permissionCode) {
    setMatrix((current) => {
      const roles = (current.roles || []).map((role) => {
        if (role.code !== roleCode) return role;

        const nextCodes = new Set(getRolePermissionCodes(role));
        if (nextCodes.has(permissionCode)) {
          nextCodes.delete(permissionCode);
        } else {
          nextCodes.add(permissionCode);
        }

        return {
          ...role,
          rolePermissions: Array.from(nextCodes).map((code) => ({
            permission: { code },
          })),
        };
      });

      return {
        ...current,
        roles,
      };
    });

    setDirty(true);
  }

  async function handleSyncCatalog() {
    setSyncing(true);
    setError("");

    try {
      await accessControlApi.syncCatalog();
      await loadMatrix();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal sync catalog access.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    setError("");

    try {
      for (const role of matrix.roles || []) {
        const permissionCodes = Array.from(getRolePermissionCodes(role));
        await accessControlApi.updateRolePermissions(role.code, permissionCodes);
      }

      await loadMatrix();
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal menyimpan matrix access.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ErpShell title="Access Control" description="Kelola role, module, dan feature access dari database.">
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
            ERP workspace
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Permission matrix</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            List modul dan fitur di kiri, kolom role di kanan. Centang hak akses untuk mengaktifkan atau menonaktifkan akses tiap role.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadMatrix} disabled={loading}>
            <RefreshCcw size={16} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleSyncCatalog} disabled={syncing}>
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Sync catalog
          </Button>
          <Button onClick={handleSaveAll} disabled={saving || !dirty}>
            <Save size={16} />
            {saving ? "Menyimpan..." : "Simpan matrix"}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <StatCard
            key={metric.title}
            title={metric.title}
            value={loading ? "-" : metric.value}
            icon={<ShieldCheck size={18} />}
          />
        ))}
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="p-5">
        <SectionHeader
          title="Roles aktif"
          description="Role disimpan di database. Perubahan permission langsung dipakai oleh login, sidebar ERP, dan proteksi halaman."
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {(matrix.roles || []).map((role) => (
            <Badge key={role.code} tone={role.branchScope === "ALL" ? "success" : "neutral"}>
              {role.name} · {role.code}
            </Badge>
          ))}
          {!loading && !matrix.roles?.length ? (
            <EmptyState title="Belum ada role" description="Sync catalog untuk membuat role default." />
          ) : null}
        </div>
      </Card>

      <div className="grid gap-5">
        {(matrix.modules || []).map((module) => {
          const permissions = module.permissions || [];

          return (
            <Card key={module.id} className="overflow-hidden p-0">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{module.name}</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{module.description}</p>
                  </div>
                  <Badge tone="neutral">{permissions.length} fitur</Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[960px] w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                        Feature
                      </th>
                      {(matrix.roles || []).map((role) => (
                        <th
                          key={role.code}
                          className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]"
                        >
                          <div className="grid gap-1">
                            <span>{role.code}</span>
                            <span className="text-[10px] font-medium normal-case tracking-normal text-[var(--color-muted)]">
                              {role.branchScope}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((permission) => (
                      <tr key={permission.id} className="border-b border-[var(--color-border)] last:border-b-0">
                        <td className="px-5 py-4 align-top">
                          <p className="font-semibold text-[var(--color-text)]">{permission.name}</p>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">{permission.description}</p>
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-muted)]">
                            {permission.code}
                          </p>
                        </td>
                        {(matrix.roles || []).map((role) => {
                          const checked = rolePermissionMap.get(role.code)?.has(permission.code) || false;

                          return (
                            <td key={`${role.code}-${permission.code}`} className="px-4 py-4 text-center">
                              <PermissionCell
                                checked={checked}
                                onChange={() => togglePermission(role.code, permission.code)}
                                disabled={role.isSystem && role.code === "SUPERADMIN"}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}

        {!loading && !matrix.modules?.length ? (
          <Card className="p-6">
            <EmptyState
              title="Belum ada module"
              description="Sync catalog untuk membuat daftar module dan fitur default."
              actionLabel="Sync catalog"
              onAction={handleSyncCatalog}
            />
          </Card>
        ) : null}
      </div>
    </ErpShell>
  );
}
