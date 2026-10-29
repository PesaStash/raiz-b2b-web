import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as model from "../src/lib/usd-kyb/model.ts";
const agreementModule = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(
      new URL("../src/lib/usd-kyb/agreement.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
  {
    module: agreementModule,
    exports: agreementModule.exports,
    require: (name) => {
      if (name === "./model") return model;
      throw Error("Unexpected dependency");
    },
  },
);
const { signedAgreementId, persistAgreement } = agreementModule.exports;
const bundle = (status, id) => ({
  case: { status, draft_payload: id ? { signed_agreement_id: id } : {} },
  prefilled_draft: {},
});

test("terms status reads both root and sectioned backend agreement fields", () => {
  assert.equal(signedAgreementId(bundle("collecting", "signed")), "signed");
  assert.equal(
    signedAgreementId({
      case: { draft_payload: {} },
      prefilled_draft: { business_profile: { signed_agreement_id: "signed" } },
    }),
    "signed",
  );
  assert.equal(signedAgreementId(undefined), "");
});
test("acceptance is saved, confirmed, then verified against the refreshed case", async () => {
  const calls = [];
  const current = bundle("awaiting_admin_review", "signed");
  const result = await persistAgreement("signed", {
    save: async (id) => {
      calls.push(["save", id]);
      return { success: true };
    },
    confirm: async () => {
      calls.push(["confirm"]);
      return true;
    },
    refresh: async () => {
      calls.push(["refresh"]);
      return current;
    },
    writeEditableDraft: async () => {
      throw Error("Must not patch a locked case");
    },
  });
  assert.equal(result, current);
  assert.deepEqual(calls, [["save", "signed"], ["confirm"], ["refresh"]]);
});
test("an editable case receives the confirmed agreement through the normal draft save", async () => {
  let current = bundle("collecting");
  const calls = [];
  await persistAgreement("signed", {
    save: async () => ({ success: true }),
    confirm: async () => true,
    refresh: async () => {
      calls.push("refresh");
      return current;
    },
    writeEditableDraft: async (id) => {
      calls.push("write");
      current = bundle("collecting", id);
    },
  });
  assert.deepEqual(calls, ["refresh", "write", "refresh"]);
});
test("a locked case that does not receive the saved agreement stays unresolved without draft mutation", async () => {
  let writes = 0;
  await assert.rejects(
    persistAgreement("signed", {
      save: async () => ({ success: true }),
      confirm: async () => true,
      refresh: async () => bundle("awaiting_admin_review"),
      writeEditableDraft: async () => {
        writes++;
      },
    }),
    /has not appeared/,
  );
  assert.equal(writes, 0);
});
test("failed confirmation never writes an agreement into the KYB draft", async () => {
  let refreshes = 0;
  let writes = 0;
  await assert.rejects(
    persistAgreement("signed", {
      save: async () => ({ success: true }),
      confirm: async () => false,
      refresh: async () => {
        refreshes++;
        return bundle("collecting");
      },
      writeEditableDraft: async () => {
        writes++;
      },
    }),
    /could not be confirmed/,
  );
  assert.equal(refreshes, 0);
  assert.equal(writes, 0);
});
test("a failed save and a stale or unavailable case cannot display successful acceptance", async () => {
  await assert.rejects(
    persistAgreement("signed", {
      save: async () => ({ success: false }),
      confirm: async () => {
        throw Error("Must not confirm failed save");
      },
      refresh: async () => bundle("collecting"),
    }),
    /could not be confirmed/,
  );
  await assert.rejects(
    persistAgreement("signed", {
      save: async () => ({ success: true }),
      confirm: async () => true,
      refresh: async () => undefined,
    }),
    /could not be refreshed/,
  );
  await assert.rejects(
    persistAgreement("signed", {
      save: async () => ({ success: true }),
      confirm: async () => true,
      refresh: async () => bundle("awaiting_admin_review", "older"),
    }),
    /has not appeared/,
  );
});

test("a rejected agreement cannot appear accepted merely because its display prompt is nonempty", () => {
  const value = bundle(
    "collecting",
    "Invalid agreement (re-enter a valid agreement)",
  );
  value.validation = {
    missing_requirements: ["signed_agreement_id"],
    field_errors: [
      {
        field: "business_profile.signed_agreement_id",
        message: "Accept valid account terms.",
        placeholder: "Invalid agreement (re-enter a valid agreement)",
      },
    ],
  };
  assert.equal(signedAgreementId(value), "");
});
