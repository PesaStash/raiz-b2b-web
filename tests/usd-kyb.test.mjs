import test from "node:test";
import assert from "node:assert/strict";
import { SaveQueue } from "../src/lib/usd-kyb/saveQueue.ts";
import {
  editableStatus,
  terminalIdentity,
  requirementStage,
  deferredRequirements,
  mergeDraft,
  normalizeDraft,
  registryPeople,
  setPath,
  getPath,
  options,
  fileError,
  personPatch,
  reconcilePeople,
} from "../src/lib/usd-kyb/model.ts";
import { canMakeRequest, isPublicPath } from "../src/lib/permissions.ts";

test("version-changing saves and actions run in order and failures do not poison the queue", async () => {
  const queue = new SaveQueue();
  let version = 3;
  const observed = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const first = queue.run(async () => {
    observed.push(version);
    await gate;
    version++;
  });
  const second = queue.run(async () => {
    observed.push(version);
    throw new Error("409");
  });
  const rejected = assert.rejects(second, /409/);
  const third = queue.run(async () => {
    observed.push(version);
    version++;
  });
  await Promise.resolve();
  assert.deepEqual(observed, [3]);
  release();
  await first;
  await rejected;
  await third;
  assert.deepEqual(observed, [3, 4, 4]);
  assert.equal(version, 5);
});
test("partial draft merges retain unknown fields, replace arrays and preserve explicit null/false", () => {
  const base = {
    profile: { name: "Old", retained: "future" },
    array: ["old"],
    unknown: { raw: 1 },
  };
  const patch = {
    profile: { name: null, dao: false },
    array: [],
    unknown: { newer: 2 },
  };
  assert.deepEqual(mergeDraft(base, patch), {
    profile: { name: null, retained: "future", dao: false },
    array: [],
    unknown: { raw: 1, newer: 2 },
  });
  const edited = setPath(base, "profile.name", "New");
  assert.equal(getPath(edited, "profile.name"), "New");
  assert.equal(base.profile.name, "Old");
  // New edits made during a save win when restoring a failed snapshot.
  assert.deepEqual(
    mergeDraft(
      { profile: { name: "sent", other: "kept" } },
      { profile: { name: "newer" } },
    ),
    { profile: { name: "newer", other: "kept" } },
  );
});
test("only contract editing states and writer roles can mutate; public invited-person route needs no login", () => {
  for (const state of ["not_started", "collecting", "requires_correction"])
    assert.equal(editableStatus(state), true);
  for (const state of [
    "awaiting_admin_review",
    "submitted_to_bridge",
    "under_review",
    "awaiting_ubo",
    "completed",
    "rejected",
    "future_status",
  ])
    assert.equal(editableStatus(state), false);
  const path = "/business/entities/verifications/usd-kyb";
  for (const role of ["owner", "admin", "developer"]) {
    assert.equal(canMakeRequest({ role, active: true }, "GET", path), true);
    assert.equal(
      canMakeRequest({ role, active: true }, "PATCH", path),
      role !== "developer",
    );
  }
  assert.equal(isPublicPath("/kyb-person-invitation"), true);
  assert.equal(isPublicPath("/kyb/person-verification"), true);
  assert.equal(isPublicPath("/onboarding/usd"), false);
});
test("terms are required before submission while identity can follow later; unknown requirements remain visible", () => {
  assert.equal(deferredRequirements.has("signed_agreement_id"), false);
  assert.equal(
    deferredRequirements.has("associated_persons.identity_verification"),
    true,
  );
  assert.equal(deferredRequirements.has("business_legal_name"), false);
  assert.equal(requirementStage("unexpected_new_requirement"), 5);
  assert.equal(
    requirementStage("associated_persons.ownership_percentage_total"),
    2,
  );
  assert.equal(
    requirementStage("business_website_or_proof_of_nature_of_business"),
    4,
  );
  for (const status of [
    "approved",
    "completed",
    "declined",
    "expired",
    "abandoned",
  ])
    assert.equal(terminalIdentity(status), true);
  assert.equal(terminalIdentity("pending"), false);
});
test("private upload inputs reject empty files, unsupported types and oversized files", () => {
  assert.equal(fileError({ type: "image/heic", size: 10 * 1024 * 1024 }), null);
  assert.match(
    fileError({ type: "application/pdf", size: 10 * 1024 * 1024 + 1 }),
    /10 MiB/,
  );
  assert.match(fileError({ type: "text/html", size: 100 }), /Choose/);
  assert.match(fileError({ type: "application/pdf", size: 0 }), /empty/);
});
test("reference options tolerate new values and public person state never goes back in PATCH", () => {
  assert.deepEqual(options(["new_type"]), [
    { value: "new_type", label: "New type" },
  ]);
  assert.deepEqual(options([{ code: "123", name: "Agriculture" }]), [
    { value: "123", label: "Agriculture" },
  ]);
  assert.deepEqual(
    personPatch({
      person_key: "stable",
      first_name: "Ada",
      is_director: true,
      verification_status: "approved",
      invitation_status: "sent",
      raw_provider: "secret",
      associated_person_id: "server-id",
    }),
    { person_key: "stable", first_name: "Ada", is_director: true },
  );
});

test("person conflict reconciliation applies only locally edited fields and retains remote roles/status", () => {
  const baseline = [
    {
      person_key: "one",
      first_name: "Ada",
      email: "old@example.test",
      is_director: true,
      has_control: false,
    },
  ];
  const local = [{ ...baseline[0], email: "new@example.test" }];
  const remote = [
    {
      ...baseline[0],
      first_name: "Adanna",
      has_control: true,
      verification_status: "pending",
    },
    { person_key: "two", first_name: "New director" },
  ];
  const reconciled = reconcilePeople(remote, local, baseline);
  assert.deepEqual(reconciled, [
    { ...remote[0], email: "new@example.test" },
    remote[1],
  ]);
  assert.throws(
    () => reconcilePeople([], local, baseline),
    /removed in another session/,
  );
  assert.deepEqual(reconcilePeople([], baseline, baseline), []);
});

