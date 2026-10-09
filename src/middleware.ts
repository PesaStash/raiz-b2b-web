import { NextRequest, NextResponse } from "next/server";
import { PAYSTACK_CALLBACK_PATH } from "@/lib/paystackCardCollection";

const ROUTES = {
  SIGNIN: "/login",
  UNAUTHORIZED: "/not-authorized",
} as const;

export async function middleware(request: NextRequest) {
  try {
    // Mobile users return here from Paystack without a web session and are
    // handed back to the app; the page itself never confirms payment.
    if (request.nextUrl.pathname.replace(/\/$/, "") === PAYSTACK_CALLBACK_PATH) {
      return NextResponse.next();
    }

    // Check for access token
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.redirect(new URL(ROUTES.SIGNIN, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL(ROUTES.UNAUTHORIZED, request.url));
  }
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
    "/gateway",
    "/gateway/:path*",
    "/developers",
    "/developers/:path*",
    "/fund-wallet/:path*",
  ],
};
