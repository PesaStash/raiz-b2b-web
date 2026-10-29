import test from "node:test";
import assert from "node:assert/strict";
import {
  createAccountSchema,
  registerFormSchemas,
  sanitizeOtpInput,
} from "../src/app/(auth)/register/_components/validation.ts";

const account = {
  firstName: "Amaka",
  lastName: "Opeyemi",
  country_id: "nigeria-id",
  email: "amaka@example.com",
  password: "ExampleTest123!",
};

test("combined registration validates account details and password together", () => {
  assert.equal(createAccountSchema.safeParse(account).success, true);
  for (const field of ["firstName", "lastName", "country_id", "email", "password"]) {
    assert.equal(createAccountSchema.safeParse({ ...account, [field]: "" }).success, false, field);
  }
});

test("combined registration retains existing password requirements", () => {
  for (const password of ["Short1!", "lowercase123!", "UPPERCASE123!", "NoNumbersHere!", "NoSymbols123"]) {
    assert.equal(createAccountSchema.safeParse({ ...account, password }).success, false, password);
  }
});

test("registration can proceed without a separate password-confirmation field", () => {
  assert.equal(createAccountSchema.safeParse({ ...account, confirmPassword: "" }).success, true);
});

test("email verification still accepts six-character alphanumeric codes", () => {
  assert.equal(registerFormSchemas[3].safeParse({ otp: "Ab1234" }).success, true);
  assert.equal(registerFormSchemas[3].safeParse({ otp: "12345" }).success, false);
  assert.equal(sanitizeOtpInput("Ab-12 34!"), "Ab1234");
});
