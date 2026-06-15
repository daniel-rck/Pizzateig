import { describe, expect, it } from "vitest";
import { STYLES } from "../lib/styles.ts";
import {
  applyStyle,
  computeDraft,
  createDraft,
  draftToRecipe,
  recipeToDraft,
} from "./recipeDraft.ts";

describe("createDraft", () => {
  it("seeds style defaults and the default ferment plan", () => {
    const d = createDraft("napoletana");
    expect(d.style).toBe("napoletana");
    expect(d.hydration).toBe(STYLES.napoletana.hydration);
    expect(d.ballWeightG).toBe(STYLES.napoletana.ballWeightG);
    expect(d.yeast).toEqual({ type: "fresh", mode: "auto", pct: 0 });
    expect(d.ferment.coldHours).toBeGreaterThan(0);
  });
});

describe("applyStyle", () => {
  it("overwrites style-derived fields but keeps count and plan", () => {
    const d = { ...createDraft("napoletana"), ballCount: 6, name: "Mein Teig" };
    const next = applyStyle(d, "teglia");
    expect(next.style).toBe("teglia");
    expect(next.hydration).toBe(STYLES.teglia.hydration);
    expect(next.oilPct).toBe(STYLES.teglia.oilPct);
    expect(next.ballWeightG).toBe(STYLES.teglia.ballWeightG);
    // preserved
    expect(next.ballCount).toBe(6);
    expect(next.name).toBe("Mein Teig");
    expect(next.ferment).toEqual(d.ferment);
  });
});

describe("computeDraft", () => {
  it("derives live amounts and a fresh-yeast suggestion", () => {
    const d = {
      ...createDraft("napoletana"),
      ballCount: 4,
      ballWeightG: 250,
      ferment: { totalHours: 8, roomTempC: 20, coldHours: 0, coldTempC: 4 },
    };
    const c = computeDraft(d);
    expect(c.amounts.totalDoughG).toBe(1000);
    expect(c.suggestedFreshPct).toBeCloseTo(0.002, 6);
    // auto + fresh → resolved equals the suggestion
    expect(c.yeastPct).toBeCloseTo(0.002, 6);
  });

  it("honors a manual yeast override", () => {
    const d = {
      ...createDraft("napoletana"),
      yeast: { type: "fresh" as const, mode: "manual" as const, pct: 0.01 },
    };
    expect(computeDraft(d).yeastPct).toBe(0.01);
  });
});

describe("draft <-> recipe", () => {
  it("round-trips the editable fields", () => {
    const d = { ...createDraft("pan"), name: "Detroit", ballCount: 2 };
    const recipe = draftToRecipe(d);
    expect(recipe.id).toBeTruthy();
    expect(recipe.name).toBe("Detroit");
    expect(recipe.preferment).toBeNull();
    expect(recipeToDraft(recipe)).toEqual(d);
  });

  it("defaults a blank name and preserves id/createdAt when provided", () => {
    const d = { ...createDraft(), name: "   " };
    const recipe = draftToRecipe(d, { id: "fixed-id", createdAt: 123 });
    expect(recipe.name).toBe("Unbenannt");
    expect(recipe.id).toBe("fixed-id");
    expect(recipe.createdAt).toBe(123);
    expect(recipe.updatedAt).toBeGreaterThanOrEqual(recipe.createdAt);
  });
});
