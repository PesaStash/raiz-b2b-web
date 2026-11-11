import type { KybDraft, KybFieldError } from "../../types/usdKyb.ts";

/** Corrections prevent completion; drafts remain saveable while incomplete or invalid. */
export function draftInputErrors(draft: KybDraft): KybFieldError[] {
  const errors: KybFieldError[] = [];
  const add = (field: string, message: string) => errors.push({ field, message });
  const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const profile = record(draft.business_profile);
  const website = String(profile.primary_website ?? "").trim();
  if (website) {
    try {
      const url = new URL(website);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname || /\s/.test(website)) throw new Error();
    } catch { add("business_profile.primary_website", "Enter a valid website URL, including https://."); }
  }
  const phone = String(profile.phone ?? "").trim();
  if (phone && !/\d/.test(phone)) add("business_profile.phone", "Enter a phone number containing digits.");
  const email = String(profile.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) add("business_profile.email", "Enter a valid email address.");
  for (const path of ["registered_address", "physical_address"] as const) {
    const country = String(record(draft[path]).country ?? "");
    if (country && !/^[A-Z]{2}$/.test(country)) add(`${path}.country`, "Choose a valid two-letter country code.");
  }
  const amount = record(draft.industry_purpose).expected_monthly_payments_usd;
  if (amount != null && amount !== "" && (!["number", "string"].includes(typeof amount) || !Number.isFinite(Number(amount)) || Number(amount) < 0))
    add("industry_purpose.expected_monthly_payments_usd", "Expected monthly payments must be zero or more.");
  return errors;
}
