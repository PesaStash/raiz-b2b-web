import test from "node:test";
import assert from "node:assert/strict";
import {
  PAYSTACK_POLL_INTERVAL_MS,
  PAYSTACK_POLL_MAX_BACKOFF_MS,
  RAIZ_APP_RETURN_URL,
  isMobileUserAgent,
  caretAfterSignificantChars,
  createIdempotencyKeyTracker,
  extractPaystackCallbackReference,
  formatAmountInput,
  formatDecimalMoney,
  stripPaystackCallbackParams,
  isRetryableStatusError,
  isTerminalViewState,
  isUnexpectedStatusCombination,
  mapPaystackCollectionError,
  nextPollDelay,
  normalizePaystackAmount,
  paymentViewState,
} from "../src/lib/paystackCardCollection.ts";
import {
  buildPendingPaystackCheckout,
  clearPendingPaystackCheckout,
  getPaystackCheckoutKey,
  loadPendingPaystackCheckout,
  pendingCheckoutFromStatus,
  savePendingPaystackCheckout,
} from "../src/lib/paystackCheckoutSession.ts";
import { canMakeRequest } from "../src/lib/permissions.ts";

const memoryStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    map,
  };
};

const initializeResponse = {
  collection_id: "b8aff692-e67b-4f17-82f1-5be687764630",
  reference: "ps_ngn_9c13c2f03ce44cc6a2a535584ba4a67f",
  authorization_url: "https://checkout.paystack.com/example",
  principal_amount: "50000.00",
  fee_amount: "862.96",
  total_amount: "50862.96",
  currency: "NGN",
  status: "pending",
};

test("amounts normalize to two-decimal strings and reject invalid input", () => {
  assert.equal(normalizePaystackAmount("50000"), "50000.00");
  assert.equal(normalizePaystackAmount("50,000.5"), "50000.50");
  assert.equal(normalizePaystackAmount(" 0012.34 "), "12.34");
  assert.equal(normalizePaystackAmount("0.01"), "0.01");
  for (const bad of ["", "0", "0.00", "-5", "1.234", "abc", ".5", "1e3"]) {
    assert.equal(normalizePaystackAmount(bad), null, bad);
  }
});

test("typed amounts are grouped for display and keep the caret position", () => {
  assert.equal(formatAmountInput(""), "");
  assert.equal(formatAmountInput("5"), "5");
  assert.equal(formatAmountInput("1234"), "1,234");
  assert.equal(formatAmountInput("1234567.5"), "1,234,567.5");
  assert.equal(formatAmountInput("50000."), "50,000.");
  assert.equal(formatAmountInput(".5"), ".5");
  assert.equal(formatAmountInput("0.25"), "0.25");
  assert.equal(normalizePaystackAmount(formatAmountInput("1234567.5")), "1234567.50");
  assert.equal(caretAfterSignificantChars("1,234", 2), 3);
  assert.equal(caretAfterSignificantChars("1,234", 1), 1);
  assert.equal(caretAfterSignificantChars("1,234", 0), 0);
  assert.equal(caretAfterSignificantChars("1,234", 9), 5);
});

test("money formatting preserves backend decimal strings exactly", () => {
  assert.equal(formatDecimalMoney("50862.96"), "₦50,862.96");
  assert.equal(formatDecimalMoney("1234567.5"), "₦1,234,567.50");
  assert.equal(formatDecimalMoney("100"), "₦100.00");
  assert.equal(formatDecimalMoney("0.105"), "₦0.105");
});

test("only completed + credited is success; unknown combinations stay processing", () => {
  assert.equal(paymentViewState({ status: "completed", settlement_status: "credited" }), "success");
  assert.equal(paymentViewState({ status: "completed", settlement_status: "unsettled" }), "processing");
  assert.equal(paymentViewState({ status: "pending", settlement_status: "unsettled" }), "processing");
  assert.equal(paymentViewState({ status: "failed", settlement_status: "unsettled" }), "failed");
  assert.equal(paymentViewState({ status: "review", settlement_status: "review" }), "review");
  assert.equal(paymentViewState({ status: "disputed", settlement_status: "credited" }), "disputed");
  assert.equal(paymentViewState({ status: "refunded", settlement_status: "credited" }), "processing");
  assert.equal(isTerminalViewState("processing"), false);
  for (const state of ["success", "failed", "review", "disputed"]) {
    assert.equal(isTerminalViewState(state), true);
  }
  assert.equal(isUnexpectedStatusCombination({ status: "completed", settlement_status: "unsettled" }), true);
  assert.equal(isUnexpectedStatusCombination({ status: "mystery", settlement_status: "unsettled" }), true);
  assert.equal(isUnexpectedStatusCombination({ status: "pending", settlement_status: "unsettled" }), false);
});

