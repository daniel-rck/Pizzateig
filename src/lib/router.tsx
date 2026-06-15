import { createBrowserRouter } from "react-router-dom";
import { App } from "../App.tsx";
import { ROUTES } from "./routes.ts";

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <App />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { CalculatorPage } = await import("../features/calculator/CalculatorPage.tsx");
          return { Component: CalculatorPage };
        },
      },
      {
        path: ROUTES.recipes,
        lazy: async () => {
          const { RecipesPage } = await import("../features/recipes/RecipesPage.tsx");
          return { Component: RecipesPage };
        },
      },
    ],
  },
]);
