import type { NextRequest, NextResponse } from "next/server";
import {
  clearedSessionCookies,
  isTokenUsable,
  SESSION_COOKIE,
  sessionCookies,
  type CookieSpec,
} from "./session";

/** RaizServer base URL. Server-only; NEXT_PUBLIC_BASE_URL is the legacy fallback. */
export function apiBaseUrl(): string | undefined {
  return process.env.RAIZ_API_URL || process.env.NEXT_PUBLIC_BASE_URL || undefined;
}

export function isSecureRequest(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
}

/** The session token from the httpOnly cookie, if present and not expired. */
export function readSessionToken(request: NextRequest): string | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return isTokenUsable(token) ? token! : null;
}

function apply(response: NextResponse, cookies: CookieSpec[]) {
  for (const cookie of cookies) response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

export function setSession(response: NextResponse, request: NextRequest, token: string) {
  return apply(response, sessionCookies(token, isSecureRequest(request)));
}

export function clearSession(response: NextResponse, request: NextRequest) {
  return apply(response, clearedSessionCookies(isSecureRequest(request)));
}

/**
 * Confirms with RaizServer that the token belongs to an active business user.
 * Used by the app's own API routes before they touch S3 or fetch files.
 */
export async function verifySession(token: string): Promise<boolean> {
  const base = apiBaseUrl();
  if (!base) return false;
  try {
    const response = await fetch(new URL("/business/account_user/me", base), {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
