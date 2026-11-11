import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as card from "../src/lib/cardCollection.ts";
import { pendingCheckoutFromStatus } from "../src/lib/cardCheckoutSession.ts";

function callbackModule({ local = null, statusLookup = async () => null, window } = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL("../src/lib/cardCheckoutCallback.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, window, require: name => {
    if (name === "@/services/transactions") return { GetCardCollectionStatusApi: statusLookup };
    if (name === "@/lib/cardCollection") return card;
    if (name === "@/lib/cardCheckoutSession") return { loadPendingCardCheckout: () => local, pendingCheckoutFromStatus };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  return exports;
}

test("missing local checkout recovers both Paystack formats through authoritative status lookup", async () => {
  for (const prefix of ["ps_ngn_", "ps-ngn-"]) {
    const reference = `${prefix}abcdef123456`;
    let calls = 0;
    const api = callbackModule({ statusLookup: async (actual, provider) => {
      calls++;
      assert.equal(actual, reference);
      assert.equal(provider, "paystack");
      return { provider, reference, collection_id: "collection", principal_amount: "100.00", fee_amount: "1.00", total_amount: "101.00", currency: "NGN", status: "pending", settlement_status: "unsettled" };
    } });
    const recovered = await api.resolveCardCheckout("entity-a", reference);
    assert.equal(calls, 1);
    assert.equal(recovered.reference, reference);
    assert.equal(recovered.wallet_id, "");
  }
});

test("a forged successful callback or a foreign reference cannot create payment success", async () => {
  const reference = card.extractCardCallbackReference("?reference=ps-ngn-abcdef123456&status=successful");
  const api = callbackModule({ statusLookup: async () => { throw { status: 404 }; } });
  assert.equal(await api.resolveCardCheckout("entity-a", reference), null);
  assert.equal(card.paymentViewState({ status: "completed", settlement_status: "unsettled" }), "processing");
  assert.equal(card.paymentViewState({ status: "completed", settlement_status: "credited" }), "success");
});

test("callback consumption strips provider parameters and preserves unrelated query and hash", () => {
  let replaced;
  const api = callbackModule({ window: {
    location: { pathname: "/fund-wallet/paystack/callback", search: "?tab=wallets&trxref=ps-ngn-AbCdEf123456&status=successful&transaction_id=123", hash: "#balance" },
    history: { state: { saved: true }, replaceState: (...args) => { replaced = args; } },
  } });
  assert.equal(api.consumeCardCallbackReference(), "ps-ngn-AbCdEf123456");
  assert.equal(replaced[2], "/fund-wallet/paystack/callback?tab=wallets#balance");
});
