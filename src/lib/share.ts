import type { RecipeDraft } from "../state/recipeDraft.ts";
import type { DoughStyle, YeastMode, YeastType } from "../types/recipe.ts";

/**
 * Recipe sharing codec (spec §5): a draft is packed into a compact, versioned
 * JSON payload and base64url-encoded into the URL hash (`#r=…`). Decoding is
 * defensive — malformed input returns null rather than throwing.
 */

const HASH_PREFIX = "r=";

const STYLES_SET = new Set<DoughStyle>(["napoletana", "teglia", "pan", "newyork", "custom"]);
const YEAST_TYPES = new Set<YeastType>(["fresh", "dry", "sourdough"]);
const YEAST_MODES = new Set<YeastMode>(["auto", "manual"]);

/** Compact wire format. Short keys keep shared URLs small. */
type ShareV1 = {
  v: 1;
  n: string;
  s: DoughStyle;
  bc: number;
  bw: number;
  h: number;
  sa: number;
  o: number;
  yt: YeastType;
  ym: YeastMode;
  yp: number;
  th: number;
  rt: number;
  ch: number;
  ct: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Encode a draft to a URL-safe base64 string. */
export function encodeDraft(draft: RecipeDraft): string {
  const payload: ShareV1 = {
    v: 1,
    n: draft.name,
    s: draft.style,
    bc: draft.ballCount,
    bw: draft.ballWeightG,
    h: draft.hydration,
    sa: draft.saltPct,
    o: draft.oilPct,
    yt: draft.yeast.type,
    ym: draft.yeast.mode,
    yp: draft.yeast.pct,
    th: draft.ferment.totalHours,
    rt: draft.ferment.roomTempC,
    ch: draft.ferment.coldHours,
    ct: draft.ferment.coldTempC,
  };
  const json = JSON.stringify(payload);
  return toBase64Url(new TextEncoder().encode(json));
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function isShareV1(x: unknown): x is ShareV1 {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 1 &&
    typeof o.n === "string" &&
    typeof o.s === "string" &&
    STYLES_SET.has(o.s as DoughStyle) &&
    isFiniteNumber(o.bc) &&
    isFiniteNumber(o.bw) &&
    isFiniteNumber(o.h) &&
    isFiniteNumber(o.sa) &&
    isFiniteNumber(o.o) &&
    typeof o.yt === "string" &&
    YEAST_TYPES.has(o.yt as YeastType) &&
    typeof o.ym === "string" &&
    YEAST_MODES.has(o.ym as YeastMode) &&
    isFiniteNumber(o.yp) &&
    isFiniteNumber(o.th) &&
    isFiniteNumber(o.rt) &&
    isFiniteNumber(o.ch) &&
    isFiniteNumber(o.ct)
  );
}

/** Decode a URL-safe base64 string back to a draft, or null if invalid. */
export function decodeDraft(encoded: string): RecipeDraft | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const parsed: unknown = JSON.parse(json);
    if (!isShareV1(parsed)) return null;
    return {
      name: parsed.n,
      style: parsed.s,
      ballCount: parsed.bc,
      ballWeightG: parsed.bw,
      hydration: parsed.h,
      saltPct: parsed.sa,
      oilPct: parsed.o,
      yeast: { type: parsed.yt, mode: parsed.ym, pct: parsed.yp },
      ferment: {
        totalHours: parsed.th,
        roomTempC: parsed.rt,
        coldHours: parsed.ch,
        coldTempC: parsed.ct,
      },
    };
  } catch {
    return null;
  }
}

/** Build a shareable URL for the given draft. */
export function buildShareUrl(draft: RecipeDraft, baseUrl: string): string {
  const base = baseUrl.split("#")[0] ?? baseUrl;
  return `${base}#${HASH_PREFIX}${encodeDraft(draft)}`;
}

/** Parse an incoming location hash (`#r=…`) into a draft, or null. */
export function parseShareHash(hash: string): RecipeDraft | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.startsWith(HASH_PREFIX)) return null;
  const encoded = raw.slice(HASH_PREFIX.length);
  if (!encoded) return null;
  return decodeDraft(encoded);
}
