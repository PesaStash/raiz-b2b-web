"use client";
import {
  correctionPath,
  valueAt,
  replaceAt,
  groupFieldErrors,
} from "@/lib/usd-kyb/corrections";
import SelectField from "@/components/ui/SelectField";
import { useState, useEffect, useRef, useId, type ReactNode } from "react";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import { useQuery } from "@tanstack/react-query";
import { kybApi } from "@/services/usdKyb";
import AddressAutocomplete, {
  usePlaceResolver,
} from "@/components/ui/AddressAutocomplete";
import Checkbox from "@/components/ui/Checkbox";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineDocumentText,
  HiOutlineMapPin,
  HiOutlineTag,
} from "react-icons/hi2";
import type { IconType } from "react-icons";
import { Action, Check, Field, Notice } from "./KybUI";
import { options, getPath, record, display, label } from "@/lib/usd-kyb/model";
import {
  ACCOUNT_PURPOSE_OPTIONS,
  SOURCE_OF_FUNDS_OPTIONS,
  REVENUE_OPTIONS,
  HIGH_RISK_ACTIVITIES,
} from "@/lib/usd-kyb/bridgeOptions";
import { formatLookupAddress, lookupAddressForForm } from "@/lib/companyLookup";
import type { KybEditor } from "@/lib/hooks/useUsdKyb";
import { KybIcon } from "./KybGuide";
import type { KybFormGuide } from "@/types/usdKyb";

