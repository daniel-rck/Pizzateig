import { useCallback, useMemo, useState } from "react";
import {
  type Amounts,
  computeAmounts,
  resolveYeastPct,
  suggestFreshYeastPct,
} from "../lib/dough.ts";
import { DEFAULT_FERMENT_PRESET, getFermentPreset } from "../lib/ferment.ts";
import { STYLES } from "../lib/styles.ts";
import type { DoughStyle, FermentConfig, Recipe, YeastConfig } from "../types/recipe.ts";

/** The editable subset of a Recipe used while composing one (no id/timestamps). */
export type RecipeDraft = {
  name: string;
  style: DoughStyle;
  ballCount: number;
  ballWeightG: number;
  hydration: number;
  saltPct: number;
  oilPct: number;
  yeast: YeastConfig;
  ferment: FermentConfig;
};

/** A fresh draft seeded from a style's defaults and the default ferment plan. */
export function createDraft(style: DoughStyle = "napoletana"): RecipeDraft {
  const s = STYLES[style];
  return {
    name: "",
    style,
    ballCount: 4,
    ballWeightG: s.ballWeightG,
    hydration: s.hydration,
    saltPct: s.saltPct,
    oilPct: s.oilPct,
    yeast: { type: "fresh", mode: "auto", pct: 0 },
    ferment: { ...getFermentPreset(DEFAULT_FERMENT_PRESET).config },
  };
}

/** Switching style overwrites the style-derived defaults; counts/plan are kept. */
export function applyStyle(draft: RecipeDraft, style: DoughStyle): RecipeDraft {
  const s = STYLES[style];
  return {
    ...draft,
    style,
    hydration: s.hydration,
    saltPct: s.saltPct,
    oilPct: s.oilPct,
    ballWeightG: s.ballWeightG,
  };
}

/** Materialize a draft into a persistable Recipe. */
export function draftToRecipe(
  draft: RecipeDraft,
  opts: { id?: string; createdAt?: number; notes?: string } = {},
): Recipe {
  const now = Date.now();
  return {
    id: opts.id ?? crypto.randomUUID(),
    name: draft.name.trim() || "Unbenannt",
    style: draft.style,
    ballCount: draft.ballCount,
    ballWeightG: draft.ballWeightG,
    hydration: draft.hydration,
    saltPct: draft.saltPct,
    oilPct: draft.oilPct,
    yeast: { ...draft.yeast },
    ferment: { ...draft.ferment },
    preferment: null,
    notes: opts.notes ?? "",
    createdAt: opts.createdAt ?? now,
    updatedAt: now,
  };
}

/** Extract an editable draft from a stored Recipe. */
export function recipeToDraft(recipe: Recipe): RecipeDraft {
  return {
    name: recipe.name,
    style: recipe.style,
    ballCount: recipe.ballCount,
    ballWeightG: recipe.ballWeightG,
    hydration: recipe.hydration,
    saltPct: recipe.saltPct,
    oilPct: recipe.oilPct,
    yeast: { ...recipe.yeast },
    ferment: { ...recipe.ferment },
  };
}

export type DraftComputation = {
  amounts: Amounts;
  /** Auto fresh-yeast suggestion for the current plan, regardless of mode. */
  suggestedFreshPct: number;
  /** Resolved yeast fraction used in the amounts, in the selected type's terms. */
  yeastPct: number;
  /** The style's trieb-dose constant. */
  k: number;
};

/** Pure live computation: ferment plan + style → amounts and yeast figures. */
export function computeDraft(draft: RecipeDraft): DraftComputation {
  const k = STYLES[draft.style].k;
  const suggestedFreshPct = suggestFreshYeastPct(draft.ferment, k);
  const yeastPct = resolveYeastPct(draft.yeast, draft.ferment, k);
  const amounts = computeAmounts({
    ballCount: draft.ballCount,
    ballWeightG: draft.ballWeightG,
    hydration: draft.hydration,
    saltPct: draft.saltPct,
    oilPct: draft.oilPct,
    yeastPct,
  });
  return { amounts, suggestedFreshPct, yeastPct, k };
}

export type UseRecipeDraft = {
  draft: RecipeDraft;
  computation: DraftComputation;
  update: (patch: Partial<RecipeDraft>) => void;
  setStyle: (style: DoughStyle) => void;
  setFerment: (ferment: FermentConfig) => void;
  setYeast: (patch: Partial<YeastConfig>) => void;
  reset: (next?: RecipeDraft) => void;
};

/** Draft state with live-derived amounts (no "calculate" button). */
export function useRecipeDraft(initial?: RecipeDraft): UseRecipeDraft {
  const [draft, setDraft] = useState<RecipeDraft>(() => initial ?? createDraft());

  const update = useCallback((patch: Partial<RecipeDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const setStyle = useCallback((style: DoughStyle) => {
    setDraft((d) => applyStyle(d, style));
  }, []);

  const setFerment = useCallback((ferment: FermentConfig) => {
    setDraft((d) => ({ ...d, ferment }));
  }, []);

  const setYeast = useCallback((patch: Partial<YeastConfig>) => {
    setDraft((d) => ({ ...d, yeast: { ...d.yeast, ...patch } }));
  }, []);

  const reset = useCallback((next?: RecipeDraft) => {
    setDraft(next ?? createDraft());
  }, []);

  const computation = useMemo(() => computeDraft(draft), [draft]);

  return { draft, computation, update, setStyle, setFerment, setYeast, reset };
}
