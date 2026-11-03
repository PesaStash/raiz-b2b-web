"use client";

import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import {
  CreateForeignBeneficiaryApi,
  FetchForeignBeneficiariesApi,
} from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import useCountryStore from "@/store/useCountryStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import {
  ForeignCurrency,
  IForeignBeneficiariesParams,
  IForeignBeneficiaryPayload,
} from "@/types/services";
import { getApiErrorMessage } from "@/utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Formik, FormikHelpers } from "formik";
import React, { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import ForeignBeneficiaryList from "./ForeignBeneficiaryList";

interface Props {
  close: () => void;
  goNext: () => void;
  hideHeader?: boolean;
}

interface FormValues {
  label: string;
  bank_name: string;
  account_owner_name: string;
  account_number: string;
  sort_code: string;
  iban: string;
  bic: string;
  country: string;
  street_line_1: string;
  city: string;
  state: string;
  postal_code: string;
  first_name: string;
  last_name: string;
}

const getValidationSchema = (currency: ForeignCurrency) =>
  z.object({
    label: z.string().min(1, "Label is required"),
    bank_name: z.string().min(1, "Bank name is required"),
    account_owner_name: z.string().min(1, "Account owner name is required"),
    account_number:
      currency === "GBP"
        ? z.string().min(6, "Account number is required")
        : z.string().optional(),
    sort_code:
      currency === "GBP"
        ? z
            .string()
            .regex(/^\d{6}$/, "Sort code must be exactly 6 digits")
        : z.string().optional(),
    iban:
      currency === "EUR"
        ? z.string().min(10, "IBAN is required")
        : z.string().optional(),
    bic: z.string().optional(),
    country:
      currency === "EUR"
        ? z.string().min(1, "Country is required")
        : z.string().optional(),
    street_line_1:
      currency === "EUR"
        ? z.string().min(1, "Street line 1 is required")
        : z.string().optional(),
    city:
      currency === "EUR"
        ? z.string().min(1, "City is required")
        : z.string().optional(),
    state: z.string().optional(),
    postal_code:
      currency === "EUR"
        ? z.string().min(1, "Postal code is required")
        : z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
  });

const initialValues: FormValues = {
  label: "",
  bank_name: "",
  account_owner_name: "",
  account_number: "",
  sort_code: "",
  iban: "",
  bic: "",
  country: "",
  street_line_1: "",
  city: "",
  state: "",
  postal_code: "",
  first_name: "",
  last_name: "",
};

const ForeignBeneficiaryForm = ({ close, goNext, hideHeader }: Props) => {
  const qc = useQueryClient();
  const { actions } = useSendStore();
  const { selectedCurrency } = useCurrencyStore();
  const { countries, fetchCountries, loading: countriesLoading } =
    useCountryStore();
  const currency = selectedCurrency.name as ForeignCurrency;
  const queryParams: IForeignBeneficiariesParams = { page: 1, limit: 50 };

  useEffect(() => {
    if (currency === "EUR") {
      fetchCountries();
    }
  }, [currency, fetchCountries]);

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.country_code,
        label: country.country_name,
      })),
    [countries],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["foreign-beneficiaries", currency, queryParams],
    queryFn: ({ queryKey }) => {
      const [, selectedCurrencyCode, params] = queryKey as [
        string,
        ForeignCurrency,
        IForeignBeneficiariesParams,
      ];
      return FetchForeignBeneficiariesApi(selectedCurrencyCode, params);
    },
    enabled: currency === "GBP" || currency === "EUR",
  });

  const beneficiaries = data?.beneficiaries || [];

  const addBeneficiaryMutation = useMutation({
    mutationFn: ({
      label,
      data,
    }: {
      label: string;
      data: IForeignBeneficiaryPayload;
    }) => CreateForeignBeneficiaryApi({ currency, label, data }),
  });

  const handleSelectBeneficiary = (beneficiary: (typeof beneficiaries)[number]) => {
    actions.selectForeignBeneficiary(beneficiary);
    goNext();
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>,
  ) => {
    try {
      const payload: IForeignBeneficiaryPayload =
        currency === "GBP"
          ? {
              bank_name: values.bank_name,
              account_owner_name: values.account_owner_name,
              account_number: values.account_number,
              sort_code: values.sort_code,
              first_name: values.first_name || undefined,
              last_name: values.last_name || undefined,
            }
          : {
              bank_name: values.bank_name,
              account_owner_name: values.account_owner_name,
              iban: values.iban,
              bic: values.bic || undefined,
              country: values.country.toUpperCase(),
              street_line_1: values.street_line_1,
              city: values.city,
              state: values.state || undefined,
              postal_code: values.postal_code,
              first_name: values.first_name || undefined,
              last_name: values.last_name || undefined,
            };

      await addBeneficiaryMutation.mutateAsync({
        label: values.label,
        data: payload,
      });

      toast.success("Beneficiary added successfully");
      await qc.invalidateQueries({ queryKey: ["foreign-beneficiaries", currency] });

      const refreshed = await FetchForeignBeneficiariesApi(currency, queryParams);
      const createdBeneficiary =
        refreshed.beneficiaries.find((beneficiary) => {
          const details = beneficiary.foreign_currency_beneficiary;

          if (currency === "GBP") {
            return (
              beneficiary.label === values.label &&
              details.account_number === values.account_number
            );
          }

          return beneficiary.label === values.label && details.iban === values.iban;
        }) || refreshed.beneficiaries[0];

      if (createdBeneficiary) {
        actions.selectForeignBeneficiary(createdBeneficiary);
        goNext();
      }

      resetForm();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to add beneficiary. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {!hideHeader && <CenterModalHeader close={close} />}
      <h2 className="md:text-xl text-base font-bold text-raiz-gray-950 md:mb-10 mb-6">
        {currency} Beneficiary
      </h2>

      <div className="flex-1 flex flex-col justify-between gap-4 h-[65vh] xl:h-[70vh]">
        <Formik
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(getValidationSchema(currency))}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
            setFieldTouched,
            isSubmitting,
            isValid,
            dirty,
          }) => {
            const selectedCountry =
              countryOptions.find((option) => option.value === values.country) ??
              null;

            return (
            <Form className="flex flex-col gap-4 h-full">
              <div className="bg-raiz-gray-50 md:p-6 p-0 overflow-y-auto md:rounded-[20px] flex-1">
                <div className="mb-11">
                  <h5 className="text-raiz-gray-950 text-sm font-bold leading-[16.80px] mb-[15px]">
                    Beneficiary
                  </h5>
                  {isLoading ? (
                    <div>Loading beneficiaries...</div>
                  ) : (
                    <ForeignBeneficiaryList
                      beneficiaries={beneficiaries}
                      onSelect={handleSelectBeneficiary}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-[15px]">
                  <InputField
                    label="Label/Nickname"
                    name="label"
                    value={values.label}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={touched.label && errors.label}
                    status={touched.label && errors.label ? "error" : null}
                  />
                  <InputField
                    label="Bank Name"
                    name="bank_name"
                    value={values.bank_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={touched.bank_name && errors.bank_name}
                    status={touched.bank_name && errors.bank_name ? "error" : null}
                  />
                  <InputField
                    label="Account Owner Name"
                    name="account_owner_name"
                    value={values.account_owner_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={
                      touched.account_owner_name && errors.account_owner_name
                    }
                    status={
                      touched.account_owner_name && errors.account_owner_name
                        ? "error"
                        : null
                    }
                  />

                  {currency === "GBP" ? (
                    <>
                      <InputField
                        label="Account Number"
                        name="account_number"
                        value={values.account_number}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={touched.account_number && errors.account_number}
                        status={
                          touched.account_number && errors.account_number
                            ? "error"
                            : null
                        }
                      />
                      <InputField
                        label="Sort Code"
                        name="sort_code"
                        value={values.sort_code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={touched.sort_code && errors.sort_code}
                        status={touched.sort_code && errors.sort_code ? "error" : null}
                      />
                    </>
                  ) : (
                    <>
                      <InputField
                        label="IBAN"
                        name="iban"
                        value={values.iban}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={touched.iban && errors.iban}
                        status={touched.iban && errors.iban ? "error" : null}
                      />
                      <InputField
                        label="BIC (Optional)"
                        name="bic"
                        value={values.bic}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={touched.bic && errors.bic}
                        status={touched.bic && errors.bic ? "error" : null}
                      />
                      <SelectField
                        label="Country"
                        name="country"
                        placeholder="Select country"
                        options={countryOptions}
                        value={selectedCountry}
                        isLoading={countriesLoading}
                        onChange={(option) => {
                          const code =
                            option?.value != null ? String(option.value) : "";
                          setFieldValue("country", code, true);
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
                        label="Street Line 1"
                        name="street_line_1"
                        value={values.street_line_1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={touched.street_line_1 && errors.street_line_1}
                        status={
                          touched.street_line_1 && errors.street_line_1
                            ? "error"
                            : null
                        }
                      />
                      <InputField
                        label="City"
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={touched.city && errors.city}
                        status={touched.city && errors.city ? "error" : null}
                      />
                      <InputField
                        label="State (Optional)"
                        name="state"
                        value={values.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={touched.state && errors.state}
                        status={touched.state && errors.state ? "error" : null}
                      />
                      <InputField
                        label="Postal Code"
                        name="postal_code"
                        value={values.postal_code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={touched.postal_code && errors.postal_code}
                        status={
                          touched.postal_code && errors.postal_code ? "error" : null
                        }
                      />
                    </>
                  )}

                  <InputField
                    label="First Name (Optional)"
                    name="first_name"
                    value={values.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={touched.first_name && errors.first_name}
                    status={touched.first_name && errors.first_name ? "error" : null}
                  />
                  <InputField
                    label="Last Name (Optional)"
                    name="last_name"
                    value={values.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={touched.last_name && errors.last_name}
                    status={touched.last_name && errors.last_name ? "error" : null}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isValid || !dirty || isSubmitting}
                loading={isSubmitting || addBeneficiaryMutation.isPending}
              >
                Add Beneficiary
              </Button>
            </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default ForeignBeneficiaryForm;
