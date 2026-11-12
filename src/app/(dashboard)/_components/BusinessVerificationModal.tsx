import { apiFieldCorrections, apiFieldErrors } from "@/lib/apiError";
import { basicBusinessField, mergePristineFields } from "@/lib/businessFormState";
import Image from "next/image";
import type { IUser } from "@/types/user";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import AddressAutocomplete, { usePlaceResolver } from "@/components/ui/AddressAutocomplete";
import { useFormik } from "formik";
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import useCountryStore from "@/store/useCountryStore";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessVerificationApi } from "@/services/user";
import { IBusinessVerificationPayload } from "@/types/services";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { getApiErrorMessage, sanitizeAddressField } from "@/utils/helpers";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import { Action, Notice } from "@/components/usd-kyb/KybUI";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserType } from "@/utils/analytics/userProps";
import CompanyLookupStep from "@/components/onboarding/CompanyLookupStep";
import {
  clearLookupPrefill,
  readLookupPrefill,
  enterBusinessManually,
  isManualBusinessEntry,
  subscribeLookupPrefill,
  selectLookupPrefill,
  type LookupPrefill,
} from "@/lib/companyLookup";

const nigerianRegNumberRegex = /^(?:RC|BN)?[A-Z0-9-]{4,24}$/i;

const BusinessSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  business_registration_number: z
    .string()
    .min(1, "Registration number is required"),
  business_email: z
    .string()
    .email("Invalid email address")
    .min(1, "Email is required"),
  address: z.string().optional(),
  country_code: z.string().regex(/^[A-Z]{2}$/, "Select a valid country"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().trim().min(1, "Postcode is required"),
  street: z.string().min(1, "Street is required"),
  building_number: z.string().optional(),
  city: z.string().min(1, "City is required"),
  length_of_stay_months: z.coerce
    .number({ invalid_type_error: "Length of stay is required" })
    .int("Enter a whole number of months")
    .min(6, "Minimum length of stay is 6 months"),
});

type BusinessFormValues = z.infer<typeof BusinessSchema>;

const mapZodFieldErrors = (
  fieldErrors: Record<string, string[] | undefined>,
): Partial<Record<keyof BusinessFormValues, string>> =>
  Object.fromEntries(
    Object.entries(fieldErrors)
      .filter((entry): entry is [string, string[]] => !!entry[1]?.length)
      .map(([key, messages]) => [key, messages[0]]),
  ) as Partial<Record<keyof BusinessFormValues, string>>;

type BasicFormProps = {
  close: () => void;
  onVerificationSuccess?: () => void;
  page?: boolean;
  prefill?: LookupPrefill | null;
};

const BusinessVerificationModal = (props: BasicFormProps) => {
  const { user } = useUser();
  const entityId = user?.business_account?.entity_id ?? "";
  const countryCode =
    user?.business_account?.entity?.country?.country_code ?? "";
  const savedPrefill = readLookupPrefill(entityId);
  const [step, setStep] = useState<"lookup" | "form">(() =>
    !savedPrefill ? "lookup" : "form",
  );
  const [prefill, setPrefill] = useState<LookupPrefill | null>(
    () => savedPrefill,
  );

  if (step === "lookup") {
    return (
      <div className="flex flex-col gap-4 min-h-0">
        <CenterModalHeader close={props.close} />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-raiz-gray-950">
            Find your business
          </h2>
          <p className="text-sm text-kyb-muted">
            Look your business up on the register. We’ll fill in the details for
            you.
          </p>
        </div>
        <CompanyLookupStep
          compact
          countryCode={countryCode}
          entityId={entityId}
          onConfirmed={(next) => {
            setPrefill(next);
            setStep("form");
          }}
          onManual={() => {
            enterBusinessManually(entityId);
            setPrefill(null);
            setStep("form");
          }}
        />
      </div>
    );
  }

  return (
    <BasicBusinessForm {...props} user={user} prefill={prefill} />
  );
};

