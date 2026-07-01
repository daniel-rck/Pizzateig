import { tick } from "../../../lib/haptics.ts";
import { DOUGH_STYLE_ORDER, STYLES } from "../../../lib/styles.ts";
import { Chip } from "../../../lib/ui/index.ts";
import type { DoughStyle } from "../../../types/recipe.ts";

type StyleChipsProps = {
  value: DoughStyle;
  onChange: (style: DoughStyle) => void;
};

/** Style chips; a tap applies the style's defaults. Wraps fully — never clipped. */
export function StyleChips({ value, onChange }: StyleChipsProps) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Teigstil</legend>
      {DOUGH_STYLE_ORDER.map((style) => {
        const active = style === value;
        return (
          <Chip
            key={style}
            active={active}
            onClick={() => {
              if (!active) {
                tick();
                onChange(style);
              }
            }}
          >
            {STYLES[style].label}
          </Chip>
        );
      })}
    </fieldset>
  );
}
