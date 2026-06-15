import { Minus, Plus } from "lucide-react";
import { tick } from "../../../lib/haptics.ts";

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Formats the displayed value (e.g. "4" or "260 g"). */
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

/** Big-target − N + stepper. No keyboard, exact values (spec §4.2). */
export function Stepper({ label, value, min, max, step, format, onChange }: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 1000) / 1000));
  const change = (next: number) => {
    const c = clamp(next);
    if (c !== value) {
      tick();
      onChange(c);
    }
  };

  const display = format ? format(value) : String(value);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-fg">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label} verringern`}
          disabled={value <= min}
          onClick={() => change(value - step)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-muted text-fg transition-colors hover:bg-surface-sunken disabled:opacity-40"
        >
          <Minus size={20} aria-hidden="true" />
        </button>
        <output className="min-w-20 text-center text-lg font-semibold tabular-nums">
          {display}
        </output>
        <button
          type="button"
          aria-label={`${label} erhöhen`}
          disabled={value >= max}
          onClick={() => change(value + step)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-muted text-fg transition-colors hover:bg-surface-sunken disabled:opacity-40"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
