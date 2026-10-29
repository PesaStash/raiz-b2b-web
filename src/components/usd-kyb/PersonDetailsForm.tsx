"use client";
import { toast } from "sonner";
import { useRef, useState } from "react";
import type { KybPerson, KybFieldError } from "@/types/usdKyb";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import SelectField from "@/components/ui/SelectField";
import { valueAt, replaceAt, correctionPath } from "@/lib/usd-kyb/corrections";
import { options } from "@/lib/usd-kyb/model";
import InputField from "@/components/ui/InputField";
import { toAlpha3Country } from "@/lib/usd-kyb/countryCode";
import { Action, Notice } from "./KybUI";
import { personDetailsErrors } from "@/lib/usd-kyb/personDetails";

const steps = [
  "Personal details",
  "Residential address",
  "Business relationship",
];
export default function PersonDetailsForm({
  initial,
  disabled,
  saving = false,
  corrections = [],
  identificationTypes,
  partial = false,
  error,
  save,
  close,
}: {
  initial: KybPerson;
  disabled: boolean;
  saving?: boolean;
  corrections?: KybFieldError[];
  identificationTypes?: unknown;
  partial?: boolean;
  error: string;
  save: (person: KybPerson) => void | Promise<void>;
  close: () => void;
}) {
  const [person, setPerson] = useState<KybPerson>({
    ...initial,
    ...(partial
      ? {}
      : {
          has_ownership: !!initial.has_ownership,
          is_director: !!initial.is_director,
          has_control: !!initial.has_control,
          is_signer: !!initial.is_signer,
        }),
  });
  const [nationalityText, setNationalityText] = useState(
    initial.nationalities?.join(", ") ?? "",
  );
  const [step, setStep] = useState(
    corrections.some((error) => error.field.startsWith("residential_address"))
      ? 1
      : corrections.some((error) =>
            error.field.startsWith("identifying_information"),
          )
        ? 2
        : 0,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [manualAddress, setManualAddress] = useState(
    () =>
      corrections.some((error) =>
        error.field.startsWith("residential_address"),
      ) || !!initial.residential_address?.street_line_1?.trim(),
  );
  const [addressQuery, setAddressQuery] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const go = (next: number) => {
    setStep(next);
    setErrors({});
    requestAnimationFrame(() => heading.current?.focus());
  };
  const changed = (path: string) =>
    JSON.stringify(valueAt(person, path)) !==
    JSON.stringify(valueAt(initial, path));
  const serverError = (path: string) =>
    corrections.find(
      (error) =>
        correctionPath(error.field) === correctionPath(path) && !changed(path),
    );
  const validate = (page?: number) => {
    const found = personDetailsErrors(person, page);
    if (partial)
      for (const key of Object.keys(found))
        if (
          !changed(key) &&
          !(
            key === "roles" &&
            ["has_ownership", "has_control", "is_signer", "is_director"].some(
              changed,
            )
          )
        )
          delete found[key];
    for (const correction of corrections) {
      const pageFor = correction.field.startsWith("residential_address")
        ? 1
        : correction.field.startsWith("identifying_information")
          ? 2
          : 0;
      if (
        (page === undefined || page === pageFor) &&
        (!changed(correction.field) ||
          !String(valueAt(person, correction.field) ?? "").trim())
      )
        found[correction.field] = correction.message;
    }
    return found;
  };
  const field = (
    key: string,
    title: string,
    value: string,
    update: (value: string) => void,
    type = "text",
    optional = false,
  ) => (
    <InputField
      key={key}
      id={`person-${key}`}
      name={key}
      label={
        title +
        (optional ||
        (partial &&
          !corrections.some(
            (error) => correctionPath(error.field) === correctionPath(key),
          ))
          ? " (optional)"
          : " *")
      }
      value={value}
      type={type}
      autoComplete="off"
      max={type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
      disabled={disabled}
      aria-invalid={!!errors[key] || !!serverError(key)}
      errorMessage={errors[key] ?? serverError(key)?.message}
      placeholder={
        corrections.find(
          (error) => correctionPath(error.field) === correctionPath(key),
        )?.placeholder
      }
      labelClass="!font-monzo !text-sm !font-semibold !text-kyb-ink"
      className="!h-12 !rounded-xl !border-kyb-border !bg-kyb-field !text-kyb-ink"
      onChange={(event) => update(event.target.value)}
    />
  );
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const found = validate(step);
        setErrors(found);
        if (Object.keys(found).length) {
          if (step === 1) setManualAddress(true);
          toast.error(Object.values(found)[0], { id: "onboarding-error" });
          return;
        }
        if (step < 2) go(step + 1);
        else {
          const all = validate();
          if (Object.keys(all).length) {
            setErrors(all);
            toast.error(Object.values(all)[0], { id: "onboarding-error" });
            const personal = all.first_name || all.email || all.birth_date;
            setStep(personal ? 0 : 1);
            if (!personal) setManualAddress(true);
            return;
          }
          void save({
            ...person,
            first_name: person.first_name?.trim(),
            last_name: person.last_name?.trim(),
            email: person.email?.trim(),
            title: person.title == null ? person.title : person.title.trim(),
            place_of_birth:
              person.place_of_birth === undefined
                ? undefined
                : person.place_of_birth?.country
                  ? person.place_of_birth
                  : null,
            relationship_established_at: person.relationship_established_at,
          });
        }
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary2">
          Person details · Step {step + 1} of 3
        </p>
        <h2
          ref={heading}
          tabIndex={-1}
          className="mt-2 text-xl font-bold text-kyb-ink outline-none"
        >
          {steps[step]}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-kyb-muted">
          {partial
            ? "Update the flagged details. Saved fields that are hidden do not need to be entered again."
            : "Complete these details before sending their identity verification link. After saving, you’ll be able to send their invite link. Required fields are marked *."}
        </p>
      </div>
      <ol
        aria-label="Person details progress"
        className="grid grid-cols-3 gap-2"
      >
        {steps.map((title, index) => (
          <li
            key={title}
            aria-current={step === index ? "step" : undefined}
            className={`border-t-[3px] pt-2 text-xs ${index <= step ? "border-primary2 text-primary2" : "border-kyb-border text-kyb-muted"}`}
          >
            {index + 1}. {title}
          </li>
        ))}
      </ol>
      {partial && (
        <Notice>
          Correct the flagged details. Hidden saved fields are preserved; you do
          not need to enter them again.
        </Notice>
      )}
      {error && <Notice error>{error}</Notice>}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["first_name", "First name"],
                ["last_name", "Last name"],
              ] as const
            ).map(([key, title]) =>
              field(key, title, String(person[key] ?? ""), (value) =>
                setPerson({ ...person, [key]: value }),
              ),
            )}
          </div>
          {field(
            "email",
            "Email address",
            person.email ?? "",
            (value) => setPerson({ ...person, email: value }),
            "email",
          )}
          {field(
            "birth_date",
            "Date of birth",
            person.birth_date ?? "",
            (value) => setPerson({ ...person, birth_date: value }),
            "date",
          )}
          {field(
            "nationalities",
            "Nationalities",
            nationalityText,
            (value) => {
              setNationalityText(value.toUpperCase());
              setPerson({
                ...person,
                nationalities: value
                  .toUpperCase()
                  .split(",")
                  .map((code) => code.trim())
                  .filter(Boolean),
              });
            },
            "text",
            true,
          )}
          <p className="text-xs text-kyb-muted">
            Use three-letter country codes separated by commas, e.g. NGA, USA.
          </p>
          {field(
            "place_of_birth",
            "Country of birth",
            person.place_of_birth?.country ?? "",
            (value) =>
              setPerson({
                ...person,
                place_of_birth: { country: value.toUpperCase() },
              }),
            "text",
            true,
          )}
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <p className="text-sm font-semibold text-kyb-ink">
              Residential address
            </p>
            <button
              type="button"
              className="text-sm font-semibold text-primary2"
              disabled={disabled}
              onClick={() => setManualAddress((current) => !current)}
            >
              {manualAddress ? "Search address instead" : "Enter manually"}
            </button>
          </div>
          {!manualAddress && (
            <div className="sm:col-span-2 [&_input]:!h-12 [&_input]:!rounded-xl [&_input]:!border-kyb-border [&_input]:!bg-kyb-field [&_input]:!text-kyb-ink [&_label]:!font-monzo [&_label]:!text-sm [&_label]:!font-semibold [&_label]:!text-kyb-ink">
              <AddressAutocomplete
                label="Search address"
                value={addressQuery}
                disabled={disabled}
                placeholder="Start typing their residential address…"
                onChange={setAddressQuery}
                onAddressSelect={(components) => {
                  const street = [components.building_number, components.street]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  const streetLine =
                    street || components.address?.split(",")[0]?.trim() || "";
                  setPerson((current) => ({
                    ...current,
                    residential_address: {
                      ...current.residential_address,
                      street_line_1: streetLine,
                      city: components.city ?? "",
                      subdivision: components.state ?? "",
                      postal_code: components.zip_code ?? "",
                      country: toAlpha3Country(components.country_code),
                    },
                  }));
                  setAddressQuery(components.address ?? streetLine);
                  setManualAddress(true);
                  setErrors((current) => {
                    const next = { ...current };
                    for (const key of Object.keys(next)) {
                      if (key.startsWith("residential_address"))
                        delete next[key];
                    }
                    return next;
                  });
                }}
                touched={!!errors["residential_address.street_line_1"]}
                error={errors["residential_address.street_line_1"] || false}
              />
              <p className="mt-2 text-xs text-kyb-muted">
                Choose a suggestion to fill the address. You can edit every
                field before continuing. Country uses a three-letter code, e.g.
                NGA for Nigeria.
              </p>
            </div>
          )}
          {manualAddress && (
            <>
              {(
                [
                  ["street_line_1", "Street address"],
                  ["street_line_2", "Street line 2"],
                  ["city", "City"],
                  ["subdivision", "State / subdivision"],
                  ["postal_code", "Postal code"],
                  ["country", "Country code"],
                ] as const
              ).map(([key, title]) =>
                field(
                  `residential_address.${key}`,
                  title,
                  person.residential_address?.[key] ?? "",
                  (value) =>
                    setPerson({
                      ...person,
                      residential_address: {
                        ...person.residential_address,
                        [key]: key === "country" ? value.toUpperCase() : value,
                      },
                    }),
                  "text",
                  ["street_line_2", "subdivision"].includes(key),
                ),
              )}
              <p className="text-xs text-kyb-muted sm:col-span-2">
                Country uses a three-letter code, e.g. NGA for Nigeria.
              </p>
            </>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          {corrections
            .filter((error) =>
              error.field.startsWith("identifying_information"),
            )
            .map((correction) => {
              const key = correctionPath(correction.field);
              const value = String(valueAt(person, key) ?? "");
              if (key.endsWith(".type")) {
                const choices = options(identificationTypes);
                return (
                  <div key={key}>
                    <SelectField
                      label="ID document type"
                      instanceId={`kyb-person-${initial.person_key}-${key}`}
                      placeholder={correction.placeholder ?? "Select ID type"}
                      name={key}
                      options={choices}
                      value={
                        choices.find((option) => option.value === value) ?? null
                      }
                      onChange={(option) =>
                        setPerson(
                          replaceAt(
                            person,
                            key,
                            option ? String(option.value) : "",
                          ) as KybPerson,
                        )
                      }
                      disabled={disabled || !choices.length}
                      status={
                        errors[key] || serverError(key) ? "error" : undefined
                      }
                      helper={
                        errors[key] ??
                        serverError(key)?.message ??
                        (!choices.length
                          ? "ID types are currently unavailable. Refresh the form guide to continue."
                          : undefined)
                      }
                    />
                  </div>
                );
              }
              return field(
                key,
                key.endsWith(".number")
                  ? "ID number"
                  : "ID issuing country code",
                value,
                (next) => setPerson(replaceAt(person, key, next) as KybPerson),
              );
            })}
          {field(
            "title",
            "Title / position",
            person.title ?? "",
            (value) => setPerson({ ...person, title: value }),
            "text",
            true,
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">
              {partial ? "Roles" : "Roles *"}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["has_ownership", "Owner"],
                  ["is_director", "Director"],
                  ["has_control", "Control person"],
                  ["is_signer", "Authorised signer"],
                ] as const
              ).map(([key, title]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${person[key] ? "border-primary2 bg-kyb-selected" : "border-kyb-border"}`}
                >
                  <input
                    type="checkbox"
                    checked={!!person[key]}
                    disabled={disabled}
                    className="size-4 accent-primary2"
                    onChange={(event) =>
                      setPerson({
                        ...person,
                        [key]: event.target.checked,
                        ...(key === "has_ownership" && !event.target.checked
                          ? { ownership_percentage: null }
                          : {}),
                      })
                    }
                  />
                  {title}
                </label>
              ))}
            </div>
            {errors.roles && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                {errors.roles}
              </p>
            )}
          </fieldset>
          {person.has_ownership &&
            field(
              "ownership_percentage",
              "Ownership percentage",
              person.ownership_percentage == null
                ? ""
                : String(person.ownership_percentage),
              (value) =>
                setPerson({
                  ...person,
                  ownership_percentage: value === "" ? null : Number(value),
                }),
              "number",
            )}
          {field(
            "relationship_established_at",
            "Relationship established date",
            person.relationship_established_at ?? "",
            (value) =>
              setPerson({ ...person, relationship_established_at: value }),
            "date",
            true,
          )}
          <Notice>
            {partial
              ? "Only your changes are saved. Existing identity evidence and verification status are preserved."
              : "They’ll provide their government ID through the secure identity verification link after these details are saved."}
          </Notice>
        </div>
      )}
      <div className="flex justify-between gap-3 border-t border-kyb-border pt-4">
        <Action
          variant="tertiary"
          onClick={() => (step ? go(step - 1) : close())}
          disabled={disabled}
        >
          {step ? "Back" : "Cancel"}
        </Action>
        <Action type="submit" disabled={disabled}>
          {saving
            ? "Saving details…"
            : step === 2
              ? "Save details"
              : "Continue"}
        </Action>
      </div>
    </form>
  );
}
