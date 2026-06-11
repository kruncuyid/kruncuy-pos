export default function PageShell({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(215,25,32,0.10),_transparent_35%),linear-gradient(180deg,var(--color-bg),var(--color-bg))]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="kr-card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]">
              Kruncuy POS
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
        <main className="grid gap-6">{children}</main>
      </div>
    </div>
  );
}
