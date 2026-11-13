import test from "node:test";
import assert from "node:assert/strict";
import { apiFieldErrors, apiFieldCorrections } from "../src/lib/apiError.ts";
import { draftInputErrors } from "../src/lib/usd-kyb/inputValidation.ts";
import { personDetailsErrors } from "../src/lib/usd-kyb/personDetails.ts";
import { personWriteErrors } from "../src/lib/usd-kyb/corrections.ts";
import { mergePersonResponse } from "../src/lib/usd-kyb/model.ts";
import { invoicePaymentReady } from "../src/lib/invoiceReadiness.ts";

test("KYB validates entered values without blocking an incomplete draft", () => {
  assert.deepEqual(draftInputErrors({}), []);
  assert.deepEqual(draftInputErrors({ business_profile: { primary_website: "https://example.com", phone: "+2348159263748", email: "hello@example.com" }, registered_address: { country: "NG" }, industry_purpose: { expected_monthly_payments_usd: "0" } }), []);
  const errors = draftInputErrors({ business_profile: { primary_website: "javascript:alert(1)", phone: "abc", email: "bad" }, registered_address: { country: "Nigeria" }, industry_purpose: { expected_monthly_payments_usd: "-100" } });
  assert.deepEqual(errors.map(error => error.field), ["business_profile.primary_website", "business_profile.phone", "business_profile.email", "registered_address.country", "industry_purpose.expected_monthly_payments_usd"]);
  for (const amount of ["NaN", "Infinity", "-0.01"]) assert.ok(draftInputErrors({ industry_purpose: { expected_monthly_payments_usd: amount } }).length);
});

test("writable ownership remains integral without rounding registry decimals", () => {
  for (const ownership_percentage of [25, 99, 100]) assert.equal(personDetailsErrors({ has_ownership: true, ownership_percentage }, 2).ownership_percentage, undefined);
  for (const ownership_percentage of [0, 1, 24, 24.99, 99.9, -1, 100.1, NaN, Infinity]) assert.ok(personDetailsErrors({ has_ownership: true, ownership_percentage }, 2).ownership_percentage);
});

test("person dates require a real date and the minimum age", () => {
  assert.equal(personDetailsErrors({ birth_date: "2015-01-01" }, 0).birth_date, undefined);
  assert.ok(personDetailsErrors({ birth_date: "2999-01-01" }, 0).birth_date);
  assert.ok(personDetailsErrors({ birth_date: "2025-02-30" }, 0).birth_date);
});

test("partial person mutation responses preserve omitted nested data and respect explicit corrections", () => {
  const merged = mergePersonResponse({ person_key: "one", first_name: "Ada", is_director: true, residential_address: { city: "Lagos", country: "NGA" } }, { person_key: "one", birth_date: "1985-02-20" }, { person_key: "one", is_director: false, residential_address: { city: "Ikeja" } });
  assert.equal(merged.first_name, "Ada");
  assert.equal(merged.birth_date, "1985-02-20");
  assert.equal(merged.is_director, false);
  assert.deepEqual(merged.residential_address, { city: "Ikeja", country: "NGA" });
  assert.equal(mergePersonResponse(merged, undefined, { person_key: "one", first_name: null }).first_name, null);
});

test("invoice email eligibility needs the matching available currency and rejects frozen or blocked accounts", () => {
  const account = { entity: {}, wallets: [{ wallet_id: "ngn", wallet_type: { currency: "NGN" }, wallet_status: "completed" }] };
  assert.equal(invoicePaymentReady(account, "NGN"), true);
  assert.equal(invoicePaymentReady(account, "USD"), false);
  assert.equal(invoicePaymentReady({ ...account, entity: { is_entity_frozen: true } }, "NGN"), false);
  assert.equal(invoicePaymentReady({ ...account, wallets: [{ ...account.wallets[0], is_pnd: true }] }, "NGN"), true);
  assert.equal(invoicePaymentReady({ ...account, wallets: [{ ...account.wallets[0], wallet_status: "pending" }] }, "NGN"), false);
  const global = { entity: {}, balance_model: "ngn_usd_v2", balances: [{ currency: "USD", status: "active" }] };
  assert.equal(invoicePaymentReady(global, "USD"), true);
  assert.equal(invoicePaymentReady(global, "NGN"), false);
  assert.equal(invoicePaymentReady(undefined, "USD"), false);
});

test("field validation errors survive both Axios rejection shapes", () => {
  const detail = [{ loc: ["body", "zip_code"], msg: "Postcode is required" }];
  assert.deepEqual(apiFieldErrors({ data: { detail } }), { zip_code: "Postcode is required" });
  assert.deepEqual(apiFieldErrors({ response: { data: { message: { field_errors: [{ field: "zip_code", message: "Invalid postcode" }] } } } }), { zip_code: "Invalid postcode" });
});


test("FastAPI detail.field_errors are retained and mapped to the submitted person", () => {
  const failure = { status: 422, data: { detail: { message: "Correct the highlighted fields", field_errors: [{ field: "associated_persons[0].ownership_percentage", message: "Whole numbers only" }] } } };
  const parsed = apiFieldCorrections(failure);
  const mapped = personWriteErrors(parsed, [{ person_key: "second" }], [{ person_key: "first" }, { person_key: "second", associated_person_id: "id-second" }]);
  assert.deepEqual(mapped, [{ field: "associated_persons[1].ownership_percentage", message: "Whole numbers only", associated_person_id: "id-second" }]);
});
