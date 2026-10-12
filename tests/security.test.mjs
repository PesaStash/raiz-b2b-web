import test from "node:test";
import assert from "node:assert/strict";
import {
  clearedSessionCookies,
  clientIpFromHeaders,
  isTokenUsable,
  isTrustedClientRequest,
  readTokenExpiry,
  sessionCookies,
  sessionMaxAge,
} from "../src/lib/server/session.ts";
import {
  extractLoginToken,
  isLoginPath,
  isLogoutPath,
  resolveUpstreamUrl,
} from "../src/lib/server/raizProxy.ts";
import { isAllowedProofUrl, proofFilename } from "../src/lib/server/files.ts";
import { safeHttpsUrl } from "../src/lib/safeUrl.ts";

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const jwt = (payload) => `${b64({ alg: "HS256" })}.${b64(payload)}.sig`;
const NOW = Date.UTC(2026, 9, 12, 12, 0, 0);
const nowSec = NOW / 1000;
const headers = (map) => (name) => map[name] ?? null;

test("token expiry is read from the JWT and drives cookie lifetime", () => {
  assert.equal(readTokenExpiry(jwt({ exp: nowSec + 600 })), nowSec + 600);
  assert.equal(readTokenExpiry("not-a-jwt"), null);
  assert.equal(readTokenExpiry(undefined), null);
  assert.equal(isTokenUsable(jwt({ exp: nowSec + 600 }), NOW), true);
  assert.equal(isTokenUsable(jwt({ exp: nowSec - 1 }), NOW), false);
  assert.equal(isTokenUsable(jwt({}), NOW), true);
  assert.equal(isTokenUsable("", NOW), false);
  assert.equal(sessionMaxAge(jwt({ exp: nowSec + 600 }), NOW), 600);
  assert.equal(sessionMaxAge(jwt({}), NOW), 24 * 60 * 60);
  assert.equal(sessionMaxAge(jwt({ exp: nowSec + 365 * 86400 }), NOW), 7 * 86400);
});

test("session cookie is httpOnly; only the hint cookie is readable", () => {
  const [session, hint] = sessionCookies(jwt({ exp: nowSec + 60 }), true, NOW);
  assert.equal(session.name, "raiz_session");
  assert.equal(session.options.httpOnly, true);
  assert.equal(session.options.secure, true);
  assert.equal(session.options.sameSite, "lax");
  assert.equal(hint.name, "raiz_auth");
  assert.equal(hint.value, "1");
  assert.equal(hint.options.httpOnly, false);
  const cleared = clearedSessionCookies(true);
  assert.deepEqual(cleared.map((c) => c.name), ["raiz_session", "raiz_auth", "access_token"]);
  assert.ok(cleared.every((c) => c.options.maxAge === 0 && c.value === ""));
});

test("CSRF guard needs the client header and a same-origin request", () => {
  const origin = "https://business.raiz.app";
  assert.equal(isTrustedClientRequest(headers({ "x-raiz-client": "web" }), origin), true);
  assert.equal(
    isTrustedClientRequest(headers({ "x-raiz-client": "web", origin, "sec-fetch-site": "same-origin" }), origin),
    true,
  );
  assert.equal(isTrustedClientRequest(headers({}), origin), false);
  assert.equal(isTrustedClientRequest(headers({ "x-raiz-client": "web", origin: "https://evil.example" }), origin), false);
  assert.equal(isTrustedClientRequest(headers({ "x-raiz-client": "web", "sec-fetch-site": "cross-site" }), origin), false);
});

test("client IP comes from proxy headers and ignores junk", () => {
  assert.equal(clientIpFromHeaders(headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })), "203.0.113.9");
  assert.equal(clientIpFromHeaders(headers({ "x-vercel-forwarded-for": "2001:db8::1", "x-forwarded-for": "1.1.1.1" })), "2001:db8::1");
  assert.equal(clientIpFromHeaders(headers({ "x-forwarded-for": "<script>" })), null);
  assert.equal(clientIpFromHeaders(headers({})), null);
});

