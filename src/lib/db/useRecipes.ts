import type { Recipe } from "../../types/recipe.ts";
import { listRecipes } from "./recipes.ts";
import { type LiveQueryResult, useLiveQuery } from "./useLiveQuery.ts";

/** Reactive list of all stored recipes, newest first. */
export function useRecipes(): LiveQueryResult<Recipe[]> {
  return useLiveQuery("recipes", listRecipes);
}
