import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { readApiError } from "../src/lib/apiError.ts";
import * as corrections from "../src/lib/usd-kyb/corrections.ts";
import * as model from "../src/lib/usd-kyb/model.ts";
import {
  identityStarted,
  personDetailsErrors,
  canResendPersonInvitation,
} from "../src/lib/usd-kyb/personDetails.ts";
import { SaveQueue } from "../src/lib/usd-kyb/saveQueue.ts";
function editorHarness({
  status = "collecting",
  canWrite = true,
  existingPerson = {},
} = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let bundle = {
    case: {
      status,
      payload_version: 1,
      draft_payload: {},
      youverify_lookup_snapshot: {
        directors: [
          {
            person_key: "existing",
            first_name: "Existing",
            last_name: "Director",
            email: "director@example.com",
            title: "Director",
            is_director: true,
            has_ownership: true,
            ownership_percentage: 60,
            has_control: false,
            is_signer: false,
          },
        ],
      },
    },
    associated_persons: [
      {
        person_key: "existing",
        first_name: "Existing",
        last_name: "Director",
        email: "director@example.com",
        title: "Director",
        has_ownership: true,
        ownership_percentage: 60,
        has_control: false,
        is_signer: false,
        is_director: true,
        ...existingPerson,
      },
    ],
    documents: [
      {
        business_usd_kyb_document_id: "person-document",
        associated_person_id: "registry-person",
      },
      {
        business_usd_kyb_document_id: "business-document",
        associated_person_id: null,
      },
    ],
    validation: { missing_requirements: [] },
  };
  const calls = [];
  const invitations = [];
  const removals = [];
  const toasts = [];
  let failure;
  let invitationFailure;
  const api = {
    get: async () => bundle,
    removePerson: async (id, version) => {
      removals.push({ id, version });
      bundle = {
        ...bundle,
        case: {
          ...bundle.case,
          payload_version: bundle.case.payload_version + 1,
        },
        associated_persons: bundle.associated_persons.filter(
          (person) => person.associated_person_id !== id,
        ),
        documents: bundle.documents.filter(
          (document) =>
            document.business_usd_kyb_document_id !== "person-document",
        ),
      };
      return { ...bundle, removed_document_ids: ["person-document"] };
    },
    invitation: async (id, action) => {
      invitations.push({ id, action });
      if (invitationFailure) throw invitationFailure;
      bundle = {
        ...bundle,
        associated_persons: bundle.associated_persons.map((p) =>
          p.associated_person_id === id
            ? { ...p, invitation_status: "sent" }
            : p,
        ),
      };
      return { ok: true };
    },
    patch: async (payload) => {
      calls.push(payload);
      if (failure) {
        const error = failure;
        failure = undefined;
        throw error;
      }
      const rows = new Map(
        bundle.associated_persons.map((p) => [p.person_key, p]),
      );
      for (const p of payload.associated_persons ?? [])
        rows.set(p.person_key, {
          person_key: p.person_key,
          associated_person_id: `id-${p.person_key}`,
          first_name: p.first_name,
          is_director: p.is_director,
        });
      bundle = {
        ...bundle,
        case: {
          ...bundle.case,
          payload_version: bundle.case.payload_version + 1,
        },
        associated_persons: [...rows.values()],
      };
      return bundle;
    },
  };
  const react = {
    useState: (initial) => {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (v) => {
          slots[i] = typeof v === "function" ? v(slots[i]) : v;
        },
      ];
    },
    useRef: (initial) => {
      const i = cursor++;
      return slots[i] ?? (slots[i] = { current: initial });
    },
    useCallback: (fn) => fn,
    useEffect: (fn) => {
      effects.push(fn);
    },
  };
  const module = { exports: {} };
  const source = ts.transpileModule(
    readFileSync(
      new URL("../src/lib/hooks/useUsdKyb.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    window: { addEventListener() {}, removeEventListener() {} },
    document: { addEventListener() {}, removeEventListener() {} },
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    require: (name) => {
      if (name === "react") return react;
      if (name === "sonner")
        return {
          toast: {
            error: (message, options) => toasts.push({ message, options }),
            success: (message) => toasts.push({ message, type: "success" }),
          },
        };
      if (name === "next/navigation")
        return { useRouter: () => ({ push() {} }) };
      if (name === "@tanstack/react-query")
        return {
          useQuery: () => ({ data: bundle }),
          useQueryClient: () => ({
            setQueryData() {},
            invalidateQueries: async () => {},
          }),
        };
      if (name === "@/services/usdKyb") return { kybApi: api };
      if (name === "@/lib/hooks/usePermissions")
        return {
          usePermissions: () => ({
            ready: true,
            canWriteBusiness: canWrite,
            user: { business_account: { entity_id: "test" } },
          }),
        };
      if (name === "@/lib/apiError") return { readApiError };
      if (name === "@/lib/session") return { sessionGeneration: () => 1 };
      if (name === "@/lib/usd-kyb/model") return model;
      if (name === "@/lib/usd-kyb/corrections") return corrections;
      if (name === "@/lib/usd-kyb/personDetails")
        return {
          identityStarted,
          personDetailsErrors,
          canResendPersonInvitation,
        };
      if (name === "@/lib/usd-kyb/saveQueue") return { SaveQueue };
      throw Error(name);
    },
  });
  const render = () => {
    cursor = 0;
    effects = [];
    const result = module.exports.useUsdKyb();
    for (const effect of effects) effect();
    return result;
  };
  render();
  return {
    render,
    calls,
    invitations,
    removals,
    toasts,
    rejectFields: (errors) => {
      bundle = {
        ...bundle,
        validation: {
          ...bundle.validation,
          field_errors: errors,
          missing_requirements: errors.map((error) => error.field),
        },
      };
    },
    failInvitation: (error) => {
      invitationFailure = error;
    },
    failSave: (error = new Error("Save failed")) => {
      failure = error;
    },
    verify: (key) => {
      bundle = {
        ...bundle,
        associated_persons: bundle.associated_persons.map((p) =>
          p.person_key === key ? { ...p, verification_status: "approved" } : p,
        ),
      };
    },
  };
}
const person = (key) => ({
  person_key: key,
  first_name: "Sample",
  last_name: "Person",
  email: "sample@example.com",
  birth_date: "1985-02-20",
  has_ownership: false,
  has_control: false,
  is_signer: false,
  is_director: true,
});
test("only changed complete people are written and business-only saves omit all people", async () => {
  const h = editorHarness();
  let e = h.render();
  assert.equal(e.canEditPerson(e.people[0]), true);
  e.changePeople([...e.people, person("one")]);
  await e.flush();
  e = h.render();
  assert.deepEqual(
    Array.from(h.calls[0].associated_persons, (p) => p.person_key),
    ["one"],
  );
  assert.equal(h.calls[0].associated_persons[0].birth_date, "1985-02-20");
  assert.equal(
    e.personInput(e.people.find((p) => p.person_key === "one")).birth_date,
    "1985-02-20",
  );
  e.change("business_profile.email", "team@example.com");
  await e.flush();
  e = h.render();
  assert.equal(h.calls[1].associated_persons, undefined);
  e.changePeople([...e.people, person("two")]);
  await e.flush();
  e = h.render();
  assert.deepEqual(
    Array.from(h.calls[2].associated_persons, (p) => p.person_key),
    ["two"],
  );
  await e.reload(false);
  e = h.render();
  assert.equal(
    e.canEditPerson(e.people.find((p) => p.person_key === "one")),
    true,
  );
});
test("fresh verification state does not prevent a changed-field supplement from preserving evidence", async () => {
  const h = editorHarness();
  let e = h.render();
  e.changePeople([...e.people, person("one")]);
  await e.flush();
  e = h.render();
  h.verify("one");
  e.changePeople(
    e.people.map((p) =>
      p.person_key === "one" ? { ...e.personInput(p), title: "Director" } : p,
    ),
  );
  await e.flush();
  assert.equal(h.calls.length, 2);
  assert.deepEqual(Object.keys(h.calls[1].associated_persons[0]).sort(), [
    "person_key",
    "title",
  ]);
});

