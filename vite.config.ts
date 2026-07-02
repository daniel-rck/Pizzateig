/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "index.ts",
      injectRegister: "auto",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2,webmanifest}"],
      },
      registerType: "autoUpdate",
      devOptions: { enabled: false, type: "module" },
      manifest: {
        id: "/",
        name: "Pizzateig — Pizzateig-Rechner",
        short_name: "Pizzateig",
        description:
          "Pizzateig-Rechner: exakte Zutatenmengen nach Bäcker-Prozent mit Hefe-Vorschlag nach Gehzeit und Temperatur.",
        lang: "de",
        theme_color: "#ea580c",
        // Manifests can't follow the color scheme; white matches the light-first surface.
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
