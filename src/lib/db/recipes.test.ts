import { beforeEach, describe, expect, it } from "vitest";
import { createDraft, draftToRecipe } from "../../state/recipeDraft.ts";
import { clearAll } from "./db.ts";
import { getRecipe, listRecipes, removeRecipe, saveRecipe } from "./recipes.ts";

const makeRecipe = (name: string, updatedAt: number) => ({
  ...draftToRecipe({ ...createDraft("napoletana"), name }),
  updatedAt,
});

describe("recipes CRUD", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("saves and fetches a recipe by id", async () => {
    const recipe = makeRecipe("Napoletana", Date.now());
    await saveRecipe(recipe);
    expect(await getRecipe(recipe.id)).toEqual(recipe);
  });

  it("lists recipes newest-first by updatedAt", async () => {
    await saveRecipe(makeRecipe("Älter", 1000));
    await saveRecipe(makeRecipe("Neuer", 2000));
    const list = await listRecipes();
    expect(list.map((r) => r.name)).toEqual(["Neuer", "Älter"]);
  });

  it("updates a recipe in place (same id)", async () => {
    const recipe = makeRecipe("V1", 1000);
    await saveRecipe(recipe);
    await saveRecipe({ ...recipe, name: "V2", updatedAt: 3000 });
    const list = await listRecipes();
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("V2");
  });

  it("removes a recipe", async () => {
    const recipe = makeRecipe("Weg", Date.now());
    await saveRecipe(recipe);
    await removeRecipe(recipe.id);
    expect(await getRecipe(recipe.id)).toBeUndefined();
    expect(await listRecipes()).toHaveLength(0);
  });
});
