import { Button } from "../../../lib/ui/index.ts";

type ImportBannerProps = {
  onSave: () => void;
  onDismiss: () => void;
};

/** Shown when the draft was loaded from a shared link (spec §5). */
export function ImportBanner({ onSave, onDismiss }: ImportBannerProps) {
  return (
    <div className="flex animate-slide-up-fade flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-300 bg-accent-50 p-3 shadow-sm dark:border-accent-700 dark:bg-accent-900/30">
      <p className="text-sm font-medium text-accent-800 dark:text-accent-200">
        Importiertes Rezept – speichern?
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Verwerfen
        </Button>
        <Button size="sm" onClick={onSave}>
          Speichern
        </Button>
      </div>
    </div>
  );
}
