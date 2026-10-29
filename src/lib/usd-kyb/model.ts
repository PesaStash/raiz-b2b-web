export const stages = [
  {
    key: "identity",
    title: "Find your business",
    group: "About the business",
    description: "Look up your Nigerian business on the CAC register.",
  },
  {
    key: "business_details",
    title: "Confirm your business details",
    group: "About the business",
    description: "We fill in what the register knows. Add the rest below.",
  },
  {
    key: "owners_directors",
    title: "Owners and directors",
    group: "About the business",
    description:
      "Everyone who owns 25% or more, every director, and anyone who controls or signs for the business.",
  },
  {
    key: "activity",
    title: "How you’ll use Raiz",
    group: "About the business",
    description:
      "Tell us how you’ll use Raiz. This helps us understand your business payments.",
  },
  {
    key: "documents",
    title: "Upload company documents",
    group: "Documents and submit",
    description:
      "Clear scans with every page. Names and registration numbers must match.",
  },
  {
    key: "review",
    title: "Check and submit",
    group: "Documents and submit",
    description:
      "Check your details before sending them to our operations team.",
  },
] as const;
export const editableStatus = (status: string) =>
  ["not_started", "collecting", "requires_correction"].includes(status);
export const terminalIdentity = (status?: string | null) =>
  ["approved", "completed", "declined", "expired", "abandoned"].includes(
    status ?? "",
  );
export const label = (value: string) =>
  value.replace(/_/g, " ").replace(/^./, (s) => s.toUpperCase());
export const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export const display = (value: unknown): string =>
  value == null || value === ""
    ? "Not provided"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
export function getPath(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((current, key) => record(current)[key], value);
}
export function setPath(
  value: Record<string, unknown>,
  path: string,
  next: unknown,
): Record<string, unknown> {
  const [key, ...rest] = path.split(".");
  return {
    ...value,
    [key]: rest.length
      ? setPath(record(value[key]), rest.join("."), next)
      : next,
  };
}
export function mergeDraft(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch))
    next[key] =
      value !== null && typeof value === "object" && !Array.isArray(value)
        ? mergeDraft(record(base[key]), record(value))
        : value;
  return next;
}
/** The contract permits both root Bridge fields and sectioned UI fields.
 * Preserve explicit section values, including blank strings, false and null.
 * Move only known aliases so future/unknown fields survive unchanged.
 */
export function normalizeDraft(
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...source };
  const sections: Record<string, string[]> = {
    business_profile: [
      "business_legal_name",
      "business_trade_name",
      "business_description",
      "email",
      "phone",
      "business_type",
      "primary_website",
      "is_dao",
      "signed_agreement_id",
    ],
    industry_purpose: [
      "business_industry",
      "account_purpose",
      "account_purpose_other",
      "source_of_funds",
      "source_of_funds_description",
      "estimated_annual_revenue_usd",
      "expected_monthly_payments_usd",
      "operates_in_prohibited_countries",
    ],
    risk_profile: [
      "high_risk_activities",
      "high_risk_activities_explanation",
      "conducts_money_services",
      "conducts_money_services_using_bridge",
      "compliance_screening_explanation",
      "conducts_money_services_description",
    ],
  };
  for (const [section, keys] of Object.entries(sections)) {
    const fields = { ...record(source[section]) };
    for (const key of keys) {
      if (Object.hasOwn(source, key)) {
        if (!Object.hasOwn(fields, key)) fields[key] = source[key];
        delete result[key];
      }
    }
    if (Object.keys(fields).length || Object.hasOwn(source, section))
      result[section] = fields;
  }
  return result;
}

