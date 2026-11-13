import test from "node:test";
import assert from "node:assert/strict";
import {
  personDetailsErrors,
  persistedPersonDetailsErrors,
  identityStarted,
  personFormErrors,
  personDetailsStep,
  latestPersonBirthDate,
  isEligibleAssociatedPerson,
} from "../src/lib/usd-kyb/personDetails.ts";
import { personPatch } from "../src/lib/usd-kyb/model.ts";
const input = () => ({
  person_key: "synthetic",
  first_name: "Ada",
  last_name: "Example",
  email: "ada@example.com",
  birth_date: "1985-02-20",
  residential_address: {
    street_line_1: "1 Example Street",
    city: "Lagos",
    postal_code: "100001",
    country: "NGA",
  },
  nationalities: ["NGA"],
  place_of_birth: { country: "NGA" },
  relationship_established_at: "2019-02-20",
  has_ownership: true,
  ownership_percentage: 60,
  is_director: true,
  has_control: false,
  is_signer: false,
});
test("new person requires personal details, a complete address and explicit business roles", () => {
  assert.deepEqual(personDetailsErrors(input()), {});
  const missing = personDetailsErrors({ person_key: "new" });
  for (const key of [
    "first_name",
    "last_name",
    "email",
    "birth_date",
    "residential_address.street_line_1",
    "residential_address.city",
    "residential_address.postal_code",
    "residential_address.country",
    "roles",
  ])
    assert.ok(missing[key], key);
  assert.equal(personDetailsErrors(input(), 0).roles, undefined);
});

test("existing registry people must fill missing visible details without re-entering redacted identity", () => {
  const redacted = { ownership_percentage: 25, has_ownership: true, person_key: "registry", associated_person_id: "id-registry", first_name: "Ada", last_name: "Example", email: "", is_director: true };
  const errors = personFormErrors(redacted, true);
  assert.deepEqual(Object.keys(errors), ["email"]);
  assert.equal(personFormErrors(redacted, true, 2).email, undefined);
  assert.ok(personFormErrors(redacted, true, 0).email);
  assert.deepEqual(personFormErrors({ ...redacted, email: "ada@example.com" }, true), {});
  assert.ok(personFormErrors({ ...redacted, email: "ada@example.com", birth_date: "" }, true).birth_date);
  assert.ok(personFormErrors({ ...redacted, email: "ada@example.com" }, false).birth_date);
});

test("person validation routes every field to its own step", () => {
  assert.equal(personDetailsStep("last_name"), 0);
  assert.equal(personDetailsStep("nationalities"), 0);
  assert.equal(personDetailsStep("residential_address.postal_code"), 1);
  assert.equal(personDetailsStep("ownership_percentage"), 2);
  assert.equal(personDetailsStep("roles"), 2);
  assert.equal(personDetailsStep("identifying_information[0].type"), 2);
});
test("associated persons must have reached their tenth birthday", () => {
  const today = new Date("2026-11-12T12:00:00Z");
  for (const birth_date of ["2016-11-12", "2016-11-11", "1985-02-20"])
    assert.equal(personDetailsErrors({ ...input(), birth_date }, 0, today).birth_date, undefined);
  for (const birth_date of ["2016-11-13", "2020-01-01"])
    assert.equal(personDetailsErrors({ ...input(), birth_date }, 0, today).birth_date,
      "Associated persons must be at least 10 years old.");
  assert.equal(latestPersonBirthDate(new Date("2024-02-29T12:00:00Z")), "2014-02-28");
  assert.ok(personDetailsErrors({ ...input(), birth_date: "2016-02-29" }, 0, new Date("2026-02-28T12:00:00Z")).birth_date);
  assert.equal(personDetailsErrors({ ...input(), birth_date: "2016-02-29" }, 0, new Date("2026-03-01T12:00:00Z")).birth_date, undefined);
});

