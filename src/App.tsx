import { Calculator, NotebookText, Pizza } from "lucide-react";
import { Outlet } from "react-router-dom";
import { ROUTES } from "./lib/routes.ts";
import { AppShell, type NavItem } from "./lib/ui/index.ts";
import { DraftProvider } from "./state/DraftContext.tsx";

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, label: "Rechner", icon: <Calculator size={20} /> },
  { to: ROUTES.recipes, label: "Rezepte", icon: <NotebookText size={20} /> },
];

/** Root layout: the shared shell with bottom-nav (mobile) / sidebar (desktop). */
export function App() {
  return (
    <DraftProvider>
      <AppShell
        title="pizzateig"
        logo={<Pizza size={22} aria-hidden="true" />}
        navItems={NAV_ITEMS}
      >
        <Outlet />
      </AppShell>
    </DraftProvider>
  );
}
