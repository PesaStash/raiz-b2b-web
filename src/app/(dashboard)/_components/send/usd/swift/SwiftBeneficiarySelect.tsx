"use client";

import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyList from "@/components/ui/EmptyList";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import {
  CreateSwiftBeneficiaryApi,
  GetSwiftBeneficiariesApi,
} from "@/services/transactions";
import useCountryStore from "@/store/useCountryStore";
import {
  ISwiftBeneficiary,
  ISwiftCreateBeneficiaryPayload,
  SwiftBeneficiaryType,
} from "@/types/services";
import { maskAccountNumber, truncateString } from "@/utils/helpers";
import { mapSwiftError } from "@/utils/swiftErrors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Formik, FormikProps } from "formik";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import SwiftBeneficiaryModal from "./SwiftBeneficiaryModal";
import SwiftInvoiceDropzone from "./SwiftInvoiceDropzone";

interface Props {
  onSelect: (beneficiary: ISwiftBeneficiary) => void;
  onBack: () => void;
  invoiceFile: File | null;
  onInvoiceChange: (file: File | null) => void;
}

interface FormValues {
  country: string;
  label: string;
  account_name: string;
  account_number_or_iban: string;
  swift_code: string;
  beneficiary_type: SwiftBeneficiaryType | "";
  bank_name: string;
  beneficiary_address: string;
  city: string;
  state: string;
  postal_code: string;
}

const initialValues: FormValues = {
  country: "",
  label: "",
  account_name: "",
  account_number_or_iban: "",
  swift_code: "",
  beneficiary_type: "",
  bank_name: "",
  beneficiary_address: "",
  city: "",
  state: "",
  postal_code: "",
};

const step1Schema = z.object({
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "Select a country"),
  label: z.string().trim().min(1, "Label is required").max(150),
  beneficiary_type: z.enum(["individual", "business"], {
    required_error: "Select a beneficiary type",
  }),
  account_name: z.string().trim().min(2, "Account name is required").max(255),
  account_number_or_iban: z
    .string()
    .trim()
    .min(4, "Account number or IBAN is required")
    .max(80),
});

const fullSchema = step1Schema.extend({
  swift_code: z
    .string()
    .trim()
    .refine(
      (value) =>
        /^[A-Za-z0-9]{8}$|^[A-Za-z0-9]{11}$/.test(value.replace(/\s/g, "")),
      { message: "SWIFT code must be 8 or 11 letters or numbers" },
    ),
  bank_name: z.string().trim().min(2, "Bank name is required").max(255),
  beneficiary_address: z
    .string()
    .trim()
    .min(2, "Address is required")
    .max(500),
  city: z.string().trim().min(1, "City is required").max(150),
  state: z.string().trim().min(1, "State is required").max(150),
  postal_code: z.string().trim().min(1, "Postal code is required").max(40),
});

const typeOptions = [
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
];

const STEP1_FIELDS: (keyof FormValues)[] = [
  "country",
  "label",
  "beneficiary_type",
  "account_name",
  "account_number_or_iban",
];

