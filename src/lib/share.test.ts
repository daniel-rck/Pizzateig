import { describe, expect, it } from "vitest";
import { createDraft, type RecipeDraft } from "../state/recipeDraft.ts";
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
    const encoded = encodeDraft({ ...sample(), style: "napoletana" });
    const tampered = btoa(
      JSON.stringify({
        ...JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))),
        s: "x",
      }),
    );
    expect(decodeDraft(tampered)).toBeNull();
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