test("lookup directors retain registry fields and roles alongside supplemental details", async () => {
  const h = editorHarness();
  let e = h.render();
  const director = e.people[0];
  const input = e.personInput(director);
  assert.equal(input.last_name, "Director");
  assert.equal(input.ownership_percentage, 60);
  e.changePeople(
    e.people.map((p) =>
      p.person_key === director.person_key
        ? {
            ...input,
            birth_date: "1985-02-20",
            residential_address: {
              street_line_1: "1 Example Street",
              city: "Lagos",
              postal_code: "100001",
              country: "NGA",
            },
            nationalities: ["NGA"],
            place_of_birth: { country: "NGA" },
          }
        : p,
    ),
  );
  await e.flush();
  const sent = h.calls[0].associated_persons[0];
  assert.equal(sent.person_key, "existing");
  assert.equal(sent.first_name, undefined);
  assert.equal(sent.email, undefined);
  assert.equal(sent.has_ownership, undefined);
  assert.equal(sent.ownership_percentage, undefined);
  assert.equal(sent.is_director, undefined);
  assert.equal(sent.has_control, undefined);
  assert.equal(sent.is_signer, undefined);
  assert.equal(sent.birth_date, "1985-02-20");
  assert.equal(sent.residential_address.country, "NGA");
  assert.equal(h.calls[0].associated_persons.length, 1);
});

