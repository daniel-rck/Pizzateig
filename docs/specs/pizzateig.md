# pizzateig — Pizzateig-Rechner (PWA)

> Spec im `web-base`-Ökosystem. Stack-Baseline: Bun, Biome, React 19, Vite 8,
> TypeScript (strict), Tailwind 4, idb/`useLiveQuery`, Cloudflare Workers.
> Verteilung/Scaffolding über `bunx github:daniel-rck/web-base`.

## 1. Zweck

Berechnet aus gewünschten Teig-Eigenschaften die exakten Zutatenmengen
(Mehl, Wasser, Salz, Hefe, Öl) nach Bäcker-Prozent und schlägt eine Hefemenge
basierend auf Gehzeit und Temperatur vor. Rezepte werden lokal gespeichert,
geladen und geteilt. Reiner Client — kein Backend, kein API-Key.

**Accent:** Orange · **Icon-Motiv:** Pizzaofen / Mehlsack

## 2. Domänenmodell

Alle Prozentwerte beziehen sich auf das Mehlgewicht (= 100 %).

### `Recipe`
| Feld            | Typ                     | Bemerkung                                  |
|-----------------|-------------------------|--------------------------------------------|
| `id`            | `string` (uuid)         | Primärschlüssel                            |
| `name`          | `string`                | z. B. „Napoletana 65 %"                    |
| `style`         | `DoughStyle`            | siehe Enum                                 |
| `ballCount`     | `number`                | Anzahl Teiglinge                           |
| `ballWeightG`   | `number`                | Gewicht je Teigling in g                   |
| `hydration`     | `number`                | 0.50–1.00 (Wasseranteil)                   |
| `saltPct`       | `number`                | typ. 0.02–0.03                             |
| `oilPct`        | `number`                | typ. 0–0.03                                |
| `yeast`         | `YeastConfig`           | siehe unten                                |
| `ferment`       | `FermentConfig`         | siehe unten                                |
| `preferment`    | `Preferment \| null`    | Biga/Poolish (optional, v1.1)              |
| `notes`         | `string`                | Freitext                                   |
| `createdAt`     | `number`                | epoch ms                                   |
| `updatedAt`     | `number`                | epoch ms                                   |

### `DoughStyle`
`'napoletana' | 'teglia' | 'pan' | 'newyork' | 'custom'`
→ liefert Default-Werte für Hydration/Salz/Öl (vorbelegen, editierbar).

### `YeastConfig`
| Feld     | Typ                                  | Bemerkung                          |
|----------|--------------------------------------|------------------------------------|
| `type`   | `'fresh' \| 'dry' \| 'sourdough'`    | Frisch- / Trocken- / Sauerteig     |
| `mode`   | `'auto' \| 'manual'`                 | auto = aus Gehzeit/Temp berechnet  |
| `pct`    | `number`                             | bei `manual` direkt gesetzt        |

### `FermentConfig`
| Feld          | Typ      | Bemerkung                          |
|---------------|----------|------------------------------------|
| `totalHours`  | `number` | Gesamtgehzeit                      |
| `roomTempC`   | `number` | Raumtemperatur Stückgare           |
| `coldHours`   | `number` | Anteil Kühlschrankgare (optional)  |
| `coldTempC`   | `number` | typ. 4 °C                          |

### `Preferment` (v1.1)
`{ kind: 'biga' | 'poolish'; flourPct: number; hydration: number; hours: number }`

## 3. Berechnungslogik

Pure Funktionen, kein State. Alles in `src/lib/dough.ts`, vollständig unit-getestet.

### 3.1 Mengen (Bäcker-Prozent)

```ts
const totalDough = ballCount * ballWeightG;
const sumPct = 1 + hydration + saltPct + oilPct + yeastPct; // yeastPct s. 3.2
const flour = totalDough / sumPct;
const water = flour * hydration;
const salt  = flour * saltPct;
const oil   = flour * oilPct;
const yeast = flour * yeastPct;
```

Ausgabe auf 1 g gerundet, Hefe auf 0.1 g.

### 3.2 Hefe-Vorschlag (auto)

