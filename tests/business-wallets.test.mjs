import assert from "node:assert/strict";
import test from "node:test";
import {
  exceedsNgnHeadroom,
  hasBankDetails,
  isNgnHoldingLimitError,
  isWalletOnly,
  ngnHeadroom,
} from "../src/lib/businessWallets.ts";

test("holding headroom uses the booked balance and compares exact net credits", () => {
  assert.equal(ngnHeadroom("250000.00"), "50000.00");
  assert.equal(ngnHeadroom("299999.99"), "0.01");
  assert.equal(exceedsNgnHeadroom("299999.99", "0.01"), false);
  assert.equal(exceedsNgnHeadroom("299999.99", "0.02"), true);
  assert.equal(exceedsNgnHeadroom("299999.999", "0.001"), false);
  assert.equal(exceedsNgnHeadroom("299999.999", "0.0011"), true);
  assert.equal(ngnHeadroom(300000), "0");
  assert.equal(ngnHeadroom(300000.01), "0");
  assert.equal(ngnHeadroom(undefined), undefined);
  assert.equal(isNgnHoldingLimitError("Business NGN wallets cannot hold more than NGN 300,000"), true);
  assert.equal(isNgnHoldingLimitError("Your daily transfer limit is NGN 300,000"), false);
});

test("wallet types remain distinct from dedicated bank instructions through upgrades", () => {
  const ngn = {
    account_number: "business@example.invalid",
    bank_name: "Raiz",
    wallet_id: "ngn",
    wallet_status: "completed",
    wallet_type_id: 2,
    wallet_type: { wallet_type_code: 4, currency: "NGN" },
  };
  assert.equal(isWalletOnly(ngn), true);
  assert.equal(hasBankDetails(ngn), false);
  assert.equal(hasBankDetails({ ...ngn, account_number: "1234567890" }), false);
  assert.equal(hasBankDetails({
    ...ngn,
    wallet_type: { wallet_type_code: 2, currency: "NGN" },
    account_number: "1234567890",
  }), true);

  const usd = {
    ...ngn,
    wallet_type: { wallet_type_code: 5, currency: "USD" },
  };
  assert.equal(hasBankDetails(usd), false);
  const usdAccount = {
    ...usd,
    wallet_type: { wallet_type_code: 1, currency: "USD" },
    account_number: "12345678",
    routing: [{ routing: "123456789" }],
  };
  assert.equal(hasBankDetails(usdAccount), true);
  assert.equal(hasBankDetails({ ...usdAccount, wallet_status: "pending" }), false);
});
