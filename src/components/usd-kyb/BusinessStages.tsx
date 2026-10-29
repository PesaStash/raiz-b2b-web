"use client";
import {
  correctionPath,
  valueAt,
  replaceAt,
  groupFieldErrors,
} from "@/lib/usd-kyb/corrections";
import SelectField from "@/components/ui/SelectField";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { kybApi } from "@/services/usdKyb";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import Checkbox from "@/components/ui/Checkbox";
import Radio from "@/components/ui/Radio";
import {
  Action,
  Badge,
  Check,
  Field,
  Notice,
  ReadRows,
  SegmentedField,
} from "./KybUI";
import { options, getPath, record, display, label } from "@/lib/usd-kyb/model";
import {
  ACCOUNT_PURPOSE_OPTIONS,
  SOURCE_OF_FUNDS_OPTIONS,
  REVENUE_OPTIONS,
  HIGH_RISK_ACTIVITIES,
} from "@/lib/usd-kyb/bridgeOptions";
import type { KybEditor } from "@/lib/hooks/useUsdKyb";
import { KybIcon } from "./KybGuide";
import type { LookupResult, KybFormGuide } from "@/types/usdKyb";

export function IdentityStage({
  editor,
  onManual,
  compact = false,
  onFound,
}: {
  editor: KybEditor;
  onManual: () => void;
  compact?: boolean;
  onFound?: () => void;
}) {
  const [number, setNumber] = useState("");
  const [kind, setKind] = useState("RC");
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<LookupResult>();
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  return (
    <div className="space-y-6">
      {compact && (
        <p className="text-sm leading-[21px] text-[#444454]">
          Enter your RC or BN number. We look your business up on the CAC
          register and fill in the details and directors for you.
        </p>
      )}
      <div>
        <label
          htmlFor={compact ? "guide-company-number" : "company-number"}
          className="mb-2 block text-sm font-semibold"
        >
          Registration number
        </label>
        <div className="flex h-12 items-center rounded-xl bg-kyb-field px-4">
          <select
            aria-label="Registration type"
            className="w-16 shrink-0 border-r border-[#D8DAE5] bg-transparent text-sm text-kyb-muted"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            disabled={!editor.editable || editor.busy}
          >
            <option>RC</option>
            <option>BN</option>
          </select>
          <input
            id={compact ? "guide-company-number" : "company-number"}
            aria-label="Registration number"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            placeholder={`Enter ${kind} number`}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            disabled={!editor.editable || editor.busy}
          />
        </div>
        {!compact && (
          <p className="mt-2 text-xs text-kyb-muted">
            It’s on your certificate of incorporation.
          </p>
        )}
      </div>
      <Check
        checked={consent}
        onChange={setConsent}
        disabled={!editor.editable || editor.busy}
      >
        I consent to Raiz looking up this company’s registration details.
      </Check>
      <div className="flex flex-wrap items-center gap-4">
        <Action
          disabled={!editor.editable || !consent || !number.trim() || wait > 0}
          loading={editor.busy}
          onClick={() => {
            setWait(15);
            void editor
              .command(() => kybApi.lookup(number.trim(), kind, consent))
              .then((next) => {
                if (next) {
                  editor.change("business_profile.business_type", "");
                  setResult(next);
                  onFound?.();
                }
              });
          }}
        >
          {wait ? `Try again in ${wait}s` : "Find business"}
        </Action>
        <button
          type="button"
          className="text-sm font-semibold text-primary2"
          onClick={onManual}
          disabled={editor.busy}
        >
          Enter details myself
        </button>
      </div>
      {result && (
        <section className="overflow-hidden rounded-xl border border-kyb-border bg-white p-5">
          <Badge good>
            Found on the CAC register{result.cached ? " · Saved result" : ""}
          </Badge>
          <h3 className="mt-3 text-lg font-bold">
            {display(result.lookup.legal_name)}
          </h3>
          <ReadRows
            data={Object.fromEntries(
              [
                "registration_number",
                "company_type",
                "status",
                "incorporation_date",
                "registered_address",
              ]
                .filter((k) => result.lookup[k] != null)
                .map((k) => [k, result.lookup[k]]),
            )}
          />
        </section>
      )}
      {!!(
        result?.differences ?? editor.bundle?.case.youverify_lookup_differences
      )?.length && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold">Some register details differ</h3>
          <p className="mt-2 text-sm">
            Your entries have been kept. Review these differences before
            continuing.
          </p>
          {(
            result?.differences ??
            editor.bundle?.case.youverify_lookup_differences ??
            []
          ).map((d, i) => (
            <div className="mt-4 text-sm" key={`${d.field}-${i}`}>
              <p className="font-semibold">{label(d.field)}</p>
              <p>Your entry: {display(d.current)}</p>
              <p>Register: {display(d.provider)}</p>
            </div>
          ))}
        </section>
      )}
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
  const [manualAddress, setManualAddress] = useState(
    () =>
      (editor.fieldErrors ?? []).some((error) =>
        error.field.startsWith(path + "."),
      ) || !!String(current.street_line_1 ?? "").trim(),
  );
  const [addressQuery, setAddressQuery] = useState("");
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <button
          type="button"
          className="text-sm font-semibold text-primary2"
          disabled={!editor.editable || editor.busy}
          onClick={() => setManualAddress((value) => !value)}
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
            onChange={setAddressQuery}
            onAddressSelect={(components) => {
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
export function BusinessDetails({
  editor,
  guide,
}: {
  editor: KybEditor;
  guide?: KybFormGuide;
}) {
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
    const value = String(
      current.find((item) => item.type === "tin")?.number ?? "",
    ).trim();
    editor.change(
      "identifying_information",
      value ? [{ type: "tin", issuing_country: "NG", number: value }] : [],
    );
  }, [editor]);
  return (
    <div className="space-y-6">
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
        title="Business website (or provide proof in Documents)"
      />
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
      <details
        className="rounded-xl border border-kyb-border p-4"
        open={
          !getPath(editor.draft, "business_profile.email") ||
          !getPath(editor.draft, "registered_address.street_line_1")
        }
      >
        <summary className="cursor-pointer text-sm font-semibold text-primary2">
          Business contact and registration details
        </summary>
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
          <Check
            checked={getPath(editor.draft, "business_profile.is_dao") === true}
            onChange={(v) => editor.change("business_profile.is_dao", v)}
          >
            This business is a decentralised autonomous organisation (DAO)
          </Check>
          {getPath(editor.draft, "business_profile.is_dao") == null && (
            <Action
              variant="tertiary"
              onClick={() => editor.change("business_profile.is_dao", false)}
              disabled={!editor.editable}
            >
              Confirm this business is not a DAO
            </Action>
          )}
          <AddressFields
            editor={editor}
            path="registered_address"
            title="Registered address"
          />
        </div>
      </details>
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
                  disabled={!editor.editable || editor.busy || !choices.length}
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
      <div>
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
    </div>
  );
}
function IndustryField({ editor }: { editor: KybEditor }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
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
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Industry</h3>
      <details className="rounded-xl bg-kyb-field">
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
  const riskChoices = options(guide?.high_risk_activities);
  const money =
    getPath(editor.draft, "risk_profile.conducts_money_services") === true;
  useEffect(() => {
    if (!editor.editable) return;
    if (
      isUsdRangeKey(
        getPath(editor.draft, "industry_purpose.expected_monthly_payments_usd"),
      )
    )
      editor.change("industry_purpose.expected_monthly_payments_usd", "");
  }, [editor]);
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">
          Where does most of your money come from?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOURCE_OF_FUNDS_OPTIONS.map((option) => {
            const selected =
              getPath(editor.draft, "industry_purpose.source_of_funds") ===
              option.value;
            const locked = !editor.editable || editor.busy;
            const select = () => {
              if (!locked)
                editor.change("industry_purpose.source_of_funds", option.value);
            };
            return (
              <div
                key={option.value}
                onClick={select}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${selected ? "border-kyb-outline bg-kyb-selected font-semibold" : "border-kyb-border"}`}
              >
                <Radio
                  checked={selected}
                  readOnly={locked}
                  aria-label={option.label}
                  className={`pointer-events-none ${selected ? "!border-primary2" : ""}`}
                  onChange={select}
                />
                {option.label}
              </div>
            );
          })}
        </div>
      </fieldset>
      <Field
        editor={editor}
        path="industry_purpose.expected_monthly_payments_usd"
        title="Expected monthly payments (USD)"
        type="number"
        min={0}
        step={1}
        helper="An estimate is fine. Include your total expected monthly payments, sent or received."
      />
      <SegmentedField
        editor={editor}
        path="industry_purpose.estimated_annual_revenue_usd"
        title="Estimated annual revenue (USD)"
        helper="Roughly how much your business earns in a year, in US dollars."
        choices={REVENUE_OPTIONS}
      />
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          Does your business do any of these?
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(riskChoices.length ? riskChoices : HIGH_RISK_ACTIVITIES).map(
            (o) => {
              const checked = risk.includes(o.value);
              const locked = !editor.editable || editor.busy;
              const toggle = (nextChecked: boolean) => {
                const next =
                  o.value === "none_of_the_above"
                    ? nextChecked
                      ? [o.value]
                      : []
                    : nextChecked
                      ? [
                          ...risk.filter((x) => x !== "none_of_the_above"),
                          o.value,
                        ]
                      : risk.filter((x) => x !== o.value);
                editor.change("risk_profile.high_risk_activities", next);
              };
              return (
                <div
                  key={o.value}
                  onClick={(event) => {
                    if (
                      locked ||
                      (event.target as HTMLElement).closest("input")
                    )
                      return;
                    toggle(!checked);
                  }}
                  className={`rounded-xl border px-3 py-2.5 ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${checked ? "border-kyb-outline bg-kyb-selected" : "border-kyb-border"}`}
                >
                  <Checkbox
                    id={`kyb-risk-${o.value}`}
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
            },
          )}
        </div>
      </section>
      <details open className="rounded-xl border border-kyb-border p-4">
        <summary className="cursor-pointer text-sm font-semibold text-primary2">
          Account purpose and source details
        </summary>
        <div className="mt-5 space-y-6">
          {" "}
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
            path="industry_purpose.source_of_funds_description"
            title="Describe your source of funds"
            multiline
          />
        </div>
      </details>
      {risk.some((x) => x !== "none_of_the_above") && (
        <Field
          editor={editor}
          path="risk_profile.high_risk_activities_explanation"
          title="Explain the selected activities"
          multiline
        />
      )}
      <Check
        checked={money}
        onChange={(v) =>
          editor.change("risk_profile.conducts_money_services", v)
        }
      >
        This business conducts money services
      </Check>
      {money && (
        <>
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
          <Check
            checked={
              getPath(
                editor.draft,
                "risk_profile.conducts_money_services_using_bridge",
              ) === true
            }
            onChange={(v) =>
              editor.change(
                "risk_profile.conducts_money_services_using_bridge",
                v,
              )
            }
          >
            Money services will use this account
          </Check>
        </>
      )}
      <Check
        checked={
          getPath(
            editor.draft,
            "industry_purpose.operates_in_prohibited_countries",
          ) === true
        }
        onChange={(v) =>
          editor.change("industry_purpose.operates_in_prohibited_countries", v)
        }
      >
        This business operates in prohibited or sanctioned countries
      </Check>
      {getPath(
        editor.draft,
        "industry_purpose.operates_in_prohibited_countries",
      ) == null && (
        <Action
          variant="tertiary"
          onClick={() =>
            editor.change(
              "industry_purpose.operates_in_prohibited_countries",
              false,
            )
          }
        >
          Confirm no operations in prohibited countries
        </Action>
      )}
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