Physikalisch begründetes Kinetik-Modell statt Stützpunkt-Tabelle. Gärung folgt
näherungsweise einer Q10-Regel: die Triebrate verdoppelt sich je ~10 °C
(Q10 ≈ 2). Die „Triebdosis" ist näherungsweise konstant, also ist die Hefemenge
umgekehrt proportional zur Summe der wirksamen Gärstunden über alle Phasen.

```ts
// Stellschrauben — out-of-the-box sinnvoll, optional nachjustierbar.
const Q10 = 5.6;   // Triebrate ×Q10 je 10 °C, kalibriert an Kühlgare-Erfahrung
const T_REF = 20;  // Referenztemperatur in °C

const rate = (tempC: number) => Math.pow(Q10, (tempC - T_REF) / 10);

// Wirksame Gärstunden über alle Phasen (Raum + Kühl).
// Bei 4 °C ist rate ≈ 5.6^((4-20)/10) ≈ 0.063 → Kühlgare trägt kaum zum Trieb
// bei (entspricht der Praxis: kalte Gare braucht deutlich mehr Hefe).
const effHours =
  (totalHours - coldHours) * rate(roomTempC) +
  coldHours * rate(coldTempC);

// K = Triebdosis-Konstante, je Stil aus EINEM kanonischen Referenzrezept
// verankert: K = referenzHefePct * effHoursDesReferenzrezepts.
const freshYeastPct = K / effHours;
```

**Verankerung `K` (Defaults je Stil):** aus einem vertrauenswürdigen
Referenzrezept rückgerechnet, nicht geraten. Beispiel Napoletana:
0.20 % Frischhefe bei 8 h / 20 °C → `effHours = 8 * 1 = 8` → `K = 0.016`.
Jeder `DoughStyle` bringt sein eigenes `K` mit.

**Hefetyp-Umrechnung** (alle relativ zu Frischhefe):
- Trockenhefe ≈ Frischhefe × 0.33
- Instanthefe ≈ Frischhefe × 0.33
- Sauerteig: eigenes Modell (Anstellgut-%), nicht über `K` — v1.1.

**Tunability (Kür, nicht Pflicht):** `Q10` und `K` sind die einzigen zwei
Knöpfe. Beide als dokumentierte Konstanten, kein verstreuter Magic Value.
Wer will, justiert `K` an eigenen Backergebnissen nach.

**Decision — `Q10` an Erfahrung kalibriert:** Die Spec nannte zwei
unvereinbare Werte — die Formel mit `Q10 = 2` (→ `rate(4 °C) ≈ 0.33`) und die
Prosa `rate(4 °C) ≈ 0.063`. Maßgeblich ist der erfahrungsnähere Wert: bei 4 °C
ruht die Hefe nahezu, eine lange Kühlgare braucht deutlich mehr Hefe als eine
kurze Raumgare. Deshalb `Q10 = 5.6`, sodass `rate(4 °C) ≈ 0.063`. Trade-off:
dieser Wert ist auf den Kältebereich getrimmt und überzeichnet die
Temperatur­empfindlichkeit im Warmen — wer überwiegend warm führt, senkt `Q10`
Richtung 2. `Q10` (und `K`) bleiben die dokumentierten Stellschrauben.

## 4. UI / UX — Mobile First

**Leitprinzip:** Kein „Berechnen"-Button. Ergebnis ist immer sichtbar (sticky
Bottom-Sheet) und reagiert live auf jede Eingabe. 80 % der Nutzer stellen nur
Stil + Anzahl + Gärplan ein und sind fertig; alles andere ist Progressive
Disclosure.

### 4.1 Eingabe-Ebenen

**Ebene 1 — 80%-Pfad (above the fold, untere Daumenzone bevorzugt):**
- **Stil-Chips** (horizontal scroll): Napoletana / Teglia / NY / Pan / Custom.
  Ein Tap setzt alle Defaults (Hydration, Salz, Öl, Ballgewicht, `K`).
- **Anzahl Teiglinge:** Stepper `− N +`, große Tap-Targets, keine Tastatur.
- **Ballgewicht:** Preset-Chips je Stil (z. B. 250/280/320 g) + feiner Stepper.

