/** Locale-aware formatting helpers for the German UI. */

const gramsFmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const yeastFmt = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const pctFmt = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Whole grams, e.g. "1.234 g". */
export function formatGrams(value: number): string {
  return `${gramsFmt.format(value)} g`;
}

/** Grams with one decimal (yeast), e.g. "1,2 g". */
export function formatYeastGrams(value: number): string {
  return `${yeastFmt.format(value)} g`;
}

/** A fraction (0.65) as a percent string, e.g. "65 %". */
export function formatPercent(fraction: number): string {
  return `${pctFmt.format(fraction * 100)} %`;
}

/** Hours, e.g. "18 h" or "1,5 h". */
export function formatHours(hours: number): string {
  return `${pctFmt.format(hours)} h`;
}

/** Temperature, e.g. "20 °C". */
export function formatTemp(tempC: number): string {
  return `${gramsFmt.format(tempC)} °C`;
}
