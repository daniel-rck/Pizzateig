import { STYLES } from "../../lib/styles.ts";
import { useDraft } from "../../state/DraftContext.tsx";
import { BallWeight } from "./components/BallWeight.tsx";
import { Feintuning } from "./components/Feintuning.tsx";
import { FermentPlan } from "./components/FermentPlan.tsx";
import { ResultSheet } from "./components/ResultSheet.tsx";
import { Stepper } from "./components/Stepper.tsx";
import { StyleChips } from "./components/StyleChips.tsx";

export function CalculatorPage() {
  const { draft, computation, update, setStyle, setFerment, setYeast } = useDraft();

  return (
    <div className="space-y-6 pb-44">
      <section>
        <h2 className="mb-2 text-sm font-medium text-fg-muted">Stil</h2>
        <StyleChips value={draft.style} onChange={setStyle} />
      </section>

      <section className="space-y-4">
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
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-fg-muted">Gärplan</h2>
        <FermentPlan
          draft={draft}
          onSelectPreset={(config) => {
            setFerment(config);
            setYeast({ mode: "auto" });
          }}
          onCustomChange={setFerment}
        />
      </section>

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
      />
    </div>
  );
}