const completePerson = (key) => ({
  ...person(key),
  residential_address: {
    street_line_1: "1 Example Street",
    city: "Lagos",
    postal_code: "100001",
    country: "NGA",
  },
});
test("first invitations require complete details successfully saved before any request", async () => {
  const h = editorHarness();
  let e = h.render();
  await e.invitePerson(e.people[0], "send");
  assert.equal(h.invitations.length, 0);
  e.changePeople([...e.people, completePerson("ready")]);
  e = h.render();
  assert.equal(
    e.personDetailsSaved(e.people.find((p) => p.person_key === "ready")),
    false,
  );
  await e.flush();
  e = h.render();
  const target = e.people.find((p) => p.person_key === "ready");
  assert.equal(e.personDetailsSaved(target), true);
  await e.invitePerson(target, "send");
  assert.deepEqual(h.invitations, [{ id: "id-ready", action: "send" }]);
  e = h.render();
  await e.invitePerson(
    e.people.find((p) => p.person_key === "ready"),
    "resend",
  );
  assert.equal(h.invitations[1].action, "resend");
});
test("failed saves and incomplete details never enable a first invitation", async () => {
  const h = editorHarness();
  let e = h.render();
  e.changePeople([...e.people, person("incomplete")]);
  await e.flush();
  e = h.render();
  const incomplete = e.people.find((p) => p.person_key === "incomplete");
  assert.equal(e.personDetailsSaved(incomplete), false);
  await e.invitePerson(incomplete, "send");
  assert.equal(h.invitations.length, 0);
  e.changePeople([...e.people, completePerson("failed")]);
  h.failSave();
  await assert.rejects(e.flush(), /Save failed/);
  e = h.render();
  assert.equal(
    e.personDetailsSaved(e.people.find((p) => p.person_key === "failed")),
    false,
  );
  assert.equal(h.invitations.length, 0);
});

test("onboarding request failures toast the same response message kept inline", async () => {
  const h = editorHarness();
  let e = h.render();
  e.changePeople([...e.people, completePerson("failed")]);
  h.failSave();
  await assert.rejects(e.flush(), /Save failed/);
  e = h.render();
  assert.equal(e.error, "Save failed");
  assert.equal(h.toasts.at(-1).message, e.error);
  assert.equal(h.toasts.at(-1).options.id, "onboarding-error");
});

test("backend response messages toast on every failed submission, including repeated errors", async () => {
  const h = editorHarness();
  let e = h.render();
  e.changePeople([...e.people, completePerson("response-error")]);
  const message = "Please check the associated person’s residential address.";
  for (let attempt = 0; attempt < 2; attempt++) {
    h.failSave({ response: { status: 422, data: { message } } });
    await assert.rejects(e.flush());
    e = h.render();
    assert.equal(e.error, message);
    assert.equal(h.toasts.at(-1).message, message);
  }
  assert.equal(h.toasts.filter((item) => item.message === message).length, 2);
});

test("confirming a lookup director has no ownership preserves their roles and does not unlock invitations", async () => {
  const h = editorHarness();
  let e = h.render();
  const saved = e.people[0];
  const updated = {
    ...e.personInput(saved),
    has_ownership: false,
    ownership_percentage: null,
  };
  e.changePeople(
    e.people.map((person) =>
      person.person_key === updated.person_key ? updated : person,
    ),
  );
  await e.flush();
  e = h.render();
  const sent = h.calls[0].associated_persons[0];
  assert.equal(sent.first_name, undefined);
  assert.equal(sent.is_director, undefined);
  assert.equal(sent.has_ownership, false);
  assert.equal(sent.ownership_percentage, null);
  assert.equal(sent.has_control, undefined);
  assert.equal(sent.is_signer, undefined);
  assert.equal(e.personDetailsSaved(e.people[0]), false);
  await e.invitePerson(e.people[0], "send");
  assert.equal(h.invitations.length, 0);
});

