import { NextRequest, NextResponse } from "next/server";
import { PAYSTACK_CALLBACK_PATH } from "@/lib/paystackCardCollection";
import { clearSession, readSessionToken } from "@/lib/server/auth";
import { LEGACY_TOKEN_COOKIE, SESSION_COOKIE } from "@/lib/server/session";

const SIGN_IN = "/login";

/**
 * Route guard for dashboard pages (Next.js 16 "proxy", formerly middleware).
 * Checks that the httpOnly session cookie exists and has not expired.
 * RaizServer still validates the token on every API call.
 */
export function proxy(request: NextRequest) {
  // Mobile users return here from Paystack without a web session and are
  // handed back to the app; the page itself never confirms payment.
  if (request.nextUrl.pathname.replace(/\/$/, "") === PAYSTACK_CALLBACK_PATH) {
    return NextResponse.next();
  }

  if (!readSessionToken(request)) {
    const response = NextResponse.redirect(new URL(SIGN_IN, request.url));
    if (request.cookies.has(SESSION_COOKIE) || request.cookies.has(LEGACY_TOKEN_COOKIE)) {
      clearSession(response, request);
    }
    return response;
  }

  const response = NextResponse.next();
  // Tokens from before the proxy were readable by scripts; drop them.
  if (request.cookies.has(LEGACY_TOKEN_COOKIE)) response.cookies.delete(LEGACY_TOKEN_COOKIE);
  return response;
}

export const config = {
  matcher: [
    "/",
    "/settings/:path*",
    "/team/:path*",
    "/transactions/:path*",
    "/analytics/:path*",
    "/invoice/:path*",
    "/customers/:path*",
    "/bill-requests/:path*",
    "/gateway/:path*",
    "/developers/:path*",
    "/fund-wallet/:path*",
  ],
};
