import { AlertTriangle } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Konfirmasi",
  message = "Apakah Anda yakin ingin melanjutkan?",
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="sm">
      <div className="grid gap-5">
        <div className="flex items-start gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
              tone === "danger"
                ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : tone === "warning"
                  ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                  : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
