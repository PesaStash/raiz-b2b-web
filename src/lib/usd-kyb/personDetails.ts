import type { KybPerson } from "../../types/usdKyb.ts";

export function identityStarted(person: KybPerson) {
  return (
    !!person.verification_started_at ||
    !!person.verified_at ||
    ["approved", "completed", "pending", "in_progress"].includes(
      person.verification_status ?? "",
    ) ||
    ["sent", "used", "accepted"].includes(person.invitation_status ?? "")
  );
}

/** Product-required details for a new person; redacted responses must never be checked as missing input. */
export function personDetailsErrors(
  person: KybPerson,
  step?: number,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const text = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";
  const required = (key: string, value: unknown, title: string) => {
    if (!text(value)) errors[key] = `${title} is required.`;
  };
  const date = (
    key: string,
    value: unknown,
    title: string,
    requiredDate: boolean,
  ) => {
    if (!text(value) && !requiredDate) return;
    const raw = text(value);
    const parsed = new Date(raw + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(raw) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== raw ||
      raw > new Date().toISOString().slice(0, 10)
    )
      errors[key] = `Enter a valid ${title} that is not in the future.`;
  };
  if (step === undefined || step === 0) {
    required("first_name", person.first_name, "First name");
    required("last_name", person.last_name, "Last name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(person.email)))
      errors.email = "Enter a valid email address.";
    date("birth_date", person.birth_date, "date of birth", true);
    if (person.nationalities?.some((code) => !/^[A-Z]{3}$/.test(code)))
      errors.nationalities =
        "Use three-letter country codes separated by commas, for example NGA, USA.";
    if (
      person.place_of_birth?.country &&
      !/^[A-Z]{3}$/.test(person.place_of_birth.country)
    )
      errors.place_of_birth =
        "Use a three-letter country code, for example NGA.";
  }
  if (step === undefined || step === 1) {
    const address = person.residential_address ?? {};
    for (const [key, title] of [
      ["street_line_1", "Street address"],
      ["city", "City"],
      ["postal_code", "Postal code"],
      ["country", "Country"],
    ])
      required(`residential_address.${key}`, address[key], title);
    if (address.country && !/^[A-Z]{3}$/.test(address.country))
      errors["residential_address.country"] =
        "Use a three-letter country code, for example NGA.";
  }
  if (step === undefined || step === 2) {
    if (
      ![
        person.has_ownership,
        person.has_control,
        person.is_signer,
        person.is_director,
      ].some(Boolean)
    )
      errors.roles = "Select at least one role.";
    if (
      person.has_ownership &&
      (person.ownership_percentage == null ||
        !Number.isFinite(person.ownership_percentage) ||
        person.ownership_percentage <= 0 ||
        person.ownership_percentage > 100)
    )
      errors.ownership_percentage =
        "Enter an ownership percentage greater than 0 and up to 100.";
    date(
      "relationship_established_at",
      person.relationship_established_at,
      "relationship date",
      false,
    );
  }
  return errors;
}

/** Missing ownership is distinct from pending identity verification. */
export function ownershipNeedsReview(person: KybPerson) {
  return (
    !!person.has_ownership &&
    (person.ownership_percentage == null ||
      !Number.isFinite(Number(person.ownership_percentage)) ||
      Number(person.ownership_percentage) <= 0 ||
      Number(person.ownership_percentage) > 100)
  );
}

export function ownershipRequirementMessage(key: string, people: KybPerson[]) {
  if (key === "associated_persons.ownership_percentage") {
    const names = people
      .filter(ownershipNeedsReview)
      .map(
        (person) =>
          [person.first_name, person.last_name].filter(Boolean).join(" ") ||
          "Unnamed person",
      );
    return names.length
      ? `Confirm ownership for ${names.join(", ")}: enter each owner’s percentage, or confirm they are not an owner.`
      : "Confirm each owner’s percentage. Pending ID verification does not cause this error.";
  }
  if (key === "associated_persons.ownership_percentage_total")
    return "Combined ownership percentages cannot exceed 100%. Review the owners’ shares.";
  return undefined;
}

/** Resending an existing invitation is separate from editing the submitted person payload. */
export function canResendPersonInvitation(person: KybPerson, status: string) {
  return (
    [
      "not_started",
      "collecting",
      "requires_correction",
      "awaiting_admin_review",
      "submitted_to_bridge",
      "under_review",
      "awaiting_ubo",
    ].includes(status) &&
    !!(
      person.associated_person_id ??
      person.business_usd_kyb_associated_person_id
    ) &&
    !!person.email &&
    ["sent", "expired", "revoked"].includes(person.invitation_status ?? "") &&
    !["approved", "completed"].includes(person.verification_status ?? "")
  );
}

/** Invite delivery, not completed identity, is the business submission prerequisite. */
export function peopleNeedingInvitation(people: KybPerson[]) {
  return people.filter((person) => {
    if (["approved", "completed"].includes(person.verification_status ?? ""))
      return false;
    if (person.invitation_status !== "sent") return true;
    const expiry = person.invitation_expires_at
      ? Date.parse(person.invitation_expires_at)
      : NaN;
    return Number.isFinite(expiry) && expiry <= Date.now();
  });
}

export function personRequirementMessage(key: string, people: KybPerson[]) {
  if (key === "associated_persons.invitations") {
    const names = peopleNeedingInvitation(people).map(
      (person) =>
        [person.first_name, person.last_name].filter(Boolean).join(" ") ||
        "Unnamed person",
    );
    return names.length
      ? `Send or resend invite links to ${names.join(", ")} before submitting. Complete their details first if needed.`
      : "Send an invite link to every associated person before submitting.";
  }
  return ownershipRequirementMessage(key, people);
}
