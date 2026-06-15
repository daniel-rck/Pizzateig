export const ROUTES = {
  home: "/",
  recipes: "/rezepte",
} as const;

export type RouteKey = keyof typeof ROUTES;
