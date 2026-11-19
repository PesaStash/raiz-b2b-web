import { NextRequest, NextResponse } from "next/server";
import { bankNameFromLookup, isRoutingNumber, RoutingLookupError } from "@/lib/routingNumber";
import { isTrustedClientRequest } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const HOST = "routing-number-bank-lookup.p.rapidapi.com";

const json = (status: number, body: unknown) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

/** Looks up the bank behind a US routing number. The RapidAPI key stays on the server. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routingNumber: string }> },
) {
  if (!isTrustedClientRequest((name) => request.headers.get(name), request.nextUrl.origin)) {
    return json(403, { message: "Request blocked." });
  }

  const { routingNumber } = await params;
  if (!isRoutingNumber(routingNumber)) {
    return json(400, { message: "Enter a valid 9-digit routing number" });
  }

  const key = process.env.RAPIDAPI_KEY;
  if (!key) return json(503, { message: "The routing number lookup isn't set up" });

  let response: Response;
  try {
    response = await fetch(
      `https://${HOST}/api/v1/${encodeURIComponent(routingNumber)}?paymentType=wire&format=json`,
      {
        headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": HOST },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return json(502, { message: "Lookup failed" });
  }

  if (response.status === 404) return json(200, { name: null });
  if (!response.ok) return json(502, { message: `Lookup failed (${response.status})` });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return json(502, { message: "Unexpected lookup answer" });
  }

  try {
    return json(200, { name: bankNameFromLookup(body) });
  } catch (error) {
    if (error instanceof RoutingLookupError) return json(502, { message: error.message });
    throw error;
  }
}
