import { describe, expect, it } from "vitest";
import { computeDraft, createDraft, type RecipeDraft } from "../state/recipeDraft.ts";
import { buildShareUrl, decodeDraft, encodeDraft, parseShareHash } from "./share.ts";

const sample = (): RecipeDraft => ({
  ...createDraft("teglia"),
  name: "Römische Teglia 80 % 🍕",
  ballCount: 3,
  ballWeightG: 333,
  yeast: { type: "dry", mode: "manual", pct: 0.0042 },
  ferment: { totalHours: 48, roomTempC: 21, coldHours: 46, coldTempC: 4 },
});

describe("share codec", () => {
  it("round-trips a draft exactly (including unicode)", () => {
    const draft = sample();
    const decoded = decodeDraft(encodeDraft(draft));
    expect(decoded).toEqual(draft);
  });

  it("produces a URL-safe encoding (no +, /, or = padding)", () => {
    const encoded = encodeDraft(sample());
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("returns null for malformed base64", () => {
    expect(decodeDraft("!!!not-base64!!!")).toBeNull();
  });

  it("returns null for valid base64 that is not a ShareV1 payload", () => {
    expect(decodeDraft(btoa('{"hello":"world"}'))).toBeNull();
  });

  it("rejects an unknown style", () => {
    expect(decodeDraft(tamper({ s: "x" }))).toBeNull();
  });
});

/** Re-encode the sample payload with tampered fields (hostile-input simulation). */
function tamper(patch: Record<string, unknown>): string {
  const encoded = encodeDraft(sample());
  const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))) as Record<
    string,
    unknown
  >;
  return btoa(JSON.stringify({ ...payload, ...patch }));
}

describe("share decode clamping", () => {
  it("clamps hostile numeric values to the UI ranges", () => {
    const decoded = decodeDraft(tamper({ h: -5, bc: 9999, sa: 3, o: -1, yp: 2 }));
    expect(decoded).not.toBeNull();
    expect(decoded?.hydration).toBe(0.5);
    expect(decoded?.ballCount).toBe(24);
    expect(decoded?.saltPct).toBe(0.04);
    expect(decoded?.oilPct).toBe(0);
    expect(decoded?.yeast.pct).toBe(0.03);
  });

  it("computes finite, positive amounts from a hostile payload", () => {
    const decoded = decodeDraft(tamper({ h: -5, sa: -3, o: -1, yp: -2, bw: -100 }));
    expect(decoded).not.toBeNull();
    const { amounts } = computeDraft(decoded as RecipeDraft);
    expect(Number.isFinite(amounts.flourG)).toBe(true);
    expect(amounts.flourG).toBeGreaterThan(0);
    expect(amounts.waterG).toBeGreaterThanOrEqual(0);
  });

  it("caps cold hours at the total hours", () => {
    const decoded = decodeDraft(tamper({ th: 10, ch: 50 }));
    expect(decoded?.ferment.totalHours).toBe(10);
    expect(decoded?.ferment.coldHours).toBe(10);
  });

  it("rounds the ball count to an integer", () => {
    expect(decodeDraft(tamper({ bc: 3.7 }))?.ballCount).toBe(4);
  });

  it("truncates an oversized name", () => {
    const decoded = decodeDraft(tamper({ n: "x".repeat(500) }));
    expect(decoded?.name).toHaveLength(200);
  });
});

describe("share url + hash", () => {
  it("builds a #r= URL and parses it back", () => {
    const draft = sample();
    const url = buildShareUrl(draft, "https://pizzateig.example/app");
    expect(url).toContain("#r=");
    const hash = url.slice(url.indexOf("#"));
    expect(parseShareHash(hash)).toEqual(draft);
  });

  it("strips an existing hash from the base URL", () => {
    const url = buildShareUrl(sample(), "https://x.test/#r=old");
    expect(url.match(/#r=/g)).toHaveLength(1);
  });

  it("returns null for a hash without the r= prefix", () => {
    expect(parseShareHash("#foo=bar")).toBeNull();
    expect(parseShareHash("")).toBeNull();
    expect(parseShareHash("#r=")).toBeNull();
  });
});
