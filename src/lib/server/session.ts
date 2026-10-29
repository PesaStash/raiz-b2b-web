/**
 * Server-side session rules. Pure functions only (no Next.js imports) so they
 * can be unit tested with `node --test`.
 *
 * The RaizServer access token lives in an httpOnly cookie that page scripts
 * cannot read. Browser code only sees a non-secret hint cookie that says a
 * session exists, which it uses for UI decisions. Every API call goes through
 * the same-origin proxy at /api/raiz, which attaches the token server-side.
 */

/** httpOnly cookie holding the RaizServer access token. */
export const SESSION_COOKIE = "raiz_session";
/** Readable cookie with no secret in it: "1" while a session exists. */
export const SESSION_HINT_COOKIE = "raiz_auth";
/** Cookie the app used before the proxy; readable by scripts, so always cleared. */
export const LEGACY_TOKEN_COOKIE = "access_token";

/** Header the web client sends on every proxied call (CSRF guard). */
export const CLIENT_HEADER = "x-raiz-client";
export const CLIENT_HEADER_VALUE = "web";
/** Header asking the proxy not to attach the session token (public calls). */
export const ANONYMOUS_HEADER = "x-raiz-anonymous";
/** Header carrying the RaizServer path the proxy should call. */
export const PATH_HEADER = "x-raiz-path";

const DEFAULT_SESSION_SECONDS = 24 * 60 * 60;
const MAX_SESSION_SECONDS = 7 * 24 * 60 * 60;

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Reads the `exp` claim (seconds since epoch) without verifying the signature.
 * Only used to decide cookie lifetime and to skip obviously expired sessions;
 * RaizServer remains the authority on whether a token is valid.
 */
export function readTokenExpiry(token: string | undefined | null): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: unknown };
    return typeof payload.exp === "number" && Number.isFinite(payload.exp) ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True when the token is present and not past its `exp` (tokens without `exp` count as usable). */
export function isTokenUsable(token: string | undefined | null, nowMs = Date.now()): boolean {
  if (!token) return false;
  const exp = readTokenExpiry(token);
  if (exp === null) return true;
  return exp * 1000 > nowMs;
}

/** Cookie lifetime in seconds: until the token expires, capped, defaulting to one day. */
export function sessionMaxAge(token: string, nowMs = Date.now()): number {
  const exp = readTokenExpiry(token);
  if (exp === null) return DEFAULT_SESSION_SECONDS;
  const remaining = Math.floor(exp - nowMs / 1000);
  return Math.max(0, Math.min(remaining, MAX_SESSION_SECONDS));
}

export type CookieSpec = {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: "/";
    maxAge: number;
  };
};

/** The two cookies that make up a signed-in session. */
export function sessionCookies(token: string, secure: boolean, nowMs = Date.now()): CookieSpec[] {
  const maxAge = sessionMaxAge(token, nowMs);
  const base = { secure, sameSite: "lax" as const, path: "/" as const, maxAge };
  return [
    { name: SESSION_COOKIE, value: token, options: { ...base, httpOnly: true } },
    { name: SESSION_HINT_COOKIE, value: "1", options: { ...base, httpOnly: false } },
  ];
}

/** Cookies that end a session, including the legacy readable token cookie. */
export function clearedSessionCookies(secure: boolean): CookieSpec[] {
  const base = { secure, sameSite: "lax" as const, path: "/" as const, maxAge: 0 };
  return [SESSION_COOKIE, SESSION_HINT_COOKIE, LEGACY_TOKEN_COOKIE].map((name) => ({
    name,
    value: "",
    options: { ...base, httpOnly: name === SESSION_COOKIE },
  }));
}

type HeaderGetter = (name: string) => string | null | undefined;

/** Best-effort client IP from proxy headers (Vercel first). Never trusted for auth. */
export function clientIpFromHeaders(get: HeaderGetter): string | null {
  const candidates = [get("x-vercel-forwarded-for"), get("x-forwarded-for"), get("x-real-ip")];
  for (const value of candidates) {
    const first = value?.split(",")[0]?.trim();
    if (first && /^[0-9a-fA-F:.]{3,45}$/.test(first)) return first;
  }
  return null;
}

/**
 * CSRF guard for cookie-authenticated calls. Requires the custom client header
 * (which a cross-site form cannot send and a cross-site fetch cannot send
 * without a CORS preflight we never approve), and rejects requests whose
 * Origin or Sec-Fetch-Site says they came from another site.
 */
export function isTrustedClientRequest(get: HeaderGetter, requestOrigin: string): boolean {
  if (get(CLIENT_HEADER) !== CLIENT_HEADER_VALUE) return false;
  const site = get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = get("origin");
  if (origin && origin !== requestOrigin) return false;
  return true;
}
