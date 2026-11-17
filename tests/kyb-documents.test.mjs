import test from "node:test";
import assert from "node:assert/strict";
import {
  companyDocumentRequirementMessage,
  missingCompanyDocuments,
} from "../src/lib/usd-kyb/documents.ts";
import { requirementStage } from "../src/lib/usd-kyb/model.ts";
import { focusAttention } from "../src/lib/usd-kyb/attention.ts";

const file = (description, extra = {}) => ({
  business_usd_kyb_document_id: description,
  description,
  associated_person_id: null,
  file_url: "s3://raiz-document-upload/file",
  file_name: `${description}.pdf`,
  purposes: ["business_formation"],
  content_type: "application/pdf",
  file_size: 10,
  ...extra,
});

const required = [
  "Certificate of incorporation",
  "Status report (Form CAC 1.1)",
  "Memorandum and articles",
  "Proof of business address",
  "Ownership structure chart",
];

test("company documents are required, and proof of nature is required only without a website", () => {
  assert.deepEqual(missingCompanyDocuments([], {}), [
    ...required,
    "Proof of nature of business",
  ]);
  assert.deepEqual(
    missingCompanyDocuments([], {
      business_profile: { primary_website: "   " },
    }),
    [...required, "Proof of nature of business"],
  );
  assert.deepEqual(
    missingCompanyDocuments([], {
      business_profile: { primary_website: "https://example.com" },
    }),
    required,
  );
  assert.deepEqual(
    missingCompanyDocuments([], { primary_website: "https://example.com" }),
    required,
  );
});

test("a slot is satisfied only by a company file saved with that description", () => {
  const documents = [
    file("Certificate of incorporation"),
    file("Status report (Form CAC 1.1)", { associated_person_id: "person-1" }),
    file("memorandum.pdf", { purposes: ["business_formation"] }),
  ];
  const missing = missingCompanyDocuments(documents, {
    business_profile: { primary_website: "https://example.com" },
  });
  assert.equal(missing.includes("Certificate of incorporation"), false);
  assert.equal(missing.includes("Status report (Form CAC 1.1)"), true);
  assert.equal(missing.includes("Memorandum and articles"), true);
});

test("document slot requirements stay on the documents step", () => {
  for (const title of [...required, "Proof of nature of business"])
    assert.equal(requirementStage(title), 4);
  assert.equal(
    companyDocumentRequirementMessage("Memorandum and articles"),
    "Upload Memorandum and articles",
  );
  assert.equal(
    companyDocumentRequirementMessage("Proof of nature of business"),
    "Upload proof of nature of business, or add a business website.",
  );
});

test("a missing company document focuses its upload slot", () => {
  const calls = [];
  const slot = {
    dataset: { kybDocument: "Ownership structure chart" },
    scrollIntoView: (options) => calls.push(["scroll", options]),
    matches: () => false,
    querySelector: () => null,
    hasAttribute: () => false,
    focus: (options) => calls.push(["focus", options]),
  };
  focusAttention(
    {
      querySelectorAll: (selector) => (selector === "[name]" ? [] : [slot]),
      querySelector: () => null,
    },
    "Ownership structure chart",
  );
  assert.equal(calls[0][0], "scroll");
  assert.deepEqual(calls[1], ["focus", { preventScroll: true }]);
});