test("polling backs off only for temporary failures and stays bounded", () => {
  assert.equal(nextPollDelay(0), PAYSTACK_POLL_INTERVAL_MS);
  assert.equal(nextPollDelay(1), PAYSTACK_POLL_INTERVAL_MS * 2);
  assert.equal(nextPollDelay(10), PAYSTACK_POLL_MAX_BACKOFF_MS);
  assert.equal(isRetryableStatusError(undefined), true);
  assert.equal(isRetryableStatusError(502), true);
  assert.equal(isRetryableStatusError(404), false);
  assert.equal(isRetryableStatusError(403), false);
});

test("idempotency key is stable per payload and renewed for a new attempt", () => {
  let n = 0;
  const tracker = createIdempotencyKeyTracker(() => `key-${++n}`);
  const payload = { wallet_id: "w1", amount: "100.00" };
  const first = tracker.keyFor(payload);
  assert.equal(tracker.keyFor({ ...payload }), first);
  const changed = tracker.keyFor({ ...payload, amount: "200.00" });
  assert.notEqual(changed, first);
  tracker.reset();
  assert.notEqual(tracker.keyFor({ ...payload, amount: "200.00" }), changed);
});

const err = (status, detail) => ({ status, data: { detail } });

test("documented backend errors map to intentional UI states", () => {
  const cases = [
    [err(400, "Please select an NGN wallet"), "wallet_reselect"],
    [err(400, "Card collection amount exceeds the limit"), "amount_limit"],
    [err(401, "Account not found"), "auth"],
    [err(403, "Account is frozen"), "account_restricted"],
    [err(403, "Account is restricted"), "account_restricted"],
    [err(403, "Completed KYB is required for card collections"), "verification_required"],
    [err(403, "Completed KYC is required for card collections"), "verification_required"],
    [err(403, "Wallet does not belong to account"), "wallet_reselect"],
    [err(403, "Wallet is restricted"), "wallet_restricted"],
    [err(404, "Wallet not found"), "wallet_reselect"],
    [err(404, "Card collection not found"), "collection_not_found"],
    [err(409, "Wallet is not ready for transactions"), "wallet_not_ready"],
    [err(409, "Possible duplicate transaction"), "duplicate"],
    [err(429, "Too many card collection attempts"), "rate_limited"],
    [err(429, "Card collection rolling limit reached"), "rate_limited"],
    [err(502, "Unable to initialize card collection"), "provider_unavailable"],
    [err(503, "NGN card collections are not configured"), "not_configured"],
    [new Error("Network Error"), "network"],
  ];
  for (const [input, kind] of cases) {
    assert.equal(mapPaystackCollectionError(input).kind, kind, JSON.stringify(input));
  }
  assert.equal(
    mapPaystackCollectionError(err(400, "Card collection amount exceeds the limit")).message,
    "Card collection amount exceeds the limit",
  );
  assert.equal(mapPaystackCollectionError(err(502, "x")).canRetry, true);
  assert.equal(mapPaystackCollectionError(err(429, "x")).canRetry, false);
  assert.equal(
    mapPaystackCollectionError({ response: { status: 503, data: { detail: "x" } } }).kind,
    "not_configured",
  );
});

test("422 validation details become field errors", () => {
  const mapped = mapPaystackCollectionError(
    err(422, [
      { loc: ["body", "amount"], msg: "Decimal input should have no more than 2 decimal places", type: "decimal" },
      { loc: ["body", "description"], msg: "String should have at most 255 characters", type: "string" },
    ]),
  );
  assert.equal(mapped.kind, "validation");
  assert.match(mapped.fieldErrors.amount, /2 decimal places/);
  assert.match(mapped.fieldErrors.description, /255/);
});

