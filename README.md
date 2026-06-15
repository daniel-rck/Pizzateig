# pizzateig

Pizzateig-Rechner als installierbare PWA. Aus gewünschten Teig-Eigenschaften
(Stil, Anzahl, Ballgewicht, Gärplan) berechnet die App die exakten
Zutatenmengen nach **Bäcker-Prozent** und schlägt eine Hefemenge auf Basis von
Gehzeit und Temperatur vor. Rezepte werden lokal gespeichert, geladen und
geteilt.

**Reiner Client** — kein Backend, kein Account, kein API-Key. Alle Daten bleiben
im Browser (IndexedDB). Voll offline-fähig.

## Funktionen

- **Live-Berechnung** ohne „Berechnen"-Button: jede Eingabe aktualisiert das
  Ergebnis sofort.
- **Stil-Presets** (Napoletana, Teglia, NY, Pan, Custom) mit sinnvollen Defaults
  für Hydration, Salz, Öl und Ballgewicht.
- **Physikalisch begründeter Hefe-Vorschlag** über ein Q10-Kinetik-Modell
  (Triebrate verdoppelt sich je ~10 °C), inkl. Kühlgare.
- **Mobile-First**: Daumen-Flow mit Chips, Steppern, Slidern und Ergebnis-Sheet.
- **Teilen** per Link (Rezept im URL-Hash) und Web-Share-API.

## Stack

Bun · React 19 · Vite 8 · TypeScript (strict) · Tailwind 4 · idb/`useLiveQuery`
· vite-plugin-pwa · Cloudflare Workers. Aufgesetzt auf der gemeinsamen
Basis [`web-base`](https://github.com/daniel-rck/web-base).

## Entwicklung

```bash
bun install
bun run dev        # Dev-Server
bun run test       # Unit-Tests (vitest)
bun run lint       # Biome
bun run typecheck  # tsc strict
bun run build      # Produktions-Build + Service Worker
```

## Deployment

```bash
bun run worker:deploy   # Cloudflare Workers (Wrangler)
```

## Lizenz

MIT © daniel-rck
