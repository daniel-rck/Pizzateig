import type { ReactNode } from "react";

export type AppHeaderProps = {
  title: string;
  logo?: ReactNode;
  actions?: ReactNode;
};

export function AppHeader({ title, logo, actions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-14 shrink-0 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="container mx-auto max-w-4xl h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {logo ? (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-sm">
              {logo}
            </span>
          ) : null}
          <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
