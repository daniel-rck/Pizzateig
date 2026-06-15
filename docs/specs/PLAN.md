# PLAN — pizzateig

> Standalone-PWA auf `web-base` (Bun, Biome, React 19, Vite 8, TS strict,
> Tailwind 4, idb/`useLiveQuery`, Cloudflare Workers). Kein Pilet, kein Backend.
> Spec: `docs/specs/pizzateig.md`. Accent: **Orange**.
>
> **Arbeitsweise:** sequenziell, ein atomarer Commit je Checkpoint (✅),
> Conventional Commits. Branch: `feat/pizzateig-v1`. Jede Phase endet grün
> (Biome + TS + `bun test`), bevor die nächste startet.

---

## Phase 0 — Scaffold & Setup

**Ziel:** lauffähiges web-base-Gerüst mit pizzateig-Identität.

- [ ] `bunx github:daniel-rck/web-base` → App `pizzateig` scaffolden
- [ ] Accent auf **Orange** setzen (Tailwind-Token + Manifest theme/background)
- [ ] App-Metadaten: Name „pizzateig", Kurzbeschreibung, Icon-Motiv (Pizzaofen)
- [ ] Baseline-Check: `biome check`, `tsc --noEmit`, `bun test`, Dev-Server läuft
- [ ] Git: Branch `feat/pizzateig-v1`, leeren Initial-Commit + Spec/PLAN ablegen

✅ **Commit:** `chore: scaffold pizzateig from web-base`

---

## Phase 1 — Domänenmodell & Persistenz

**Ziel:** Typen + reaktive IndexedDB-Schicht, noch ohne UI.

- [ ] `src/types/recipe.ts`: `Recipe`, `DoughStyle`, `YeastConfig`,
      `FermentConfig`, `Preferment` (Felder gem. Spec §2)
- [ ] `src/lib/styles.ts`: Default-Registry je `DoughStyle`
      (Hydration, Salz, Öl, Ballgewicht, **`K`** je Stil)
- [ ] `src/db/index.ts`: idb-Schema, Store `recipes`, Versionierung/Migration
- [ ] `src/db/recipes.ts`: CRUD (`save`, `get`, `list`, `remove`)
- [ ] `useRecipes()` Hook über `useLiveQuery` (reaktive Liste)

✅ **Commit:** `feat: recipe domain model and idb persistence`

---

## Phase 2 — Kernlogik `dough.ts` (Quality Gate)

**Ziel:** pure, vollständig getestete Berechnung. Hier sitzt der Wert der App.

- [ ] `src/lib/dough.ts` — pure Funktionen, kein State:
  - [ ] `computeAmounts()` — Bäcker-Prozent (Spec §3.1)
  - [ ] `suggestYeastPct()` — Q10-Kinetik mit `effHours` (Spec §3.2)
  - [ ] `convertYeast()` — frisch ↔ trocken/instant (×0.33)
- [ ] `src/lib/dough.test.ts` (`bun test`):
  - [ ] Mengen: Summe = Gesamtteig, Rundung g/0.1 g
  - [ ] Q10: Monotonie (mehr Zeit → weniger Hefe; mehr Wärme → weniger Hefe)
  - [ ] Kühlgare: 4 °C trägt ~0.06× bei (Randfall)
  - [ ] Kombi Raum+Kühl, Extremwerte (0 h, 100 % Hydration), Hefetyp-Konvertierung
- [ ] `K`-Defaults je Stil aus kanonischem Referenzrezept verankert + dokumentiert

✅ **Commit:** `feat: dough math and Q10 yeast model with tests`

---

## Phase 3 — App-State & Live-Berechnung

**Ziel:** Eingabe-State → abgeleitete Mengen, live, ohne „Berechnen"-Button.

- [ ] `src/state/recipeDraft.ts`: Draft-State (Anzahl, Gewicht, Stil, Ferment,
      Feintuning) + Stil-Wechsel überschreibt Defaults
