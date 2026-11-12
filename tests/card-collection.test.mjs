import test from "node:test";
import assert from "node:assert/strict";
import {
  CARD_POLL_INTERVAL_MS,
  CARD_POLL_MAX_BACKOFF_MS,
  RAIZ_APP_RETURN_URL,
  isMobileUserAgent,
  caretAfterSignificantChars,
  createIdempotencyKeyTracker,
  extractCardCallbackReference,
  formatAmountInput,
  formatDecimalMoney,
  stripCardCallbackParams,
  isRetryableStatusError,
  isTerminalViewState,
  isUnexpectedStatusCombination,
  mapCardCollectionError,
  nextPollDelay,
  normalizeCardAmount,
  paymentViewState,
  providerFromReference,
  providerLabel,
} from "../src/lib/cardCollection.ts";
import {
  buildPendingCardCheckout,
  CARD_CHECKOUT_RESUME_WINDOW_MS,
  clearPendingCardCheckout,
  getCardCheckoutKey,
  getLegacyCardCheckoutKey,
  isCardCheckoutStale,
  loadPendingCardCheckout,
  pendingCheckoutFromStatus,
  savePendingCardCheckout,
} from "../src/lib/cardCheckoutSession.ts";
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
  provider: "flutterwave",
  collection_id: "b8aff692-e67b-4f17-82f1-5be687764630",
  reference: "fw_ngn_9c13c2f03ce44cc6a2a535584ba4a67f",
  authorization_url: "https://checkout.flutterwave.com/example",
  principal_amount: "50000.00",
  fee_amount: "700.00",
  total_amount: "50700.00",
  currency: "NGN",
  status: "pending",
};

test("amounts normalize to two-decimal strings and reject invalid input", () => {
  assert.equal(normalizeCardAmount("50000"), "50000.00");
  assert.equal(normalizeCardAmount("50,000.5"), "50000.50");
  assert.equal(normalizeCardAmount(" 0012.34 "), "12.34");
  assert.equal(normalizeCardAmount("0.01"), "0.01");
  for (const bad of ["", "0", "0.00", "-5", "1.234", "abc", ".5", "1e3"]) {
    assert.equal(normalizeCardAmount(bad), null, bad);
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
  assert.equal(normalizeCardAmount(formatAmountInput("1234567.5")), "1234567.50");
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
  assert.equal(nextPollDelay(0), CARD_POLL_INTERVAL_MS);
  assert.equal(nextPollDelay(1), CARD_POLL_INTERVAL_MS * 2);
  assert.equal(nextPollDelay(10), CARD_POLL_MAX_BACKOFF_MS);
  assert.equal(isRetryableStatusError(undefined), true);
  assert.equal(isRetryableStatusError(502), true);
  assert.equal(isRetryableStatusError(404), false);
  assert.equal(isRetryableStatusError(403), false);
});

test("idempotency key is stable per payload and renewed for a new attempt", () => {
  let n = 0;
  const tracker = createIdempotencyKeyTracker(() => `key-${++n}`);
  const payload = { provider: "flutterwave", wallet_id: "w1", amount: "100.00" };
  const first = tracker.keyFor(payload);
  assert.equal(tracker.keyFor({ ...payload }), first);
  const changed = tracker.keyFor({ ...payload, amount: "200.00" });
  assert.notEqual(changed, first);
  const providerChange = tracker.keyFor({ ...payload, amount: "200.00", provider: "paystack" });
  assert.notEqual(providerChange, changed);
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
    assert.equal(mapCardCollectionError(input).kind, kind, JSON.stringify(input));
  }
  assert.equal(
    mapCardCollectionError(err(400, "Card collection amount exceeds the limit")).message,
    "Card collection amount exceeds the limit",
  );
  assert.equal(mapCardCollectionError(err(502, "x")).canRetry, true);
  assert.equal(mapCardCollectionError(err(429, "x")).canRetry, false);
  assert.equal(
    mapCardCollectionError({ response: { status: 503, data: { detail: "x" } } }).kind,
    "not_configured",
  );
});

