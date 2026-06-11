import { BarChart3, ChevronRight, Compass, FileText, Sparkles, Wallet, Boxes, Users, ReceiptText, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card } from "../../../components/ui";
import ErpShell from "../components/ErpShell";
import { REPORT_GROUPS } from "../reportCatalog";

const GROUP_ICONS = {
  "sales-pos": BarChart3,
  "cash-settlement": Wallet,
  inventory: Boxes,
  crew: Users,
  expenses: ReceiptText,
  system: ShieldCheck,
};

const GROUP_ACCENTS = {
  "sales-pos": "from-rose-500/12 to-orange-400/8 text-rose-600",
  "cash-settlement": "from-emerald-500/12 to-teal-400/8 text-emerald-600",
  inventory: "from-amber-500/12 to-yellow-400/8 text-amber-600",
  crew: "from-sky-500/12 to-blue-400/8 text-sky-600",
  expenses: "from-violet-500/12 to-purple-400/8 text-violet-600",
  system: "from-slate-500/12 to-zinc-400/8 text-slate-600",
};

export default function ErpReportsCenterPage() {
  const navigate = useNavigate();
  const totalReports = REPORT_GROUPS.reduce((sum, group) => sum + group.reports.length, 0);

  return (
    <ErpShell title="Reports Center" description="Pusat navigasi semua laporan operasional KRUNCUY POS.">
      <header className="kr-card overflow-hidden px-5 py-5 lg:px-6">
        <div className="relative">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(215,25,32,0.18),_transparent_65%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">
                  ERP workspace
                </p>
                <Badge tone="success">Live data</Badge>
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Reports Center</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
                Semua laporan sudah terhubung ke database operasional. Filter per branch, periode tanggal, dan export
                Excel/PDF tersedia di setiap halaman report.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate("/erp")}>
                <Compass size={16} />
                Ke dashboard
              </Button>
            </div>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Total reports", totalReports, "Laporan siap dipakai"],
              ["Export", "Excel + PDF", "Di setiap halaman report"],
              ["Filter", "Branch & date", "Sales report punya filter lanjutan"],
            ].map(([label, value, hint]) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">{label}</p>
                <p className="mt-1 text-xl font-black text-[var(--color-text)]">{value}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {REPORT_GROUPS.map((group) => {
          const Icon = GROUP_ICONS[group.key] || FileText;
          const accent = GROUP_ACCENTS[group.key] || GROUP_ACCENTS.system;

          return (
            <Card key={group.key} className="overflow-hidden p-0">
              <div className={`border-b border-[var(--color-border)] bg-gradient-to-br ${accent} px-5 py-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-80">{group.title}</p>
                    <p className="mt-2 text-sm leading-6 opacity-90">{group.description}</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3 shadow-sm backdrop-blur">
                    <Icon size={18} />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 p-4">
                {group.reports.map((report) => (
                  <Link
                    key={report.key}
                    to={report.path}
                    className="group flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--color-primary-soft)] hover:bg-white hover:shadow-sm"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">{report.title}</p>
                        <Badge tone={report.key === "sales-recap" ? "primary" : "success"}>
                          {report.key === "sales-recap" ? "Featured" : "Ready"}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">
                        {report.description}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-[var(--color-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]"
                    />
                  </Link>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 border-dashed p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[var(--color-primary-soft)] p-3 text-[var(--color-primary)]">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Mulai dari Sales Recapitulation</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Report paling lengkap dengan filter cashier, channel, payment, dan preview item transaksi.
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/erp/reports/sales-recap")}>Buka Sales Recap</Button>
      </Card>
    </ErpShell>
  );
}
