import test from "node:test";
import assert from "node:assert/strict";
import { isAccountReady, spendableBalances, formatMoney, receivingInstructions, describeFee, conversionEstimate } from "../src/lib/globalBalance.ts";

test("v2 balances are authoritative, exclude foreign assets, and do not subtract pending debits", () => {
  const balance = { currency: "USD", available_balance: "100.25", pending_debits: "30.00" };
  assert.deepEqual(spendableBalances({ balance_model: "ngn_usd_v2", balances: [balance, { currency: "EUR", available_balance: "999" }], wallets: [{ account_balance: 900, wallet_type: { currency: "USD" } }], legacy_balances: [{ balance: "500" }] }), [balance]);
  assert.deepEqual(spendableBalances({ balance_model: "ngn_usd_v2", wallets: [{ wallet_type: { currency: "USD" }, account_balance: 99 }] }), []);
});
test("legacy profiles retain NGN/USD compatibility", () => {
  const result = spendableBalances({ wallets: [{ wallet_id: "usd", wallet_type: { currency: "USD" }, account_balance: 12.5 }, { wallet_type: { currency: "GBP" }, account_balance: 80 }] });
  assert.equal(result.length, 1); assert.equal(result[0].available_balance, "12.5");
});
test("money formatting preserves decimal precision beyond Number safe range", () => {
  assert.equal(formatMoney("9007199254740993.01", "USD"), "$9,007,199,254,740,993.01");
  assert.equal(formatMoney("0.000001", "USDT"), "0.000001 USDT");
  assert.equal(formatMoney(undefined, "USD"), "—");
});
test("receiving instructions preserve network, memo, status and disclosures without a balance", () => {
  const result = receivingInstructions({ receiving_account_id: "r", asset: "USDT", kind: "crypto_address", status: "pending", crypto: { network: "tron", address: "synthetic-address", memo: "123" }, disclosures: ["Settles to USD"] });
  assert.equal(result.status, "pending"); assert.equal(result.network, "tron");
  assert.deepEqual(result.disclosures, ["Settles to USD"]);
  assert.ok(result.fields.some(f => f.label === "Memo / tag" && f.value === "123"));
  assert.equal(result.balance, undefined);
});
test("fee percent points and conditional bounds are disclosed without scaling", () => {
  const text = describeFee({ configured_value: "0.75", value_unit: "percent_points", calculation_kind: "gross_up_percentage", fee_currency: "USD", minimum_fee: "1.00", maximum_fee: "25.00", condition: "wire only", basis: "gross_usd_equivalent" });
  assert.match(text, /0\.75%/); assert.match(text, /grossed up/); assert.match(text, /minimum \$1\.00/); assert.match(text, /maximum \$25\.00/); assert.match(text, /wire only/);
});
test("indicative conversions use decimal integer arithmetic in both directions", () => {
  assert.equal(conversionEstimate("1000", "1541.43", false), "1541430.00");
  assert.equal(conversionEstimate("1541430", "1541.43", true), "1000.00");
  assert.equal(conversionEstimate("0.10", "0.1", false), "0.01");
  assert.equal(conversionEstimate("10", "0", true), undefined);
  assert.equal(conversionEstimate("abc", "1", false), undefined);
});

test("account readiness accepts activated and completed API statuses without enabling pending or blocked accounts", () => {
  for (const status of ["active", "activated", "complete", "completed", " COMPLETE "]) {
    assert.equal(isAccountReady(status), true, status);
  }
  for (const status of [undefined, "", "pending", "processing", "suspended", "blocked", "closed", "failed", "inactive", "unknown"]) {
    assert.equal(isAccountReady(status), false, String(status));
  }
});
