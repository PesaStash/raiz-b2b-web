/** Refresh pristine fields while retaining edits made since the last profile snapshot. */
export function mergePristineFields<T extends object>(current: T, previous: T, next: T): T {
  const merged = { ...current };
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (Object.is(current[key], previous[key])) merged[key] = next[key];
  }
  return merged;
}

/** Alias API address paths to the basic form's flat controls. Unknown paths stay in the summary. */
export function basicBusinessField(path: string): string {
  const normalized = path.replace(/\[(\d+)\]/g, ".$1").replace(/^body\./, "");
  const aliases: Record<string, string> = {
    "business_account.business_registration_number": "business_registration_number",
    "address.postcode": "zip_code", "address.zip_code": "zip_code",
    "address.street": "street", "address.street_line_1": "street",
    "address.city": "city", "address.state": "state", "address.country": "country_code",
    "address.length_of_stay_months": "length_of_stay_months",
  };
  return aliases[normalized] ?? normalized;
}
