import type { CountryRequirements, InquiryRequest } from "../types/usdKyb";

export function inquiryRequest(country: CountryRequirements, values: Record<string, string | boolean>, consent: boolean): InquiryRequest {
  return {
    country_code: country.country_code,
    registration_number: String(values.registration_number ?? "").trim(),
    consent,
    ...(country.requires_subdivision ? { jurisdiction_code: String(values.jurisdiction_code ?? "") } : {}),
    ...(country.country_code === "NG" ? {
      ...(values.registration_type ? { registration_type: String(values.registration_type) } : {}),
      ...(String(values.registration_name ?? "").trim() ? { registration_name: String(values.registration_name).trim() } : {}),
    } : {}),
  };
}

export function inquiryErrors(country: CountryRequirements, values: Record<string, string | boolean>, consent: boolean): string[] {
  const errors: string[] = [];
  if (!consent) errors.push("Please consent to the business registry inquiry.");
  if (!String(values.registration_number ?? "").trim()) errors.push("Business registration number is required.");
  if (country.requires_subdivision && !country.subdivisions.some(s => s.code === values.jurisdiction_code)) errors.push("Select a registry jurisdiction.");
  for (const field of country.fields) {
    if (["country_code", "jurisdiction_code", "consent"].includes(field.name)) continue;
    if (country.country_code !== "NG" && ["registration_type", "registration_name"].includes(field.name)) continue;
    const value = values[field.name];
    const title = field.label || field.name.replaceAll("_", " ");
    const required = field.required || country.required_fields.includes(field.name);
    if (required && (value === undefined || value === "")) errors.push(`${title} is required.`);
    if (field.type === "boolean" && field.must_equal !== undefined && value !== field.must_equal) errors.push(`${title} must be ${field.must_equal}.`);
    if (typeof value === "string" && value) {
      if (field.min_length != null && value.trim().length < field.min_length) errors.push(`${title} must be at least ${field.min_length} characters.`);
      if (field.max_length != null && value.trim().length > field.max_length) errors.push(`${title} must be at most ${field.max_length} characters.`);
      if (field.options?.length && !field.options.some(o => (typeof o === "string" ? o : o.code) === value)) errors.push(`Select a valid ${title}.`);
    }
  }
  return errors;
}

export function matchesInquiry(snapshot: Record<string, unknown>, request: InquiryRequest): boolean {
  const normalize = (value: unknown) => request.country_code === "NG"
    ? String(value ?? "").toUpperCase().replace(/^(RC|BN)/, "") : String(value ?? "");
  return snapshot.country_code === request.country_code &&
    normalize(snapshot.registration_number) === normalize(request.registration_number) &&
    (!request.jurisdiction_code || snapshot.jurisdiction_code === request.jurisdiction_code) &&
    (request.country_code !== "NG" || (String(snapshot.lookup_registration_name ?? "") === (request.registration_name ?? "") && (!request.registration_type || snapshot.registration_type === request.registration_type)));
}
