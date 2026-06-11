import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearSession, getStoredAccess, getStoredUser } from "../../../core/auth/session";
import { ERP_NAV_GROUPS } from "../erpNavigation.config";

function hasPermission(permissions, required) {
  if (!required) return true;
  if (permissions.includes("*")) return true;
  if (Array.isArray(required)) return required.some((permission) => permissions.includes(permission));
  return permissions.includes(required);
}

function isNavPathActive(href, currentPath) {
  if (href === "/erp") return currentPath === href;
  if (currentPath === href) return true;
  return currentPath.startsWith(`${href}/`);
}

export default function ErpShell({
  children,
  title = "ERP Control Center",
  description = "Workspace ERP.",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const access = getStoredAccess();
  const permissions = access?.permissions || [];
  const currentPath = location.pathname;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentPath]);

  const visibleGroups = useMemo(() => {
    return ERP_NAV_GROUPS.map((group) => {
      const items = group.items.filter((item) => hasPermission(permissions, item.permission));
      return { ...group, items };
    }).filter((group) => group.items.length > 0);
  }, [permissions]);

  const activeGroupKey = useMemo(() => {
    const activeGroup = visibleGroups.find((group) =>
      group.items.some((item) => isNavPathActive(item.href, currentPath))
    );

    return activeGroup?.key || visibleGroups[0]?.key || "";
  }, [currentPath, visibleGroups]);

  const [openGroupKey, setOpenGroupKey] = useState(activeGroupKey);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setOpenGroupKey(activeGroupKey);
  }, [activeGroupKey]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(215,25,32,0.10),_transparent_28%),linear-gradient(180deg,var(--color-bg),var(--color-bg))]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-4 px-2 py-2 sm:px-3 sm:py-3 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-4 lg:px-4 lg:py-4">
        <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)] lg:min-w-0">
          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)] text-white shadow-2xl shadow-slate-950/15">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgba(215,25,32,0.16)] text-white">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  KRUNCUY POS
                </p>
                <h1 className="mt-1 text-[17px] font-black leading-tight">{title}</h1>
                <p className="mt-0.5 text-[11px] text-white/70">{description}</p>
              </div>
            </div>

            <nav className="erp-scrollbar-hidden min-h-0 overflow-y-auto px-2 py-3">
              {visibleGroups.map((group) => {
                const Icon = group.icon;
                const isOpen = openGroupKey === group.key;

                return (
                  <div key={group.key} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <button
                      type="button"
                      onClick={() => setOpenGroupKey((current) => (current === group.key ? "" : group.key))}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                        isOpen ? "bg-[rgba(215,25,32,0.16)] text-white" : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white/12 text-white">
                          <Icon size={14} />
                        </span>
                        <span className="truncate text-[12px] font-semibold leading-4">{group.label}</span>
                      </div>
                      <ChevronDown size={12} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen ? (
                      <div className="border-t border-white/10 bg-black/10 p-1">
                        {group.items.map((item) => {
                          const active = isNavPathActive(item.href, currentPath);

                          return (
                            <button
                              key={item.href}
                              type="button"
                              onClick={() => navigate(item.href)}
                              className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] leading-4 transition-colors last:mb-0 ${
                                active
                                  ? "bg-white text-[var(--color-primary)]"
                                  : "bg-white/0 text-white/90 hover:bg-white/10"
                              }`}
                            >
                              <span className="min-w-0 truncate font-medium">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {!visibleGroups.length ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/6 px-3 py-3 text-[11px] text-white/70">
                  Permission belum cukup untuk menampilkan menu ERP.
                </div>
              ) : null}
            </nav>

            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-9 w-full items-center gap-2 rounded-xl bg-white/10 px-3 text-left text-[12px] font-semibold text-white transition-colors hover:bg-white/15"
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="grid min-w-0 gap-3 pb-4 sm:gap-4">
          <div className="flex items-center justify-between gap-3 rounded-[24px] bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)] px-3 py-3 text-white shadow-2xl shadow-slate-950/15 sm:px-4 sm:py-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white"
              aria-label="Buka menu"
            >
              <ChevronDown size={18} className="rotate-90" />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70 sm:block">
                KRUNCUY POS
              </p>
              <p className="truncate text-sm font-black sm:mt-1">{title}</p>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl">
              <span className="text-[10px] font-bold text-white/50">{description?.slice(0, 3) || "ERP"}</span>
            </div>
          </div>
          <div className="erp-page-content grid gap-4">{children}</div>
        </main>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-2 sm:p-3 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="ml-auto flex h-full w-full max-w-[330px] flex-col overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)] text-white shadow-2xl shadow-slate-950/30"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgba(215,25,32,0.16)] text-white">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  KRUNCUY POS
                </p>
                <h1 className="mt-1 text-[17px] font-black leading-tight">{title}</h1>
                <p className="mt-0.5 text-[11px] text-white/70">{description}</p>
              </div>
            </div>

            <nav className="erp-scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-2 py-3">
              {visibleGroups.map((group) => {
                const Icon = group.icon;
                const isOpen = openGroupKey === group.key;

                return (
                  <div key={group.key} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <button
                      type="button"
                      onClick={() => setOpenGroupKey((current) => (current === group.key ? "" : group.key))}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                        isOpen ? "bg-[rgba(215,25,32,0.16)] text-white" : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white/12 text-white">
                          <Icon size={14} />
                        </span>
                        <span className="truncate text-[12px] font-semibold leading-4">{group.label}</span>
                      </div>
                      <ChevronDown size={12} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen ? (
                      <div className="border-t border-white/10 bg-black/10 p-1">
                        {group.items.map((item) => {
                          const active = isNavPathActive(item.href, currentPath);

                          return (
                            <button
                              key={item.href}
                              type="button"
                              onClick={() => navigate(item.href)}
                              className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] leading-4 transition-colors last:mb-0 ${
                                active
                                  ? "bg-white text-[var(--color-primary)]"
                                  : "bg-white/0 text-white/90 hover:bg-white/10"
                              }`}
                            >
                              <span className="min-w-0 truncate font-medium">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {!visibleGroups.length ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/6 px-3 py-3 text-[11px] text-white/70">
                  Permission belum cukup untuk menampilkan menu ERP.
                </div>
              ) : null}
            </nav>

            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-9 w-full items-center gap-2 rounded-xl bg-white/10 px-3 text-left text-[12px] font-semibold text-white transition-colors hover:bg-white/15"
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
