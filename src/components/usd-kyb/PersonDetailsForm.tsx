"use client";
import { registryOwnership } from "@/lib/usd-kyb/model";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KybPerson, KybFieldError } from "@/types/usdKyb";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import SelectField, { type Option } from "@/components/ui/SelectField";
import { valueAt, replaceAt, correctionPath } from "@/lib/usd-kyb/corrections";
import { options } from "@/lib/usd-kyb/model";
import InputField from "@/components/ui/InputField";
import { toAlpha3Country } from "@/lib/usd-kyb/countryCode";
import useCountryStore from "@/store/useCountryStore";
import { Action, Notice } from "./KybUI";
import { personDetailsErrors } from "@/lib/usd-kyb/personDetails";
import { ownershipFlag } from "@/lib/usd-kyb/model";

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
    has_ownership: ownershipFlag(initial),
    ...(partial
      ? {}
      : {
          is_director: !!initial.is_director,
          has_control: !!initial.has_control,
          is_signer: !!initial.is_signer,
        }),
  });
  const {
    countries,
    fetchCountries,
    loading: countriesLoading,
    error: countriesError,
  } = useCountryStore();
  useEffect(() => {
    void fetchCountries();
  }, [fetchCountries]);
  const countryOptions = useMemo(() => {
    const seen = new Set<string>();
    return countries
      .flatMap((country) => {
        const value = toAlpha3Country(country.country_code);
        if (!/^[A-Z]{3}$/.test(value) || seen.has(value)) return [];
        seen.add(value);
        return [{ value, label: country.country_name }];
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [countries]);
  const countryOption = (code: string): Option =>
    countryOptions.find((option) => option.value === code) ?? {
      value: code,
      label: code,
    };
  const [step, setStep] = useState(
    corrections.some((error) => error.field.startsWith("residential_address"))
      ? 1
      : corrections.some((error) =>
            error.field.startsWith("identifying_information"),
          )
        ? 2
        : 0,
  );
  const [attemptedErrors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
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
      const field = correctionPath(correction.field);
      // Boolean true already answers this correction. Leaving the checkbox
      // untouched must not block the rest of the form or submission.
      if (field === "has_ownership" && person.has_ownership === true) continue;
      if (
        (page === undefined || page === pageFor) &&
        (!changed(correction.field) ||
          !String(valueAt(person, correction.field) ?? "").trim())
      )
        found[correction.field] = correction.message;
    }
    return found;
  };
  const errors = Object.fromEntries(
    Object.entries(validate(step)).filter(([key]) => touchedFields[key] || Object.hasOwn(attemptedErrors, key)),
  );
  const field = (
    key: string,
    title: string,
    value: string,
    update: (value: string) => void,
    type = "text",
    optional = false,
  ) => (
    <div key={key}>
    <InputField
      id={`person-${key}`}
      name={key}
      aria-label={title}
      aria-describedby={type === "date" ? `person-${key}-format` : undefined}
      label={
        title +
        (optional
          ? " (optional)"
          : " *")
      }
      value={value}
      type={type}
      autoComplete="off"
      step={type === "number" ? "1" : undefined}
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
      onBlur={() => setTouchedFields(current => ({ ...current, [key]: true }))}
      onChange={(event) => {
        setTouchedFields(current => ({ ...current, [key]: true }));
        update(event.target.value);
      }}
    />
    {type === "date" && <p id={`person-${key}-format`} className="mt-1 text-xs text-kyb-muted">Use the calendar or your browser’s date format. The saved date uses YYYY-MM-DD.</p>}
    </div>
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
            : "Save their details, then send an invite. Required fields are marked *."}
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
          <SelectField
            isMulti
            label="Nationalities (optional)"
            instanceId={`person-${initial.person_key}-nationalities`}
            name="nationalities"
            placeholder="Select nationalities"
            options={countryOptions}
            value={(person.nationalities ?? []).map(countryOption)}
            onChange={(selected) =>
              setPerson({
                ...person,
                nationalities: (selected ?? []).map((option) =>
                  String(option.value),
                ),
              })
            }
            disabled={disabled}
            isLoading={countriesLoading}
            isClearable
            isSearchable
            menuPlacement="auto"
            labelClass="!font-monzo !text-sm !font-semibold !text-kyb-ink"
            bgColor="#F4F4F8"
            minHeight="48px"
            className="!shadow-none"
            status={
              errors.nationalities || serverError("nationalities")
                ? "error"
                : undefined
            }
            helper={
              errors.nationalities ??
              serverError("nationalities")?.message ??
              (countriesError
                ? "Countries could not be loaded. Refresh and try again."
                : "Select every nationality.")
            }
          />
          <SelectField
            label="Country of birth (optional)"
            instanceId={`person-${initial.person_key}-place-of-birth`}
            name="place_of_birth"
            placeholder="Select country of birth"
            options={countryOptions}
            value={
              person.place_of_birth?.country
                ? countryOption(person.place_of_birth.country)
                : null
            }
            onChange={(option) =>
              setPerson({
                ...person,
                place_of_birth: option
                  ? { country: String(option.value) }
                  : null,
              })
            }
            disabled={disabled}
            isLoading={countriesLoading}
            isClearable
            isSearchable
            menuPlacement="auto"
            labelClass="!font-monzo !text-sm !font-semibold !text-kyb-ink"
            bgColor="#F4F4F8"
            minHeight="48px"
            className="!shadow-none"
            status={
              errors.place_of_birth ||
              serverError("place_of_birth") ||
              serverError("place_of_birth.country")
                ? "error"
                : undefined
            }
            helper={
              errors.place_of_birth ??
              serverError("place_of_birth")?.message ??
              serverError("place_of_birth.country")?.message ??
              (countriesError
                ? "Countries could not be loaded. Refresh and try again."
                : undefined)
            }
          />
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
          {registryOwnership(person) !== "Unavailable" && <p className="text-sm text-kyb-muted">Registry-calculated ownership: {registryOwnership(person)}. The writable field accepts whole numbers only. Do not round fractional registry holdings; contact support for guidance.</p>}
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