- [ ] Derived: `useMemo` über `dough.ts` → live Mengen + Hefe-%
- [ ] `src/lib/share.ts`: Rezept ↔ URL-safe Base64 (`#r=…`), Roundtrip-sicher
- [ ] Import: Hash beim Start parsen → Draft vorbefüllen (nicht auto-speichern)

✅ **Commit:** `feat: live recipe draft state and share codec`

---

## Phase 4 — UI Mobile-First (Spec §4)

**Ziel:** der Daumen-Flow. Komponenten einzeln, dann verdrahten.

- [ ] `StyleChips` — horizontal scroll, Tap setzt Defaults
- [ ] `Stepper` — Anzahl & Ballgewicht (große Targets, keine Tastatur)
- [ ] `FermentPlan` — Preset-Karten (Schnell / Über Nacht / 2 Tage) mit
      Inline-Hefeanzeige + „Eigener Plan" → Slider (Raumstunden/-temp, Kühlstunden)
- [ ] `Feintuning` — Akkordeon: Hydration/Salz/Öl-Slider, Hefetyp-Segmented,
      manuelle Hefe-Übersteuerung
- [ ] `ResultSheet` — sticky bottom; eingeklappt 1 Zeile, aufgezogen volle
      Tabelle + Back-Timeline + Aktionen; live-Update
- [ ] Screen-Komposition + Reachability (Chips oben, Regler unten, Sheet am Daumen)
- [ ] Vibration-API-Feedback bei Stepper/Slider (nice-to-have)

✅ **Commit:** `feat: mobile-first input UI and live result sheet`

---

## Phase 5 — Rezepte (Speichern/Laden/Teilen)

**Ziel:** Persistenz im UI nutzbar.

- [ ] Speichern aus dem ResultSheet (Name vergeben)
- [ ] Rezeptliste (`useRecipes`), Laden in Draft, Löschen (mit Bestätigung)
- [ ] Teilen via Web-Share-API + Copy-Link Fallback (`share.ts`)
- [ ] Import-Banner bei `#r=…` („Importiertes Rezept – speichern?")

✅ **Commit:** `feat: recipe save, list, load and sharing`

---

## Phase 6 — PWA & Offline

**Ziel:** installierbar, voll offline (reiner Rechner, keine Laufzeit-Netzlast).

- [ ] Manifest finalisieren (Name, Icons aller Größen, Orange theme/background)
- [ ] Service Worker: Precache aller Assets, Offline-First
- [ ] Offline-Test (Flugmodus): App startet, rechnet, speichert lokal
- [ ] Lighthouse: PWA installierbar, Performance/A11y grün

✅ **Commit:** `feat: pwa manifest and offline service worker`

---

## Phase 7 — DoD & Release

**Ziel:** AGENTS.md React/Bun-DoD erfüllt, deploybar.

- [ ] `biome check` clean, `tsc` strict ohne `any`, `bun test` grün
- [ ] DoD-Checkliste (React/Bun-Profil) abgehakt
- [ ] Share-Roundtrip + Offline-Pfad manuell verifiziert
- [ ] `K` je Stil mit 2–3 eigenen Backergebnissen plausibilisiert
- [ ] README (Setup, Stack, Kurzbeschreibung) im web-base-Stil
- [ ] Cloudflare Workers Deploy (Wrangler), Custom-Domain prüfen
- [ ] PR `feat/pizzateig-v1` → main

✅ **Commit:** `chore: release pizzateig v1`

---

## Backlog (post-v1, Spec §8)

- Vorteig Biga/Poolish (Mehl/Wasser aufteilen, Hauptteig nachrechnen)
- Sauerteig-Modus (Anstellgut-%, eigene Triebkurve)
- Mehrere Mehle mit Anteilen + Verschnitt-%
- Einheiten g/oz umschaltbar
- Backlogbuch/Bewertung je Rezept

---

## Hinweise

- Phasen sind als Beads-Issues schneidbar, falls über mehrere Sessions verteilt.
- Reihenfolge bewusst: Logik (Phase 2) vor UI (Phase 4) — `dough.ts` ist das
  testbare Herz, die UI ist nur dünne Hülle drumherum.
- Nichts vorzeitig committen: jede Phase endet erst, wenn die Gates grün sind.
