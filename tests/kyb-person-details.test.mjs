import test from "node:test";
import assert from "node:assert/strict";
import {
  personDetailsErrors,
  identityStarted,
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

test("every associated person must be invited or verified before submission, including minor owners", async () => {
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
    { person_key: "expired", invitation_status: "expired" },
    { person_key: "revoked", invitation_status: "revoked" },
    {
      person_key: "stale",
      invitation_status: "sent",
      invitation_expires_at: "2000-01-01T00:00:00Z",
    },
  ];
  assert.deepEqual(
    peopleNeedingInvitation(people).map((p) => p.person_key),
    ["minor-owner", "expired", "revoked", "stale"],
  );
  assert.match(
    personRequirementMessage("associated_persons.invitations", people),
    /Minor/,
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
