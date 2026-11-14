import type { InternalAxiosRequestConfig } from "axios";

/** Same-origin proxy that forwards to RaizServer and attaches the session token. */
export const API_PROXY_URL = "/api/raiz";
const PATH_HEADER = "x-raiz-path";
const CLIENT_HEADER = "x-raiz-client";
const ANONYMOUS_HEADER = "x-raiz-anonymous";

/** RaizServer path (without query) for a request config, before or after routing. */
export function requestPath(config?: Pick<InternalAxiosRequestConfig, "url" | "headers">): string {
  const routed = config?.headers?.[PATH_HEADER];
  if (typeof routed === "string") return routed;
  return new URL(config?.url ?? "/", "https://local.invalid").pathname;
}

/**
 * Points a request at the proxy: the RaizServer path travels in a header and
 * any query string written into the URL stays on the URL. Anonymous requests
 * are sent without the session token, as before the proxy existed.
 */
export function routeThroughProxy(
  config: InternalAxiosRequestConfig,
  options: { anonymous?: boolean } = {},
): InternalAxiosRequestConfig {
  if (config.headers[PATH_HEADER]) return config; // already routed (retry)
  const url = new URL(config.url ?? "/", "https://local.invalid");
  config.baseURL = undefined;
  config.url = `${API_PROXY_URL}${url.search}`;
  config.headers[PATH_HEADER] = url.pathname;
  config.headers[CLIENT_HEADER] = "web";
  if (options.anonymous) config.headers[ANONYMOUS_HEADER] = "1";
  return config;
}
