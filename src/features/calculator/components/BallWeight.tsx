import { tick } from "../../../lib/haptics.ts";
import { Chip } from "../../../lib/ui/index.ts";
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
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Ballgewicht-Vorgaben</legend>
        {presets.map((preset) => {
          const active = preset === value;
          return (
            <Chip
              key={preset}
              active={active}
              onClick={() => {
                if (!active) {
                  tick();
                  onChange(preset);
                }
              }}
            >
              {preset} g
            </Chip>
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
