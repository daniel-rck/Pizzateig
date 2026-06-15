import type { FermentConfig, YeastConfig, YeastType } from "../types/recipe.ts";

/**
 * Pure dough math (spec §3). No state, no I/O.
 *
 * All percentage inputs are fractions of flour weight (flour = 1.0).
 */

// ── Q10 yeast kinetics (spec §3.2) ──────────────────────────────────────

/** Q10 trieb rate doubles per ~10 °C (baker's rule of thumb). */
export const Q10 = 2;

/** Reference temperature in °C; `fermentRate(T_REF) === 1`. */
export const T_REF = 20;

/** Dry/instant yeast relative to fresh yeast (spec §3.2). */
export const DRY_FACTOR = 0.33;

/** Relative fermentation rate at a given temperature (Q10 model). */
export function fermentRate(tempC: number): number {
  return Q10 ** ((tempC - T_REF) / 10);
}

/**
 * Effective fermentation hours across all phases.
 *
 * With the spec's baker Q10 = 2 / T_REF = 20, cold gare still slows markedly:
 * `fermentRate(4 °C) ≈ 0.33`, so an hour in the fridge counts ~a third of a
 * room hour. (The spec's prose figure of ≈0.063 is inconsistent with Q10 = 2 —
 * it would require Q10 ≈ 5.6 — so the normative formula is followed here.)
 * `Q10` and the per-style `K` are the two documented, tunable knobs; raise
 * `Q10` if cold ferments should contribute even less (spec §3.2 tunability).
 */
export function effectiveHours(ferment: FermentConfig): number {
  const coldHours = Math.max(0, ferment.coldHours);
  const roomHours = Math.max(0, ferment.totalHours - coldHours);
  return roomHours * fermentRate(ferment.roomTempC) + coldHours * fermentRate(ferment.coldTempC);
}

/**
 * Suggested fresh-yeast fraction for the given ferment plan and style constant.
 * `freshYeastPct = k / effHours`. Degenerate plans (no effective hours) yield 0.
 */
export function suggestFreshYeastPct(ferment: FermentConfig, k: number): number {
  const eff = effectiveHours(ferment);
  if (!(eff > 0)) return 0;
  return k / eff;
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
  const flour = totalDough / sumPct;

  return {
    totalDoughG: roundG(totalDough),
    flourG: roundG(flour),
    waterG: roundG(flour * hydration),
    saltG: roundG(flour * saltPct),
    oilG: roundG(flour * oilPct),
    yeastG: roundYeastG(flour * yeastPct),
  };
}