test("422 validation details become field errors", () => {
  const mapped = mapCardCollectionError(
    err(422, [
      { loc: ["body", "amount"], msg: "Decimal input should have no more than 2 decimal places", type: "decimal" },
      { loc: ["body", "description"], msg: "String should have at most 255 characters", type: "string" },
    ]),
  );
  assert.equal(mapped.kind, "validation");
  assert.match(mapped.fieldErrors.amount, /2 decimal places/);
  assert.match(mapped.fieldErrors.description, /255/);
});

test("new error shape with message, errors, and correlation_id is mapped", () => {
  const mapped = mapCardCollectionError({
    status: 422,
    data: {
      success: false,
      message: "Validation Error",
      errors: ["Input should be 'paystack' or 'flutterwave' in provider", "amount must be greater than zero"],
      correlation_id: "9f16c6cc-b339-48d4-b7e8-64a2f25f6077",
    },
  });
  assert.equal(mapped.kind, "validation");
  assert.equal(mapped.correlationId, "9f16c6cc-b339-48d4-b7e8-64a2f25f6077");
  assert.match(mapped.fieldErrors.provider, /paystack|flutterwave/);
  assert.match(mapped.fieldErrors.amount, /greater than zero/);

  const messageOnly = mapCardCollectionError({
    status: 400,
    data: {
      success: false,
      message: "Please select an NGN wallet",
      correlation_id: "abc-123",
    },
  });
  assert.equal(messageOnly.kind, "wallet_reselect");
  assert.equal(messageOnly.correlationId, "abc-123");
});

test("recovery record stores only safe fields and is isolated per business entity", () => {
  const storage = memoryStorage();
  const record = buildPendingCardCheckout(initializeResponse, "wallet-1", new Date("2026-10-07T10:00:00Z"));
  assert.equal(record.actor, "business");
  assert.equal(record.provider, "flutterwave");
  assert.equal(record.started_at, "2026-10-07T10:00:00.000Z");
  assert.equal("authorization_url" in record, false);

  assert.equal(savePendingCardCheckout("entity-a", record, storage), true);
  assert.equal(storage.map.get(getCardCheckoutKey("entity-a")).includes("checkout.flutterwave.com"), false);
  assert.deepEqual(loadPendingCardCheckout("entity-a", storage), record);
  assert.equal(loadPendingCardCheckout("entity-b", storage), null);

  clearPendingCardCheckout("entity-a", storage);
  assert.equal(loadPendingCardCheckout("entity-a", storage), null);
});

test("a checkout past the resume window is stale and an unfinished one should not reopen", () => {
  const started = new Date("2026-10-07T10:00:00.000Z");
  const record = buildPendingCardCheckout(initializeResponse, "wallet-1", started);
  assert.equal(isCardCheckoutStale(record, new Date(started.getTime() + CARD_CHECKOUT_RESUME_WINDOW_MS)), false);
  assert.equal(isCardCheckoutStale(record, new Date(started.getTime() + CARD_CHECKOUT_RESUME_WINDOW_MS + 1)), true);
  assert.equal(isCardCheckoutStale({ ...record, started_at: "not-a-date" }, started), true);
});

test("legacy recovery records without provider migrate to the new key as paystack", () => {
  const storage = memoryStorage();
  const legacy = {
    actor: "business",
    collection_id: "b8aff692-e67b-4f17-82f1-5be687764630",
    reference: "ps_ngn_9c13c2f03ce44cc6a2a535584ba4a67f",
    wallet_id: "wallet-1",
    principal_amount: "50000.00",
    fee_amount: "862.96",
    total_amount: "50862.96",
    started_at: "2026-10-07T10:00:00.000Z",
  };
  storage.setItem(getLegacyCardCheckoutKey("entity-a"), JSON.stringify(legacy));
  const loaded = loadPendingCardCheckout("entity-a", storage);
  assert.equal(loaded.provider, "paystack");
  assert.equal(loaded.reference, legacy.reference);
  assert.equal(storage.map.has(getLegacyCardCheckoutKey("entity-a")), false);
  assert.equal(storage.map.has(getCardCheckoutKey("entity-a")), true);
});

test("malformed or personal recovery records are discarded", () => {
  const storage = memoryStorage();
  storage.setItem(getCardCheckoutKey("entity-a"), "{not json");
  assert.equal(loadPendingCardCheckout("entity-a", storage), null);
  assert.equal(storage.map.size, 0);

  const personal = { ...buildPendingCardCheckout(initializeResponse, "w"), actor: "personal" };
  storage.setItem(getCardCheckoutKey("entity-a"), JSON.stringify(personal));
  assert.equal(loadPendingCardCheckout("entity-a", storage), null);
  assert.equal(loadPendingCardCheckout(undefined, storage), null);
});