**Ebene 2 — Gärplan (die kritische Eingabe):** Statt 4 abstrakter Felder
(Gesamtzeit/Raumtemp/Kühlstunden/Kühltemp) → **Preset-Karten** nach
Nutzer-Mentalmodell, jede zeigt die errechnete Hefemenge inline:
- „Schnell · 4–6 h @ 22 °C"
- „Über Nacht · ~18 h kalt"
- „2 Tage · ~48 h kalt"
- „Eigener Plan" → öffnet erst dann Slider (Raumstunden, Raumtemp, Kühlstunden;
  Kühltemp default 4 °C). 90 % bedienen nur einen Tap, ohne Temperatureingabe.

**Ebene 3 — „Feintuning" (Akkordeon, eingeklappt):** Hydration-, Salz-,
Öl-Slider; Hefetyp-Toggle (frisch/trocken); manuelle Hefe-Übersteuerung.

### 4.2 Pattern-Wahl je Input-Typ

| Input              | Pattern        | Begründung                              |
|--------------------|----------------|-----------------------------------------|
| Stil, Gärplan      | Chips / Karten | Auswahl mit sinnvollen Defaults         |
| Anzahl, Gewicht    | Stepper        | Exakt, kein Vertippen, keine Tastatur   |
| Hydration/Salz/Öl  | Slider + Label | Ungefähr, visuell, Präzision irrelevant |
| Hefetyp            | Segmented      | Binär/ternär, ein Tap                   |

Keine native Nummerntastatur auf dem Primärpfad. Vibration-API für haptisches
Feedback bei Stepper/Slider-Raster (nice-to-have).

### 4.3 Ergebnis-Sheet (sticky bottom)

- **Eingeklappt:** eine Zeile — Gesamtteig + Mehl/Wasser.
- **Aufgezogen:** volle Mengen-Tabelle, errechnete Hefe-% mit Hinweis
  „Vorschlag, justierbar", Back-Timeline, Aktionen Speichern/Teilen.
- Aktualisiert live, daumennah, nie verdeckt von der Tastatur.

### 4.4 Reachability

Stil-Chips oben (einmal gesetzt) · häufig angefasste Regler (Anzahl, Gärplan)
in der unteren Hälfte · Ergebnis-Sheet am Daumen unten.

## 5. Persistenz & Sharing

- IndexedDB via `idb`, Store `recipes`, reaktiv über `useLiveQuery`.
- Teilen: Rezept als URL-safe Base64 in den Hash (`#r=...`) packen →
  Web-Share-API / Copy-Link. Beim Laden Hash parsen, Rezept als „importiert"
  vorbefüllen (nicht automatisch speichern).
- Kein Server-State. Cloudflare Worker liefert nur statische Assets + PWA.

## 6. PWA

- Offline-fähig (Precache aller Assets), installierbar.
- Manifest: Name „pizzateig", Theme/Background passend zum Orange-Accent.
- Reine Rechner-App → keine Netzwerkabhängigkeit zur Laufzeit.

## 7. Definition of Done (Auszug, React/Bun-Profil)

- [ ] `dough.ts` 100 % pure, Unit-Tests für Mengen + Interpolation (Rand-/Kombi-Fälle)
- [ ] Biome clean, TS strict ohne `any`
- [ ] Lighthouse PWA installierbar, offline lauffähig
- [ ] Share-Roundtrip getestet (Export → Import identisch)
- [ ] `K` je Stil an einem kanonischen Referenzrezept verankert + mit 2–3 eigenen Backergebnissen plausibilisiert

## 8. Backlog / v1.1+

- Vorteig (Biga/Poolish): Mehl/Wasser aufteilen, Hauptteig nachrechnen.
- Sauerteig-Modus (Anstellgut-% statt Hefe, eigene Triebkurve).
- Mehrere Mehle mit Anteilen (+ Verschnitt-/Waste-%).
- Einheiten g/oz umschaltbar.
- Backnotizen/Bewertung pro Rezept (Logbuch wie bei PizzApp).
