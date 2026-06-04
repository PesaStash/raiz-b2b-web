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
import { sanitizeAddressField } from "@/utils/helpers";

const nigerianRegNumberRegex = /^(RC|BN|IT|LP)?[\s-]*\d{4,9}$/i;

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
  fieldErrors: Record<string, string[] | undefined>
): Partial<Record<keyof BusinessFormValues, string>> =>
  Object.fromEntries(
    Object.entries(fieldErrors)
      .filter((entry): entry is [string, string[]] => !!entry[1]?.length)
      .map(([key, messages]) => [key, messages[0]])
  ) as Partial<Record<keyof BusinessFormValues, string>>;

const BusinessVerificationModal = ({ close }: { close: () => void }) => {
  const [useManualAddress, setUseManualAddress] = useState(false);
  const { countries, fetchCountries, loading: countriesLoading } =
    useCountryStore();
  const { user } = useUser();

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.country_code,
        label: country.country_name,
      })),
    [countries]
  );

  const isNigerian =
    user?.business_account?.entity?.country?.country_name?.toLowerCase() ===
    "nigeria";
  const qc = useQueryClient();
  const BusinessVerificationMutation = useMutation({
    mutationFn: (payload: IBusinessVerificationPayload) =>
      BusinessVerificationApi(payload),
    onSuccess: () => {
      toast.success(
        "Account registration successful. You'll receive an email from our banking partner regarding the next step for your onboarding"
      );
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["KYB-links"] });
      close();
    },
  });

  const getEffectiveSchema = () =>
    BusinessSchema.refine(
      (data) => {
        if (!isNigerian) return true;

        return nigerianRegNumberRegex.test(
          data.business_registration_number?.toUpperCase()
        );
      },
      {
        message:
          "Invalid Nigerian business registration number. Must start with RC, BN, IT, or LP and contain 4–9 digits.",
        path: ["business_registration_number"],
      }
    );

  const formik = useFormik<BusinessFormValues>({
    initialValues: {
      business_registration_number: "",
      business_name: "",
      business_email: "",
      country_code: "",
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
        (option) => option.value === formik.values.country_code
      ) ?? null,
    [countryOptions, formik.values.country_code]
  );

  const hasRequiredAddress =
    !!formik.values.city &&
    !!formik.values.state &&
    !!formik.values.street &&
    !!formik.values.country_code;

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

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex flex-col gap-4 min-h-0"
    >
      <div className="flex flex-col gap-3">
        <h2 className="text-raiz-gray-950 font-bold text-lg md:text-xl my-1 md:my-2">
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
            const code =
              option?.value != null ? String(option.value) : "";
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
