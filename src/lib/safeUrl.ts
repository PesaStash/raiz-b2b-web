/**
 * Returns the URL only when it is an absolute https link, so a bad value from
 * an API response (for example a `javascript:` URL) is never navigated to.
 */
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
