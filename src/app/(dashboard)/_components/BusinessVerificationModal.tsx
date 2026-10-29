import Image from "next/image";
import type { IUser } from "@/types/user";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { useFormik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
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

const nigerianRegNumberRegex = /^(RC|BN)[\s-]*\d{5,8}$/i;

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
  country_code: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().optional(),
  street: z.string().min(1, "Street is required"),
  building_number: z.string().optional(),
  city: z.string().min(1, "City is required"),
  length_of_stay_months: z.coerce
    .number({ invalid_type_error: "Length of stay is required" })
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
};
const BusinessVerificationModal = (props: BasicFormProps) => {
  const { user } = useUser();
  return <BasicBusinessForm {...props} user={user} />;
};
export const BasicBusinessForm = ({
  close,
  onVerificationSuccess,
  page = false,
  user,
}: BasicFormProps & { user?: IUser }) => {
  const [useManualAddress, setUseManualAddress] = useState(false);
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
      })),
    [countries],
  );

  const qc = useQueryClient();
  const BusinessVerificationMutation = useMutation({
    mutationFn: (payload: IBusinessVerificationPayload) =>
      BusinessVerificationApi(payload),
    onSuccess: async (response) => {
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
          "Invalid Nigerian business registration number. Must start with RC or BN and contain 6-7 digits.",
        path: ["business_registration_number"],
      },
    );

  const formik = useFormik<BusinessFormValues>({
    initialValues: {
      business_registration_number: "",
      business_name: user?.business_account?.business_name || "",
      business_email:
        user?.business_account?.business_email || user?.email || "",
      country_code: user?.business_account?.entity?.country?.country_code || "",
      state: "",
      zip_code: "",
      street: "",
      building_number: "",
      city: "",
      length_of_stay_months: undefined as unknown as number,
      address: "",
    },
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

  const selectedCountry = useMemo(
    () =>
      countryOptions.find(
        (option) => option.value === formik.values.country_code,
      ) ?? null,
    [countryOptions, formik.values.country_code],
  );

  const hasRequiredAddress =
    !!formik.values.city &&
    !!formik.values.state &&
    !!formik.values.street &&
    !!formik.values.country_code;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const result = getEffectiveSchema().safeParse(formik.values);
    if (!result.success)
      toast.error(result.error.issues[0].message, { id: "onboarding-error" });
    formik.handleSubmit(event);
  };
  const fieldError = (name: keyof BusinessFormValues) => {
    const error = formik.touched[name] && formik.errors[name];
    if (!error) return null;
    return Array.isArray(error) ? (error.length ? "error" : null) : "error";
  };

  const fieldErrorMessage = (name: keyof BusinessFormValues) => {
    const error = formik.touched[name] && formik.errors[name];
    if (!error) return undefined;
    return Array.isArray(error) ? error[0] : error;
  };

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
        onSubmit={handleSubmit}
        className="space-y-7 rounded-2xl border border-kyb-border bg-white p-5 md:p-8"
      >
        {BusinessVerificationMutation.isError && (
          <Notice error>
            {getApiErrorMessage(
              BusinessVerificationMutation.error,
              "Unable to submit your business details. Please try again.",
            )}
          </Notice>
        )}
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
                formatOptionLabel={(option) => (
                  <span className="flex items-center gap-2.5">
                    {option.value === "NG" && (
                      <Image
                        src="/images/kyb/registration-ng.png"
                        width={22}
                        height={15}
                        alt=""
                        className="rounded-[3px]"
                      />
                    )}
                    {option.label}
                  </span>
                )}
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
                      inputMode="numeric"
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
                The number on your CAC
              </p>
            </div>
            {field("business_name", "Business name")}
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
          {useManualAddress ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {field("street", "Street address")}
              {field("building_number", "Apartment / floor (optional)")}
              {field("city", "City")}
              {field("state", "State / region")}
              {field("zip_code", "Postcode (optional)")}
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
              <div className="sm:w-[calc(50%-8px)]">
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
      {BusinessVerificationMutation.isError && (
        <Notice error>
          {getApiErrorMessage(
            BusinessVerificationMutation.error,
            "Unable to submit your business details. Please try again.",
          )}
        </Notice>
      )}
      <div className="flex flex-col gap-3">
        <CenterModalHeader close={close} />
        <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
          Basic Business Verification
        </h2>
        <InputField
          label="Business Name"
          {...formik.getFieldProps("business_name")}
          status={fieldError("business_name")}
          errorMessage={fieldErrorMessage("business_name")}
        />
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
              label="ZIP / Postal Code"
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
