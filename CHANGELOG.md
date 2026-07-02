# Changelog

All notable changes to this project are documented here. The format loosely
follows Keep a Changelog; the app itself is unversioned (`0.0.0`, see
`docs/specs/` for the rationale) — entries are grouped by milestone.

## v1.0.1 — Härtung & Politur

### Fixed

- Shared `#r=` payloads are clamped to the UI value ranges on decode; hostile
  links can no longer produce infinite/negative gram amounts.
- The auto yeast suggestion is capped at 3 % — very short cold-only plans
  previously suggested absurd doses.
- Switching fresh⇄dry with a manual yeast override now converts the
  percentage so the physical dose stays equivalent.
- Loading or saving a recipe clears a lingering `#r=` share hash, so a reload
  no longer re-imports the stale shared draft.
- New **Neu** action in the result sheet detaches from a loaded recipe;
  previously every save overwrote the loaded recipe in place.
- Theme persistence no longer crashes in private-browsing modes.
- The reactive recipe list is latest-wins; overlapping refreshes can no
  longer show stale data.

### Changed

- A11y: modal dialogs use `aria-modal` with a focus trap and safe initial
  focus; chip groups use screen-reader legends; subtle text now passes
  WCAG AA contrast in light mode.
- The last English label ("Custom") is now "Eigener Stil".
- The worker sends security headers (strict CSP with a hashed inline theme
  script, nosniff, Referrer-Policy, Permissions-Policy) on all responses via
  `run_worker_first`; `/healthz` is `no-store`.
- CI runs explicit lint/typecheck/test/build steps instead of an unpinned
  reusable workflow; new worker tests cover routing and headers.
- PWA manifest: stable `id`/`scope`, the manifest itself is precached, and
  the installed-app identity is capitalized ("Pizzateig").
- Dead code removed (unused SW message handler, theme-script export, unused
  design tokens); ferment preset previews are memoized.

## v1 — Initial release

### Added

- Baker's-percent dough calculator: flour, water, salt, oil and yeast derived
  live from style, ball count, ball weight and the ferment plan (no
  "calculate" button).
- Physically-grounded Q10 yeast suggestion (`dough.ts`), with fresh⇄dry
  conversion and an auto/manual mode. Two documented, tunable knobs: `Q10`
  and the per-style trieb-dose constant `K`.
- Dough-style presets (Napoletana, Teglia, New York, Pan, Custom) with
  sensible hydration/salt/oil/ball-weight defaults.
- Mobile-first UI: style chips, steppers, ferment-plan preset cards with inline
  yeast preview, a custom-plan slider panel, a fine-tuning accordion, and a
  sticky live result sheet with a bake timeline.
- Local persistence via IndexedDB (`idb`) with a reactive recipe list; save,
  load, update and delete recipes.
- Recipe sharing through a URL-hash codec (`#r=…`) with the Web Share API and a
  copy-link fallback; incoming shared links prefill the draft with a save
  prompt.
- Installable, offline-capable PWA: manifest, orange pizza icons, Workbox
  precache and a navigation fallback for client-side routes.
