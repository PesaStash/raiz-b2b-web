import { NextRequest, NextResponse } from "next/server";

const ROUTES = {
  SIGNIN: "/login",
  UNAUTHORIZED: "/not-authorized",
} as const;

export async function middleware(request: NextRequest) {
  try {
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
    "/transactions/:path*",
    "/analytics/:path*",
    "/invoice/:path*",
    "/customers/:path*",
  ],
};
