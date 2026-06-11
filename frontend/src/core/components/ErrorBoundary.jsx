import { Component } from "react";
import { Button } from "../../components/ui";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text)]">Terjadi Kesalahan</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {this.props.fallbackMessage || "Halaman ini mengalami gangguan. Silakan coba lagi."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => window.location.reload()}>
                Muat Ulang
              </Button>
              <Button variant="secondary" onClick={() => { this.setState({ hasError: false, error: null }); }}>
                Coba Lagi
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error ? (
              <pre className="mt-6 rounded-xl bg-red-50 p-4 text-left text-xs text-red-700 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