test("Paystack and Flutterwave redirect parameters are recognised and stripped", () => {
  const paystackSearch =
    "?trxref=ps_ngn_829cbac572ca4d7894692f24910cbb1e&reference=ps_ngn_829cbac572ca4d7894692f24910cbb1e";
  assert.equal(
    extractCardCallbackReference(paystackSearch),
    "ps_ngn_829cbac572ca4d7894692f24910cbb1e",
  );
  assert.equal(extractCardCallbackReference("?trxref=ps_ngn_abcdef123456"), "ps_ngn_abcdef123456");
  assert.equal(extractCardCallbackReference("?reference=../../admin"), null);
  assert.equal(extractCardCallbackReference("?reference=T123456789"), null);
  assert.equal(extractCardCallbackReference(""), null);
  assert.equal(stripCardCallbackParams(paystackSearch), "");
  assert.equal(stripCardCallbackParams("?tab=wallets&reference=ps_ngn_abcdef123456"), "?tab=wallets");

  const flutterwaveSearch =
    "?tx_ref=fw_ngn_9c13c2f03ce44cc6a2a535584ba4a67f&transaction_id=12345&status=successful";
  assert.equal(
    extractCardCallbackReference(flutterwaveSearch),
    "fw_ngn_9c13c2f03ce44cc6a2a535584ba4a67f",
  );
  assert.equal(stripCardCallbackParams(flutterwaveSearch), "");
  assert.equal(
    stripCardCallbackParams("?tab=wallets&tx_ref=fw_ngn_abcdef123456&status=successful"),
    "?tab=wallets",
  );
});

test("provider is inferred from the Raiz reference prefix", () => {
  assert.equal(providerFromReference("ps_ngn_abcdef123456"), "paystack");
  assert.equal(providerFromReference("ps-ngn-abcdef123456"), "paystack");
  assert.equal(providerFromReference("PS-NGN-AbCdEf123456"), "paystack");
  assert.equal(providerFromReference("fw_ngn_9c13c2f03ce44cc6a2a535584ba4a67f"), "flutterwave");
  assert.equal(providerFromReference("unknown_ref"), null);
  assert.equal(providerLabel("paystack"), "Paystack");
  assert.equal(providerLabel("flutterwave"), "Flutterwave");
});

test("both Paystack formats are accepted unchanged in reference and trxref", () => {
  for (const prefix of ["ps_ngn_", "ps-ngn-", "PS-NGN-"]) {
    for (const parameter of ["reference", "trxref"]) {
      const reference = `${prefix}AbCdEf123456`;
      const search = `?tab=wallets&${parameter}=${reference}&status=successful`;
      assert.equal(extractCardCallbackReference(search), reference);
      assert.equal(stripCardCallbackParams(search), "?tab=wallets");
    }
  }
  for (const reference of ["ps-ngn-short", `ps-ngn-${"a".repeat(65)}`, "ps-ngn-abcdef12/extra", "ps-ngn-abcdef12%0A", "ps-ngn-abcdef12=", "ps_ngn-abcdef1234"]) {
    assert.equal(extractCardCallbackReference(`?reference=${encodeURIComponent(reference)}`), null, reference);
  }
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
  assert.equal(record.provider, "flutterwave");
  assert.equal(record.principal_amount, "50000.00");
  assert.equal(record.wallet_id, "");
  const storage = memoryStorage();
  savePendingCardCheckout("entity-a", record, storage);
  assert.equal(loadPendingCardCheckout("entity-a", storage), null);
});

test("initialize requires business write access; status reads are open to active roles", () => {
  const initialize = "/business/transactions/collections/card/initialize/";
  const status = "/business/transactions/collections/card/fw_ngn_1/status/?provider=flutterwave";
  for (const role of ["owner", "admin", "developer"]) {
    const profile = { role, active: true };
    assert.equal(canMakeRequest(profile, "POST", initialize), role !== "developer");
    assert.equal(canMakeRequest(profile, "GET", status), true);
  }
});
