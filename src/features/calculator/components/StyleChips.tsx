import { tick } from "../../../lib/haptics.ts";
import { DOUGH_STYLE_ORDER, STYLES } from "../../../lib/styles.ts";
import type { DoughStyle } from "../../../types/recipe.ts";

type StyleChipsProps = {
  value: DoughStyle;
  onChange: (style: DoughStyle) => void;
};

/** Horizontal-scroll style chips; a tap applies the style's defaults. */
export function StyleChips({ value, onChange }: StyleChipsProps) {
  return (
    <fieldset className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1" aria-label="Teigstil">
      {DOUGH_STYLE_ORDER.map((style) => {
        const active = style === value;
        return (
          <button
            key={style}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (!active) {
                tick();
                onChange(style);
              }
            }}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent-600 text-white"
                : "bg-surface-muted text-fg-muted hover:bg-surface-sunken"
            }`}
          >
            {STYLES[style].label}
          </button>
        );
      })}
    </fieldset>
  );
}
