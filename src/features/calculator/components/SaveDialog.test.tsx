import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaveDialog } from "./SaveDialog.tsx";

describe("SaveDialog", () => {
  it("can't be dismissed while a save is in flight", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => {};
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const onClose = vi.fn();
    render(
      <SaveDialog open initialName="Test" isUpdate={false} onSave={onSave} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: "Speichern" }));
    expect(onSave).toHaveBeenCalledTimes(1);

    // Every dismissal path is blocked until the save settles.
    expect(screen.getByRole("button", { name: "Abbrechen" })).toBeDisabled();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Schließen" }));
    expect(onClose).not.toHaveBeenCalled();

    finish();
    await vi.waitFor(() =>
      expect(screen.getByRole("button", { name: "Abbrechen" })).not.toBeDisabled(),
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
