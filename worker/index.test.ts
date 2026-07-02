// @vitest-environment node
import { describe, expect, it } from "vitest";
import handler, { type Env } from "./index.ts";

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
} as unknown as ExecutionContext;

function envWith(contentType: string): Env {
  return {
    ASSETS: {
      fetch: async () => new Response("body", { headers: { "content-type": contentType } }),
    },
  } as unknown as Env;
}

const fetchPath = (path: string, env: Env) =>
  handler.fetch(new Request(`https://pizzateig.test${path}`), env, ctx);

describe("worker routing", () => {
  it("serves /healthz uncached", async () => {
    const res = await fetchPath("/healthz", envWith("text/html"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 404 JSON for unknown /api/ paths", async () => {
    const res = await fetchPath("/api/anything", envWith("text/html"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });
});

describe("worker security headers", () => {
  it("sets CSP and hardening headers on HTML responses", async () => {
    const res = await fetchPath("/", envWith("text/html; charset=utf-8"));
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/]+='/);
    expect(await res.text()).toBe("body");
  });

  it("sets nosniff but no CSP on non-HTML assets", async () => {
    const res = await fetchPath("/assets/index.css", envWith("text/css"));
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
    expect(res.headers.get("Permissions-Policy")).toBeNull();
  });
});
