import { CalendarClock, CookingPot, FilePlus2, Save, Share2, Wheat } from "lucide-react";
import { useCallback, useState } from "react";
import { getRecipe, saveRecipe } from "../../lib/db/index.ts";
import { shareDraft } from "../../lib/shareAction.ts";
import { STYLES } from "../../lib/styles.ts";
import { Button, SectionCard } from "../../lib/ui/index.ts";
import { useDraft } from "../../state/DraftContext.tsx";
import { draftToRecipe } from "../../state/recipeDraft.ts";
import { useToast } from "../../state/ToastContext.tsx";
import { ConfirmDialog } from "../recipes/components/ConfirmDialog.tsx";
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
    startNewRecipe,
  } = useDraft();

  const { showToast } = useToast();
  const [saveOpen, setSaveOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const handleSave = useCallback(
    async (name: string) => {
      try {
        const existing = currentRecipeId ? await getRecipe(currentRecipeId) : undefined;
        const recipe = draftToRecipe(
          { ...draft, name },
          { id: existing?.id, createdAt: existing?.createdAt, notes: existing?.notes },
        );
        await saveRecipe(recipe);
        loadRecipe(recipe);
        setSaveOpen(false);
        showToast(existing ? "Aktualisiert" : "Gespeichert");
      } catch {
        // Storage can fail (quota, private mode); keep the dialog open to retry.
        showToast("Speichern fehlgeschlagen");
      }
    },
    [draft, currentRecipeId, loadRecipe, showToast],
  );

  const handleShare = useCallback(async () => {
    const outcome = await shareDraft(draft);
    if (outcome === "copied") showToast("Link kopiert");
    else if (outcome === "unavailable") showToast("Teilen nicht möglich");
  }, [draft, showToast]);

  const closeNew = useCallback(() => setNewOpen(false), []);

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
        quickActions={
          <>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Teilen"
              title="Teilen"
              onClick={handleShare}
              className="h-11 w-11 px-0"
            >
              <Share2 size={18} aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              aria-label={currentRecipeId ? "Aktualisieren" : "Speichern"}
              title={currentRecipeId ? "Aktualisieren" : "Speichern"}
              onClick={() => setSaveOpen(true)}
              className="h-11 w-11 px-0"
            >
              <Save size={18} aria-hidden="true" />
            </Button>
          </>
        }
        actions={
          currentRecipeId ? (
            <Button variant="secondary" onClick={() => setNewOpen(true)}>
              <FilePlus2 size={16} aria-hidden="true" />
              Neu
            </Button>
          ) : null
        }
      />

      <SaveDialog
        open={saveOpen}
        initialName={draft.name}
        isUpdate={currentRecipeId !== null}
        onSave={handleSave}
        onClose={() => setSaveOpen(false)}
      />

      <ConfirmDialog
        open={newOpen}
        title="Neues Rezept starten?"
        message={`„${draft.name}" bleibt gespeichert, nicht gespeicherte Änderungen gehen verloren.`}
        confirmLabel="Neu starten"
        onConfirm={() => {
          setNewOpen(false);
          startNewRecipe(draft.style);
        }}
        onClose={closeNew}
      />
    </div>
  );
}
