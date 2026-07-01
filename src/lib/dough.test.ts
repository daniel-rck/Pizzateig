import { describe, expect, it } from "vitest";
import type { FermentConfig } from "../types/recipe.ts";
import {
  computeAmounts,
  convertYeast,
  convertYeastBetween,
  DRY_FACTOR,
  effectiveHours,
  fermentRate,
  MAX_FRESH_YEAST_PCT,
  Q10,
  resolveYeastPct,
  suggestFreshYeastPct,
  T_REF,
} from "./dough.ts";
import { STYLES } from "./styles.ts";

const ferment = (over: Partial<FermentConfig> = {}): FermentConfig => ({
  totalHours: 8,
  roomTempC: 20,
  coldHours: 0,
  coldTempC: 4,
  ...over,
});

describe("fermentRate (Q10)", () => {
  it("equals 1 at the reference temperature", () => {
    expect(fermentRate(T_REF)).toBe(1);
  });

  it("scales by ×Q10 per +10 °C and ÷Q10 per −10 °C", () => {
    expect(fermentRate(T_REF + 10)).toBeCloseTo(Q10, 10);
    expect(fermentRate(T_REF - 10)).toBeCloseTo(1 / Q10, 10);
  });

  it("at 4 °C collapses to ~0.063× of a room hour (cold gare barely raises)", () => {
    // Q10 = 5.6 is calibrated so 5.6^((4-20)/10) ≈ 0.063.
    expect(fermentRate(4)).toBeCloseTo(0.063, 2);
    expect(fermentRate(4)).toBeLessThan(0.1);
  });
});

describe("effectiveHours", () => {
  it("equals the room hours at the reference temperature", () => {
    expect(effectiveHours(ferment({ totalHours: 8, roomTempC: 20 }))).toBeCloseTo(8, 10);
  });

  it("combines room and cold phases (spec §3.2 example)", () => {
    // 2 h @ 22 °C room + 22 h @ 4 °C cold.
    const eff = effectiveHours(ferment({ totalHours: 24, coldHours: 22, roomTempC: 22 }));
    const expected = 2 * fermentRate(22) + 22 * fermentRate(4);
    expect(eff).toBeCloseTo(expected, 10);
  });

  it("treats cold hours exceeding total as all-cold (no negative room hours)", () => {
    const eff = effectiveHours(ferment({ totalHours: 10, coldHours: 99, coldTempC: 4 }));
    expect(eff).toBeCloseTo(99 * fermentRate(4), 10);
  });
});

describe("suggestFreshYeastPct", () => {
  it("reproduces the Napoletana anchor: 0.20 % fresh @ 8 h / 20 °C", () => {
    const pct = suggestFreshYeastPct(
      ferment({ totalHours: 8, roomTempC: 20 }),
      STYLES.napoletana.k,
    );
    expect(pct).toBeCloseTo(0.002, 6);
  });

  it("is monotonically decreasing in time (more time → less yeast)", () => {
    const k = STYLES.napoletana.k;
    const short = suggestFreshYeastPct(ferment({ totalHours: 4 }), k);
    const mid = suggestFreshYeastPct(ferment({ totalHours: 8 }), k);
    const long = suggestFreshYeastPct(ferment({ totalHours: 24 }), k);
    expect(short).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(long);
  });

  it("is monotonically decreasing in temperature (more warmth → less yeast)", () => {
    const k = STYLES.napoletana.k;
    const cool = suggestFreshYeastPct(ferment({ roomTempC: 18 }), k);
    const warm = suggestFreshYeastPct(ferment({ roomTempC: 24 }), k);
    const hot = suggestFreshYeastPct(ferment({ roomTempC: 30 }), k);
    expect(cool).toBeGreaterThan(warm);
    expect(warm).toBeGreaterThan(hot);
  });

  it("returns 0 for a degenerate plan with no effective hours", () => {
    expect(suggestFreshYeastPct(ferment({ totalHours: 0, coldHours: 0 }), 0.016)).toBe(0);
  });

  it("caps the suggestion for very short cold plans at MAX_FRESH_YEAST_PCT", () => {
    // 2 h all-cold at 4 °C → tiny effective hours; uncapped this would be ~13 %.
    const pct = suggestFreshYeastPct(
      ferment({ totalHours: 2, coldHours: 2, coldTempC: 4 }),
      STYLES.napoletana.k,
    );
    expect(pct).toBe(MAX_FRESH_YEAST_PCT);
  });

  it("needs much more yeast for a cold overnight plan than a warm room plan", () => {
    const k = STYLES.napoletana.k;
    const warm8h = suggestFreshYeastPct(ferment({ totalHours: 8, roomTempC: 24 }), k);
    const cold18h = suggestFreshYeastPct(
      ferment({ totalHours: 18, coldHours: 18, coldTempC: 4 }),
      k,
    );
    // 18 h cold at 4 °C has tiny effective hours → more yeast than a warm 8 h.
    expect(cold18h).toBeGreaterThan(warm8h);
  });
});

describe("convertYeast", () => {
  it("leaves fresh yeast unchanged", () => {
    expect(convertYeast(0.01, "fresh")).toBe(0.01);
  });

  it("scales dry yeast by the 0.33 factor", () => {
    expect(convertYeast(0.012, "dry")).toBeCloseTo(0.012 * DRY_FACTOR, 10);
  });
});