const sentPerson = {
  associated_person_id: "id-existing",
  email: "director@example.com",
  invitation_status: "sent",
};
test("resending on submitted cases uses only the invitation endpoint without editing person data", async () => {
  for (const status of [
    "awaiting_admin_review",
    "submitted_to_bridge",
    "under_review",
    "awaiting_ubo",
  ]) {
    const h = editorHarness({ status, existingPerson: sentPerson });
    let e = h.render();
    assert.equal(e.editable, false);
    assert.equal(e.canResendPerson(e.people[0]), true);
    await e.resendPerson(e.people[0]);
    assert.deepEqual(h.invitations, [{ id: "id-existing", action: "resend" }]);
    assert.equal(h.calls.length, 0);
    assert.ok(h.toasts.some((item) => item.type === "success"));
  }
});
test("review resend respects roles, completed cases and people who were never invited", async () => {
  for (const options of [
    {
      canWrite: false,
      status: "awaiting_admin_review",
      existingPerson: sentPerson,
    },
    { status: "completed", existingPerson: sentPerson },
    {
      status: "awaiting_admin_review",
      existingPerson: { ...sentPerson, invitation_status: "not_sent" },
    },
  ]) {
    const h = editorHarness(options);
    const e = h.render();
    assert.equal(e.canResendPerson(e.people[0]), false);
    await e.resendPerson(e.people[0]);
    assert.equal(h.invitations.length, 0);
    assert.equal(h.calls.length, 0);
  }
});
test("resend checks fresh verification and shows backend lock errors without patching a locked case", async () => {
  const stale = editorHarness({
    status: "awaiting_admin_review",
    existingPerson: sentPerson,
  });
  const old = stale.render();
  stale.verify("existing");
  await old.resendPerson(old.people[0]);
  assert.equal(stale.invitations.length, 0);
  const h = editorHarness({
    status: "awaiting_admin_review",
    existingPerson: { ...sentPerson, invitation_status: "expired" },
  });
  let e = h.render();
  h.failInvitation({
    response: {
      status: 409,
      data: { message: "Invitations cannot be changed in this case state." },
    },
  });
  await e.resendPerson(e.people[0]);
  e = h.render();
  assert.equal(h.calls.length, 0);
  assert.equal(e.error, "Invitations cannot be changed in this case state.");
  assert.equal(h.toasts.at(-1).message, e.error);
});

test("can_remove permits registry/verified people to be removed and the selected list stays authoritative", async () => {
  const h = editorHarness({
    existingPerson: {
      associated_person_id: "registry-person",
      verification_status: "approved",
      can_remove: true,
    },
  });
  let e = h.render();
  await e.removePerson(e.people[0]);
  e = h.render();
  assert.deepEqual(h.removals, [{ id: "registry-person", version: 1 }]);
  assert.equal(e.people.length, 0);
  assert.equal(e.bundle.case.payload_version, 2);
  assert.deepEqual(
    Array.from(
      e.bundle.documents,
      (document) => document.business_usd_kyb_document_id,
    ),
    ["business-document"],
  );
  await e.reload(false);
  e = h.render();
  assert.equal(e.people.length, 0);
  assert.equal(e.bundle.case.youverify_lookup_snapshot.directors.length, 1);
});
test("server-disabled and reopened cases never send person removals", async () => {
  for (const options of [
    { existingPerson: { can_remove: false, associated_person_id: "person" } },
    {
      status: "requires_correction",
      existingPerson: { can_remove: true, associated_person_id: "person" },
    },
  ]) {
    const h = editorHarness(options);
    const e = h.render();
    await e.removePerson(e.people[0]);
    assert.equal(h.removals.length, 0);
  }
});

test("saved supplemental fields with server corrections do not unlock a first invite", async () => {
  const h = editorHarness();
  let e = h.render();
  e.changePeople([...e.people, completePerson("needs-correction")]);
  h.rejectFields([
    {
      field: "associated_persons[1].residential_address.postal_code",
      associated_person_id: "id-needs-correction",
      message: "Enter a valid postal code.",
      source: "local",
    },
  ]);
  await e.flush();
  e = h.render();
  const target = e.people.find(
    (person) => person.person_key === "needs-correction",
  );
  assert.equal(e.personDetailsSaved(target), false);
  assert.equal(e.personErrors(target)[0].message, "Enter a valid postal code.");
  await e.invitePerson(target, "send");
  assert.equal(h.invitations.length, 0);
});
test("verified people can correct a redacted ID type without resending roles or other hidden fields", async () => {
  const h = editorHarness({
    existingPerson: {
      associated_person_id: "verified-person",
      verification_status: "approved",
    },
  });
  let e = h.render();
  const target = e.people[0];
  assert.equal(e.canEditPerson(target), true);
  e.changePeople([
    {
      ...e.personInput(target),
      identifying_information: [{ type: "passport" }],
    },
  ]);
  await e.flush();
  assert.deepEqual(
    JSON.parse(JSON.stringify(h.calls[0].associated_persons[0])),
    { person_key: "existing", identifying_information: [{ type: "passport" }] },
  );
});

test("one queued save may contain a new person and changed fields for an existing person", async () => {
  const h = editorHarness();
  const e = h.render();
  e.changePeople([
    { ...e.personInput(e.people[0]), title: "CEO" },
    completePerson("new-person"),
  ]);
  await e.flush();
  assert.deepEqual(
    Array.from(h.calls[0].associated_persons, (person) => person.person_key),
    ["existing", "new-person"],
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(h.calls[0].associated_persons[0])),
    { person_key: "existing", title: "CEO" },
  );
});