// Live document-purposes data is an object inside the SuccessResponse envelope.
test("document-purpose response preserves valid upload purposes and future backend values", () => {
  const result = options({
    document_purposes: [
      "business_formation",
      "directors_registry",
      "proof_of_address",
      "new_backend_purpose",
    ],
  });
  assert.deepEqual(
    result.map((option) => option.value),
    [
      "business_formation",
      "directors_registry",
      "proof_of_address",
      "new_backend_purpose",
    ],
  );
  assert.equal(result[0].label, "Business formation");
});

test("lookup root fields populate canonical sections without losing other saved data", () => {
  const input = {
    business_profile: { is_dao: false },
    business_legal_name: "Example Limited",
    business_type: "PRIVATE COMPANY LIMITED BY SHARES",
    registered_address: { street_line_1: "Example street", country: "NG" },
    industry_purpose: { source_of_funds: "owners_capital" },
    provider_extra: { retained: true },
  };
  const output = normalizeDraft(input);
  assert.equal(output.business_profile.business_legal_name, "Example Limited");
  assert.equal(
    output.business_profile.business_type,
    "PRIVATE COMPANY LIMITED BY SHARES",
  );
  assert.equal(output.business_profile.is_dao, false);
  assert.deepEqual(output.registered_address, input.registered_address);
  assert.deepEqual(output.industry_purpose, input.industry_purpose);
  assert.deepEqual(output.provider_extra, input.provider_extra);
  assert.equal(Object.hasOwn(output, "business_legal_name"), false);
  assert.equal(input.business_legal_name, "Example Limited");
  assert.equal(
    Object.hasOwn(input.business_profile, "business_legal_name"),
    false,
  );
});
test("sectioned manual edits and unsaved patches take precedence over lookup aliases", () => {
  const draft = normalizeDraft({
    business_legal_name: "Registry Limited",
    business_type: "registry type",
    is_dao: true,
    business_profile: {
      business_legal_name: "Manual Limited",
      business_type: "",
      is_dao: false,
    },
    source_of_funds: "owners_capital",
    industry_purpose: { source_of_funds: null },
  });
  assert.deepEqual(draft.business_profile, {
    business_legal_name: "Manual Limited",
    business_type: "",
    is_dao: false,
  });
  assert.equal(draft.industry_purpose.source_of_funds, null);
  const withEdits = mergeDraft(draft, {
    business_profile: { business_legal_name: "Unsaved edit" },
  });
  assert.equal(withEdits.business_profile.business_legal_name, "Unsaved edit");
  assert.deepEqual(normalizeDraft(withEdits), withEdits);
});

test("registry people retain explicit roles and missing ownership, without importing private provider fields", () => {
  const result = registryPeople(
    {
      directors: [
        {
          person_key: "youverify:0",
          first_name: "Sample",
          last_name: "Owner",
          has_ownership: true,
          ownership_percentage: null,
          has_control: false,
          title: "PERSONS WITH SIGNIFICANT CONTROL",
          payload: { secret: "omit" },
          birth_date: "omit",
        },
        { person_key: "saved", first_name: "Already saved" },
        { person_key: "youverify:0", first_name: "Duplicate" },
      ],
    },
    [{ person_key: "saved" }],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].ownership_percentage, null);
  assert.equal(result[0].has_control, false);
  assert.equal(result[0].has_ownership, true);
  assert.equal(Object.hasOwn(result[0], "payload"), false);
  assert.equal(Object.hasOwn(result[0], "birth_date"), false);
});

test("ownership evidence belongs to Documents, while ownership percentages stay with people", () => {
  assert.equal(
    requirementStage("ownership_structure_attestation_or_document"),
    4,
  );
  assert.equal(requirementStage("associated_persons.ownership_percentage"), 2);
  assert.equal(
    requirementStage("associated_persons.ownership_percentage_total"),
    2,
  );
  const missing = [
    "associated_persons.identity_verification",
    "business_website_or_proof_of_nature_of_business",
    "documents",
    "ownership_structure_attestation_or_document",
    "signed_agreement_id",
  ];
  const blockers = (step) =>
    missing.filter(
      (key) => !deferredRequirements.has(key) && requirementStage(key) === step,
    );
  assert.deepEqual(blockers(2), []);
  assert.deepEqual(blockers(4), [
    "business_website_or_proof_of_nature_of_business",
    "documents",
    "ownership_structure_attestation_or_document",
  ]);
  assert.ok(
    !deferredRequirements.has("ownership_structure_attestation_or_document"),
  );
});

test("server can_remove allows registry and verified people only before the first submission", async () => {
  const { personRemovalReason } = await import("../src/lib/usd-kyb/model.ts");
  assert.equal(
    personRemovalReason(
      { person_key: "youverify:0", can_remove: true },
      { status: "collecting" },
    ),
    undefined,
  );
  assert.equal(
    personRemovalReason(
      { can_remove: true, verification_status: "approved" },
      { status: "collecting" },
    ),
    undefined,
  );
  assert.match(
    personRemovalReason({ can_remove: false }, { status: "collecting" }),
    /unavailable/,
  );
  assert.match(
    personRemovalReason(
      { can_remove: true },
      { status: "requires_correction", submitted_for_review_at: "2026-10-29" },
    ),
    /after the first/,
  );
});