test("person dates, country formats and ownership are validated without inventing identity approval", () => {
  for (const birth_date of ["2025-02-30", "2999-01-01", "02/20/1985"])
    assert.ok(personDetailsErrors({ ...input(), birth_date }).birth_date);
  assert.ok(
    personDetailsErrors({ ...input(), nationalities: ["NG"] }).nationalities,
  );
  assert.ok(
    personDetailsErrors({ ...input(), ownership_percentage: 101 })
      .ownership_percentage,
  );
  assert.ok(
    personDetailsErrors({ ...input(), ownership_percentage: 0 })
      .ownership_percentage,
  );
  assert.ok(
    personDetailsErrors({
      ...input(),
      relationship_established_at: "2999-01-01",
    }).relationship_established_at,
  );
});
test("complete supplemental write retains explicit false roles but accepts documented ID corrections but strips server state", () => {
  const source = {
    ...input(),
    verification_status: "approved",
    invitation_status: "sent",
    identifying_information: [{ type: "passport" }],
    middle_name: "not-documented",
    phone: "not-documented",
  };
  const patch = personPatch(source);
  assert.deepEqual(patch, {
    ...input(),
    identifying_information: [{ type: "passport" }],
  });
  assert.equal(patch.verification_status, undefined);
  assert.equal(patch.identifying_information[0].type, "passport");
});
test("reloaded people keep omitted birth date and address, but still need a name and email", () => {
  const saved = {
    person_key: "youverify:3",
    first_name: "Jane",
    last_name: "Doe",
    email: "janedoe@yopmail.com",
    has_ownership: true,
    ownership_percentage: 50,
  };
  assert.deepEqual(persistedPersonDetailsErrors(saved), {});
  assert.ok(personDetailsErrors(saved).birth_date);
  assert.ok(persistedPersonDetailsErrors({ ...saved, birth_date: "" }).birth_date);
  assert.ok(
    persistedPersonDetailsErrors({
      ...saved,
      has_ownership: true,
      email: null,
      first_name: null,
      last_name: null,
    }).email,
  );
});
test("invited and verified people cannot be replaced with incomplete supplemental input", () => {
  assert.equal(identityStarted({ person_key: "new" }), false);
  for (const state of [
    { invitation_status: "sent" },
    { verification_started_at: "2026-01-01" },
    { verified_at: "2026-01-02" },
    { verification_status: "approved" },
    { verification_status: "completed" },
  ])
    assert.equal(identityStarted({ person_key: "existing", ...state }), true);
});

test("seven profiles can have pending verification without ownership errors when roles are correct", async () => {
  const { ownershipNeedsReview, ownershipRequirementMessage } = await import(
    "../src/lib/usd-kyb/personDetails.ts"
  );
  const people = Array.from({ length: 7 }, (_, index) => ({
    person_key: `person-${index}`,
    first_name: `Person ${index}`,
    is_director: true,
    has_ownership: index < 2,
    ownership_percentage: index < 2 ? 50 : null,
    verification_status: index < 3 ? "approved" : "not_started",
  }));
  assert.equal(people.filter(ownershipNeedsReview).length, 0);
  const misclassified = people.map((person, index) =>
    index >= 3 ? { ...person, has_ownership: true } : person,
  );
  assert.equal(misclassified.filter(ownershipNeedsReview).length, 4);
  const message = ownershipRequirementMessage(
    "associated_persons.ownership_percentage",
    misclassified,
  );
  for (const index of [3, 4, 5, 6])
    assert.ok(message.includes(`Person ${index}`));
  assert.ok(!message.includes("Person 0"));
  assert.match(message, /confirm they are not an owner/);
});

test("only people with at least 25 percent ownership require invitations", async () => {
  const { peopleNeedingInvitation, personRequirementMessage } = await import(
    "../src/lib/usd-kyb/personDetails.ts"
  );
  const people = [
    {
      person_key: "owner",
      first_name: "Owner",
      has_ownership: true,
      ownership_percentage: 80,
      invitation_status: "sent",
    },
    {
      person_key: "verified",
      verification_status: "approved",
      invitation_status: "not_sent",
    },
    {
      person_key: "minor-owner",
      first_name: "Minor",
      has_ownership: true,
      ownership_percentage: 20,
      invitation_status: "not_sent",
    },
    { person_key: "expired", ownership_percentage: 25, invitation_status: "expired" },
    { person_key: "revoked", ownership_percentage: 25, invitation_status: "revoked" },
    {
      person_key: "stale", ownership_percentage: 25,
      invitation_status: "sent",
      invitation_expires_at: "2000-01-01T00:00:00Z",
    },
  ];
  assert.deepEqual(
    peopleNeedingInvitation(people).map((p) => p.person_key),
    ["expired", "revoked", "stale"],
  );
  assert.match(
    personRequirementMessage("associated_persons.invitations", people),
    /Unnamed person/,
  );
  assert.deepEqual(
    peopleNeedingInvitation(
      people.map((person) => ({
        ...person,
        invitation_status: "sent",
        invitation_expires_at: "2999-01-01T00:00:00Z",
      })),
    ),
    [],
  );
});

test("25 percent is inclusive and other roles do not bypass the ownership threshold", () => {
  for (const ownership_percentage of [25, 50, 100])
    assert.equal(isEligibleAssociatedPerson({ ownership_percentage }), true);
  for (const ownership_percentage of [0, 24, 24.99, null, undefined, NaN, Infinity, 101, "25"])
    assert.equal(isEligibleAssociatedPerson({ ownership_percentage, is_director: true, has_control: true, is_signer: true }), false);
  assert.match(personDetailsErrors({ ...input(), ownership_percentage: 24 }, 2).ownership_percentage, /at least 25%/);
});
