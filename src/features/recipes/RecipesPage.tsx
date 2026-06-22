import { NotebookText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeRecipe, useRecipes } from "../../lib/db/index.ts";
import { formatPercent } from "../../lib/format.ts";
import { ROUTES } from "../../lib/routes.ts";
import { STYLES } from "../../lib/styles.ts";
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from "../../lib/ui/index.ts";
import { useDraft } from "../../state/DraftContext.tsx";
import type { Recipe } from "../../types/recipe.ts";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";

export function RecipesPage() {
  const { data: recipes, loading } = useRecipes();
  const { loadRecipe } = useDraft();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<Recipe | null>(null);

  const open = (recipe: Recipe) => {
    loadRecipe(recipe);
    navigate(ROUTES.home);
  };

  return (
    <div>
      <PageHeader title="Rezepte" subtitle="Gespeicherte Teige" />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !recipes || recipes.length === 0 ? (
        <EmptyState
          icon={<NotebookText size={40} aria-hidden="true" />}
          title="Noch keine Rezepte"
          description="Speichere einen Teig im Rechner, dann erscheint er hier."
          action={<Button onClick={() => navigate(ROUTES.home)}>Zum Rechner</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="animate-fade-in">
              <Card interactive className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => open(recipe)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{recipe.name}</span>
                    <Badge variant="accent" className="shrink-0">
                      {STYLES[recipe.style].label}
                    </Badge>
                  </p>
                  <p className="mt-1 truncate text-sm tabular-nums text-fg-muted">
                    {recipe.ballCount} × {recipe.ballWeightG} g · {formatPercent(recipe.hydration)}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${recipe.name} löschen`}
                  onClick={() => setPendingDelete(recipe)}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Rezept löschen"
        message={pendingDelete ? `„${pendingDelete.name}" wird dauerhaft gelöscht.` : ""}
        onConfirm={async () => {
          if (pendingDelete) await removeRecipe(pendingDelete.id);
          setPendingDelete(null);
        }}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
