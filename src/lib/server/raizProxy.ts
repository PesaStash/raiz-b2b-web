/**
 * Rules for the same-origin RaizServer proxy (/api/raiz). Pure functions only
 * so they can be unit tested with `node --test`.
 */

/** RaizServer path prefixes the web app is allowed to reach through the proxy. */
export const ALLOWED_PATH_PREFIXES = [
  "/business/",
  "/b2b/",
  "/countries/",
  "/transactions/",
  "/raiz-payments/",
  "/util/",
  // Card top-up / pay-in intents. Despite the prefix these are user-facing
  // RaizServer endpoints authenticated with the business user's token.
  "/admin/transaction/topup/",
  "/admin/transaction/payins/",
] as const;

/** Successful responses from these paths carry a new access token. */
export const LOGIN_PATHS = new Set(["/business/auth/login/otp/"]);
/** RaizServer expects the token being revoked as a `token` query parameter. */
export const LOGOUT_PATH = "/business/auth/logout/";

/** Request headers forwarded to RaizServer. Everything else is dropped. */
export const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "idempotency-key",
  "user-agent",
] as const;

/** Response headers passed back to the browser. Set-Cookie is never passed through. */
export const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "content-language",
] as const;

const SAFE_PATH = /^\/[A-Za-z0-9._~%\-/]*$/;

export function normalisePath(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * Validates the requested RaizServer path and returns the full upstream URL,
 * or null when the path is not allowed.
 */
export function resolveUpstreamUrl(
  baseUrl: string | undefined,
  path: string | null | undefined,
  search = "",
): URL | null {
  if (!baseUrl || !path) return null;
  if (!SAFE_PATH.test(path)) return null;
  if (path.includes("//")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (decoded.split("/").some((segment) => segment === "." || segment === "..")) return null;
  if (/[\\\u0000-\u001f]/.test(decoded) || decoded.includes("//")) return null;
  const checked = normalisePath(path);
  if (!ALLOWED_PATH_PREFIXES.some((prefix) => checked.startsWith(prefix))) return null;

  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return null;
  }
  const basePath = base.pathname.replace(/\/$/, "");
  const url = new URL(`${base.origin}${basePath}${path}`);
  if (url.origin !== base.origin || !url.pathname.startsWith(`${basePath}/`)) return null;
  if (search) url.search = search.startsWith("?") ? search : `?${search}`;
  return url;
}

export function isLoginPath(path: string): boolean {
  return LOGIN_PATHS.has(normalisePath(path));
}

export function isLogoutPath(path: string): boolean {
  return normalisePath(path) === LOGOUT_PATH;
}

/**
 * Takes the token out of a login response so it never reaches page scripts.
 * Returns the token (if any) and the body to send to the browser.
 */
export function extractLoginToken(body: unknown): { token: string | null; body: unknown } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { token: null, body };
  const record = body as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : null;
  const token =
    typeof record.access_token === "string"
      ? record.access_token
      : typeof nested?.access_token === "string"
        ? (nested.access_token as string)
        : null;
  if (!token) return { token: null, body };
  const strip = (value: Record<string, unknown>) => {
    const copy = { ...value };
    delete copy.access_token;
    delete copy.refresh_token;
    return copy;
  };
  const cleaned = strip(record);
  if (nested) cleaned.data = strip(nested);
  return { token, body: cleaned };
}