describe("convertYeastBetween", () => {
  it("converts fresh to dry and back without drift", () => {
    const dry = convertYeastBetween(0.01, "fresh", "dry");
    expect(dry).toBeCloseTo(0.01 * DRY_FACTOR, 10);
    expect(convertYeastBetween(dry, "dry", "fresh")).toBeCloseTo(0.01, 10);
  });

  it("is the identity for a same-type conversion", () => {
    expect(convertYeastBetween(0.007, "fresh", "fresh")).toBeCloseTo(0.007, 10);
    expect(convertYeastBetween(0.003, "dry", "dry")).toBeCloseTo(0.003, 10);
  });
});

describe("resolveYeastPct", () => {
  it("uses the manual pct verbatim in manual mode", () => {
    const pct = resolveYeastPct(
      { type: "dry", mode: "manual", pct: 0.005 },
      ferment(),
      STYLES.napoletana.k,
    );
    expect(pct).toBe(0.005);
  });

  it("clamps negative manual pct to 0", () => {
    const pct = resolveYeastPct(
      { type: "fresh", mode: "manual", pct: -1 },
      ferment(),
      STYLES.napoletana.k,
    );
    expect(pct).toBe(0);
  });

  it("derives and type-converts in auto mode", () => {
    const fresh = resolveYeastPct(
      { type: "fresh", mode: "auto", pct: 0 },
      ferment({ totalHours: 8, roomTempC: 20 }),
      STYLES.napoletana.k,
    );
    const dry = resolveYeastPct(
      { type: "dry", mode: "auto", pct: 0 },
      ferment({ totalHours: 8, roomTempC: 20 }),
      STYLES.napoletana.k,
    );
    expect(fresh).toBeCloseTo(0.002, 6);
    expect(dry).toBeCloseTo(0.002 * DRY_FACTOR, 6);
  });
});

describe("computeAmounts", () => {
  it("flour + water + salt + oil + yeast equals the total dough (raw identity)", () => {
    const input = {
      ballCount: 4,
      ballWeightG: 250,
      hydration: 0.65,
      saltPct: 0.028,
      oilPct: 0.02,
      yeastPct: 0.003,
    };
    const total = input.ballCount * input.ballWeightG;
    const sumPct = 1 + input.hydration + input.saltPct + input.oilPct + input.yeastPct;
    const flour = total / sumPct;
    const rawSum =
      flour +
      flour * input.hydration +
      flour * input.saltPct +
      flour * input.oilPct +
      flour * input.yeastPct;
    expect(rawSum).toBeCloseTo(total, 6);
  });

  it("totals the right dough weight and rounds within 1.5 g", () => {
    const a = computeAmounts({
      ballCount: 3,
      ballWeightG: 280,
      hydration: 0.62,
      saltPct: 0.028,
      oilPct: 0,
      yeastPct: 0.002,
    });
    expect(a.totalDoughG).toBe(840);
    const sum = a.flourG + a.waterG + a.saltG + a.oilG + a.yeastG;
    expect(Math.abs(sum - a.totalDoughG)).toBeLessThanOrEqual(1.5);
  });

  it("rounds bulk ingredients to whole grams and yeast to 0.1 g", () => {
    const a = computeAmounts({
      ballCount: 2,
      ballWeightG: 333,
      hydration: 0.7,
      saltPct: 0.025,
      oilPct: 0.015,
      yeastPct: 0.0037,
    });
    expect(Number.isInteger(a.flourG)).toBe(true);
    expect(Number.isInteger(a.waterG)).toBe(true);
    expect(Number.isInteger(a.saltG)).toBe(true);
    expect(Number.isInteger(a.oilG)).toBe(true);
    // yeast has at most one decimal place.
    expect(Math.round(a.yeastG * 10)).toBeCloseTo(a.yeastG * 10, 10);
  });

  it("water equals flour at 100 % hydration (extreme case)", () => {
    const a = computeAmounts({
      ballCount: 1,
      ballWeightG: 500,
      hydration: 1.0,
      saltPct: 0,
      oilPct: 0,
      yeastPct: 0,
    });
    expect(a.waterG).toBe(a.flourG);
    expect(a.flourG).toBe(250);
  });

  it("stays finite when the percentage sum is driven non-positive", () => {
    const a = computeAmounts({
      ballCount: 4,
      ballWeightG: 250,
      hydration: -2,
      saltPct: 0,
      oilPct: 0,
      yeastPct: 0,
    });
    expect(a.flourG).toBe(0);
    for (const v of Object.values(a)) expect(Number.isFinite(v)).toBe(true);
  });

  it("matches hand-computed baker's percent for a Napoletana batch", () => {
    const a = computeAmounts({
      ballCount: 4,
      ballWeightG: 250,
      hydration: 0.62,
      saltPct: 0.028,
      oilPct: 0,
      yeastPct: 0.002,
    });
    // total 1000 g, sumPct = 1.65, flour ≈ 606.06 g
    expect(a.totalDoughG).toBe(1000);
    expect(a.flourG).toBe(606);
    expect(a.waterG).toBe(376); // 606.06 * 0.62
    expect(a.saltG).toBe(17); // 606.06 * 0.028
  });
});
