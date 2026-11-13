import test from "node:test";
import assert from "node:assert/strict";
import { hasCreatedForeignAccount } from "../src/lib/createdForeignAccount.ts";

const user = (wallets, receiving = []) => ({
  business_account: { wallets, receiving_accounts: receiving },
});

test("a GBP or EUR wallet counts as a created account", () => {
  const profile = user([{ wallet_type: { currency: "GBP" } }]);
  assert.equal(hasCreatedForeignAccount(profile, "GBP"), true);
  assert.equal(hasCreatedForeignAccount(profile, "EUR"), false);
});

test("a receiving account counts when there is no wallet", () => {
  const profile = user([]);
  assert.equal(
    hasCreatedForeignAccount(profile, "EUR", [{ asset: "EUR" }]),
    true,
  );
  assert.equal(hasCreatedForeignAccount(profile, "GBP", [{ asset: "EUR" }]), false);
});

test("missing profile cannot add or send a foreign currency", () => {
  assert.equal(hasCreatedForeignAccount(undefined, "GBP"), false);
  assert.equal(hasCreatedForeignAccount(undefined, "EUR"), false);
});
