import { ArrowLeft, Compass, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card } from "../../../components/ui";
import ErpShell from "../components/ErpShell";

export default function ErpFeaturePage({
  title,
  description,
  purpose,
  ideas = [],
  permissions = [],
}) {
  const navigate = useNavigate();

  return (
    <ErpShell title={title} description={description}>
      <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
            ERP workspace
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Kembali
          </Button>
          <Button onClick={() => navigate("/erp")}>
            <Compass size={16} />
            Ke dashboard
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[var(--color-primary-soft)] p-3 text-[var(--color-primary)]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Halaman ini untuk...
              </p>
              <p className="mt-3 text-base leading-7 text-[var(--color-text)]">{purpose}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Permission
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {permissions.length ? (
              permissions.map((permission) => (
                <Badge key={permission} tone="info">
                  {permission}
                </Badge>
              ))
            ) : (
              <Badge tone="neutral">No special permission</Badge>
            )}
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
          Ide dasar page
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ideas.length ? (
            ideas.map((idea) => (
              <div
                key={idea}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]"
              >
                {idea}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-4 text-sm text-[var(--color-muted)]">
              Belum ada ide dasar yang ditetapkan.
            </div>
          )}
        </div>
      </Card>
    </ErpShell>
  );
}
