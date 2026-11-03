import test from "node:test";
import assert from "node:assert/strict";
import {
  attentionSection,
  focusAttention,
} from "../src/lib/usd-kyb/attention.ts";
import { requirementStage } from "../src/lib/usd-kyb/model.ts";
test("review requirements point to account terms, specific document slots and associated people", () => {
  assert.equal(attentionSection("signed_agreement_id"), "account-terms");
  assert.equal(
    attentionSection("business_profile.signed_agreement_id"),
    "account-terms",
  );
  assert.equal(requirementStage("business_profile.signed_agreement_id"), 5);
  assert.equal(
    attentionSection("ownership_structure_attestation_or_document"),
    "ownership_chart",
  );
  assert.equal(
    attentionSection("business_website_or_proof_of_nature_of_business"),
    "proof_of_nature_of_business",
  );
  assert.equal(
    attentionSection("associated_persons.invitations"),
    "associated_persons",
  );
  assert.equal(requirementStage("associated_persons.invitations"), 2);
});
test("account terms link scrolls its card and focuses the terms action without losing scroll position", () => {
  const calls = [];
  const button = { focus: (options) => calls.push(["focus", options]) };
  const card = {
    dataset: { kybRequirement: "account-terms" },
    scrollIntoView: (options) => calls.push(["scroll", options]),
    matches: () => false,
    querySelector: () => button,
  };
  const root = {
    querySelectorAll: (selector) => (selector === "[name]" ? [] : [card]),
    querySelector: () => null,
  };
  focusAttention(root, "signed_agreement_id");
  assert.equal(calls[0][0], "scroll");
  assert.equal(calls[0][1].block, "center");
  assert.deepEqual(calls[1], ["focus", { preventScroll: true }]);
});
test("backend field names can locate their sectioned frontend controls", () => {
  const calls = [];
  const field = {
    getAttribute: (key) =>
      key === "name" ? "business_profile.business_legal_name" : "text",
    scrollIntoView: () => calls.push("scroll"),
    matches: () => true,
    focus: () => calls.push("focus"),
  };
  focusAttention(
    {
      querySelectorAll: (selector) => (selector === "[name]" ? [field] : []),
      querySelector: () => null,
    },
    "business_legal_name",
  );
  assert.deepEqual(calls, ["scroll", "focus"]);
});