test("recovery record stores only safe fields and is isolated per business entity", () => {
  const storage = memoryStorage();
  const record = buildPendingPaystackCheckout(initializeResponse, "wallet-1", new Date("2026-10-07T10:00:00Z"));
  assert.equal(record.actor, "business");
  assert.equal(record.started_at, "2026-10-07T10:00:00.000Z");
  assert.equal("authorization_url" in record, false);

  assert.equal(savePendingPaystackCheckout("entity-a", record, storage), true);
  assert.equal(storage.map.get(getPaystackCheckoutKey("entity-a")).includes("checkout.paystack.com"), false);
  assert.deepEqual(loadPendingPaystackCheckout("entity-a", storage), record);
  assert.equal(loadPendingPaystackCheckout("entity-b", storage), null);

  clearPendingPaystackCheckout("entity-a", storage);
  assert.equal(loadPendingPaystackCheckout("entity-a", storage), null);
});

test("malformed or personal recovery records are discarded", () => {
  const storage = memoryStorage();
  storage.setItem(getPaystackCheckoutKey("entity-a"), "{not json");
  assert.equal(loadPendingPaystackCheckout("entity-a", storage), null);
  assert.equal(storage.map.size, 0);

  const personal = { ...buildPendingPaystackCheckout(initializeResponse, "w"), actor: "personal" };
  storage.setItem(getPaystackCheckoutKey("entity-a"), JSON.stringify(personal));
  assert.equal(loadPendingPaystackCheckout("entity-a", storage), null);
  assert.equal(loadPendingPaystackCheckout(undefined, storage), null);
});

test("Paystack redirect parameters are recognised on any route and stripped", () => {
  const search = "?trxref=ps_ngn_829cbac572ca4d7894692f24910cbb1e&reference=ps_ngn_829cbac572ca4d7894692f24910cbb1e";
  assert.equal(extractPaystackCallbackReference(search), "ps_ngn_829cbac572ca4d7894692f24910cbb1e");
  assert.equal(extractPaystackCallbackReference("?trxref=ps_ngn_abcdef123456"), "ps_ngn_abcdef123456");
  assert.equal(extractPaystackCallbackReference("?reference=../../admin"), null);
  assert.equal(extractPaystackCallbackReference("?reference=T123456789"), null);
  assert.equal(extractPaystackCallbackReference(""), null);
  assert.equal(stripPaystackCallbackParams(search), "");
  assert.equal(stripPaystackCallbackParams("?tab=wallets&reference=ps_ngn_abcdef123456"), "?tab=wallets");
});

test("mobile return link is the generic app link with no parameters", () => {
  assert.equal(RAIZ_APP_RETURN_URL, "raizapp://");
  const url = new URL(RAIZ_APP_RETURN_URL);
  assert.equal(url.protocol, "raizapp:");
  assert.equal(url.search, "");
  assert.equal(url.hash, "");
  assert.equal(RAIZ_APP_RETURN_URL.includes("ps_ngn_"), false);
});

test("phones and tablets get the app handoff; desktops do not", () => {
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
  const android = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36";
  const macSafari = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
  const windows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36";
  assert.equal(isMobileUserAgent(iphone), true);
  assert.equal(isMobileUserAgent(android), true);
  assert.equal(isMobileUserAgent(macSafari, 5), true);
  assert.equal(isMobileUserAgent(macSafari, 0), false);
  assert.equal(isMobileUserAgent(windows), false);
});

test("callback without local state builds a display-only record from backend status", () => {
  const record = pendingCheckoutFromStatus({
    ...initializeResponse,
    settlement_status: "unsettled",
    transaction_report_id: null,
    paid_at: null,
    credited_at: null,
  });
  assert.equal(record.reference, initializeResponse.reference);
  assert.equal(record.principal_amount, "50000.00");
  assert.equal(record.wallet_id, "");
  const storage = memoryStorage();
  savePendingPaystackCheckout("entity-a", record, storage);
  assert.equal(loadPendingPaystackCheckout("entity-a", storage), null);
});

test("initialize requires business write access; status reads are open to active roles", () => {
  const initialize = "/business/transactions/collections/paystack/card/initialize/";
  const status = "/business/transactions/collections/paystack/card/ps_ngn_1/status/";
  for (const role of ["owner", "admin", "developer"]) {
    const profile = { role, active: true };
    assert.equal(canMakeRequest(profile, "POST", initialize), role !== "developer");
    assert.equal(canMakeRequest(profile, "GET", status), true);
  }
});
