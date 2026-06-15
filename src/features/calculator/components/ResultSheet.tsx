import { ChevronUp } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Amounts } from "../../../lib/dough.ts";
import { formatGrams, formatHours, formatPercent, formatTemp } from "../../../lib/format.ts";
import type { FermentConfig, YeastType } from "../../../types/recipe.ts";

type ResultSheetProps = {
  amounts: Amounts;
  ferment: FermentConfig;
  yeastPct: number;
  yeastType: YeastType;
  yeastIsAuto: boolean;
  actions?: ReactNode;
};

const YEAST_NAME: Record<YeastType, string> = {
  fresh: "Frischhefe",
  dry: "Trockenhefe",
  sourdough: "Sauerteig",
};

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={strong ? "font-medium text-fg" : "text-fg-muted"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-semibold" : "font-medium"}`}>{value}</span>
    </div>
  );
}

/** Build the fermentation timeline steps from the plan. */
function timelineSteps(ferment: FermentConfig): string[] {
  const roomHours = Math.max(0, ferment.totalHours - ferment.coldHours);
  const steps = ["Teig kneten"];
  if (roomHours > 0) {
    steps.push(`Raumgare ${formatHours(roomHours)} bei ${formatTemp(ferment.roomTempC)}`);
  }
  if (ferment.coldHours > 0) {
    steps.push(`Kühlgare ${formatHours(ferment.coldHours)} bei ${formatTemp(ferment.coldTempC)}`);
  }
  steps.push("Formen & backen");
  return steps;
}

/** Sticky bottom result sheet: collapsed one-liner, expanded full table (spec §4.3). */
export function ResultSheet({
  amounts,
  ferment,
  yeastPct,
  yeastType,
  yeastIsAuto,
  actions,
}: ResultSheetProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 md:bottom-0">
      <div className="container mx-auto max-w-4xl px-4 md:px-4">
        <div className="overflow-hidden rounded-t-xl border border-border bg-surface/98 shadow-lg backdrop-blur">
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Ergebnis einklappen" : "Ergebnis aufziehen"}
            onClick={() => setExpanded((e) => !e)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3"
          >
            <span className="flex items-baseline gap-3 text-sm">
              <span className="font-semibold">{formatGrams(amounts.totalDoughG)} Teig</span>
              <span className="text-fg-muted">
                {formatGrams(amounts.flourG)} Mehl · {formatGrams(amounts.waterG)} Wasser
              </span>
            </span>
            <ChevronUp
              size={18}
              aria-hidden="true"
              className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>

          {expanded ? (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto border-t border-border px-4 py-3 text-sm">
              <div>
                <Row label="Gesamtteig" value={formatGrams(amounts.totalDoughG)} strong />
                <Row label="Mehl" value={formatGrams(amounts.flourG)} />
                <Row label="Wasser" value={formatGrams(amounts.waterG)} />
                <Row label="Salz" value={formatGrams(amounts.saltG)} />
                {amounts.oilG > 0 ? <Row label="Öl" value={formatGrams(amounts.oilG)} /> : null}
                <Row
                  label={YEAST_NAME[yeastType]}
                  value={`${formatGrams(amounts.yeastG)} · ${formatPercent(yeastPct)}`}
                />
                {yeastIsAuto ? (
                  <p className="pt-1 text-xs text-fg-subtle">Hefe: Vorschlag, justierbar.</p>
                ) : (
                  <p className="pt-1 text-xs text-fg-subtle">Hefe: manuell gesetzt.</p>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-medium text-fg">Ablauf</h3>
                <ol className="space-y-1">
                  {timelineSteps(ferment).map((step, i) => (
                    <li key={step} className="flex gap-2 text-fg-muted">
                      <span className="font-semibold text-accent-600">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
