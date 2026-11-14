import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, clearSession, readSessionToken, setSession } from "@/lib/server/auth";
import {
  ANONYMOUS_HEADER,
  clientIpFromHeaders,
  isTrustedClientRequest,
  PATH_HEADER,
} from "@/lib/server/session";
import {
  extractLoginToken,
  FORWARDED_REQUEST_HEADERS,
  FORWARDED_RESPONSE_HEADERS,
  isLoginPath,
  isLogoutPath,
  resolveUpstreamUrl,
} from "@/lib/server/raizProxy";

/**
 * Same-origin proxy to RaizServer. The browser never holds the access token:
 * this route reads it from the httpOnly session cookie and adds the
 * Authorization header. The RaizServer path comes from the x-raiz-path header
 * so trailing slashes survive Next.js URL normalisation.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (status: number, message: string) =>
  NextResponse.json({ message }, { status, headers: { "cache-control": "no-store" } });

async function handle(request: NextRequest): Promise<NextResponse> {
  const get = (name: string) => request.headers.get(name);
  if (!isTrustedClientRequest(get, request.nextUrl.origin)) {
    return json(403, "Request blocked.");
  }

  const path = request.headers.get(PATH_HEADER);
  const upstream = resolveUpstreamUrl(apiBaseUrl(), path, request.nextUrl.search);
  if (!upstream || !path) return json(400, "Unknown API path.");

  const anonymous = request.headers.get(ANONYMOUS_HEADER) === "1";
  const token = anonymous ? null : readSessionToken(request);
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (token) headers.set("authorization", `Bearer ${token}`);
  const ip = clientIpFromHeaders(get);
  if (ip) headers.set("ip-address", ip);

  const logout = isLogoutPath(path);
  if (logout && token) upstream.searchParams.set("token", token);

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstream, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    const response = json(timedOut ? 504 : 502, timedOut ? "The server took too long to respond." : "Could not reach the server.");
    return logout ? clearSession(response, request) : response;
  }

  const responseHeaders = new Headers({ "cache-control": "no-store" });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstreamResponse.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  // Login: move the token into the httpOnly cookie and out of the body.
  if (isLoginPath(path) && upstreamResponse.ok) {
    const text = await upstreamResponse.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    const { token: newToken, body } = extractLoginToken(parsed);
    if (!newToken) {
      return new NextResponse(text, { status: upstreamResponse.status, headers: responseHeaders });
    }
    responseHeaders.set("content-type", "application/json");
    const response = new NextResponse(JSON.stringify(body), {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
    return setSession(response, request, newToken);
  }

  const status = upstreamResponse.status;
  // Upstream redirects are not followed or exposed to the browser.
  if (status >= 300 && status < 400) return json(502, "Unexpected redirect from the server.");

  const response = new NextResponse(status === 204 ? null : upstreamResponse.body, {
    status,
    headers: responseHeaders,
  });
  if (logout || (status === 401 && token)) clearSession(response, request);
  return response;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
