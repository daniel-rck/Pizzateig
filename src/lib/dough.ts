import type { FermentConfig, YeastConfig, YeastType } from "../types/recipe.ts";

/**
 * Pure dough math (spec §3). No state, no I/O.
 *
 * All percentage inputs are fractions of flour weight (flour = 1.0).
 */

// ── Q10 yeast kinetics (spec §3.2) ──────────────────────────────────────

/**
 * Temperature sensitivity of the trieb rate (rate scales ×Q10 per +10 °C).
 *
 * Calibrated to real cold-ferment experience rather than the textbook baker's
 * Q10 of ~2: at fridge temperature the rate must collapse, not merely third.
 * Q10 = 5.6 gives `fermentRate(4 °C) ≈ 0.063` — i.e. an hour in the fridge
 * contributes only ~6 % of a 20 °C hour — matching the spec's stated intuition
 * that cold gare barely raises the dough. (A plain Q10 of 2 would give ≈0.33,
 * which overstates how much a cold ferment drives rise.)
 *
 * `Q10` and the per-style `K` are the two documented, tunable knobs. Note the
 * trade-off: this value is tuned for the cold range; it consequently overstates
 * warm-range sensitivity, so lower it toward ~2 if you mostly ferment warm.
 */
export const Q10 = 5.6;

/** Reference temperature in °C; `fermentRate(T_REF) === 1`. */
export const T_REF = 20;

/** Dry/instant yeast relative to fresh yeast (spec §3.2). */
export const DRY_FACTOR = 0.33;

/** Relative fermentation rate at a given temperature (Q10 model). */
export function fermentRate(tempC: number): number {
  return Q10 ** ((tempC - T_REF) / 10);
}

/**
 * Effective fermentation hours across all phases. Cold hours contribute little
 * because `fermentRate(4 °C) ≈ 0.063` (spec §3.2): a long fridge proof needs
 * markedly more yeast than a short warm one.
 */
export function effectiveHours(ferment: FermentConfig): number {
  const coldHours = Math.max(0, ferment.coldHours);
  const roomHours = Math.max(0, ferment.totalHours - coldHours);
  return roomHours * fermentRate(ferment.roomTempC) + coldHours * fermentRate(ferment.coldTempC);
}

/**
 * Upper bound for the suggested fresh-yeast fraction (matches the manual
 * override slider's ceiling). Very short, mostly-cold plans would otherwise
 * suggest physically absurd doses (`k / eff` grows without bound as eff → 0).
 */
export const MAX_FRESH_YEAST_PCT = 0.03;

/**
 * Suggested fresh-yeast fraction for the given ferment plan and style constant.
 * `freshYeastPct = k / effHours`, capped at `MAX_FRESH_YEAST_PCT`. Degenerate
 * plans (no effective hours) yield 0.
 */
export function suggestFreshYeastPct(ferment: FermentConfig, k: number): number {
  const eff = effectiveHours(ferment);
  if (!(eff > 0)) return 0;
  return Math.min(MAX_FRESH_YEAST_PCT, k / eff);
}

/**
 * Convert a fresh-yeast fraction to the equivalent amount for another yeast
 * type. Sourdough has its own model (v1.1) and is returned unchanged here.
 */
export function convertYeast(freshPct: number, type: YeastType): number {
  switch (type) {
    case "fresh":
      return freshPct;
    case "dry":
      return freshPct * DRY_FACTOR;
    case "sourdough":
      // Sourdough uses an Anstellgut-% model (v1.1), not the K/Q10 path.
      return freshPct;
  }
}

/**
 * Convert a yeast fraction between types so the physical leavening effect
 * stays equivalent (normalize to fresh terms, then convert to the target).
 */
export function convertYeastBetween(pct: number, from: YeastType, to: YeastType): number {
  const fresh = from === "dry" ? pct / DRY_FACTOR : pct;
  return convertYeast(fresh, to);
}

/**
 * Resolve the yeast fraction to use in the amount calculation, expressed in
 * terms of the selected yeast type.
 *
 * - `manual` mode: the user-set `pct` is used directly (already in type terms).
 * - `auto` mode: derived from the ferment plan and converted to the type.
 */
export function resolveYeastPct(yeast: YeastConfig, ferment: FermentConfig, k: number): number {
  if (yeast.mode === "manual") return Math.max(0, yeast.pct);
  return convertYeast(suggestFreshYeastPct(ferment, k), yeast.type);
}

// ── Amounts by baker's percent (spec §3.1) ──────────────────────────────

export type AmountsInput = {
  ballCount: number;
  ballWeightG: number;
  hydration: number;
  saltPct: number;
  oilPct: number;
  /** Yeast fraction in terms of the selected type (see `resolveYeastPct`). */
  yeastPct: number;
};

export type Amounts = {
  totalDoughG: number;
  flourG: number;
  waterG: number;
  saltG: number;
  oilG: number;
  yeastG: number;
};

const roundG = (x: number): number => Math.round(x);
const roundYeastG = (x: number): number => Math.round(x * 10) / 10;

/**
 * Resolve ingredient weights from baker's percentages.
 * Output rounded to 1 g, yeast to 0.1 g (spec §3.1).
 */
export function computeAmounts(input: AmountsInput): Amounts {
  const { ballCount, ballWeightG, hydration, saltPct, oilPct, yeastPct } = input;
  const totalDough = ballCount * ballWeightG;
  const sumPct = 1 + hydration + saltPct + oilPct + yeastPct;
  // Defensive: callers clamp their inputs, but keep the pure function total.
  const flour = sumPct > 0 ? totalDough / sumPct : 0;

  return {
    totalDoughG: roundG(totalDough),
    flourG: roundG(flour),
    waterG: roundG(flour * hydration),
    saltG: roundG(flour * saltPct),
    oilG: roundG(flour * oilPct),
    yeastG: roundYeastG(flour * yeastPct),
  };
}
