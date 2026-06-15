import type { FermentConfig } from "../types/recipe.ts";

/**
 * Fermentation presets matching the user's mental model (spec §4.1, Ebene 2).
 * Each maps to a concrete FermentConfig consumed by the Q10 model.
 */
export type FermentPresetId = "quick" | "overnight" | "twoDays";

export type FermentPreset = {
  id: FermentPresetId;
  label: string;
  hint: string;
  config: FermentConfig;
};

export const FERMENT_PRESETS: Record<FermentPresetId, FermentPreset> = {
  quick: {
    id: "quick",
    label: "Schnell",
    hint: "~5 h @ 22 °C",
    config: { totalHours: 5, roomTempC: 22, coldHours: 0, coldTempC: 4 },
  },
  overnight: {
    id: "overnight",
    label: "Über Nacht",
    hint: "~18 h, davon kalt",
    config: { totalHours: 18, roomTempC: 20, coldHours: 16, coldTempC: 4 },
  },
  twoDays: {
    id: "twoDays",
    label: "2 Tage",
    hint: "~48 h kalt",
    config: { totalHours: 48, roomTempC: 20, coldHours: 46, coldTempC: 4 },
  },
};

export const FERMENT_PRESET_ORDER: FermentPresetId[] = ["quick", "overnight", "twoDays"];

export const DEFAULT_FERMENT_PRESET: FermentPresetId = "overnight";

export function getFermentPreset(id: FermentPresetId): FermentPreset {
  return FERMENT_PRESETS[id];
}

/** Match a FermentConfig against the presets; returns the id or null (custom). */
export function matchFermentPreset(config: FermentConfig): FermentPresetId | null {
  for (const id of FERMENT_PRESET_ORDER) {
    const c = FERMENT_PRESETS[id].config;
    if (
      c.totalHours === config.totalHours &&
      c.roomTempC === config.roomTempC &&
      c.coldHours === config.coldHours &&
      c.coldTempC === config.coldTempC
    ) {
      return id;
    }
  }
  return null;
}
