import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { parseShareHash } from "../lib/share.ts";
import type { DoughStyle, Recipe } from "../types/recipe.ts";
import { createDraft, type RecipeDraft, recipeToDraft, useRecipeDraft } from "./recipeDraft.ts";

type DraftContextValue = ReturnType<typeof useRecipeDraft> & {
  /** True when the current draft came from a shared `#r=` link. */
  imported: boolean;
  /** Dismiss the import banner and drop the hash from the URL. */
  dismissImport: () => void;
  /** Id of the stored recipe the draft was loaded from (for in-place updates). */
  currentRecipeId: string | null;
  /** Load a stored recipe into the draft and switch to edit-in-place mode. */
  loadRecipe: (recipe: Recipe) => void;
  /** Start a fresh draft, detached from any stored recipe or share import. */
  startNewRecipe: (style?: DoughStyle) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

function readHashDraft(): RecipeDraft | null {
  if (typeof window === "undefined") return null;
  return parseShareHash(window.location.hash);
}

/** Drop a `#r=` share hash so a reload can't re-import a stale draft. */
function clearShareHash(): void {
  if (typeof window !== "undefined" && window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const hashDraft = useMemo(readHashDraft, []);
  const draftApi = useRecipeDraft(hashDraft ?? undefined);
  const [imported, setImported] = useState(hashDraft !== null);
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null);

  const dismissImport = useCallback(() => {
    setImported(false);
    clearShareHash();
  }, []);

  const loadRecipe = useCallback(
    (recipe: Recipe) => {
      draftApi.reset(recipeToDraft(recipe));
      setCurrentRecipeId(recipe.id);
      setImported(false);
      clearShareHash();
    },
    [draftApi.reset],
  );

  const startNewRecipe = useCallback(
    (style?: DoughStyle) => {
      draftApi.reset(createDraft(style));
      setCurrentRecipeId(null);
      setImported(false);
      clearShareHash();
    },
    [draftApi.reset],
  );

  const value = useMemo<DraftContextValue>(
    () => ({
      ...draftApi,
      imported,
      dismissImport,
      currentRecipeId,
      loadRecipe,
      startNewRecipe,
    }),
    [draftApi, imported, dismissImport, currentRecipeId, loadRecipe, startNewRecipe],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within a DraftProvider");
  return ctx;
}
