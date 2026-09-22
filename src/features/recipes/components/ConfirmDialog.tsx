import { useEffect, useRef, useState } from "react";
import { Button, useFocusTrap } from "../../../lib/ui/index.ts";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

/** Small confirmation modal for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Löschen",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    // Focus the safe action so Enter can't destroy anything by accident.
    const t = setTimeout(() => cancelRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-black/40 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm animate-pop-in rounded-2xl border border-border bg-surface p-5 shadow-warm"
      >
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-fg-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={async () => {
              // Block double taps while an async confirm (e.g. delete) runs.
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
