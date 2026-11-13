/** File rules for the app's own API routes. Pure functions for `node --test`. */

const S3_HOST = /^([a-z0-9][a-z0-9.-]*\.)?s3([.-][a-z0-9-]+)*\.amazonaws\.com$/;

/**
 * Payment proofs are only fetched from S3 (and any hosts listed in
 * PAYMENT_PROOF_ALLOWED_HOSTS), over https, on the default port. This keeps the
 * download route from being used to reach internal or arbitrary addresses.
 */
export function isAllowedProofUrl(value: string, extraHosts: string[] = []): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.port || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const extras = extraHosts.map((h) => h.trim().toLowerCase()).filter(Boolean);
  return S3_HOST.test(host) || extras.includes(host) ? url : null;
}

/** File name for the download, from the URL's last segment or the content type. */
export function proofFilename(url: URL, contentType: string | null): string {
  try {
    const last = decodeURIComponent(url.pathname.split("/").pop() || "");
    const safe = last.replace(/[^A-Za-z0-9._-]/g, "_");
    if (safe.includes(".") && safe.length <= 120) return safe;
  } catch {
    // Fall through to a generated name.
  }
  if (contentType?.includes("pdf")) return "payment-proof.pdf";
  if (contentType?.includes("png")) return "payment-proof.png";
  if (contentType?.includes("webp")) return "payment-proof.webp";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "payment-proof.jpg";
  return "payment-proof";
}
