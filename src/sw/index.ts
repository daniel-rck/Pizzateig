/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope;

// Injected at build time by vite-plugin-pwa (injectManifest strategy).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback: serve the precached app shell for client-side routes
// (e.g. /rezepte) so deep links work offline. Exclude API/health endpoints.
const appShell = createHandlerBoundToURL("index.html");
registerRoute(new NavigationRoute(appShell, { denylist: [/^\/api\//, /^\/healthz$/] }));

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