export function IdentityStage({
  editor,
  onManual,
  compact: _compact = false,
  onFound,
}: {
  editor: KybEditor;
  onManual: () => void;
  compact?: boolean;
  onFound?: () => void;
}) {
  const snapshot = record(editor.bundle?.case.youverify_lookup_snapshot);
  const hasRegistry = Object.keys(snapshot).length > 0;
  const businessName =
    getPath(editor.draft, "business_profile.business_legal_name") ||
    snapshot.legal_name ||
    editor.access.user?.business_account?.business_name;
  const registrationNumber =
    snapshot.registration_number ??
    editor.bundle?.case.youverify_lookup_registration_number;
  const address = formatLookupAddress(snapshot.registered_address);
  const rows: [string, unknown, IconType][] = (
    [
      ["Business name", businessName, HiOutlineBuildingOffice2],
      ["Registration number", registrationNumber, HiOutlineDocumentText],
      ["Company type", snapshot.company_type, HiOutlineTag],
      ["Incorporated", snapshot.incorporation_date, HiOutlineCalendarDays],
      ["Registered address", address || null, HiOutlineMapPin],
    ] as const
  ).filter(([, value]) => value != null && String(value).trim() !== "") as [
    string,
    unknown,
    IconType,
  ][];
  const differences = editor.bundle?.case.youverify_lookup_differences ?? [];

  return (
    <div className="space-y-6">
      <p className="text-sm leading-[21px] text-[#444454]">
        We’ve already found your business. Check these details, then continue to
        confirm the rest of your business information.
      </p>
      <section className="rounded-xl bg-kyb-soft">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-kyb-muted">
          {hasRegistry ? "Your details" : "From your basic business details"}
        </div>
        {rows.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {rows.map(([title, value, Icon]) => (
              <span
                key={title}
                title={title}
                className="flex max-w-full items-center gap-1.5 rounded-full bg-white px-2.5 py-1 capitalize"
              >
                <Icon aria-hidden className="size-3.5 shrink-0 text-primary2" />
                <span className="min-w-0 truncate">
                  {display(value).toLowerCase()}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-kyb-muted">
            No saved business details yet. Continue to enter them on the next
            step.
          </p>
        )}
      </section>
      {!!differences.length && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold">Some register details differ</h3>
          <p className="mt-2 text-sm">
            Your entries have been kept. Review these differences before
            continuing.
          </p>
          {differences.map((d, i) => (
            <div className="mt-4 text-sm" key={`${d.field}-${i}`}>
              <p className="font-semibold">{label(d.field)}</p>
              <p>Your entry: {display(d.current)}</p>
              <p>Register: {display(d.provider)}</p>
            </div>
          ))}
        </section>
      )}
      <Action disabled={editor.busy} onClick={() => (onFound ?? onManual)()}>
        Continue to business details
      </Action>
    </div>
  );
}
function AddressFields({
  editor,
  path,
  title,
}: {
  editor: KybEditor;
  path: string;
  title: string;
}) {
  const current = record(getPath(editor.draft, path));
  const draftAddress = getPath(editor.draft, path);
  const savedAddress =
    (typeof draftAddress === "string" || current.street_line_1
      ? formatLookupAddress(draftAddress)
      : "") ||
    (path === "registered_address"
      ? formatLookupAddress(
          record(editor.bundle?.case.youverify_lookup_snapshot)
            .registered_address,
        )
      : "");
  const savedQuery = lookupAddressForForm(savedAddress);
  const complete = [
    "street_line_1",
    "city",
    "subdivision",
    "postal_code",
    "country",
  ].every((key) => !!String(current[key] ?? "").trim());
  const [manualAddress, setManualAddress] = useState(
    () =>
      (editor.fieldErrors ?? []).some((error) =>
        error.field.startsWith(path + "."),
      ) || complete,
  );
  const [addressQuery, setAddressQuery] = useState(savedQuery);
  const { resolve, isLoaded } = usePlaceResolver();
  const latestEditor = useRef(editor);
  const userEdited = useRef(false);
  const addressSignature = JSON.stringify(getPath(editor.draft, path));
  useEffect(() => {
    latestEditor.current = editor;
  }, [editor]);
  useEffect(() => {
    if (
      !isLoaded ||
      !editor.editable ||
      editor.busy ||
      complete ||
      !savedQuery ||
      userEdited.current
    )
      return;
    let cancelled = false;
    void resolve(savedQuery).then((components) => {
      const latest = latestEditor.current;
      if (
        cancelled ||
        userEdited.current ||
        !components ||
        !latest.editable ||
        latest.busy ||
        JSON.stringify(getPath(latest.draft, path)) !== addressSignature
      )
        return;
      const previous = record(getPath(latest.draft, path));
      const street = [components.building_number, components.street]
        .filter(Boolean)
        .join(" ")
        .trim();
      const resolvedAddress = {
        ...previous,
        street_line_1:
          street ||
          previous.street_line_1 ||
          components.address?.split(",")[0]?.trim() ||
          "",
        city: previous.city || components.city || "",
        subdivision: previous.subdivision || components.state || "",
        postal_code: previous.postal_code || components.zip_code || "",
        country:
          previous.country ||
          (components.country_code ?? "").trim().toUpperCase(),
      };
      const mirrorsRegistered =
        path === "registered_address" &&
        JSON.stringify(latest.draft.physical_address) ===
          JSON.stringify(latest.draft.registered_address);
      latest.change(path, resolvedAddress);
      if (mirrorsRegistered)
        latest.change("physical_address", { ...resolvedAddress });
      setAddressQuery(components.address || savedQuery);
      setManualAddress(true);
    });
    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    editor.editable,
    editor.busy,
    complete,
    savedQuery,
    addressSignature,
    path,
    resolve,
  ]);
  return (
    <section
      className="space-y-4"
      onChangeCapture={() => {
        userEdited.current = true;
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <button
          type="button"
          className="text-sm font-semibold text-primary2"
          disabled={!editor.editable || editor.busy}
          onClick={() => {
            userEdited.current = true;
            setAddressQuery((value) => value || savedQuery);
            setManualAddress((value) => !value);
          }}
        >
          {manualAddress ? "Search address instead" : "Enter manually"}
        </button>
      </div>
      {!manualAddress && (
        <div className="[&_input]:!h-12 [&_input]:!rounded-xl [&_input]:!border-kyb-border [&_input]:!bg-kyb-field [&_input]:!text-kyb-ink [&_label]:!font-monzo [&_label]:!text-sm [&_label]:!font-semibold [&_label]:!text-kyb-ink">
          <AddressAutocomplete
            label="Search address"
            value={addressQuery}
            disabled={!editor.editable || editor.busy}
            placeholder="Start typing an address…"
            onChange={(value) => {
              userEdited.current = true;
              setAddressQuery(value);
            }}
            onAddressSelect={(components) => {
              userEdited.current = true;
              const street = [components.building_number, components.street]
                .filter(Boolean)
                .join(" ")
                .trim();
              const streetLine =
                street || components.address?.split(",")[0]?.trim() || "";
              const country = (components.country_code ?? "")
                .trim()
                .toUpperCase();
              editor.change(path, {
                ...record(getPath(editor.draft, path)),
                street_line_1: streetLine,
                city: components.city ?? "",
                subdivision: components.state ?? "",
                postal_code: components.zip_code ?? "",
                country,
              });
              setAddressQuery(components.address ?? streetLine);
              setManualAddress(true);
            }}
          />
          <p className="mt-2 text-xs text-kyb-muted">
            Choose a suggestion to fill the address. You can edit every field
            before continuing. Country uses a two-letter code, such as NG.
          </p>
        </div>
      )}
      {manualAddress && (
        <>
          <Field
            editor={editor}
            path={`${path}.street_line_1`}
            title="Street address"
          />
          <Field
            editor={editor}
            path={`${path}.street_line_2`}
            title="Address line 2 (optional)"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["city", "City"],
              ["subdivision", "State / region"],
              ["postal_code", "Postal code"],
              ["country", "Country code"],
            ].map(([key, fieldTitle]) => (
              <Field
                key={key}
                editor={editor}
                path={`${path}.${key}`}
                title={fieldTitle}
                helper={
                  key === "country"
                    ? "Two-letter country code, such as NG."
                    : undefined
                }
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
/** Keep fields mounted so collapsing a section preserves local input state. */
function BusinessSection({
  groupName,
  number,
  title,
  description,
  nextTitle,
  children,
}: {
  groupName: string;
  number: number;
  title: string;
  description: string;
  nextTitle?: string;
  children: ReactNode;
}) {
  const section = useRef<HTMLDetailsElement>(null);
  return (
    <details
      ref={section}
      name={groupName}
      open={number === 1}
      className="group rounded-xl border border-kyb-border"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary2 [&::-webkit-details-marker]:hidden">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-kyb-selected text-sm font-semibold text-primary2">
          {number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs font-normal text-kyb-muted">
            {description}
          </span>
        </span>
        <span
          className="text-primary2 group-open:rotate-180"
          aria-hidden="true"
        >
          <KybIcon name="chevron" />
        </span>
      </summary>
      <div className="space-y-5 border-t border-kyb-border p-4 sm:p-5">
        {children}
        {nextTitle && (
          <Action
            variant="secondary"
            onClick={() => {
              const current = section.current;
              const next = current?.nextElementSibling;
              if (current && next instanceof HTMLDetailsElement) {
                current.open = false;
                next.open = true;
                next.querySelector("summary")?.focus();
                next.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            Next: {nextTitle}
          </Action>
        )}
      </div>
    </details>
  );
}

export function BusinessDetails({
  editor,
  guide,
}: {
  editor: KybEditor;
  guide?: KybFormGuide;
}) {
  const sectionGroup = useId();
  const [sameAddress, setSameAddress] = useState(
    () =>
      JSON.stringify(editor.draft.registered_address) ===
        JSON.stringify(editor.draft.physical_address) &&
      !!editor.draft.registered_address,
  );
  const [editRegistry, setEditRegistry] = useState(false);
  const snapshot = record(editor.bundle?.case.youverify_lookup_snapshot);
  const hasRegistry = Object.keys(snapshot).length > 0;

  const identifiers = Array.isArray(editor.draft.identifying_information)
    ? (editor.draft.identifying_information as Record<string, unknown>[])
    : [];
  const tinEntry = identifiers.find((item) => item.type === "tin");
  const tinNumber = String(tinEntry?.number ?? "");
  const rewrittenIds = useRef<string | undefined>(undefined);
  const setTin = (number: string) => {
    const value = number.trim();
    editor.change(
      "identifying_information",
      value ? [{ type: "tin", issuing_country: "NG", number: value }] : [],
    );
  };
  useEffect(() => {
    if (!editor.editable) return;
    const current = Array.isArray(editor.draft.identifying_information)
      ? (editor.draft.identifying_information as Record<string, unknown>[])
      : [];
    const onlyTin =
      current.length === 0 ||
      (current.length === 1 &&
        current[0]?.type === "tin" &&
        current[0]?.issuing_country === "NG");
    if (onlyTin) return;
    const signature = JSON.stringify(current);
    if (rewrittenIds.current === signature) return;
    rewrittenIds.current = signature;
    const value = String(
      current.find((item) => item.type === "tin")?.number ?? "",
    ).trim();
    editor.change(
      "identifying_information",
      value ? [{ type: "tin", issuing_country: "NG", number: value }] : [],
    );
  }, [editor]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-kyb-muted">
        Review these four short sections. You can reopen any section to make
        changes.
      </p>
      <BusinessSection
        groupName={sectionGroup}
        number={1}
        title="Business overview"
        description="Your registered details and what your business does"
        nextTitle="Operating address"
      >
        {hasRegistry && !editRegistry ? (
          <section className="rounded-xl border border-kyb-border bg-kyb-soft p-5">
            <div className="mb-4 flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-kyb-muted">
                <KybIcon name="lock" />
                From the CAC register
              </span>
              <button
                type="button"
                className="font-semibold text-primary2"
                onClick={() => setEditRegistry(true)}
              >
                Something wrong? Edit details
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                [
                  "Registered name",
                  getPath(editor.draft, "business_profile.business_legal_name"),
                ],
                [
                  "RC number",
                  snapshot.registration_number ??
                    editor.bundle?.case.youverify_lookup_registration_number,
                ],
                ["Company type", snapshot.company_type],
                ["Incorporated", snapshot.incorporation_date],
              ].map(([title, value]) => (
                <div key={String(title)}>
                  <dt className="text-xs text-kyb-muted">{String(title)}</dt>
                  <dd className="mt-1 font-semibold">{display(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : (
          <Field
            editor={editor}
            path="business_profile.business_legal_name"
            title="Registered business name"
          />
        )}
        <Field
          editor={editor}
          path="business_profile.business_trade_name"
          title="Trading name (optional)"
        />
        <Field
          editor={editor}
          path="business_profile.business_type"
          title="Business type"
          choices={options(guide?.business_types)}
          strictChoices
          helper={
            snapshot.company_type
              ? `The register lists this as ${display(snapshot.company_type)}. Choose the matching business type.`
              : "Choose the business type from the supported options."
          }
        />
        <IndustryField editor={editor} />
        <Field
          editor={editor}
          path="business_profile.business_description"
          title="What does the business do?"
          multiline
          helper="A sentence or two, in plain words."
        />
        <Field
          editor={editor}
          path="business_profile.primary_website"
          title="Business website"
        />
      </BusinessSection>
      <BusinessSection
        groupName={sectionGroup}
        number={2}
        title="Operating address"
        description="Where you run your business"
        nextTitle="Contact and registration"
      >
        <section>
          <h3 className="mb-3 text-sm font-semibold">
            Where do you operate from?
          </h3>
          <div
            className={`rounded-xl border p-4 ${sameAddress ? "border-kyb-outline bg-kyb-selected" : "border-kyb-border"}`}
          >
            <Check
              checked={sameAddress}
              onChange={(v) => {
                setSameAddress(v);
                if (v)
                  editor.change("physical_address", {
                    ...record(editor.draft.registered_address),
                  });
              }}
            >
              <span className="block font-semibold">
                Same as the registered address
              </span>
              <span className="mt-1 block text-xs text-kyb-muted">
                {Object.values(record(editor.draft.registered_address))
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </Check>
          </div>
          <p className="mt-2 text-xs text-kyb-muted">
            Untick to add a different operating address.
          </p>
        </section>
        {!sameAddress && (
          <AddressFields
            editor={editor}
            path="physical_address"
            title="Operating address"
          />
        )}
      </BusinessSection>
      <BusinessSection
        groupName={sectionGroup}
        number={3}
        title="Contact and registration"
        description="How to reach you and where your business is registered"
        nextTitle="Tax information"
      >
        <div className="mt-5 space-y-5">
          {" "}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              editor={editor}
              path="business_profile.email"
              title="Business email"
              type="email"
            />
            <Field
              editor={editor}
              path="business_profile.phone"
              title="Business phone (optional)"
              type="tel"
            />
          </div>
          <div
            className="flex items-start justify-between gap-4"
            data-kyb-requirement="business_profile.is_dao"
          >
            <label
              htmlFor={`${sectionGroup}-dao`}
              className="text-sm font-semibold text-kyb-ink"
            >
              Is this business a DAO?
              <span className="mt-1 block text-xs font-normal text-kyb-muted">
                A Decentralised Autonomous Organisation (DAO)
              </span>
            </label>
            <ToggleSwitch
              id={`${sectionGroup}-dao`}
              checked={
                getPath(editor.draft, "business_profile.is_dao") === true
              }
              onChange={(value) =>
                editor.change("business_profile.is_dao", value)
              }
              disabled={!editor.editable || editor.busy}
              checkedColor="#443287"
            />
          </div>
          <AddressFields
            editor={editor}
            path="registered_address"
            title="Registered address"
          />
        </div>
      </BusinessSection>
      <BusinessSection
        groupName={sectionGroup}
        number={4}
        title="Tax information"
        description="Your business tax identification number"
      >
        {groupFieldErrors(editor.fieldErrors ?? [])
          .filter((error) => error.field.startsWith("identifying_information"))
          .map((error) => {
            const path = correctionPath(error.field);
            if (path.endsWith(".number"))
              return (
                <p key={path} className="text-xs text-red-700">
                  {error.message}
                </p>
              );
            const value = String(valueAt(editor.draft, path) ?? "");
            const change = (next: string) =>
              editor.change(
                "identifying_information",
                replaceAt(editor.draft, path, next).identifying_information,
              );
            if (path.endsWith(".type")) {
              const choices = options(guide?.identification_types);
              return (
                <div key={path} data-kyb-requirement={error.field}>
                  <SelectField
                    label="Business identification type"
                    instanceId={`kyb-business-${path}`}
                    placeholder={
                      error.placeholder ?? "Select identification type"
                    }
                    options={choices}
                    value={
                      choices.find((option) => option.value === value) ?? null
                    }
                    onChange={(option) =>
                      change(option ? String(option.value) : "")
                    }
                    disabled={
                      !editor.editable || editor.busy || !choices.length
                    }
                    status="error"
                    helper={error.message}
                  />
                </div>
              );
            }
            return (
              <label
                key={path}
                data-kyb-requirement={error.field}
                className="block text-sm font-semibold"
              >
                Identification issuing country
                <input
                  name={error.field}
                  value={value}
                  placeholder={error.placeholder}
                  disabled={!editor.editable || editor.busy}
                  onChange={(event) => change(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-kyb-border bg-kyb-field px-3"
                />
                <span className="mt-1 block text-xs font-normal text-red-700">
                  {error.message}
                </span>
              </label>
            );
          })}
        <div data-kyb-requirement="identifying_information">
          <label
            htmlFor="business-tin"
            className="mb-2 block text-sm font-semibold text-kyb-ink"
          >
            Tax identification number (TIN)
          </label>
          <input
            id="business-tin"
            name="identifying_information.tin"
            aria-label="Tax identification number (TIN)"
            className="h-12 w-full rounded-xl border-transparent bg-kyb-field p-3 text-sm text-kyb-ink outline-none"
            value={tinNumber}
            onChange={(e) => setTin(e.target.value)}
            disabled={!editor.editable || editor.busy}
            autoComplete="off"
          />
        </div>
      </BusinessSection>
    </div>
  );
}
function IndustryField({ editor }: { editor: KybEditor }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const panelRef = useOutsideClick(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  });
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);
  const industries = useQuery({
    queryKey: [
      "usd-kyb-reference",
      editor.access.user?.business_account?.entity_id,
      "industries",
      debounced,
    ],
    queryFn: () => kybApi.industries(debounced),
    staleTime: Infinity,
    retry: false,
  });
  const selected =
    (getPath(editor.draft, "industry_purpose.business_industry") as
      | string[]
      | undefined) ?? [];
  return (
    <section
      className="space-y-2"
      data-kyb-requirement="industry_purpose.business_industry"
    >
      <h3 className="text-sm font-semibold">Industry</h3>
      <div ref={panelRef}>
        <details ref={detailsRef} className="rounded-xl bg-kyb-field">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
            <span>
              {selected.length
                ? selected
                    .map(
                      (v) =>
                        options(industries.data).find((o) => o.value === v)
                          ?.label ?? label(v),
                    )
                    .join(", ")
                : "Choose your industry"}
            </span>
            <KybIcon name="chevron" />
          </summary>
          <div className="space-y-3 border-t border-kyb-border p-3">
            <input
              aria-label="Search industries"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search industries…"
              className="w-full rounded-lg bg-white p-3 text-sm"
            />
            {industries.isError ? (
              <Notice error>
                Unable to load industries.{" "}
                <button
                  className="underline"
                  onClick={() => void industries.refetch()}
                >
                  Try again
                </button>
              </Notice>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-kyb-border p-4">
                {industries.isPending && (
                  <p className="text-sm">Loading industries…</p>
                )}
                {options(industries.data).map((o) => (
                  <Check
                    key={o.value}
                    checked={selected.includes(o.value)}
                    onChange={(v) =>
                      editor.change(
                        "industry_purpose.business_industry",
                        v
                          ? [...selected, o.value]
                          : selected.filter((x) => x !== o.value),
                      )
                    }
                  >
                    {o.label}
                  </Check>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
      {editor.missing.some((k) => k.includes("business_industry")) && (
        <p className="text-xs text-red-700">Choose a business industry.</p>
      )}
    </section>
  );
}
/** Previous range keys such as `0_9999` or `1000000_plus` are not amounts. */
function isUsdRangeKey(value: unknown) {
  return typeof value === "string" && /^\d+_(?:\d+|plus)$/.test(value);
}

const yesNoPaths = [
  "risk_profile.conducts_money_services",
  "risk_profile.conducts_money_services_using_bridge",
  "risk_profile.acting_as_intermediary",
  "industry_purpose.operates_in_prohibited_countries",
];
function yesNoRequirement(missing: string[], path: string) {
  const leaf = path.split(".").at(-1);
  return missing.some((key) => key === path || key === leaf);
}

function BusinessYesNo({
  editor,
  path,
  title,
}: {
  editor: KybEditor;
  path: string;
  title: string;
}) {
  const id = useId();
  const value = getPath(editor.draft, path);
  const answered = value === true || value === false;
  const correction = groupFieldErrors(editor.fieldErrors ?? []).find(
    (error) => error.field === path || error.field === path.split(".").at(-1),
  );
  const groupNeedsAnswer = yesNoPaths.some((field) =>
    yesNoRequirement(editor.missing, field),
  );
  const showError =
    !!correction ||
    (!answered && (yesNoRequirement(editor.missing, path) || groupNeedsAnswer));
  return (
    <div data-kyb-requirement={path} className="py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p id={`${id}-label`} className="text-sm font-semibold">
            {title}
          </p>
          {showError && (
            <p id={`${id}-error`} className="mt-1 text-xs text-red-700">
              {correction?.message ?? "Select Yes or No."}
            </p>
          )}
        </div>
        <div
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-invalid={showError}
          aria-describedby={showError ? `${id}-error` : undefined}
          className="flex w-fit shrink-0 gap-1 rounded-xl bg-kyb-field p-1"
        >
          {[false, true].map((answer) => (
            <label key={String(answer)} className="relative cursor-pointer">
              <input
                type="radio"
                name={path}
                checked={value === answer}
                disabled={!editor.editable || editor.busy}
                onChange={() => editor.change(path, answer)}
                className="peer sr-only"
              />
              <span className="flex min-h-9 min-w-14 items-center justify-center rounded-lg px-3 text-sm text-kyb-muted peer-checked:bg-white peer-checked:font-semibold peer-checked:text-primary2 peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary2 peer-disabled:opacity-50">
                {answer ? "Yes" : "No"}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActivityStage({
  editor,
  guide,
}: {
  editor: KybEditor;
  guide?: KybFormGuide;
}) {
  const risk =
    (getPath(editor.draft, "risk_profile.high_risk_activities") as
      | string[]
      | undefined) ?? [];
  const endorsements = Array.isArray(editor.draft.endorsements)
    ? (editor.draft.endorsements as string[])
    : [];
  const referenceRiskChoices = options(guide?.high_risk_activities);
  const riskChoices = referenceRiskChoices.length
    ? referenceRiskChoices
    : HIGH_RISK_ACTIVITIES;
  const selectedRisk = risk.map(
    (value) =>
      riskChoices.find((option) => option.value === value) ?? {
        value,
        label: label(value),
      },
  );
  const riskError =
    groupFieldErrors(editor.fieldErrors ?? []).find(
      (error) =>
        error.field === "risk_profile.high_risk_activities" ||
        error.field === "high_risk_activities",
    )?.message ??
    (editor.missing.some(
      (key) =>
        key === "risk_profile.high_risk_activities" ||
        key === "high_risk_activities",
    )
      ? "Choose all that apply, or None of the above."
      : undefined);
  const riskId = useId();
  const money =
    getPath(editor.draft, "risk_profile.conducts_money_services") === true;
  const clearedPaymentRange = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!editor.editable) return;
    const current = getPath(
      editor.draft,
      "industry_purpose.expected_monthly_payments_usd",
    );
    if (!isUsdRangeKey(current) || clearedPaymentRange.current === current)
      return;
    clearedPaymentRange.current = String(current);
    editor.change("industry_purpose.expected_monthly_payments_usd", "");
  }, [editor]);
  return (
    <div className="space-y-6">
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-primary2">
          Account purpose and funding
        </h3>
        <Field
          editor={editor}
          path="industry_purpose.account_purpose"
          title="What will you use this account for?"
          choices={ACCOUNT_PURPOSE_OPTIONS}
        />
        {getPath(editor.draft, "industry_purpose.account_purpose") ===
          "other" && (
          <Field
            editor={editor}
            path="industry_purpose.account_purpose_other"
            title="Describe your account purpose"
            multiline
          />
        )}
        <Field
          editor={editor}
          path="industry_purpose.source_of_funds"
          title="Where does most of your money come from?"
          choices={SOURCE_OF_FUNDS_OPTIONS}
        />
        <Field
          editor={editor}
          path="industry_purpose.source_of_funds_description"
          title="Tell us a little about this income"
          multiline
          helper="For example, payments from customers for the products or services you sell."
        />
      </section>
      <section className="space-y-5 border-t border-kyb-border pt-6">
        <h3 className="text-sm font-semibold text-primary2">
          Expected account activity
        </h3>
        <Field
          editor={editor}
          path="industry_purpose.expected_monthly_payments_usd"
          title="Expected monthly payments (USD)"
          type="number"
          min={0}
          step={1}
          helper="An estimate is fine. Include your total expected monthly payments, sent or received."
        />
        <Field
          editor={editor}
          path="industry_purpose.estimated_annual_revenue_usd"
          title="Estimated annual revenue (USD)"
          helper="Roughly how much your business earns in a year, in US dollars."
          choices={REVENUE_OPTIONS}
        />
      </section>
      <section className="space-y-5 border-t border-kyb-border pt-6">
        <h3 className="text-sm font-semibold text-primary2">
          Business activities
        </h3>
        <div data-kyb-requirement="risk_profile.high_risk_activities">
          <SelectField
            isMulti
            instanceId={riskId}
            name="risk_profile.high_risk_activities"
            label="Does your business do any of these?"
            placeholder="Select all that apply"
            options={riskChoices}
            value={selectedRisk}
            minHeight="48px"
            bgColor="#F4F4F8"
            className="!shadow-none"
            labelClass="!font-monzo !text-sm !font-semibold !text-kyb-ink"
            disabled={!editor.editable || editor.busy}
            status={riskError ? "error" : undefined}
            helper={
              riskError ?? "Choose all that apply, or select None of the above."
            }
            onChange={(selected) => {
              const values = selected.map((option) => String(option.value));
              const addedNone =
                values.includes("none_of_the_above") &&
                !risk.includes("none_of_the_above");
              editor.change(
                "risk_profile.high_risk_activities",
                addedNone
                  ? ["none_of_the_above"]
                  : values.length > 1
                    ? values.filter((value) => value !== "none_of_the_above")
                    : values,
              );
            }}
          />
        </div>
        {risk.some((x) => x !== "none_of_the_above") && (
          <Field
            editor={editor}
            path="risk_profile.high_risk_activities_explanation"
            title="Explain the selected activities"
            multiline
          />
        )}
        <div className="divide-y divide-kyb-border rounded-xl border border-kyb-border px-4">
          <BusinessYesNo
            editor={editor}
            path="risk_profile.conducts_money_services"
            title="Does your business provide money services?"
          />
          {money && (
            <div className="space-y-4 py-4">
              <Field
                editor={editor}
                path="risk_profile.conducts_money_services_description"
                title="Describe the money services"
                multiline
              />
              <Field
                editor={editor}
                path="risk_profile.compliance_screening_explanation"
                title="Describe compliance screening"
                multiline
              />
              <BusinessYesNo
                editor={editor}
                path="risk_profile.conducts_money_services_using_bridge"
                title="Will you use this account for money services?"
              />
            </div>
          )}
          <BusinessYesNo
            editor={editor}
            path="risk_profile.acting_as_intermediary"
            title="Does your business act as an intermediary?"
          />
          <BusinessYesNo
            editor={editor}
            path="industry_purpose.operates_in_prohibited_countries"
            title="Does your business operate in prohibited or sanctioned countries?"
          />
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          Requested payment capabilities
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {options(guide?.endorsements).map((o) => {
            const checked = endorsements.includes(o.value);
            const locked = !editor.editable || editor.busy;
            const toggle = (nextChecked: boolean) =>
              editor.change(
                "endorsements",
                nextChecked
                  ? [...endorsements, o.value]
                  : endorsements.filter((x) => x !== o.value),
              );
            return (
              <div
                key={o.value}
                onClick={(event) => {
                  if (locked || (event.target as HTMLElement).closest("input"))
                    return;
                  toggle(!checked);
                }}
                className={`rounded-xl border px-3 py-2.5 ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${checked ? "border-kyb-outline bg-kyb-selected" : "border-kyb-border"}`}
              >
                <Checkbox
                  id={`kyb-endorsement-${o.value}`}
                  checked={checked}
                  label={o.label}
                  className="pointer-events-none w-full"
                  labelClass={`!ml-3 !min-w-0 !flex-1 !text-sm !leading-snug !text-kyb-ink ${checked ? "!font-semibold" : ""}`}
                  bgStyle="border-primary2 bg-primary2"
                  checkMarkColor="#FFFFFF"
                  onChange={toggle}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
