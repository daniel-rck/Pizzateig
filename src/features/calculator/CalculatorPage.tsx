import { CalendarClock, CookingPot, Share2, Wheat } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getRecipe, saveRecipe } from "../../lib/db/index.ts";
import { shareDraft } from "../../lib/shareAction.ts";
import { STYLES } from "../../lib/styles.ts";
import { Button, SectionCard } from "../../lib/ui/index.ts";
import { useDraft } from "../../state/DraftContext.tsx";
import { draftToRecipe } from "../../state/recipeDraft.ts";
import { BallWeight } from "./components/BallWeight.tsx";
import { Feintuning } from "./components/Feintuning.tsx";
import { FermentPlan } from "./components/FermentPlan.tsx";
import { ImportBanner } from "./components/ImportBanner.tsx";
import { ResultSheet } from "./components/ResultSheet.tsx";
import { SaveDialog } from "./components/SaveDialog.tsx";
import { Stepper } from "./components/Stepper.tsx";
import { StyleChips } from "./components/StyleChips.tsx";

export function CalculatorPage() {
  const {
    draft,
    computation,
    update,
    setStyle,
    setFerment,
    setYeast,
    imported,
    dismissImport,
    currentRecipeId,
    loadRecipe,
  } = useDraft();

  const [saveOpen, setSaveOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSave = useCallback(
    async (name: string) => {
      const existing = currentRecipeId ? await getRecipe(currentRecipeId) : undefined;
      const recipe = draftToRecipe(
        { ...draft, name },
        { id: existing?.id, createdAt: existing?.createdAt, notes: existing?.notes },
      );
      await saveRecipe(recipe);
      loadRecipe(recipe);
      setSaveOpen(false);
      setToast(existing ? "Aktualisiert" : "Gespeichert");
    },
    [draft, currentRecipeId, loadRecipe],
  );

  const handleShare = useCallback(async () => {
    const outcome = await shareDraft(draft);
    if (outcome === "copied") setToast("Link kopiert");
    else if (outcome === "unavailable") setToast("Teilen nicht möglich");
  }, [draft]);

  return (
    <div className="space-y-4 pb-44">
      {imported ? (
        <ImportBanner onSave={() => setSaveOpen(true)} onDismiss={dismissImport} />
      ) : null}

      <SectionCard title="Stil" icon={<CookingPot size={16} />}>
        <StyleChips value={draft.style} onChange={setStyle} />
      </SectionCard>

      <SectionCard title="Menge" icon={<Wheat size={16} />} className="space-y-4">
        <Stepper
          label="Teiglinge"
          value={draft.ballCount}
          min={1}
          max={24}
          step={1}
          onChange={(v) => update({ ballCount: v })}
        />
        <BallWeight
          value={draft.ballWeightG}
          presets={STYLES[draft.style].ballPresetsG}
          onChange={(v) => update({ ballWeightG: v })}
        />
      </SectionCard>

      <SectionCard title="Gärplan" icon={<CalendarClock size={16} />}>
        <FermentPlan
          draft={draft}
          onSelectPreset={(config) => {
            setFerment(config);
            setYeast({ mode: "auto" });
          }}
          onCustomChange={setFerment}
        />
      </SectionCard>

      <Feintuning
        draft={draft}
        resolvedYeastPct={computation.yeastPct}
        onUpdate={update}
        onYeast={setYeast}
      />

      <ResultSheet
        amounts={computation.amounts}
        ferment={draft.ferment}
        yeastPct={computation.yeastPct}
        yeastType={draft.yeast.type}
        yeastIsAuto={draft.yeast.mode === "auto"}
        actions={
          <>
            <Button onClick={() => setSaveOpen(true)}>
              {currentRecipeId ? "Aktualisieren" : "Speichern"}
            </Button>
            <Button variant="secondary" onClick={handleShare}>
              <Share2 size={16} aria-hidden="true" />
              Teilen
            </Button>
          </>
        }
      />

      <SaveDialog
        open={saveOpen}
        initialName={draft.name}
        isUpdate={currentRecipeId !== null}
        onSave={handleSave}
        onClose={() => setSaveOpen(false)}
      />

      {toast ? (
        <div
          role="status"
          className="fixed inset-x-0 top-16 z-50 mx-auto w-fit rounded-full bg-fg px-4 py-2 text-sm font-medium text-surface shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
