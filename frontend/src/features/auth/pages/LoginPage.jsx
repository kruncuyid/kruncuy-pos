import { Eye, EyeOff, Lock, LoaderCircle, LogIn, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../../../components/ui";
import { getHomePathByRole, saveSession } from "../../../core/auth/session";
import { authApi } from "../services/authApi";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authApi.login({ username, password });
      const { token, user, access } = response.data.data;

      saveSession({ token, user, access });
      navigate(getHomePathByRole(user.role), { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login gagal. Coba cek username dan password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(215,25,32,0.16),_transparent_32%),linear-gradient(180deg,var(--color-bg),var(--color-bg))] px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle,_rgba(215,25,32,0.12),_transparent_55%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">Kruncuy POS</p>
            <h2 className="mt-3 max-w-xl text-5xl font-black tracking-tight">
              Kasir lebih cepat, ringkas, dan siap dipakai tim.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--color-muted)]">
            Login ini sudah terhubung ke backend auth dan database Prisma. Gunakan username dan password yang
            sudah terdaftar.
            </p>

          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              ["Auth", "JWT + Prisma"],
              ["User", "ERP Admin & Outlet Crew"],
              ["DB", "PostgreSQL"],
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{label}</p>
                <p className="mt-2 text-lg font-bold">{value}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="w-full max-w-xl p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Login staf
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Masuk ke kasir</h1>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Gunakan username dan password yang sudah terdaftar. Username login bersifat huruf kecil sesuai data
                tersimpan.
              </p>
            </div>
            <div className="hidden rounded-2xl bg-[var(--color-primary-soft)] p-3 text-[var(--color-primary)] sm:grid place-items-center">
              <LogIn size={20} />
            </div>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Input
              label="Username"
              placeholder="Username"
              icon={<UserRound size={16} />}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              icon={<Lock size={16} />}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <div className="-mt-1 flex items-center justify-between text-xs text-[var(--color-muted)]">
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="inline-flex items-center gap-1 font-medium text-[var(--color-text)]"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? "Sembunyikan password" : "Lihat password"}
              </button>
              <span>Gunakan username dan password yang sudah terdaftar</span>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="mt-1 w-full" disabled={loading}>
              {loading ? <LoaderCircle size={18} className="animate-spin" /> : <LogIn size={18} />}
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-5 grid gap-3 text-xs text-[var(--color-muted)] sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
              <p className="font-semibold text-[var(--color-text)]">Akun terdaftar</p>
              <p className="mt-1">Login pakai username yang sudah dibuat di sistem.</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
              <p className="font-semibold text-[var(--color-text)]">Catatan</p>
              <p className="mt-1">Pastikan huruf kecil sesuai data tersimpan.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
