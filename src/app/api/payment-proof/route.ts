import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MAX_PROOF_BYTES = 15 * 1024 * 1024;

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return true;

  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function filenameFromProof(url: string, contentType: string | null) {
  try {
    const lastSegment = decodeURIComponent(
      new URL(url).pathname.split("/").pop() || "",
    );
    if (lastSegment && lastSegment.includes(".")) return lastSegment;
  } catch {
    // Fall through to a generated name.
  }

  if (contentType?.includes("pdf")) return "payment-proof.pdf";
  if (contentType?.includes("png")) return "payment-proof.png";
  if (contentType?.includes("webp")) return "payment-proof.webp";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
    return "payment-proof.jpg";
  }

  return "payment-proof";
}

export async function POST(request: NextRequest) {
  const accessToken = (await cookies()).get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let proofUrl = "";
  try {
    const body = (await request.json()) as { url?: string };
    proofUrl = body.url?.trim() || "";
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(proofUrl);
  } catch {
    return NextResponse.json({ message: "Invalid proof URL" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || isPrivateHostname(parsed.hostname)) {
    return NextResponse.json({ message: "Invalid proof URL" }, { status: 400 });
  }

  const upstream = await fetch(proofUrl, { redirect: "follow" });
  if (!upstream.ok) {
    return NextResponse.json(
      { message: "Unable to download payment proof" },
      { status: 502 },
    );
  }

  const contentLength = Number(upstream.headers.get("content-length") || 0);
  if (contentLength > MAX_PROOF_BYTES) {
    return NextResponse.json(
      { message: "Payment proof is too large" },
      { status: 413 },
    );
  }

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > MAX_PROOF_BYTES) {
    return NextResponse.json(
      { message: "Payment proof is too large" },
      { status: 413 },
    );
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  const filename = filenameFromProof(proofUrl, contentType);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
