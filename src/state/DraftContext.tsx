import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { parseShareHash } from "../lib/share.ts";
import type { Recipe } from "../types/recipe.ts";
import { type RecipeDraft, recipeToDraft, useRecipeDraft } from "./recipeDraft.ts";

type DraftContextValue = ReturnType<typeof useRecipeDraft> & {
  /** True when the current draft came from a shared `#r=` link. */
  imported: boolean;
  /** Dismiss the import banner and drop the hash from the URL. */
  dismissImport: () => void;
  /** Id of the stored recipe the draft was loaded from (for in-place updates). */
  currentRecipeId: string | null;
  /** Load a stored recipe into the draft and switch to edit-in-place mode. */
  loadRecipe: (recipe: Recipe) => void;
  /** Forget any tracked recipe id (e.g. after starting fresh). */
  clearCurrentRecipe: () => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

function readHashDraft(): RecipeDraft | null {
  if (typeof window === "undefined") return null;
  return parseShareHash(window.location.hash);
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const hashDraft = useMemo(readHashDraft, []);
  const draftApi = useRecipeDraft(hashDraft ?? undefined);
  const [imported, setImported] = useState(hashDraft !== null);
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null);

  const dismissImport = useCallback(() => {
    setImported(false);
    if (typeof window !== "undefined" && window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const loadRecipe = useCallback(
    (recipe: Recipe) => {
      draftApi.reset(recipeToDraft(recipe));
      setCurrentRecipeId(recipe.id);
      setImported(false);
    },
    [draftApi.reset],
  );

  const clearCurrentRecipe = useCallback(() => setCurrentRecipeId(null), []);

  const value = useMemo<DraftContextValue>(
    () => ({
      ...draftApi,
      imported,
      dismissImport,
      currentRecipeId,
      loadRecipe,
      clearCurrentRecipe,
    }),
    [draftApi, imported, dismissImport, currentRecipeId, loadRecipe, clearCurrentRecipe],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within a DraftProvider");
  return ctx;
}
