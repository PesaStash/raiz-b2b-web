import test from "node:test";
import assert from "node:assert/strict";
import { invoiceEmailPayload } from "../src/lib/invoiceEmail.ts";

test("invoice-only mail omits absent, null and empty payment links", () => {
  for (const link of [undefined, null, "", "  "]) {
    assert.deepEqual(invoiceEmailPayload("JVBERi0=", link), { invoice_pdf_url: "JVBERi0=" });
  }
  assert.deepEqual(invoiceEmailPayload("data:application/pdf;base64,JVBERi0=", " https://example.com/pay/business "), { invoice_pdf_url: "data:application/pdf;base64,JVBERi0=", payment_link: "https://example.com/pay/business" });
});

test("empty or over-limit encoded PDF content is rejected without a mail request", () => {
  assert.throws(() => invoiceEmailPayload(""));
  assert.throws(() => invoiceEmailPayload("a".repeat(15_000_001)));
  assert.equal(invoiceEmailPayload("a".repeat(15_000_000)).invoice_pdf_url.length, 15_000_000);
});

import { invoiceLineItemSchema } from "../src/lib/invoiceLineItem.ts";
test("invoice quantities are positive whole numbers and unit prices are at least one", () => {
  const item = { description: "QA item", quantity: 1, unitPrice: 1 };
  assert.equal(invoiceLineItemSchema.safeParse(item).success, true);
  for (const quantity of [0, -1, 1.5, NaN, Infinity]) assert.equal(invoiceLineItemSchema.safeParse({ ...item, quantity }).success, false);
  for (const unitPrice of [0, -1, 0.99, NaN, Infinity]) assert.equal(invoiceLineItemSchema.safeParse({ ...item, unitPrice }).success, false);
});

import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
test("invoice-only sending reaches the mail endpoint without a receiving-account precheck", async () => {
  const requests = [];
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL("../src/services/invoice.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports, URLSearchParams, require: name => {
    if (name === "@/lib/invoiceEmail") return { invoiceEmailPayload };
    if (name === "@/lib/authAxios") return { AuthAxios: { post: async (url, payload) => { requests.push({ url, payload }); return { data: { success: true } }; } } };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  const result = await exports.SendInvoiceMailApi("invoice-id", { invoice_pdf_url: "JVBERi0=", payment_link: "" });
  assert.equal(result.success, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "/business/invoice/send/mail/?invoice_id=invoice-id");
  assert.deepEqual(requests[0].payload, { invoice_pdf_url: "JVBERi0=" });
});