export const BasicBusinessForm = ({
  close,
  onVerificationSuccess,
  page = false,
  user,
  prefill: prefillProp,
}: BasicFormProps & { user?: IUser }) => {
  const entityId = user?.business_account?.entity_id ?? "";
  const persistedPrefill = useSyncExternalStore(subscribeLookupPrefill, () => readLookupPrefill(entityId), () => null);
  // Explicit null means manual entry; it must not fall back to an earlier lookup.
  const storedPrefill = selectLookupPrefill(isManualBusinessEntry(entityId), prefillProp, persistedPrefill);
  const { resolve: resolveAddress, isLoaded: addressReady, error: addressLoadError, resolutionError } = usePlaceResolver();
  const [addressStatus, setAddressStatus] = useState<"idle" | "loading" | "failed" | "done">("idle");
  const [addressRetry, setAddressRetry] = useState(0);
  const [useManualAddress, setUseManualAddress] = useState(
    () => !!storedPrefill?.address || !!user?.business_account?.entity?.entity_address?.[0]?.street,
  );
  const {
    countries,
    fetchCountries,
    loading: countriesLoading,
  } = useCountryStore();

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.country_code,
        label: country.country_name,
        flag: country.country_flag,
      })),
    [countries],
  );

  const formatCountryOption = (
    option:
      | (typeof countryOptions)[number]
      | { value: string | number; label: string },
  ) => {
    const flag =
      "flag" in option && typeof option.flag === "string"
        ? option.flag
        : countries.find((country) => country.country_code === option.value)
            ?.country_flag;
    return (
      <span className="flex items-center gap-2.5">
        {flag ? (
          <Image
            src={flag}
            width={22}
            height={15}
            alt=""
            className="rounded-[3px] object-cover"
          />
        ) : null}
        {option.label}
      </span>
    );
  };

  const formRef = useRef<HTMLFormElement>(null);
  const focusField = (name: string) => {
    const controls = formRef.current?.querySelectorAll<HTMLElement>("input, select, textarea, [role=combobox]");
    const control = Array.from(controls ?? []).find(control => control.getAttribute("name") === name || (name === "business_registration_number" && control.id === "business-reg") || (name === "country_code" && control.getAttribute("role") === "combobox"));
    control?.focus();
    control?.scrollIntoView({ block: "center" });
  };
  const qc = useQueryClient();
  const BusinessVerificationMutation = useMutation({
    mutationFn: (payload: IBusinessVerificationPayload) =>
      BusinessVerificationApi(payload),
    onError: error => {
      const fields = Object.fromEntries(Object.entries(apiFieldErrors(error)).map(([key, message]) => [basicBusinessField(key), message]).filter(([key]) => Object.hasOwn(formik.values, key)));
      formik.setErrors(fields);
      const first = Object.keys(fields)[0];
      requestAnimationFrame(() => first ? focusField(first) : errorSummaryRef.current?.focus());
    },
    onSuccess: async (response) => {
      clearLookupPrefill(entityId);
      toast.success(
        response?.message ||
          "Basic business information submitted. Choose a starting currency to continue.",
      );
      pushDataLayerEvent("kyc_status_update", {
        kyc_step: "basic_info",
        kyc_status: "submitted",
        user_type: getAnalyticsUserType(),
      });
      await qc.invalidateQueries({ queryKey: ["user"] });
      onVerificationSuccess?.();
      if (!page) close();
    },
  });

  const getEffectiveSchema = () =>
    BusinessSchema.refine(
      (data) => {
        if (data.country_code !== "NG") return true;

        return nigerianRegNumberRegex.test(
          data.business_registration_number?.toUpperCase(),
        );
      },
      {
        message:
          "Enter a valid Nigerian registration number (4–24 alphanumeric or hyphen characters, with an optional RC/BN prefix).",
        path: ["business_registration_number"],
      },
    );

  const existingEmail =
    user?.business_account?.business_email || user?.email || "";

  const saved = user?.business_account?.entity?.entity_address?.[0];
  const initialValues = useMemo<BusinessFormValues>(() => ({
      business_registration_number:
        user?.business_account?.business_registration_number || storedPrefill?.registration_number || "",
      business_name:
        user?.business_account?.business_name ||
        storedPrefill?.business_name ||
        "",
      business_email:
        existingEmail || storedPrefill?.business_email || "",
      country_code:
        user?.business_account?.entity?.country?.country_code ||
        storedPrefill?.country_code ||
        "",
      state: saved?.state || storedPrefill?.state || "",
      zip_code: saved?.zip_code || storedPrefill?.zip_code || "",
      street: saved?.street || storedPrefill?.street || "",
      building_number: saved?.building_number || storedPrefill?.building_number || "",
      city: saved?.city || storedPrefill?.city || "",
      length_of_stay_months: saved?.length_of_stay_months ?? (undefined as unknown as number),
      address: storedPrefill?.address || "",
    }), [user, storedPrefill, existingEmail, saved]);
  const previousInitial = useRef(initialValues);
  const previousEntity = useRef(entityId);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const formik = useFormik<BusinessFormValues>({
    initialValues,
    validateOnChange: true,
    validate: (values) => {
      const result = getEffectiveSchema().safeParse(values);

      if (!result.success) {
        return mapZodFieldErrors(result.error.flatten().fieldErrors);
      }
    },
    onSubmit: (values) => {
      BusinessVerificationMutation.mutate({
        business_name: values.business_name,
        business_registration_number: values.business_registration_number,
        business_email: values.business_email,
        country_code: values.country_code || null,
        state: sanitizeAddressField(values.state || "") || null,
        zip_code: values.zip_code || null,
        street: sanitizeAddressField(values.street || "") || null,
        building_number: values.building_number || null,
        city: sanitizeAddressField(values.city || "") || null,
        length_of_stay_months: values.length_of_stay_months || 0,
      });
    },
  });

  const setFormValues = formik.setValues;
  useEffect(() => {
    const previous = previousInitial.current;
    const changedBusiness = previousEntity.current !== entityId;
    previousEntity.current = entityId;
    previousInitial.current = initialValues;
    if (changedBusiness || JSON.stringify(previous) !== JSON.stringify(initialValues)) {
      void setFormValues(current => changedBusiness ? initialValues : mergePristineFields(current, previous, initialValues), false);
    }
  }, [entityId, initialValues, setFormValues]);

  const latestForm = useRef(formik);
  useEffect(() => { latestForm.current = formik; }, [formik]);
  const savedAddress = storedPrefill?.address;
  useEffect(() => {
    if (!savedAddress || !addressReady) return;
    const before = latestForm.current.values;
    if (before.city && before.state && before.zip_code) return;
    let cancelled = false;
    const run = async () => {
      setAddressStatus("loading");
      const parts = await resolveAddress(savedAddress, before.country_code);
      if (cancelled) return;
      if (!parts) { setAddressStatus("failed"); return; }
      const current = latestForm.current.values;
      // A late Places response must not replace a user's address edits.
      if (current.address !== before.address || current.street !== before.street || current.country_code !== before.country_code) {
        setAddressStatus("idle");
        return;
      }
      const next = {
        ...current,
        street: parts.street && current.street === storedPrefill?.street
          ? [parts.building_number, parts.street].filter(Boolean).join(" ") : current.street,
        city: current.city || parts.city || "",
        state: current.state || parts.state || "",
        zip_code: current.zip_code || parts.zip_code || "",
        address: parts.address || current.address,
      };
      await latestForm.current.setValues(next, false);
      setAddressStatus(next.city && next.state && next.zip_code ? "done" : "failed");
    };
    void run();
    return () => { cancelled = true; };
  }, [savedAddress, storedPrefill?.street, addressReady, addressRetry, resolveAddress]);

  const addressResolutionNotice = storedPrefill?.address && addressLoadError ? (
    <Notice error>{addressLoadError} Reload the page to retry, or complete the address fields.</Notice>
  ) : addressStatus === "loading" ? (
    <p role="status" className="text-sm text-kyb-muted">Finding city, state and postcode…</p>
  ) : addressStatus === "failed" ? (
    <Notice>{resolutionError || "Google could not fill every address field."} <button type="button" className="underline" onClick={() => setAddressRetry(value => value + 1)}>Retry address lookup</button>, or complete the missing fields.</Notice>
  ) : null;

  const selectedCountry = countryOptions.find(
    option => option.value === formik.values.country_code,
  ) ?? null;

  const hasRequiredAddress =
    !!formik.values.city &&
    !!formik.values.state &&
    !!formik.values.street &&
    !!formik.values.country_code;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const result = getEffectiveSchema().safeParse(formik.values);
    if (!result.success) {
      toast.error(result.error.issues[0].message, { id: "onboarding-error" });
      const first = String(result.error.issues[0].path[0] ?? "");
      requestAnimationFrame(() => focusField(first));
    }
    formik.handleSubmit(event);
  };
  // Render synchronous schema feedback; Formik still owns submit validation.
  const liveValidation = getEffectiveSchema().safeParse(formik.values);
  const liveErrors = liveValidation.success ? {} : mapZodFieldErrors(liveValidation.error.flatten().fieldErrors);
  const fieldError = (name: keyof BusinessFormValues) => {
    const error = (formik.touched[name] || formik.submitCount > 0) && (formik.errors[name] || liveErrors[name]);
    if (!error) return null;
    return Array.isArray(error) ? (error.length ? "error" : null) : "error";
  };

  const fieldErrorMessage = (name: keyof BusinessFormValues) => {
    const error = (formik.touched[name] || formik.submitCount > 0) && (formik.errors[name] || liveErrors[name]);
    if (!error) return undefined;
    return Array.isArray(error) ? error[0] : error;
  };

  const hasRegistryName = !!storedPrefill?.business_name?.trim() && storedPrefill.business_name.trim() === formik.values.business_name.trim();
  const prefillNotice = storedPrefill ? (
    <Notice>
      Pre-filled from the business register. Check and edit anything that’s
      changed.
    </Notice>
  ) : null;

  const serverCorrections = apiFieldCorrections(BusinessVerificationMutation.error);
  const correctionSummary = BusinessVerificationMutation.isError && (
    <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 p-4 text-sm text-red-700">
      <p>{getApiErrorMessage(BusinessVerificationMutation.error, "Unable to submit your business details. Please try again.")}</p>
      <ul className="list-disc pl-5">{serverCorrections.map(({ field, message }, index) => <li key={`${field}-${index}`}>
        <button type="button" className="text-left underline" onClick={() => focusField(basicBusinessField(field))}>{basicBusinessField(field).replace(/[_.[\]]+/g, " ")}: {message}</button>
      </li>)}</ul>
    </div>
  );

  if (page) {
    const field = (
      name: keyof BusinessFormValues,
      label: string,
      type = "text",
    ) => (
      <InputField
        label={label}
        type={type}
        {...formik.getFieldProps(name)}
        value={formik.values[name] ?? ""}
        min={type === "number" ? 6 : undefined}
        labelClass="!font-monzo !text-sm !font-semibold !text-kyb-ink"
        className="!h-12 !rounded-xl !border-transparent !bg-kyb-field !text-kyb-ink"
        status={fieldError(name)}
        errorMessage={fieldErrorMessage(name)}
      />
    );
    const ng = formik.values.country_code === "NG";
    const reg = formik.values.business_registration_number;
    const prefix = reg.startsWith("BN") ? "BN" : "RC";
    return (
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-7 rounded-2xl border border-kyb-border bg-white p-5 md:p-8"
      >
        {correctionSummary}
        {/* {prefillNotice} */}
        <header>
          <p className="text-xs font-semibold text-primary2">
            VERIFY YOUR BUSINESS · TASK 2 OF 3
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-8">
            Basic business details
          </h1>
          <p className="mt-2 text-[15px] leading-[22px] text-kyb-muted">
            Tell us who you are once. We reuse it for USD, NGN or both.
          </p>
        </header>
        <section className="space-y-5 border-t border-kyb-border pt-7">
          <div>
            <h2 className="font-semibold">About the business</h2>
            <p className="mt-1 text-[13px] text-kyb-muted">
              Registered details, as they appear on your certificate.
            </p>
          </div>
          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <div>
              <SelectField
                formatOptionLabel={formatCountryOption}
                label="Country business is registered in"
                name="country_code"
                options={countryOptions}
                value={selectedCountry}
                isLoading={countriesLoading}
                height="48px"
                minHeight="48px"
                bgColor="#F4F4F8"
                className="!shadow-none"
                labelClass="!font-monzo !text-sm !font-semibold !text-kyb-ink"
                onChange={(option) => {
                  void formik.setFieldValue(
                    "country_code",
                    String(option?.value ?? ""),
                  );
                }}
                status={fieldError("country_code")}
                helper={fieldErrorMessage("country_code")}
              />
              <p className="mt-2 text-[13px] text-kyb-muted">
                From your sign-up. You can change it.
              </p>
            </div>
            <div>
              {ng ? (
                <>
                  <label
                    htmlFor="business-reg"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Registration number
                  </label>
                  <div className="flex h-12 items-center gap-2 rounded-xl bg-kyb-field px-4">
                    <Image
                      src="/images/kyb/registration-ng.png"
                      width={22}
                      height={15}
                      alt=""
                      className="rounded-[3px]"
                    />
                    <select
                      aria-label="Registration type"
                      value={prefix}
                      className="w-16 bg-transparent text-sm font-semibold"
                      onChange={(e) =>
                        void formik.setFieldValue(
                          "business_registration_number",
                          e.target.value + reg.replace(/^(RC|BN)[\s-]*/i, ""),
                        )
                      }
                    >
                      <option value="RC">RC</option>
                      <option value="BN">BN</option>
                    </select>
                    <input
                      id="business-reg"
                      aria-label="Registration number"
                      className="min-w-0 flex-1 border-l border-kyb-border bg-transparent pl-3 text-[15px] outline-none"
                      value={reg.replace(/^(RC|BN)[\s-]*/i, "")}
                      onBlur={() =>
                        void formik.setFieldTouched(
                          "business_registration_number",
                        )
                      }
                      onChange={(e) =>
                        void formik.setFieldValue(
                          "business_registration_number",
                          prefix + e.target.value,
                        )
                      }
                    />
                  </div>
                  {fieldErrorMessage("business_registration_number") && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrorMessage("business_registration_number")}
                    </p>
                  )}
                </>
              ) : (
                field("business_registration_number", "Registration number")
              )}
              <p className="mt-2 text-[13px] text-kyb-muted">
                The number on your registration certificate
              </p>
            </div>
            <div>
              {field("business_name", "Business name")}
              <p className="mt-2 text-[13px] text-kyb-muted">
                {hasRegistryName ? `Fetched from the ${formik.values.country_code === "NG" ? "CAC registry" : "business registry"}` : "Enter your registered business name."}
              </p>
            </div>
            <div>
              {field("business_email", "Business email", "email")}
              <p className="mt-2 text-[13px] text-kyb-muted">
                Where we send business notices.
              </p>
            </div>
          </div>
        </section>
        <section className="space-y-5 border-t border-kyb-border pt-7">
          <div>
            <h2 className="font-semibold">Business address</h2>
            <p className="mt-1 text-[13px] text-kyb-muted">
              Where the business operates day to day.
            </p>
          </div>
          <div className="flex justify-between gap-3 text-sm font-semibold">
            <span>Business address</span>
            <button
              type="button"
              className="text-primary2"
              onClick={() => setUseManualAddress(!useManualAddress)}
            >
              {useManualAddress ? "Search address instead" : "Enter manually"}
            </button>
          </div>
          {addressResolutionNotice}
          {useManualAddress ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {field("street", "Street address")}
              {field("building_number", "Apartment / floor (optional)")}
              {field("city", "City")}
              {field("state", "State / region")}
              {field("zip_code", "Postcode *")}
              {field(
                "length_of_stay_months",
                "Time at this address (months)",
                "number",
              )}
            </div>
          ) : (
            <>
              <div className="[&_input]:!h-12 [&_input]:!rounded-xl [&_input]:!bg-kyb-field">
                <AddressAutocomplete
                  value={formik.values.address}
                  onChange={(value) => {
                    void formik.setFieldValue("address", value);
                    for (const key of ["street", "city", "state"])
                      void formik.setFieldValue(key, "", false);
                  }}
                  onAddressSelect={(components) =>
                    void formik.setValues({
                      ...formik.values,
                      ...components,
                      country_code: formik.values.country_code,
                    })
                  }
                  placeholder="Start typing your business address…"
                  touched={formik.submitCount > 0}
                  error={
                    !hasRequiredAddress
                      ? "Choose an address suggestion, or enter it manually."
                      : false
                  }
                />
              </div>
              <div className="sm:w-full">
                {field(
                  "length_of_stay_months",
                  "Time at this address (months)",
                  "number",
                )}
              </div>
            </>
          )}
        </section>
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-kyb-border pt-6">
          <p className="mr-auto text-[13px] text-kyb-muted">
            Takes about 3 minutes
          </p>
          <Action type="button" variant="secondary" onClick={close}>
            Back
          </Action>
          <Action
            type="submit"
            loading={BusinessVerificationMutation.isPending}
            disabled={BusinessVerificationMutation.isPending}
          >
            Save and continue
          </Action>
        </footer>
      </form>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
      {correctionSummary}
      {prefillNotice}
      {addressResolutionNotice}
      <div className="flex flex-col gap-3">
        <CenterModalHeader close={close} />
        <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
          Basic Business Verification
        </h2>
        <div>
          <InputField
            label="Business Name"
            {...formik.getFieldProps("business_name")}
            status={fieldError("business_name")}
            errorMessage={fieldErrorMessage("business_name")}
          />
          <p className="mt-2 text-[13px] text-kyb-muted">
            {hasRegistryName ? `Fetched from the ${formik.values.country_code === "NG" ? "CAC registry" : "business registry"}. You can edit it.` : "Enter your registered business name."}
          </p>
        </div>
        <InputField
          label="Business Registration Number"
          {...formik.getFieldProps("business_registration_number")}
          status={fieldError("business_registration_number")}
          errorMessage={fieldErrorMessage("business_registration_number")}
        />
        <InputField
          label="Business Email"
          type="email"
          {...formik.getFieldProps("business_email")}
          status={fieldError("business_email")}
          errorMessage={fieldErrorMessage("business_email")}
        />
        <SelectField
          formatOptionLabel={formatCountryOption}
          label="Country"
          name="country_code"
          placeholder="Select country"
          options={countryOptions}
          value={selectedCountry}
          isLoading={countriesLoading}
          onChange={(option) => {
            const code = option?.value != null ? String(option.value) : "";
            formik.setFieldValue("country_code", code, true);
            formik.setFieldTouched("country_code", true, false);
          }}
          status={fieldError("country_code")}
          helper={
            fieldErrorMessage("country_code")
              ? String(fieldErrorMessage("country_code"))
              : null
          }
        />

        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-gray-700">
            Business Address
          </label>
          <button
            type="button"
            onClick={() => setUseManualAddress((prev) => !prev)}
            className="text-sm text-raiz-purple-90 font-semibold hover:underline shrink-0"
          >
            {useManualAddress
              ? "Search address instead"
              : "Enter address manually"}
          </button>
        </div>

        {useManualAddress ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Building / Unit No"
              {...formik.getFieldProps("building_number")}
              status={fieldError("building_number")}
              errorMessage={fieldErrorMessage("building_number")}
            />
            <InputField
              label="Street"
              {...formik.getFieldProps("street")}
              status={fieldError("street")}
              errorMessage={fieldErrorMessage("street")}
            />
            <InputField
              label="City"
              {...formik.getFieldProps("city")}
              status={fieldError("city")}
              errorMessage={fieldErrorMessage("city")}
            />
            <InputField
              label="State / Region"
              {...formik.getFieldProps("state")}
              status={fieldError("state")}
              errorMessage={fieldErrorMessage("state")}
            />
            <InputField
              label="ZIP / Postal Code *"
              {...formik.getFieldProps("zip_code")}
              status={fieldError("zip_code")}
              errorMessage={fieldErrorMessage("zip_code")}
            />
          </div>
        ) : (
          <AddressAutocomplete
            value={formik.values.address}
            onChange={(value) => formik.setFieldValue("address", value)}
            onAddressSelect={(components) => {
              formik.setValues({
                ...formik.values,
                address: components.address ?? formik.values.address,
                building_number:
                  components.building_number ?? formik.values.building_number,
                street: components.street ?? formik.values.street,
                city: components.city ?? formik.values.city,
                state: components.state ?? formik.values.state,
                zip_code: components.zip_code ?? formik.values.zip_code,
                country_code:
                  components.country_code ?? formik.values.country_code,
              });
            }}
            placeholder="Start typing your business address..."
            touched={formik.touched.street || formik.touched.city}
            error={
              !hasRequiredAddress &&
              (formik.touched.address || formik.submitCount > 0)
                ? "Select an address from the suggestions"
                : false
            }
          />
        )}

        <InputField
          label="Length of Stay (Months)"
          {...formik.getFieldProps("length_of_stay_months")}
          type="number"
          min={6}
          status={fieldError("length_of_stay_months")}
          errorMessage={fieldErrorMessage("length_of_stay_months")}
        />
      </div>
      <div className="shrink-0 sticky bottom-0 z-10 bg-raiz-gray-50 pt-3 md:static md:bg-transparent md:pt-0">
        <Button
          disabled={
            !formik.dirty ||
            !hasRequiredAddress ||
            BusinessVerificationMutation.isPending
          }
          loading={BusinessVerificationMutation.isPending}
          type="submit"
        >
          {BusinessVerificationMutation?.isPending
            ? "Loading...."
            : "Verify Business"}
        </Button>
      </div>
    </form>
  );
};

export default BusinessVerificationModal;