// Product policy requires terms before user submission; only identity may follow later.
export const deferredRequirements = new Set([
  "associated_persons.government_id_document",
  "associated_persons.identity_verification",
]);
export function requirementStage(key: string): number {
  if (key === "signed_agreement_id" || key.endsWith(".signed_agreement_id"))
    return 5;
  // Ownership evidence is supplied later, not a missing person/percentage.
  if (key === "ownership_structure_attestation_or_document") return 4;
  if (/business_industry/.test(key)) return 1;
  if (/associated_person|ownership/.test(key)) return 2;
  if (/document|proof_of_nature/.test(key)) return 4;
  if (
    /industry|purpose|funds|revenue|payments|risk|money_services|prohibited|endorsement|screening/.test(
      key,
    )
  )
    return 3;
  if (/business_|address|email|identifying|is_dao/.test(key)) return 1;
  return 5;
}
export interface KybOption {
  value: string;
  label: string;
}
export function options(value: unknown): KybOption[] {
  const r = record(value);
  const rows = Array.isArray(value)
    ? value
    : Array.isArray(r.document_purposes)
      ? r.document_purposes
      : Array.isArray(r.items)
        ? r.items
        : Array.isArray(r.results)
          ? r.results
          : Array.isArray(r.data)
            ? r.data
            : [];
  return rows.flatMap((item) => {
    if (typeof item === "string") return [{ value: item, label: label(item) }];
    const row = record(item);
    const key = row.value ?? row.code ?? row.purpose;
    return typeof key === "string"
      ? [{ value: key, label: String(row.label ?? row.name ?? label(key)) }]
      : [];
  });
}
export const uploadMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
export function fileError(file: { type: string; size: number }): string | null {
  if (!uploadMimeTypes.includes(file.type))
    return "Choose a PDF, JPEG, PNG, WebP, HEIC or HEIF file.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > 10 * 1024 * 1024) return "Files must be 10 MiB or smaller.";
  return null;
}
/** PATCH accepts person-edit fields only, never invitation/provider state. */
export function personPatch(
  person: Record<string, unknown>,
): Record<string, unknown> {
  const fields = [
    "person_key",
    "first_name",
    "last_name",
    "email",
    "title",
    "birth_date",
    "residential_address",
    "nationalities",
    "place_of_birth",
    "relationship_established_at",
    "identifying_information",
    "has_ownership",
    "ownership_percentage",
    "has_control",
    "is_signer",
    "is_director",
  ];
  return Object.fromEntries(
    fields
      .filter((key) => person[key] !== undefined)
      .map((key) => [key, person[key]]),
  );
}

/** Reapply only edited person fields, preserving another tab's unrelated changes. */
export function reconcilePeople<
  T extends { person_key: string; [key: string]: unknown },
>(remote: T[], local: T[], baseline: T[]): T[] {
  const result = new Map(remote.map((person) => [person.person_key, person]));
  const previous = new Map(
    baseline.map((person) => [person.person_key, person]),
  );
  for (const person of local) {
    const before = previous.get(person.person_key);
    const changes = Object.fromEntries(
      Object.entries(personPatch(person)).filter(
        ([key, value]) =>
          key !== "person_key" &&
          JSON.stringify(value) !== JSON.stringify(before?.[key]),
      ),
    );
    if (!Object.keys(changes).length) continue;
    const current = result.get(person.person_key);
    if (!current && before)
      throw new Error(
        "A person you edited was removed in another session. Load the saved case before continuing.",
      );
    result.set(person.person_key, {
      ...current,
      ...changes,
      person_key: person.person_key,
    } as T);
  }
  return [...result.values()];
}

/** Offer normalized registry people for review when the backend has not created them yet. */
export function registryPeople(
  snapshot: unknown,
  existing: { person_key: string }[],
) {
  const rows = record(snapshot).directors;
  if (!Array.isArray(rows)) return [];
  const seen = new Set(existing.map((person) => person.person_key));
  return rows.flatMap((value) => {
    const person = record(value);
    if (
      typeof person.person_key !== "string" ||
      !person.person_key ||
      seen.has(person.person_key)
    )
      return [];
    seen.add(person.person_key);
    return [
      Object.fromEntries(
        Object.entries(personPatch(person)).filter(([key]) =>
          [
            "person_key",
            "first_name",
            "last_name",
            "email",
            "title",
            "has_ownership",
            "ownership_percentage",
            "has_control",
            "is_signer",
            "is_director",
          ].includes(key),
        ),
      ) as { person_key: string; [key: string]: unknown },
    ];
  });
}

/** Merge documented lookup fields with saved roles and current-session supplemental input. */
export function lookupPersonInput(
  person: { person_key: string; [key: string]: unknown },
  snapshot: unknown,
  input?: Record<string, unknown>,
) {
  const directors = record(snapshot).directors;
  const lookup = Array.isArray(directors)
    ? directors.map(record).find((row) => row.person_key === person.person_key)
    : undefined;
  return {
    ...(lookup ? personPatch(lookup) : {}),
    ...Object.fromEntries(
      Object.entries(person).filter(
        ([key, value]) =>
          !lookup ||
          lookup[key] === undefined ||
          (value !== null && value !== undefined && value !== ""),
      ),
    ),
    ...input,
    person_key: person.person_key,
  };
}
export function isLookupPerson(personKey: string, snapshot: unknown) {
  const directors = record(snapshot).directors;
  return (
    Array.isArray(directors) &&
    directors.some((row) => record(row).person_key === personKey)
  );
}

/** The backend still makes the final removal decision, including hidden provider associations. */
export function personRemovalReason(
  person: { can_remove?: boolean },
  caseInfo?: { status?: string; submitted_for_review_at?: string | null },
) {
  if (
    caseInfo?.submitted_for_review_at ||
    (caseInfo?.status &&
      !["not_started", "collecting"].includes(caseInfo.status))
  )
    return "People cannot be removed after the first submission.";
  return person.can_remove === true
    ? undefined
    : "Removal is unavailable for this person.";
}
