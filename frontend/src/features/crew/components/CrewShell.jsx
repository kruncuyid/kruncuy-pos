import { ArrowLeft, House, LayoutDashboard, ShoppingCart, Boxes, Wallet, TrendingUp, LogOut } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearSession, getStoredUser } from "../../../core/auth/session";

const navItems = [
  { label: "Beranda", path: "/crew", icon: LayoutDashboard },
  { label: "POS", path: "/crew/pos", icon: ShoppingCart },
  { label: "Operasional", path: "/crew/operational", icon: Boxes },
  { label: "Stok Outlet", path: "/crew/stock-outlet", icon: Boxes },
  { label: "Setoran Cash", path: "/crew/cash-withdrawals", icon: Wallet },
  { label: "Performa Saya", path: "/crew/performance", icon: TrendingUp },
];

const sidebarItems = navItems;

export default function CrewShell({
  title,
  description,
  children,
  backTo = "/crew",
  compactHeader = false,
  hideHeader = false,
  hideMobileHeader = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  const isHome = location.pathname === "/crew";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(215,25,32,0.12),_transparent_28%),linear-gradient(180deg,var(--color-bg),var(--color-bg))] pb-20 sm:pb-24">
      <div className="mx-auto grid min-h-screen w-full max-w-[1180px] gap-3 px-2 pt-2 sm:px-4 sm:pt-3 lg:grid-cols-[280px_1fr]">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-3 flex h-[calc(100vh-1.5rem)] flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Crew workspace</p>
              <h1 className="mt-2 text-xl font-black tracking-tight">KRUNCUY POS</h1>
              <p className="mt-2 text-sm text-[var(--color-muted)]">Ringkas, cepat, untuk Android.</p>
            </div>
            <div className="mt-5 grid gap-1.5">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = item.path === location.pathname;
                return (
                  <button key={item.label} type="button" onClick={() => navigate(item.path)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${active ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"}`}
                  ><Icon size={16} /> {item.label}</button>
                );
              })}
            </div>
            <div className="mt-auto rounded-2xl bg-[var(--color-surface-2)] p-4">
              <p className="text-sm font-semibold">{user?.name || "Outlet Crew"}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{user?.branch?.name || "Branch aktif"}</p>
              <button type="button" onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-danger-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:opacity-80"
              ><LogOut size={16} /> Keluar</button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className={`flex min-h-screen flex-col ${compactHeader ? "gap-2" : "gap-3"}`}>
          {/* Sticky Header with mobile logout */}
          <div className="sticky top-0 z-30 -mx-2 px-2 pt-2 sm:-mx-4 sm:px-4 sm:pt-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] shadow-[var(--shadow-card)] backdrop-blur-xl">
              <div className={`flex items-center justify-between gap-3 ${compactHeader ? "px-3 py-2 sm:px-4 sm:py-2.5" : "px-4 py-3 sm:px-5 sm:py-4"}`}>
                <div className="flex items-center gap-2 min-w-0">
                  {!isHome ? (
                    <button type="button" onClick={() => navigate(backTo)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]" aria-label="Kembali"
                    ><ArrowLeft size={16} /></button>
                  ) : (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><House size={16} /></div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!compactHeader ? <span className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)] sm:block">Crew</span> : null}
                      <h2 className="truncate text-base font-black tracking-tight sm:text-xl">{title}</h2>
                    </div>
                    {!compactHeader ? (
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <span className="truncate max-w-[160px]">{user?.branch?.name || user?.name || "Outlet"}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {description && !compactHeader ? <p className="hidden text-sm text-[var(--color-muted)] md:block">{description}</p> : null}
                  {/* Logout for mobile */}
                  <button type="button" onClick={handleLogout}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-red-50 hover:text-red-600 transition-colors lg:hidden"
                    aria-label="Keluar"
                  ><LogOut size={16} /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 min-w-0 overflow-x-hidden">{children}</div>
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      {hideMobileHeader ? null : (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-1 pb-1 pt-1 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[500px] items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.path === location.pathname;
            return (
              <button key={item.label} type="button" onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 transition-all min-w-0 flex-1 ${active ? "text-white bg-gradient-to-t from-primary to-red-600 shadow-sm" : "text-[var(--color-muted)] active:text-[var(--color-text)]"}`}
                style={{ minHeight: 52 }}
              ><Icon size={20} /><span className="text-[10px] font-semibold leading-tight">{item.label}</span></button>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}
