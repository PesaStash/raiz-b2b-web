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

const LOOKUP_CHANGED = "raiz-company-lookup-changed";
const manualEntries = new Set<string>();
const manualKey = (entityId: string) => `raiz-company-manual:${entityId}`;

export function subscribeLookupPrefill(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(LOOKUP_CHANGED, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(LOOKUP_CHANGED, notify);
  };
}

function notifyLookupChanged() {
  if (typeof window !== "undefined") window.dispatchEvent?.(new Event(LOOKUP_CHANGED));
}

export function isManualBusinessEntry(entityId?: string): boolean {
  if (!entityId || typeof window === "undefined") return false;
  try { return localStorage.getItem(manualKey(entityId)) === "true" || manualEntries.has(entityId); }
  catch { return manualEntries.has(entityId); }
}

export function selectLookupPrefill(
  manual: boolean,
  supplied: LookupPrefill | null | undefined,
  stored: LookupPrefill | null,
): LookupPrefill | null {
  return manual ? null : supplied === undefined ? stored : supplied;
}

/** A manual-entry decision survives navigation and reauthentication for this business. */
export function enterBusinessManually(entityId?: string) {
  if (!entityId || typeof window === "undefined") return;
  try {
    localStorage.setItem(manualKey(entityId), "true");
    manualEntries.delete(entityId);
  } catch { manualEntries.add(entityId); }
  clearLookupPrefill(entityId);
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
  manualEntries.delete(entityId);
  try {
    localStorage.removeItem(manualKey(entityId));
    localStorage.setItem(storageKey(entityId), JSON.stringify(prefill));
  } catch {
    /* Prefill still works in memory for the current navigation. */
  }
  notifyLookupChanged();
}

let cachedRaw: string | null = null;
let cachedPrefill: LookupPrefill | null = null;
export function readLookupPrefill(entityId?: string): LookupPrefill | null {
  if (!entityId || typeof window === "undefined") return null;
  if (isManualBusinessEntry(entityId)) return null;
  try {
    const raw = localStorage.getItem(storageKey(entityId));
    if (!raw) return null;
    const parsed = raw === cachedRaw ? cachedPrefill : JSON.parse(raw) as LookupPrefill;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.registration_number || !parsed.country_code) return null;
    if (!parsed.confirmed_at) return null;
    if (lookupWasRejected(entityId, {
      country_code: parsed.country_code, jurisdiction_code: parsed.jurisdiction_code,
      registration_number: parsed.registration_number,
    })) return null;
    cachedRaw = raw;
    cachedPrefill = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLookupPrefill(entityId?: string) {
  if (!entityId || typeof window === "undefined") return;
  cachedRaw = null;
  cachedPrefill = null;
  try {
    localStorage.removeItem(storageKey(entityId));
  } catch {
    /* Ignore storage failures. */
  }
  notifyLookupChanged();
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
