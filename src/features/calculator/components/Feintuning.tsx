import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { formatPercent } from "../../../lib/format.ts";
import { tick } from "../../../lib/haptics.ts";
import { Chip } from "../../../lib/ui/index.ts";
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
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-sm font-semibold tracking-tight"
      >
        <span className="flex items-center gap-2">
          <span className="text-accent-600" aria-hidden="true">
            <SlidersHorizontal size={16} />
          </span>
          Feintuning
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`text-fg-muted transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-[var(--duration-base)] ease-[var(--ease-out-quart)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
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
              <div className="flex flex-wrap gap-2">
                {(Object.keys(YEAST_LABELS) as Array<keyof typeof YEAST_LABELS>).map((type) => {
                  const active = draft.yeast.type === type;
                  return (
                    <Chip
                      key={type}
                      active={active}
                      onClick={() => {
                        tick();
                        onYeast({ type });
                      }}
                    >
                      {YEAST_LABELS[type]}
                    </Chip>
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
        </div>
      </div>
    </div>
  );
}