const SwiftBeneficiarySelect = ({
  onSelect,
  onBack,
  invoiceFile,
  onInvoiceChange,
}: Props) => {
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [showChooser, setShowChooser] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const qc = useQueryClient();
  const { countries, fetchCountries, loading: countriesLoading } =
    useCountryStore();

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const { data, isLoading } = useQuery({
    queryKey: ["swift-beneficiaries", 1],
    queryFn: () => GetSwiftBeneficiariesApi({ page: 1, limit: 50 }),
  });

  const beneficiaries = data?.beneficiaries ?? [];

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.country_code,
        label: country.country_name,
      })),
    [countries],
  );

  const createMutation = useMutation({
    mutationFn: (payload: ISwiftCreateBeneficiaryPayload) =>
      CreateSwiftBeneficiaryApi(payload),
  });

  const validateStep1 = async (formik: FormikProps<FormValues>) => {
    const touched = Object.fromEntries(
      STEP1_FIELDS.map((field) => [field, true]),
    );
    formik.setTouched({ ...formik.touched, ...touched }, false);
    const result = step1Schema.safeParse({
      country: formik.values.country,
      label: formik.values.label,
      beneficiary_type: formik.values.beneficiary_type,
      account_name: formik.values.account_name,
      account_number_or_iban: formik.values.account_number_or_iban,
    });
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          formik.setFieldError(field, issue.message);
        }
      });
      return false;
    }
    return true;
  };

  return (
    <div className="p-0 md:p-6 h-full flex flex-col overflow-y-auto no-scrollbar">
      <button type="button" onClick={onBack} className="mb-4 self-start">
        <Image src="/icons/arrow-left.svg" width={18} height={18} alt="back" />
      </button>
      <h2 className="text-raiz-gray-950 md:text-[22px] text-lg font-semibold leading-10 tracking-[-0.44px] mb-6">
        SWIFT
      </h2>

      <div className="bg-raiz-gray-50 md:p-6 p-3 rounded-[20px] flex-1">
        <div className="mb-11">
          <h5 className="text-raiz-gray-950 text-sm font-bold leading-[16.8px] mb-[15px]">
            {beneficiaries.length > 0 ? "Recent" : "Beneficiary"}
          </h5>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-raiz-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : beneficiaries.length > 0 ? (
            <div className="flex gap-2 overflow-x-scroll no-scrollbar">
              {beneficiaries.map((beneficiary) => (
                <button
                  key={beneficiary.swift_beneficiary_id}
                  type="button"
                  className="flex flex-col justify-center items-center gap-1 px-2 flex-shrink-0"
                  onClick={() => onSelect(beneficiary)}
                >
                  <Avatar src="" name={beneficiary.account_name} />
                  <p className="text-center text-raiz-gray-950 text-[13px] font-semibold leading-none w-[86px]">
                    {truncateString(beneficiary.account_name, 18)}
                  </p>
                  <p className="text-center text-raiz-gray-700 text-xs leading-[18px] w-[86px]">
                    {maskAccountNumber(beneficiary.account_number_or_iban)}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyList text="No beneficiary yet" />
          )}
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(fullSchema)}
          onSubmit={async (values, { setFieldError }) => {
            setSubmitError("");
            const payload: ISwiftCreateBeneficiaryPayload = {
              country: values.country.trim().toUpperCase(),
              label: values.label.trim(),
              account_name: values.account_name.trim(),
              account_number_or_iban: values.account_number_or_iban.trim(),
              swift_code: values.swift_code.replace(/\s/g, "").toUpperCase(),
              beneficiary_type: values.beneficiary_type as SwiftBeneficiaryType,
              bank_name: values.bank_name.trim(),
              beneficiary_address: values.beneficiary_address.trim(),
              city: values.city.trim(),
              state: values.state.trim(),
              postal_code: values.postal_code.trim(),
            };

            try {
              const beneficiary = await createMutation.mutateAsync(payload);
              qc.invalidateQueries({ queryKey: ["swift-beneficiaries"] });
              onSelect(beneficiary);
            } catch (error) {
              const mapped = mapSwiftError(
                error,
                "Unable to add SWIFT beneficiary. Please try again.",
              );
              Object.entries(mapped.fieldErrors).forEach(([field, message]) => {
                setFieldError(field, message);
              });
              if (Object.keys(mapped.fieldErrors).length === 0) {
                setSubmitError(mapped.message);
              }
              if (
                mapped.fieldErrors.country ||
                mapped.fieldErrors.label ||
                mapped.fieldErrors.beneficiary_type ||
                mapped.fieldErrors.account_name ||
                mapped.fieldErrors.account_number_or_iban
              ) {
                setFormStep(1);
              }
            }
          }}
        >
          {(formik) => {
            const {
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
              setFieldTouched,
              isSubmitting,
            } = formik;

            const selectedCountry =
              countryOptions.find((option) => option.value === values.country) ??
              null;
            const selectedType =
              typeOptions.find(
                (option) => option.value === values.beneficiary_type,
              ) ?? null;

            return (
              <Form className="flex flex-col gap-[15px]">
                <div className="flex justify-between w-full items-start">
                  <h4 className="text-zinc-900 text-sm font-bold leading-none">
                    Add Beneficiary
                  </h4>
                  {beneficiaries.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowChooser(true)}
                      className="text-indigo-900 text-[13px] font-bold leading-tight"
                    >
                      Choose Beneficiary
                    </button>
                  ) : null}
                </div>

                {formStep === 1 ? (
                  <>
                    <SelectField
                      label="Country"
                      name="country"
                      placeholder="Search country"
                      options={countryOptions}
                      value={selectedCountry}
                      isLoading={countriesLoading}
                      isSearchable
                      onChange={(option) => {
                        setFieldValue("country", option?.value ?? "", true);
                        setFieldTouched("country", true, false);
                      }}
                      status={touched.country && errors.country ? "error" : null}
                      helper={
                        touched.country && errors.country
                          ? String(errors.country)
                          : null
                      }
                    />
                    <InputField
                      label="Label / Nickname"
                      name="label"
                      value={values.label}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="School fees - UK"
                      errorMessage={touched.label && errors.label}
                      status={touched.label && errors.label ? "error" : null}
                    />
                    <SelectField
                      label="Beneficiary Type"
                      name="beneficiary_type"
                      placeholder="Individual"
                      options={typeOptions}
                      value={selectedType}
                      onChange={(option) => {
                        setFieldValue(
                          "beneficiary_type",
                          option?.value ?? "",
                          true,
                        );
                        setFieldTouched("beneficiary_type", true, false);
                      }}
                      status={
                        touched.beneficiary_type && errors.beneficiary_type
                          ? "error"
                          : null
                      }
                      helper={
                        touched.beneficiary_type && errors.beneficiary_type
                          ? String(errors.beneficiary_type)
                          : null
                      }
                    />
                    <InputField
                      label="Account Name"
                      name="account_name"
                      value={values.account_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter beneficiary name"
                      errorMessage={touched.account_name && errors.account_name}
                      status={
                        touched.account_name && errors.account_name
                          ? "error"
                          : null
                      }
                    />
                    <InputField
                      label="Account Number / IBAN"
                      name="account_number_or_iban"
                      value={values.account_number_or_iban}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter account number"
                      errorMessage={
                        touched.account_number_or_iban &&
                        errors.account_number_or_iban
                      }
                      status={
                        touched.account_number_or_iban &&
                        errors.account_number_or_iban
                          ? "error"
                          : null
                      }
                    />
                  </>
                ) : (
                  <>
                    <InputField
                      label="SWIFT Code"
                      name="swift_code"
                      value={values.swift_code}
                      onChange={handleChange}
                      onBlur={(event) => {
                        setFieldValue(
                          "swift_code",
                          event.target.value.replace(/\s/g, "").toUpperCase(),
                          false,
                        );
                        handleBlur(event);
                      }}
                      placeholder="8 or 11 characters"
                      errorMessage={touched.swift_code && errors.swift_code}
                      status={
                        touched.swift_code && errors.swift_code ? "error" : null
                      }
                    />
                    <InputField
                      label="Bank Name"
                      name="bank_name"
                      value={values.bank_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter bank name"
                      errorMessage={touched.bank_name && errors.bank_name}
                      status={
                        touched.bank_name && errors.bank_name ? "error" : null
                      }
                    />
                    <AddressAutocomplete
                      label="Beneficiary Address"
                      value={values.beneficiary_address}
                      onChange={(value) =>
                        setFieldValue("beneficiary_address", value, true)
                      }
                      onAddressSelect={(components) => {
                        setFieldValue(
                          "beneficiary_address",
                          components.address ||
                            [
                              components.building_number,
                              components.street,
                            ]
                              .filter(Boolean)
                              .join(" ") ||
                            values.beneficiary_address,
                          true,
                        );
                        setFieldValue(
                          "city",
                          components.city || values.city,
                          true,
                        );
                        setFieldValue(
                          "state",
                          components.state || values.state,
                          true,
                        );
                        setFieldValue(
                          "postal_code",
                          components.zip_code || values.postal_code,
                          true,
                        );
                        setFieldTouched("beneficiary_address", true, false);
                        setFieldTouched("city", true, false);
                        setFieldTouched("state", true, false);
                        setFieldTouched("postal_code", true, false);
                      }}
                      placeholder="Enter beneficiary address"
                      touched={!!touched.beneficiary_address}
                      error={
                        touched.beneficiary_address &&
                        errors.beneficiary_address
                      }
                      required
                    />
                    <InputField
                      label="City"
                      name="city"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter city"
                      errorMessage={touched.city && errors.city}
                      status={touched.city && errors.city ? "error" : null}
                    />
                    <InputField
                      label="State"
                      name="state"
                      value={values.state}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter state"
                      errorMessage={touched.state && errors.state}
                      status={touched.state && errors.state ? "error" : null}
                    />
                    <InputField
                      label="Postal Code"
                      name="postal_code"
                      value={values.postal_code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter postal code"
                      errorMessage={touched.postal_code && errors.postal_code}
                      status={
                        touched.postal_code && errors.postal_code
                          ? "error"
                          : null
                      }
                    />
                    <SwiftInvoiceDropzone
                      file={invoiceFile}
                      error={invoiceError}
                      onChange={onInvoiceChange}
                      onError={setInvoiceError}
                    />
                  </>
                )}

                {submitError ? (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-red-600 text-xs">{submitError}</p>
                  </div>
                ) : null}

                <div className="pt-4 flex flex-col gap-2">
                  <p className="text-raiz-gray-500 text-sm">
                    {formStep === 1
                      ? "Step 1 of 2 · Beneficiary details"
                      : "Step 2 of 2 · Bank details"}
                  </p>
                  {formStep === 1 ? (
                    <Button
                      type="button"
                      onClick={async () => {
                        const ok = await validateStep1(formik);
                        if (ok) setFormStep(2);
                      }}
                    >
                      Continue
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        loading={isSubmitting || createMutation.isPending}
                      >
                        Continue
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setFormStep(1)}
                      >
                        Back
                      </Button>
                    </>
                  )}
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>

      {showChooser ? (
        <SwiftBeneficiaryModal
          close={() => setShowChooser(false)}
          beneficiaries={beneficiaries}
          onSelect={onSelect}
        />
      ) : null}
    </div>
  );
};

export default SwiftBeneficiarySelect;
