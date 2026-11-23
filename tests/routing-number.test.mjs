import test from "node:test";
import assert from "node:assert/strict";
import { bankNameFromLookup, isRoutingNumber } from "../src/lib/routingNumber.ts";

test("ABA checksum accepts a known routing number and rejects the rest", () => {
  assert.equal(isRoutingNumber("021000021"), true);
  assert.equal(isRoutingNumber("021000022"), false);
  assert.equal(isRoutingNumber("02100002"), false);
  assert.equal(isRoutingNumber("0210000211"), false);
  assert.equal(isRoutingNumber("02100002a"), false);
});

test("lookup parser returns a trimmed name, null for an empty name, and rejects a malformed body", () => {
  assert.equal(bankNameFromLookup([{ status: "ok", data: { name: "  JPMORGAN CHASE  " } }]), "JPMORGAN CHASE");
  assert.equal(bankNameFromLookup([{ data: { name: "   " } }]), null);
  assert.equal(bankNameFromLookup([{ data: { name: null } }]), null);
  assert.equal(bankNameFromLookup([]), null);
  assert.throws(() => bankNameFromLookup({ name: "Chase" }));
  assert.throws(() => bankNameFromLookup(null));
});
