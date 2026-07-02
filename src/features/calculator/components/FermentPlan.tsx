import { CalendarDays, Clock, Snowflake } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  FERMENT_PRESET_ORDER,
  FERMENT_PRESETS,
  type FermentPresetId,
  matchFermentPreset,
} from "../../../lib/ferment.ts";
import { formatHours, formatTemp, formatYeastGrams } from "../../../lib/format.ts";
import { tick } from "../../../lib/haptics.ts";
import { computeDraft, type RecipeDraft } from "../../../state/recipeDraft.ts";
import type { FermentConfig } from "../../../types/recipe.ts";
import { Slider } from "./Slider.tsx";

const PRESET_ICON: Record<FermentPresetId, ReactNode> = {
  quick: <Clock size={16} aria-hidden="true" />,
  overnight: <Snowflake size={16} aria-hidden="true" />,
  twoDays: <CalendarDays size={16} aria-hidden="true" />,
};

type FermentPlanProps = {
  draft: RecipeDraft;
  onSelectPreset: (config: FermentConfig) => void;
  onCustomChange: (config: FermentConfig) => void;
};

/** Preview the auto fresh-yeast amount (in grams) for a given plan. */
function previewYeastG(draft: RecipeDraft, config: FermentConfig): number {
  const preview = computeDraft({
    ...draft,
    yeast: { ...draft.yeast, mode: "auto" },
    ferment: config,
  });
  return preview.amounts.yeastG;
}

/** Ferment plan: preset cards with inline yeast + a custom slider panel (spec §4.1). */
export function FermentPlan({ draft, onSelectPreset, onCustomChange }: FermentPlanProps) {
  const activePreset = matchFermentPreset(draft.ferment);
  const [customOpen, setCustomOpen] = useState(activePreset === null);

  const previewYeast = useMemo(
    () =>
      Object.fromEntries(
        FERMENT_PRESET_ORDER.map((id) => [id, previewYeastG(draft, FERMENT_PRESETS[id].config)]),
      ) as Record<FermentPresetId, number>,
    [draft],
  );

  const { ferment } = draft;
  const roomHours = Math.max(0, ferment.totalHours - ferment.coldHours);

  const updateCustom = (patch: Partial<{ roomHours: number } & FermentConfig>) => {
    const nextRoom = patch.roomHours ?? roomHours;
    const nextCold = patch.coldHours ?? ferment.coldHours;
    onCustomChange({
      totalHours: nextRoom + nextCold,
      roomTempC: patch.roomTempC ?? ferment.roomTempC,
      coldHours: nextCold,
      coldTempC: patch.coldTempC ?? ferment.coldTempC,
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {FERMENT_PRESET_ORDER.map((id) => {
          const preset = FERMENT_PRESETS[id];
          const active = activePreset === id && !customOpen;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                tick();
                setCustomOpen(false);
                onSelectPreset(preset.config);
              }}
              className={`flex flex-col rounded-xl border p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] active:scale-[0.98] ${
                active
                  ? "border-accent-500 bg-accent-50 shadow-sm dark:bg-accent-900/30"
                  : "border-border bg-surface-muted hover:bg-surface-sunken"
              }`}
            >
              <span
                className={`mb-1.5 ${active ? "text-accent-600 dark:text-accent-300" : "text-fg-subtle"}`}
              >
                {PRESET_ICON[id]}
              </span>
              <span className="text-sm font-semibold">{preset.label}</span>
              <span className="mt-0.5 text-xs text-fg-muted">{preset.hint}</span>
              <span className="mt-2 text-xs font-medium text-accent-700 dark:text-accent-300">
                {formatYeastGrams(previewYeast[id])} Hefe
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-expanded={customOpen}
        onClick={() => setCustomOpen((o) => !o)}
        className={`w-full rounded-xl border p-3 text-left text-sm font-medium transition-[background-color,border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] ${
          customOpen
            ? "border-accent-500 bg-accent-50 shadow-sm dark:bg-accent-900/30"
            : "border-border bg-surface-muted hover:bg-surface-sunken"
        }`}
      >
        Eigener Plan
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-[var(--duration-base)] ease-[var(--ease-out-quart)]"
        style={{ gridTemplateRows: customOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden" inert={!customOpen}>
          <div className="space-y-4 rounded-xl border border-border bg-surface-muted p-4">
            <Slider
              label="Raumstunden"
              value={roomHours}
              min={0}
              max={24}
              step={0.5}
              format={formatHours}
              onChange={(v) => updateCustom({ roomHours: v })}
            />
            <Slider
              label="Raumtemperatur"
              value={ferment.roomTempC}
              min={16}
              max={30}
              step={1}
              format={formatTemp}
              onChange={(v) => updateCustom({ roomTempC: v })}
            />
            <Slider
              label="Kühlstunden"
              value={ferment.coldHours}
              min={0}
              max={96}
              step={1}
              format={formatHours}
              onChange={(v) => updateCustom({ coldHours: v })}
            />
            <Slider
              label="Kühltemperatur"
              value={ferment.coldTempC}
              min={1}
              max={8}
              step={1}
              format={formatTemp}
              onChange={(v) => updateCustom({ coldTempC: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
