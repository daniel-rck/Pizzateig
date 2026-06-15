import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DraftProvider } from "../../state/DraftContext.tsx";
import { CalculatorPage } from "./CalculatorPage.tsx";

function renderPage() {
  return render(
    <DraftProvider>
      <CalculatorPage />
    </DraftProvider>,
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
});
