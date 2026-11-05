import { isProductionDeployment } from "@/lib/permissions";
import type { AddressComponents } from "@/components/ui/AddressAutocomplete";
import type { KybBundle, LookupResult } from "@/types/usdKyb";

/** Known sandbox fixture replacement, never applied to other addresses. */
export const DEV_LOOKUP_ADDRESS = "13 Thorbon Avenue sabo yaba lagos";

export type LookupPrefill = {
  registration_number: string;
  country_code: string;
  business_name: string;
  business_email?: string;
  address?: string;
  street?: string;
  building_number?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  resolved: boolean;
  jurisdiction_code?: string;
  confirmed_at?: string;
};

function storageKey(entityId: string) {
  return `raiz-company-lookup:${entityId}`;
}

/** Human-readable line from a register address string or object. */
export function formatLookupAddress(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  return [
    row.street_line_1,
    row.street_line_2,
    row.street,
    row.building_number,
    row.city,
    row.subdivision,
    row.state,
    row.postal_code,
    row.zip_code,
    typeof row.country === "string" ? row.country.toUpperCase() : row.country,
  ]
    .filter((part): part is string => typeof part === "string" && !!part.trim())
    .join(", ");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function lookupAddressForForm(registeredAddress: unknown): string {
  const line = formatLookupAddress(registeredAddress);
  if (!line) return "";
  const env =
    process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
  if (
    !isProductionDeployment(env) &&
    /1st\s+floor\s*,\s*sum\s+house\s*,\s*fake\s+street/i.test(line)
  ) return DEV_LOOKUP_ADDRESS;
  return line;
}

export function lookupPrefill(lookup: Record<string, unknown>): {
  business_name?: string;
  business_email?: string;
  address?: string;
} {
  const business_name = text(lookup.legal_name);
  const business_email = text(lookup.email);
  const address = lookupAddressForForm(lookup.registered_address);
  return {
    ...(business_name ? { business_name } : {}),
    ...(business_email ? { business_email } : {}),
    ...(address ? { address } : {}),
  };
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function buildLookupPrefill(
  result: LookupResult,
  registrationNumber: string,
  countryCode: string,
  resolved: AddressComponents | null,
  bundle?: KybBundle,
): LookupPrefill {
  const draft = object(bundle?.prefilled_draft ?? result.case?.draft_payload);
  const profile = { ...draft, ...object(draft.business_profile) };
  const savedAddress = draft.registered_address ?? profile.registered_address;
  const source = Object.keys(object(savedAddress)).length
    ? savedAddress : result.lookup.registered_address;
  const original = object(source);
  const line = lookupAddressForForm(source);
  const sandboxSwap = line !== formatLookupAddress(source);
  const address = sandboxSwap ? {} : original;
  const street = text(address.street_line_1) || text(address.street) || resolved?.street || line.split(",")[0];
  const city = text(address.city) || resolved?.city;
  const state = text(address.subdivision) || text(address.state) || resolved?.state;
  const zip = text(address.postal_code) || text(address.zip_code) || resolved?.zip_code;
  return {
    registration_number: text(result.lookup.registration_number) || registrationNumber.trim(),
    country_code: text(original.country).toUpperCase() || countryCode.toUpperCase(),
    jurisdiction_code: text(result.lookup.jurisdiction_code) || undefined,
    business_name: text(profile.business_legal_name) || text(result.lookup.legal_name),
    business_email: text(profile.email) || text(result.lookup.email) || undefined,
    address: resolved?.address || line,
    street,
    building_number: text(address.building_number) || resolved?.building_number,
    city, state, zip_code: zip,
    resolved: !!(street && city && state && zip),
    confirmed_at: new Date().toISOString(),
  };
}

export function saveLookupPrefill(entityId: string, prefill: LookupPrefill) {
  if (!entityId || typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(entityId), JSON.stringify(prefill));
  } catch {
    /* Prefill still works in memory for the current navigation. */
  }
}

let cachedRaw: string | null = null;
let cachedPrefill: LookupPrefill | null = null;
export function readLookupPrefill(entityId?: string): LookupPrefill | null {
  if (!entityId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(entityId));
    if (!raw) return null;
    if (raw === cachedRaw) return cachedPrefill;
    const parsed = JSON.parse(raw) as LookupPrefill;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.registration_number || !parsed.country_code) return null;
    if (!parsed.confirmed_at) return null;
    cachedRaw = raw;
    cachedPrefill = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLookupPrefill(entityId?: string) {
  if (!entityId || typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(entityId));
  } catch {
    /* Ignore storage failures. */
  }
}

/** Confirmation is a UI decision: the inquiry endpoint saves before the user reviews it. */
export function saveLookupDecision(entityId: string, lookup: Record<string, unknown>, accepted: boolean) {
  if (!entityId || typeof window === "undefined") return;
  try {
    localStorage.setItem(`raiz-company-decision:${entityId}`, JSON.stringify({
      country: lookup.country_code, jurisdiction: lookup.jurisdiction_code,
      number: lookup.registration_number, accepted,
    }));
  } catch { /* The current view still requires explicit confirmation. */ }
}
export function lookupWasRejected(entityId: string | undefined, lookup: Record<string, unknown>): boolean {
  if (!entityId || typeof window === "undefined") return false;
  try {
    const saved = JSON.parse(localStorage.getItem(`raiz-company-decision:${entityId}`) || "null");
    return !!saved && saved.accepted === false && saved.country === lookup.country_code && saved.jurisdiction === lookup.jurisdiction_code && saved.number === lookup.registration_number;
  } catch { return false; }
}
