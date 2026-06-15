import type { DoughStyle } from "../types/recipe.ts";

/**
 * Per-style defaults (spec §2 / §3.2).
 *
 * `k` is the trieb-dose constant of the Q10 yeast model
 * (`freshYeastPct = k / effHours`), anchored to ONE canonical reference recipe
 * per style: `k = referenceFreshYeastPct * effHoursOfReference`. Anchoring at
 * the model's reference temperature (20 °C, so `rate = 1`) keeps the back-calc
 * trivial: `k = referenceFreshYeastPct * referenceHours`.
 *
 * The Napoletana anchor is taken from the spec (0.20 % fresh @ 8 h / 20 °C →
 * k = 0.002 × 8 = 0.016). The other styles are anchored to plausible canonical
 * room-temperature references; per the DoD these `k` values are to be
 * plausibilized against 2–3 own bakes and nudged if needed (a single, documented
 * knob per style).
 */
export type StyleDefaults = {
  /** German display label. */
  label: string;
  /** Water fraction. */
  hydration: number;
  /** Salt fraction. */
  saltPct: number;
  /** Oil fraction. */
  oilPct: number;
  /** Default ball weight in grams. */
  ballWeightG: number;
  /** Suggested ball-weight presets in grams. */
  ballPresetsG: number[];
  /** Trieb-dose constant for the Q10 yeast model. */
  k: number;
};

export const STYLES: Record<DoughStyle, StyleDefaults> = {
  napoletana: {
    label: "Napoletana",
    hydration: 0.62,
    saltPct: 0.028,
    oilPct: 0,
    ballWeightG: 260,
    ballPresetsG: [230, 250, 280, 320],
    // Reference: 0.20 % fresh @ 8 h / 20 °C (spec §3.2).
    k: 0.016,
  },
  teglia: {
    label: "Teglia",
    hydration: 0.8,
    saltPct: 0.025,
    oilPct: 0.02,
    ballWeightG: 300,
    ballPresetsG: [250, 300, 350, 400],
    // Reference: ~0.25 % fresh @ 8 h / 20 °C.
    k: 0.02,
  },
  newyork: {
    label: "New York",
    hydration: 0.62,
    saltPct: 0.025,
    oilPct: 0.02,
    ballWeightG: 280,
    ballPresetsG: [250, 280, 320, 360],
    // Reference: ~0.30 % fresh @ 8 h / 20 °C.
    k: 0.024,
  },
  pan: {
    label: "Pan",
    hydration: 0.7,
    saltPct: 0.022,
    oilPct: 0.03,
    ballWeightG: 320,
    ballPresetsG: [280, 320, 400, 450],
    // Reference: ~0.35 % fresh @ 8 h / 20 °C.
    k: 0.028,
  },
  custom: {
    label: "Custom",
    hydration: 0.65,
    saltPct: 0.025,
    oilPct: 0.01,
    ballWeightG: 280,
    ballPresetsG: [230, 260, 280, 320],
    // Baseline anchor (mirrors Napoletana) until tuned per recipe.
    k: 0.016,
  },
};

export const DOUGH_STYLE_ORDER: DoughStyle[] = ["napoletana", "teglia", "newyork", "pan", "custom"];
