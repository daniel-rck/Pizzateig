/**
 * Domain model for the pizza dough calculator (spec §2).
 *
 * All percentage values are fractions relative to flour weight (flour = 1.0).
 * e.g. `hydration: 0.65` means 65 % water, `saltPct: 0.028` means 2.8 % salt.
 */

export type DoughStyle = "napoletana" | "teglia" | "pan" | "newyork" | "custom";

export type YeastType = "fresh" | "dry" | "sourdough";

export type YeastMode = "auto" | "manual";

export type YeastConfig = {
  /** Fresh, dry/instant, or sourdough. */
  type: YeastType;
  /** `auto` = derived from fermentation time/temperature; `manual` = `pct` set directly. */
  mode: YeastMode;
  /** Yeast amount as a fraction of flour weight. Authoritative only in `manual` mode. */
  pct: number;
};

export type FermentConfig = {
  /** Total fermentation time across all phases, in hours. */
  totalHours: number;
  /** Room temperature for the room-temperature phase, in °C. */
  roomTempC: number;
  /** Portion of the total time spent in cold (fridge) fermentation, in hours. */
  coldHours: number;
  /** Fridge temperature, typically 4 °C. */
  coldTempC: number;
};

/** Preferment (biga/poolish). Reserved for v1.1 — not wired into the v1 math. */
export type Preferment = {
  kind: "biga" | "poolish";
  flourPct: number;
  hydration: number;
  hours: number;
};

export type Recipe = {
  /** Primary key (uuid). */
  id: string;
  name: string;
  style: DoughStyle;
  /** Number of dough balls. */
  ballCount: number;
  /** Weight per dough ball, in grams. */
  ballWeightG: number;
  /** Water fraction (0.50–1.00). */
  hydration: number;
  /** Salt fraction (typ. 0.02–0.03). */
  saltPct: number;
  /** Oil fraction (typ. 0–0.03). */
  oilPct: number;
  yeast: YeastConfig;
  ferment: FermentConfig;
  /** Optional preferment (v1.1). */
  preferment: Preferment | null;
  notes: string;
  /** Epoch ms. */
  createdAt: number;
  /** Epoch ms. */
  updatedAt: number;
};
