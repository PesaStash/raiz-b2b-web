import test from "node:test";
import assert from "node:assert/strict";
import { mergePristineFields, basicBusinessField } from "../src/lib/businessFormState.ts";
import { apiFieldCorrections, readApiError } from "../src/lib/apiError.ts";

test("profile refresh hydrates saved values but preserves unsaved user edits", () => {
  const previous = { registration: "", city: "Lagos", months: 0 };
  assert.deepEqual(mergePristineFields({ ...previous, city: "Ikeja" }, previous, { registration: "RC1234", city: "Abuja", months: 12 }), { registration: "RC1234", city: "Ikeja", months: 12 });
  assert.deepEqual(mergePristineFields(previous, previous, { registration: "RC1234", city: "Abuja", months: 0 }), { registration: "RC1234", city: "Abuja", months: 0 });
});

test("all deployed field error envelopes survive empty lists and generic summary errors", () => {
  const errors = apiFieldCorrections({ response: { status: 422, data: {
    message: { message: "Correct these fields", field_errors: [] },
    field_errors: [{ field: "address.postcode", message: "This field is required" }],
    errors: ["Invalid request. Reference: example", { field: "associated_persons.1.email", message: "Enter a valid value" }],
  } } });
  assert.deepEqual(errors.map(error => [error.field, error.message]), [["address.postcode", "This field is required"], ["associated_persons.1.email", "Enter a valid value"]]);
  assert.equal(basicBusinessField(errors[0].field), "zip_code");
  assert.equal(basicBusinessField("associated_persons[1].email"), "associated_persons.1.email");
  assert.equal(basicBusinessField("unrecognized.field"), "unrecognized.field");
  assert.equal(readApiError({ status: 409, data: { message: { code: "invoice_payments_unavailable", message: "Set up receiving" } } }).message, "Set up receiving");
});

test("duplicate corrections are deduplicated without losing separate explanations", () => {
  const field = { field: "zip_code", message: "Enter a valid value" };
  assert.equal(apiFieldCorrections({ data: { field_errors: [field], message: { field_errors: [field] }, errors: [{ field: "zip_code", message: "This field is required" }] } }).length, 2);
});
