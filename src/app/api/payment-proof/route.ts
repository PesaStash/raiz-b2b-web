import { NextRequest, NextResponse } from "next/server";
import { readSessionToken, verifySession } from "@/lib/server/auth";
import { isTrustedClientRequest } from "@/lib/server/session";
import { isAllowedProofUrl, proofFilename } from "@/lib/server/files";

export const dynamic = "force-dynamic";

const MAX_PROOF_BYTES = 15 * 1024 * 1024;
const PROOF_CONTENT_TYPES = /^(image\/(jpeg|png|webp|gif)|application\/pdf|application\/octet-stream|binary\/octet-stream)/i;

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

/** Downloads a payment proof from S3 for a signed-in user (the browser cannot due to CORS). */
export async function POST(request: NextRequest) {
  if (!isTrustedClientRequest((name) => request.headers.get(name), request.nextUrl.origin)) {
    return fail(403, "Request blocked.");
  }
  const token = readSessionToken(request);
  if (!token || !(await verifySession(token))) return fail(401, "Unauthorized");

  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return fail(400, "Invalid request");
  }

  const extraHosts = (process.env.PAYMENT_PROOF_ALLOWED_HOSTS ?? "").split(",");
  const proofUrl = isAllowedProofUrl(body.url?.trim() ?? "", extraHosts);
  if (!proofUrl) return fail(400, "Invalid proof URL");

  let upstream: Response;
  try {
    upstream = await fetch(proofUrl, {
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return fail(502, "Unable to download payment proof");
  }
  if (!upstream.ok) return fail(502, "Unable to download payment proof");

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  if (!PROOF_CONTENT_TYPES.test(contentType)) return fail(415, "Unsupported payment proof type");

  const declaredLength = Number(upstream.headers.get("content-length") || 0);
  if (declaredLength > MAX_PROOF_BYTES) return fail(413, "Payment proof is too large");

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > MAX_PROOF_BYTES) return fail(413, "Payment proof is too large");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${proofFilename(proofUrl, contentType)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
