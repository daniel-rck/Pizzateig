import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DraftProvider } from "../../state/DraftContext.tsx";
import { ToastProvider } from "../../state/ToastContext.tsx";
import { CalculatorPage } from "./CalculatorPage.tsx";

function renderPage() {
  return render(
    <ToastProvider>
      <DraftProvider>
        <CalculatorPage />
      </DraftProvider>
    </ToastProvider>,
  );
}

describe("CalculatorPage", () => {
  it("shows a live total for the default draft (4 × 260 g)", () => {
    renderPage();
    expect(screen.getByText(/1\.040 g Teig/)).toBeInTheDocument();
  });

  it("updates the total live when the style changes the ball weight", async () => {
    const user = userEvent.setup();
    renderPage();
    // Teglia default ball weight is 300 g → 4 × 300 = 1.200 g.
    await user.click(screen.getByRole("button", { name: "Teglia" }));
    expect(screen.getByText(/1\.200 g Teig/)).toBeInTheDocument();
  });

  it("expands the result sheet to reveal the full breakdown", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Ergebnis aufziehen" }));
    expect(screen.getByText("Gesamtteig")).toBeInTheDocument();
    expect(screen.getByText("Mehl")).toBeInTheDocument();
    expect(screen.getByText("Ablauf")).toBeInTheDocument();
  });

  it("increments the ball count via the stepper", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Teiglinge erhöhen" }));
    // 5 × 260 = 1.300 g
    expect(screen.getByText(/1\.300 g Teig/)).toBeInTheDocument();
  });

  it("shows the yeast with one decimal, even in the collapsed sheet", async () => {
    const user = userEvent.setup();
    renderPage();
    // Default: 4 × 260 g Napoletana, overnight → a sub-gram fresh-yeast dose.
    expect(screen.getByText(/^\d+,\d g Frischhefe$/)).toBeInTheDocument();

    // Dry yeast is a third of that — must not round down to "0 g".
    await user.click(screen.getByRole("button", { name: /Feintuning/ }));
    await user.click(screen.getByRole("button", { name: "Trocken" }));
    const chip = screen.getByText(/g Trockenhefe$/);
    expect(chip.textContent).toMatch(/^\d+,\d g Trockenhefe$/);
    expect(chip.textContent).not.toBe("0 g Trockenhefe");
  });

  it("saves a recipe, then detaches again via the Neu action", async () => {
    const user = userEvent.setup();
    renderPage();

    // Save is reachable without expanding the result sheet.
    await user.click(screen.getByRole("button", { name: "Speichern" }));
    await user.type(screen.getByLabelText("Name"), "Testpizza");
    const submit = screen
      .getAllByRole("button", { name: "Speichern" })
      .find((b) => b.getAttribute("type") === "submit");
    expect(submit).toBeDefined();
    await user.click(submit as HTMLElement);

    // Saved: the primary action now updates in place and a toast confirms.
    expect(await screen.findByRole("button", { name: "Aktualisieren" })).toBeInTheDocument();
    expect(screen.getByText("Gespeichert")).toHaveAttribute("role", "status");

    // Neu lives in the expanded sheet and asks before discarding the draft.
    await user.click(screen.getByRole("button", { name: "Ergebnis aufziehen" }));
    await user.click(screen.getByRole("button", { name: "Neu" }));
    await user.click(screen.getByRole("button", { name: "Neu starten" }));

    // Detached: back to a fresh draft that saves as a new recipe.
    expect(screen.getByRole("button", { name: "Speichern" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Neu" })).not.toBeInTheDocument();
  });

  it("highlights the matching preset again after leaving a custom plan", async () => {
    const user = userEvent.setup();
    renderPage();
    const overnight = screen.getByRole("button", { name: /Über Nacht/ });
    expect(overnight).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Eigener Plan" }));
    // Opening the panel alone does not un-highlight the still-matching preset.
    expect(overnight).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /Schnell/ }));
    expect(screen.getByRole("button", { name: /Schnell/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Eigener Plan" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
