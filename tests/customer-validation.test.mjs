import test from "node:test";
import assert from "node:assert/strict";
import { validateCustomer } from "../src/lib/customerValidation.ts";

const empty = { customerType: "", fullname: "", companyName: "", email: "", phone: "", address: "", city: "", state: "", country_code: "" };
const valid = { ...empty, customerType: "individual", fullname: "QA Customer", email: "qa@example.com", phone: "+2348159263748", address: "1 Test Street", city: "Ikeja", state: "Lagos", country_code: "NG" };

test("only the visible customer type is required before choosing a type", () => {
  assert.deepEqual(validateCustomer(empty), { customerType: "Select a customer type." });
  assert.deepEqual(validateCustomer({ ...empty, customerType: "other" }), { customerType: "Select a customer type." });
});

test("empty customer fields give named errors rather than generic Required messages", () => {
  const errors = validateCustomer({ ...empty, customerType: "individual", phone: undefined });
  assert.deepEqual(errors, {
    fullname: "Full name is required.", email: "Email address is required.", phone: "Phone number is required.",
    address: "Street address is required.", city: "City is required.", state: "State or region is required.", country_code: "Select an address country.",
  });
  assert.equal(validateCustomer({ ...empty, customerType: "business" }).companyName, "Business name is required.");
  assert.equal(validateCustomer({ ...empty, customerType: "business" }).fullname, undefined);
});

test("valid individual and business customers accept a manually completed address", () => {
  assert.deepEqual(validateCustomer(valid), {});
  assert.deepEqual(validateCustomer({ ...valid, customerType: "business", fullname: "", companyName: "QA Business" }), {});
  assert.deepEqual(validateCustomer({ ...valid, fullname: "  QA Customer  ", email: "  qa@example.com  " }), {});
});

test("malformed contacts and missing address components remain actionable", () => {
  const errors = validateCustomer({ ...valid, fullname: " ", email: "bad", phone: "+123", city: " ", state: "", country_code: "Nigeria" });
  assert.equal(errors.fullname, "Full name is required.");
  assert.equal(errors.email, "Enter a valid email address.");
  assert.match(errors.phone, /country code/);
  assert.equal(errors.city, "City is required.");
  assert.equal(errors.state, "State or region is required.");
  assert.equal(errors.country_code, "Select an address country.");
});
