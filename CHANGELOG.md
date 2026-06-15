# Changelog

All notable changes to this project are documented here. The format loosely
follows Keep a Changelog; the app itself is unversioned (`0.0.0`, see
`docs/specs/` for the rationale) — entries are grouped by milestone.

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
