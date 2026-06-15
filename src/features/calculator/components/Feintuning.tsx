import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { formatPercent } from "../../../lib/format.ts";
import { tick } from "../../../lib/haptics.ts";
import type { RecipeDraft } from "../../../state/recipeDraft.ts";
import type { YeastConfig, YeastType } from "../../../types/recipe.ts";
import { Slider } from "./Slider.tsx";

type FeintuningProps = {
  draft: RecipeDraft;
  /** Currently effective yeast fraction (for seeding a manual override). */
  resolvedYeastPct: number;
  onUpdate: (patch: Partial<RecipeDraft>) => void;
  onYeast: (patch: Partial<YeastConfig>) => void;
};

const YEAST_LABELS: Record<Exclude<YeastType, "sourdough">, string> = {
  fresh: "Frisch",
  dry: "Trocken",
};

/** Progressive-disclosure fine-tuning accordion (spec §4.1, Ebene 3). */
export function Feintuning({ draft, resolvedYeastPct, onUpdate, onYeast }: FeintuningProps) {
  const [open, setOpen] = useState(false);
  const manual = draft.yeast.mode === "manual";

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-sm font-medium"
      >
        Feintuning
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="space-y-5 border-t border-border p-4">
          <Slider
            label="Hydration"
            value={draft.hydration}
            min={0.5}
            max={1.0}
            step={0.01}
            format={formatPercent}
            onChange={(v) => onUpdate({ hydration: v })}
          />
          <Slider
            label="Salz"
            value={draft.saltPct}
            min={0}
            max={0.04}
            step={0.001}
            format={formatPercent}
            onChange={(v) => onUpdate({ saltPct: v })}
          />
          <Slider
            label="Öl"
            value={draft.oilPct}
            min={0}
            max={0.05}
            step={0.001}
            format={formatPercent}
            onChange={(v) => onUpdate({ oilPct: v })}
          />

          <fieldset>
            <legend className="mb-1 block text-sm font-medium text-fg">Hefetyp</legend>
            <div className="inline-flex rounded-lg border border-border p-0.5">
              {(Object.keys(YEAST_LABELS) as Array<keyof typeof YEAST_LABELS>).map((type) => {
                const active = draft.yeast.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      tick();
                      onYeast({ type });
                    }}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-accent-600 text-white" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {YEAST_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-fg">Hefe manuell übersteuern</span>
            <input
              type="checkbox"
              checked={manual}
              onChange={(e) => {
                tick();
                onYeast(
                  e.target.checked ? { mode: "manual", pct: resolvedYeastPct } : { mode: "auto" },
                );
              }}
              className="h-5 w-5 accent-accent-600"
            />
          </label>

          {manual ? (
            <Slider
              label="Hefe"
              value={draft.yeast.pct}
              min={0}
              max={0.03}
              step={0.0005}
              format={formatPercent}
              onChange={(v) => onYeast({ pct: v })}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
