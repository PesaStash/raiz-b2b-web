import type { KybDocument } from "../../types/usdKyb.ts";

/** Company uploads matched by the description saved at upload time. */
export const companyDocumentSlots = [
  {
    title: "Certificate of incorporation",
    helper: "From the CAC",
    purpose: "business_formation",
    requirement: "always",
  },
  {
    title: "Status report (Form CAC 1.1)",
    helper: "Shows directors and shareholders",
    purpose: "directors_registry",
    requirement: "always",
  },
  {
    title: "Memorandum and articles",
    helper: "The MEMART filed with the CAC",
    purpose: "business_formation",
    requirement: "always",
  },
  {
    title: "Proof of business address",
    helper: "Utility bill or bank statement",
    purpose: "proof_of_address",
    requirement: "always",
  },
  {
    title: "Ownership structure chart",
    helper: "Show who owns the business and each owner’s percentage",
    purpose: "ownership_chart",
    requirement: "always",
  },
  {
    title: "Proof of nature of business",
    helper:
      "Evidence of what your business does e.g business invoice. Required if you don’t provide a business website.",
    purpose: "proof_of_nature_of_business",
    requirement: "without_website",
  },
] as const;

export type CompanyDocumentSlot = (typeof companyDocumentSlots)[number];

export function businessWebsite(draft: Record<string, unknown> | undefined) {
  const profile = draft?.business_profile;
  const nested =
    profile !== null && typeof profile === "object" && !Array.isArray(profile)
      ? (profile as Record<string, unknown>).primary_website
      : undefined;
  const value =
    typeof nested === "string"
      ? nested
      : typeof draft?.primary_website === "string"
        ? draft.primary_website
        : "";
  return value.trim();
}

export function slotIsRequired(
  slot: CompanyDocumentSlot,
  draft: Record<string, unknown> | undefined,
) {
  return slot.requirement === "always" || !businessWebsite(draft);
}

/** Slot files are company documents. A person upload with the same description does not count. */
export function companyDocumentFor(
  documents: KybDocument[] | undefined,
  title: string,
) {
  return documents?.find(
    (document) => document.description === title && !document.associated_person_id,
  );
}

export function missingCompanyDocuments(
  documents: KybDocument[] | undefined,
  draft: Record<string, unknown> | undefined,
) {
  return companyDocumentSlots
    .filter(
      (slot) => slotIsRequired(slot, draft) && !companyDocumentFor(documents, slot.title),
    )
    .map((slot) => slot.title);
}

export function isCompanyDocumentRequirement(key: string) {
  return companyDocumentSlots.some((slot) => slot.title === key);
}

export function companyDocumentRequirementMessage(key: string) {
  const slot = companyDocumentSlots.find((item) => item.title === key);
  if (!slot) return undefined;
  if (slot.requirement === "without_website")
    return "Upload proof of nature of business, or add a business website.";
  return `Upload ${slot.title}`;
}
