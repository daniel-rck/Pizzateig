export interface Env {
  ASSETS: Fetcher;
}

/**
 * Content-Security-Policy for the HTML shell. The app is fully self-contained
 * (no CDNs, no external requests), and the pre-paint theme script lives in
 * /theme-init.js rather than inline — so `script-src` needs no hash allowance
 * and never falls out of sync with the snippet.
 * 'unsafe-inline' for styles covers React inline style attributes.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

/** Add security headers to a static-asset response (CSP only on HTML). */
function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if ((headers.get("content-type") ?? "").includes("text/html")) {
    headers.set("Content-Security-Policy", CSP);
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, ctx);
    }

    // Fall through to Workers Assets (static SPA bundle).
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;

async function handleApi(_request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
  return Response.json({ error: "not_found" }, { status: 404 });
}
