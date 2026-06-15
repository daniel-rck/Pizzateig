import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "../../../lib/ui/index.ts";

type SaveDialogProps = {
  open: boolean;
  initialName: string;
  /** True when overwriting an already-stored recipe. */
  isUpdate: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
};

/** Modal to name a recipe before saving (spec §4.3 actions). */
export function SaveDialog({ open, initialName, isUpdate, onSave, onClose }: SaveDialogProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, initialName, onClose]);

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-black/40 backdrop-blur-sm"
      />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm animate-pop-in rounded-2xl border border-border bg-surface p-5 shadow-warm"
        aria-labelledby={`${id}-title`}
      >
        <h2 id={`${id}-title`} className="text-base font-semibold">
          {isUpdate ? "Rezept aktualisieren" : "Rezept speichern"}
        </h2>
        <label htmlFor={`${id}-name`} className="mt-4 mb-1 block text-sm font-medium text-fg-muted">
          Name
        </label>
        <input
          id={`${id}-name`}
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Napoletana 65 %"
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Speichern
          </Button>
        </div>
      </form>
    </div>
  );
}
