import { useId } from "react";
import { tick } from "../../../lib/haptics.ts";

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

/** Labeled range slider — approximate inputs where precision is irrelevant. */
export function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  const id = useId();
  const display = format ? format(value) : String(value);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        <span className="text-sm font-semibold tabular-nums text-accent-700 dark:text-accent-300">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          tick(5);
          onChange(Number(e.target.value));
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-sunken accent-accent-600"
      />
    </div>
  );
}
