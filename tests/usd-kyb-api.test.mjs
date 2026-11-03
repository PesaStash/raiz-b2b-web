import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { validationForPeople } from "../src/lib/usd-kyb/corrections.ts";
import { personPatch } from "../src/lib/usd-kyb/model.ts";

function service({ uploadError, uploadStatus = 200 } = {}) {
  const calls = [];
  const replies = [];
  const request = async (method, url, payload, config) => {
    calls.push({ method, url, payload, config });
    const next = replies.shift();
    if (next instanceof Error) throw next;
    return { data: next ?? { success: true, data: { ok: true } } };
  };
  const client = {
    get: (url, config) => request("GET", url, undefined, config),
    post: (url, payload, config) => request("POST", url, payload, config),
    patch: (url, payload, config) => request("PATCH", url, payload, config),
    delete: (url, config) => request("DELETE", url, undefined, config),
  };
  const module = { exports: {} };
  const source = ts.transpileModule(
    readFileSync(new URL("../src/services/usdKyb.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    fetch: async (url, config) => {
      calls.push({ method: config.method, url, payload: config.body, config });
      if (uploadError) throw uploadError;
      return {
        ok: uploadStatus >= 200 && uploadStatus < 300,
        status: uploadStatus,
      };
    },
    require: (name) => {
      if (name === "@/lib/authAxios") return { AuthAxios: client };
      if (name === "@/lib/publicAxios") return { PublicAxios: client };
      if (name === "@/lib/usd-kyb/model") return { personPatch };
      if (name === "@/lib/usd-kyb/corrections") return { validationForPeople };
      if (name === "axios")
        return {
          request: async (config) => {
            calls.push({
              method: config.method,
              url: config.url,
              payload: config.data,
              config,
            });
            if (uploadError) throw uploadError;
            config.onUploadProgress?.({ loaded: 12, total: 12 });
            return {};
          },
        };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return { ...module.exports, calls, replies };
}

test("KYB requests use authenticated tenant scope and explicit version/declaration payloads", async () => {
  const { kybApi, calls } = service();
  await kybApi.get();
  await kybApi.patch({
    expected_version: 7,
    draft_payload: { business_profile: { business_legal_name: "Example" } },
    associated_persons: [
      {
        person_key: "stable",
        is_director: true,
        invitation_status: "sent",
        verification_status: "pending",
      },
    ],
  });
  await kybApi.submit(8);
  await kybApi.removePerson("person/1", 9);
  assert.equal(calls[0].url, "/business/entities/verifications/usd-kyb");
  assert.equal(calls[1].payload.expected_version, 7);
  assert.deepEqual(
    JSON.parse(JSON.stringify(calls[1].payload.associated_persons)),
    [{ person_key: "stable", is_director: true }],
  );
  assert.deepEqual(JSON.parse(JSON.stringify(calls[2].payload)), {
    expected_version: 8,
    declaration_accepted: true,
  });
  assert.equal(calls[3].config.params.expected_version, 9);
  assert.match(calls[3].url, /person%2F1$/);
  for (const call of calls)
    assert.doesNotMatch(
      JSON.stringify(call.payload ?? {}),
      /business_account_id|business_id|submit-to-bridge/,
    );
});
test("private upload performs raw PUT with supplied headers then registers the private S3 reference", async () => {
  const { kybApi, calls, replies } = service();
  replies.push({
    upload_url: "https://upload.example.test/object",
    file_url: "s3://private/object",
    method: "PUT",
    required_headers: {
      "Content-Type": "application/pdf",
      "x-amz-test": "required",
    },
    max_file_size: 1000,
  });
  replies.push({
    success: true,
    data: { business_usd_kyb_document_id: "doc-1" },
  });
  const file = { name: "formation.pdf", type: "application/pdf", size: 12 };
  const progress = [];
  await kybApi.upload(file, "business_formation", null, (value) =>
    progress.push(value),
  );
  assert.equal(calls[0].payload.file_size, 12);
  assert.equal(calls[1].method, "PUT");
  assert.equal(calls[1].config.credentials, "omit");
  assert.equal(calls[1].config.headers["x-amz-test"], "required");
  assert.equal(calls[1].config.headers.Authorization, undefined);
  assert.equal(calls[1].payload, file);
  assert.equal(calls[2].payload.file_url, "s3://private/object");
  assert.equal(calls[2].payload.file_name, "formation.pdf");
  assert.deepEqual(progress, [0, 100]);
});
test("an invalid public metadata target never registers a document", async () => {
  const { kybApi, calls, replies } = service();
  replies.push({
    upload_url: "https://upload.example.test/object",
    file_url: "https://public.example.test/object",
    method: "PUT",
    required_headers: {},
    max_file_size: 100,
  });
  await assert.rejects(
    kybApi.upload(
      { name: "x", type: "application/pdf", size: 12 },
      "business_formation",
      null,
      () => {},
    ),
    /private upload target/,
  );
  assert.equal(calls.length, 1);
});
test("invitation tokens only enter JSON bodies and pending sessions can omit URL/token", async () => {
  const { personInvitationApi, calls, replies } = service();
  const token = "synthetic-test-token-that-is-long-enough";
  replies.push({ success: true, data: { associated_person_id: "person" } });
  replies.push({
    success: true,
    data: { session_id: "existing", status: "pending", workflow_id: null },
  });
  await personInvitationApi.inspect(token);
  const session = await personInvitationApi.session(token);
  assert.equal(session.session_id, "existing");
  assert.equal(session.url, undefined);
  for (const call of calls) {
    assert.equal(call.payload.token, token);
    assert.equal(call.url.includes(token), false);
    assert.equal(call.method, "POST");
  }
});

test("a failed raw PUT never registers metadata for an incomplete upload", async () => {
  const { kybApi, calls, replies } = service({
    uploadError: new Error("Connection lost"),
  });
  replies.push({
    upload_url: "https://upload.example.test/object",
    file_url: "s3://private/object",
    method: "PUT",
    required_headers: { "Content-Type": "application/pdf" },
    max_file_size: 100,
  });
  await assert.rejects(
    kybApi.upload(
      { name: "formation.pdf", type: "application/pdf", size: 12 },
      "business_formation",
      null,
      () => {},
    ),
    /Connection lost/,
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[1].method, "PUT");
});

test("successful final submission exposes the backend response message without changing the bundle", async () => {
  const { kybApi, replies } = service();
  replies.push({
    success: true,
    message: "Your verification was submitted successfully.",
    data: { case: { status: "awaiting_admin_review" } },
  });
  let message;
  const bundle = await kybApi.submit(9, (value) => {
    message = value;
  });
  assert.equal(message, "Your verification was submitted successfully.");
  assert.equal(bundle.case.status, "awaiting_admin_review");
});

test("a rejected S3 response never registers document metadata", async () => {
  const { kybApi, calls, replies } = service({ uploadStatus: 403 });
  replies.push({
    upload_url: "https://upload.example.test/object",
    file_url: "s3://private/object",
    method: "PUT",
    required_headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private",
      "Content-Disposition": "attachment",
    },
    max_file_size: 1000,
  });
  await assert.rejects(
    kybApi.upload(
      { name: "sample.pdf", type: "application/pdf", size: 12 },
      "business_formation",
      null,
      () => {},
    ),
    /HTTP 403/,
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[1].config.credentials, "omit");
  assert.equal(calls[1].config.headers["Cache-Control"], "private");
  assert.equal(calls[1].config.headers["Content-Disposition"], "attachment");
});