test("proxy only reaches allowed RaizServer paths on the configured host", () => {
  const base = "https://stageapi.raizserver.com";
  assert.equal(resolveUpstreamUrl(base, "/business/account_user/me")?.href, `${base}/business/account_user/me`);
  assert.equal(resolveUpstreamUrl(base, "/business/invoice/", "?page=2")?.href, `${base}/business/invoice/?page=2`);
  assert.equal(resolveUpstreamUrl(base, "/countries/")?.href, `${base}/countries/`);
  assert.equal(resolveUpstreamUrl(base, "/countries")?.href, `${base}/countries`);
  assert.ok(resolveUpstreamUrl(base, "/admin/transaction/topup/usd/confirm-intent/"));
  for (const bad of [
    "/admin/users/",
    "/internal/anything",
    "/business/../admin/users/",
    "/business/%2e%2e/admin/",
    "//evil.example/business/",
    "/business//x",
    "https://evil.example/business/",
    "/business/x\\y",
    "",
    null,
  ]) {
    assert.equal(resolveUpstreamUrl(base, bad), null, String(bad));
  }
  assert.equal(resolveUpstreamUrl(undefined, "/business/x/"), null);
  assert.equal(resolveUpstreamUrl("https://api.example.com/v1", "/business/x/")?.href, "https://api.example.com/v1/business/x/");
});

test("login responses lose their token before reaching the browser", () => {
  assert.equal(isLoginPath("/business/auth/login/otp/"), true);
  assert.equal(isLoginPath("/business/auth/login/otp"), true);
  assert.equal(isLoginPath("/business/auth/login/"), false);
  assert.equal(isLogoutPath("/business/auth/logout"), true);
  const top = extractLoginToken({ access_token: "t1", refresh_token: "r", user_id: "u" });
  assert.equal(top.token, "t1");
  assert.deepEqual(top.body, { user_id: "u" });
  const nested = extractLoginToken({ message: "ok", data: { access_token: "t2", id: 1 } });
  assert.equal(nested.token, "t2");
  assert.deepEqual(nested.body, { message: "ok", data: { id: 1 } });
  assert.deepEqual(extractLoginToken({ message: "otp sent" }), { token: null, body: { message: "otp sent" } });
  assert.equal(extractLoginToken(null).token, null);
});

test("payment proofs are only fetched from S3 or configured hosts", () => {
  assert.ok(isAllowedProofUrl("https://raiz-dev-assets.s3.us-east-1.amazonaws.com/proof.pdf"));
  assert.ok(isAllowedProofUrl("https://raizapp-mobile.s3.amazonaws.com/a/b.png"));
  assert.ok(isAllowedProofUrl("https://s3.eu-west-2.amazonaws.com/bucket/x.jpg"));
  assert.ok(isAllowedProofUrl("https://files.raiz.app/x.pdf", ["files.raiz.app"]));
  for (const bad of [
    "http://raiz-dev-assets.s3.amazonaws.com/x.pdf",
    "https://169.254.169.254/latest/meta-data/",
    "https://localhost/x",
    "https://evil.example/x.pdf",
    "https://amazonaws.com.evil.example/x",
    "https://raiz.s3.amazonaws.com:8443/x",
    "https://user:pass@raiz.s3.amazonaws.com/x",
    "not a url",
  ]) {
    assert.equal(isAllowedProofUrl(bad), null, bad);
  }
  assert.equal(proofFilename(new URL("https://b.s3.amazonaws.com/a/receipt%201.pdf"), null), "receipt_1.pdf");
  assert.equal(proofFilename(new URL("https://b.s3.amazonaws.com/a/blob"), "image/png"), "payment-proof.png");
});

test("external redirects only follow https URLs", () => {
  assert.equal(safeHttpsUrl("https://checkout.paystack.com/abc"), "https://checkout.paystack.com/abc");
  assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpsUrl("http://checkout.paystack.com/abc"), null);
  assert.equal(safeHttpsUrl("/relative"), null);
  assert.equal(safeHttpsUrl(undefined), null);
});
