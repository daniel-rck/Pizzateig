import type { Recipe } from "../../types/recipe.ts";
import { getDB, notifyMutation } from "./db.ts";

const STORE = "recipes";

/** Insert or update a recipe and notify subscribers. */
export async function saveRecipe(recipe: Recipe): Promise<void> {
  const db = await getDB();
  await db.put(STORE, recipe);
  notifyMutation(STORE);
}

/** Fetch a single recipe by id. */
export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const db = await getDB();
  return db.get(STORE, id);
}

/** List all recipes, newest first. */
export async function listRecipes(): Promise<Recipe[]> {
  const db = await getDB();
  const recipes = await db.getAllFromIndex(STORE, "byUpdatedAt");
  return recipes.reverse();
}

/** Delete a recipe by id and notify subscribers. */
export async function removeRecipe(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
  notifyMutation(STORE);
}
