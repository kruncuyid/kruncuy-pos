import { FileQuestion, Home, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStoredToken } from "../../../core/auth/session";
import { Button } from "../../../components/ui";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getStoredToken());

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <FileQuestion size={36} />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-[var(--color-text)]">404</h1>
        <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">Halaman tidak ditemukan</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div className="mt-8 grid gap-3">
          <Button onClick={() => navigate(isLoggedIn ? "/" : "/login")} className="w-full">
            {isLoggedIn ? <Home size={16} /> : <LogIn size={16} />}
            {isLoggedIn ? "Ke Beranda" : "Ke Halaman Login"}
          </Button>
        </div>
      </div>
    </div>
  );
}
