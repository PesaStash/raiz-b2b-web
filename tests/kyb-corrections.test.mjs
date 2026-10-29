import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanDraft,
  cleanPerson,
  errorsForPerson,
  currentFieldErrors,
  changedFields,
  replaceAt,
} from "../src/lib/usd-kyb/corrections.ts";
import { readApiError } from "../src/lib/apiError.ts";
test("correction prompts are empty display inputs, while unrelated and typed values remain intact", () => {
  const error = {
    field: "registered_address.postal_code",
    message: "Invalid postal code",
    placeholder: "Invalid postal code (re-enter a valid postal code)",
    source: "bridge",
  };
  const original = {
    registered_address: { postal_code: error.placeholder, city: "Lagos" },
    business_profile: { business_legal_name: "Original" },
  };
  const cleaned = cleanDraft(original, [error]);
  assert.equal(cleaned.registered_address.postal_code, "");
  assert.equal(cleaned.registered_address.city, "Lagos");
  assert.equal(original.registered_address.postal_code, error.placeholder);
  assert.equal(
    cleanDraft({ registered_address: { postal_code: "90210" } }, [error])
      .registered_address.postal_code,
    "90210",
  );
});
test("person corrections follow stable IDs after the active list is reordered", () => {
  const error = {
    field: "associated_persons[1].identifying_information[0].type",
    associated_person_id: "target",
    message: "Choose a valid ID type",
    placeholder: "Invalid ID type (re-enter a valid ID type)",
  };
  const person = {
    person_key: "selected",
    associated_person_id: "target",
    identifying_information: [{ type: error.placeholder }],
  };
  const local = errorsForPerson([error], person, 0);
  assert.equal(local[0].field, "identifying_information.0.type");
  assert.equal(cleanPerson(person, local).identifying_information[0].type, "");
  assert.equal(
    currentFieldErrors([error], [person])[0].field,
    "associated_persons[0].identifying_information[0].type",
  );
  assert.deepEqual(currentFieldErrors([error], []), []);
});
test("changed-field person writes omit redacted data and retain explicit clears", () => {
  const before = {
    person_key: "p",
    first_name: "Ada",
    has_control: true,
    residential_address: { city: "Lagos", postal_code: "100001" },
  };
  assert.deepEqual(
    changedFields(
      {
        ...before,
        residential_address: { city: "Lagos", postal_code: "100002" },
      },
      before,
    ),
    { residential_address: { postal_code: "100002" } },
  );
  assert.deepEqual(
    changedFields(
      { ...before, has_control: false, residential_address: null },
      before,
    ),
    { has_control: false, residential_address: null },
  );
  assert.equal(
    Object.hasOwn(
      changedFields({ ...before, title: "Director" }, before),
      "identifying_information",
    ),
    false,
  );
});
test("redacted ID correction inputs construct a real array rather than an object with numeric keys", () => {
  const next = replaceAt(
    { person_key: "p" },
    "identifying_information[0].type",
    "passport",
  );
  assert.ok(Array.isArray(next.identifying_information));
  assert.deepEqual(next.identifying_information, [{ type: "passport" }]);
});
test("nested response message envelopes preserve provider explanations", () => {
  const body = {
    response: {
      status: 400,
      data: {
        message: {
          message: "Please correct these fields",
          code: "invalid_parameters",
          field_errors: [
            {
              field: "registered_address.postal_code",
              message: "Invalid postal",
            },
          ],
        },
      },
    },
  };
  assert.equal(readApiError(body).message, "Please correct these fields");
  assert.equal(readApiError(body).code, "invalid_parameters");
});

test("conflict recovery preserves hidden unchanged fields, remote roles and only local edits", async () => {
  const { rebasePersonInput } = await import(
    "../src/lib/usd-kyb/corrections.ts"
  );
  const before = {
    person_key: "p",
    title: "Director",
    has_control: false,
    birth_date: "1985-02-20",
  };
  const input = { ...before, title: "CEO" };
  const fresh = { person_key: "p", title: "Director", has_control: true };
  const result = rebasePersonInput(input, before, fresh);
  assert.equal(result.input.has_control, true);
  assert.equal(result.input.birth_date, "1985-02-20");
  assert.equal(result.input.title, "CEO");
  assert.deepEqual(changedFields(result.input, result.baseline), {
    title: "CEO",
  });
  assert.throws(
    () => rebasePersonInput(input, before, undefined),
    /has been removed/,
  );
});

test("multiple explanations for the same field remain visible without duplicate controls", async () => {
  const { groupFieldErrors } = await import(
    "../src/lib/usd-kyb/corrections.ts"
  );
  const result = groupFieldErrors([
    { field: "registered_address.postal_code", message: "Invalid format" },
    {
      field: "registered_address.postal_code",
      message: "Does not match country",
    },
  ]);
  assert.equal(result.length, 1);
  assert.match(result[0].message, /Invalid format/);
  assert.match(result[0].message, /Does not match country/);
});
