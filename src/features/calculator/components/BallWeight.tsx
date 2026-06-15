import { tick } from "../../../lib/haptics.ts";
import { Stepper } from "./Stepper.tsx";

type BallWeightProps = {
  value: number;
  presets: number[];
  onChange: (value: number) => void;
};

/** Ball-weight presets per style plus a fine stepper (spec §4.1). */
export function BallWeight({ value, presets, onChange }: BallWeightProps) {
  return (
    <div className="space-y-3">
      <fieldset className="flex flex-wrap gap-2" aria-label="Ballgewicht-Vorgaben">
        {presets.map((preset) => {
          const active = preset === value;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (!active) {
                  tick();
                  onChange(preset);
                }
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-600 text-white"
                  : "bg-surface-muted text-fg-muted hover:bg-surface-sunken"
              }`}
            >
              {preset} g
            </button>
          );
        })}
      </fieldset>
      <Stepper
        label="Ballgewicht"
        value={value}
        min={100}
        max={1000}
        step={5}
        format={(v) => `${v} g`}
        onChange={onChange}
      />
    </div>
  );
}
