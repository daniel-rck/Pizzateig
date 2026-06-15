import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./App.tsx";

describe("App shell", () => {
  it("renders the app title and navigation", async () => {
    const router = createMemoryRouter(
      [{ path: "/", element: <App />, children: [{ index: true, element: <p>Inhalt</p> }] }],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);

    expect(screen.getByRole("heading", { name: "Pizzateig" })).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Hauptnavigation" }).length).toBeGreaterThan(
      0,
    );
  });
});
