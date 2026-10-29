import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/server/auth";
import { isTrustedClientRequest } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Ends the local session (clears the httpOnly cookie) without calling RaizServer. */
export async function DELETE(request: NextRequest) {
  if (!isTrustedClientRequest((name) => request.headers.get(name), request.nextUrl.origin)) {
    return NextResponse.json({ message: "Request blocked." }, { status: 403 });
  }
  return clearSession(new NextResponse(null, { status: 204 }), request);
}
