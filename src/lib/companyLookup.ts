import { isProductionDeployment } from "@/lib/permissions";
import type { AddressComponents } from "@/components/ui/AddressAutocomplete";
import type { LookupResult } from "@/types/usdKyb";

export const LOOKUP_COUNTRIES = ["NG", "ZA", "KE"] as const;

export type LookupCountry = (typeof LOOKUP_COUNTRIES)[number];

/** Real address used on non-production so Places can resolve structured fields. */
export const DEV_LOOKUP_ADDRESS = "13 Thorbon Avenue sabo yaba lagos";

/** Backend registration_type for countries without RC/BN prefixes. Confirm with API. */
const DEFAULT_REGISTRATION_TYPE: Record<Exclude<LookupCountry, "NG">, string> =
  {
    ZA: "CN",
    KE: "BN",
  };

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
  lookup: Record<string, unknown>;
};

function storageKey(entityId: string) {
  return `raiz-company-lookup:${entityId}`;
}

export function supportsCompanyLookup(countryCode: string): boolean {
  return (LOOKUP_COUNTRIES as readonly string[]).includes(
    countryCode.toUpperCase(),
  );
}

export function registrationType(countryCode: string, number: string): string {
  const country = countryCode.toUpperCase();
  if (country === "NG") {
    const match = number.trim().match(/^(RC|BN)/i);
    return (match?.[1] ?? "RC").toUpperCase();
  }
  if (country === "ZA" || country === "KE") {
    return DEFAULT_REGISTRATION_TYPE[country];
  }
  return "RC";
}

/** Digits (or raw value) for the company-lookup registration_number field. */
export function registrationNumberForLookup(
  countryCode: string,
  number: string,
): string {
  const trimmed = number.trim();
  if (countryCode.toUpperCase() === "NG") {
    return trimmed.replace(/^(RC|BN)[\s-]*/i, "");
  }
  return trimmed;
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

export function buildLookupPrefill(
  result: LookupResult,
  registrationNumber: string,
  countryCode: string,
  resolved: AddressComponents | null,
): LookupPrefill {
  const base = lookupPrefill(result.lookup);
  const address = resolved?.address ?? base.address;
  const streetFallback = address?.split(",")[0]?.trim() || address;

  return {
    registration_number: registrationNumber.trim(),
    country_code: countryCode.toUpperCase(),
    business_name: base.business_name ?? "",
    ...(base.business_email ? { business_email: base.business_email } : {}),
    ...(address ? { address } : {}),
    street: resolved?.street || streetFallback || undefined,
    building_number: resolved?.building_number || undefined,
    city: resolved?.city || undefined,
    state: resolved?.state || undefined,
    zip_code: resolved?.zip_code || undefined,
    resolved: !!resolved,
    lookup: result.lookup,
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

export function readLookupPrefill(entityId?: string): LookupPrefill | null {
  if (!entityId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(entityId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LookupPrefill;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.registration_number || !parsed.country_code) return null;
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
