"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useMutation, useQuery } from "@tanstack/react-query";
import InputField from "@/components/ui/InputField";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import Button from "@/components/ui/Button";
import SelectField from "@/components/ui/SelectField";
import PhoneNumberInput from "@/components/ui/PhoneNumberInput";
import { useGuestSendStore } from "@/store/GuestSend";
import {
  GetAfricaPayinCountriesApi,
  RegisterRaizPaymentsPayerApi,
  RequestRaizPaymentsPayerEmailOtpApi,
} from "@/services/business";
import {
  AFRICA_UNSUPPORTED_COUNTRY_CODES,
  filterAfricaPayinCountries,
  mapAfricaPayinError,
} from "./africaPayinUtils";
import { toast } from "sonner";
import { RaizPaymentsPayerRegisterPayload } from "@/types/services";
import { Country } from "react-phone-number-input";

interface Props {
  goBack: () => void;
  goNext: () => void;
  onVerified?: () => void;
}

const ID_TYPES = [
  { label: "Passport", value: "passport" },
  { label: "National ID", value: "national_id" },
  { label: "Driver license", value: "license" },
];

const GuestPayerRegister = ({ goBack, goNext, onVerified }: Props) => {
  const {
    payer_email,
    payer_first_name,
    payer_last_name,
    payer_country_code,
    guestLocalCurrency,
    actions,
  } = useGuestSendStore();
  const [formError, setFormError] = useState<string | null>(null);

  const { data: countries = [] } = useQuery({
    queryKey: ["afican-payin-countries"],
    queryFn: GetAfricaPayinCountriesApi,
  });

  const countryOptions = useMemo(
    () =>
      filterAfricaPayinCountries(countries).map((country) => ({
        label: country.country_name,
        value: country.country_code,
      })),
    [countries],
  );

  const requestOtpMutation = useMutation({
    mutationFn: (email: string) => RequestRaizPaymentsPayerEmailOtpApi(email),
    onSuccess: () => {
      toast.success("OTP sent to your email");
      goNext();
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      setFormError(mapped.message);
      toast.error(mapped.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RaizPaymentsPayerRegisterPayload) =>
      RegisterRaizPaymentsPayerApi(payload),
    onSuccess: (res) => {
      actions.setFields({
        payer_id: res.payer_id,
        payer_email: res.email,
        payer_first_name: res.first_name,
        payer_last_name: res.last_name,
        payer_country_code: res.country_code,
        payer_email_verified: !!res.email_verified,
        payer_exists: true,
        sender_name: `${res.first_name} ${res.last_name}`.trim(),
      });
      if (res.email_verified) {
        if (onVerified) {
          onVerified();
          return;
        }
        goNext();
        return;
      }
      requestOtpMutation.mutate(res.email);
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      setFormError(mapped.message);
      toast.error(mapped.message);
    },
  });

  const formik = useFormik({
    initialValues: {
      email: payer_email || "",
      first_name: payer_first_name || "",
      last_name: payer_last_name || "",
      phone_number: "",
      country_code:
        payer_country_code ||
        guestLocalCurrency?.value ||
        "",
      address: "",
      dob: "",
      id_type: "passport",
      id_number: "",
    },
    validationSchema: toFormikValidationSchema(
      z.object({
        email: z.string().email("Enter a valid email"),
        first_name: z
          .string()
          .trim()
          .min(2, "First name must be at least 2 characters")
          .max(75, "First name must be at most 75 characters"),
        last_name: z
          .string()
          .trim()
          .min(2, "Last name must be at least 2 characters")
          .max(75, "Last name must be at most 75 characters"),
        phone_number: z
          .string()
          .min(1, "Phone number is required")
          .regex(/^\+?\d+$/, "Enter a valid phone number"),
        country_code: z
          .string()
          .length(2, "Select a country")
          .refine(
            (value) =>
              !AFRICA_UNSUPPORTED_COUNTRY_CODES.has(value.toUpperCase()),
            "This country is not available for this payment method",
          ),
        address: z.string().trim().min(5, "Enter a full residential address"),
        dob: z
          .string()
          .regex(
            /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/,
            "Use MM/DD/YYYY",
          ),
        id_type: z.string().min(1, "Select an ID type"),
        id_number: z.string().trim().min(3, "Enter a valid ID number"),
      }),
    ),
    onSubmit: (values) => {
      setFormError(null);
      registerMutation.mutate({
        email: values.email.trim().toLowerCase(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone_number: values.phone_number.trim(),
        country_code: values.country_code.toUpperCase(),
        address: values.address.trim(),
        dob: values.dob.trim(),
        id_type: values.id_type,
        id_number: values.id_number.trim(),
      });
    },
  });

  return (
    <section className="flex flex-col h-full px-4">
      <div className="mt-4">
        <button type="button" onClick={goBack}>
          <Image
            className="w-3 h-3 md:w-[18px] md:h-[18px]"
            src={"/icons/arrow-left.svg"}
            width={18.48}
            height={18.48}
            alt="back"
          />
        </button>
        <header className="flex items-center justify-between">
          <h2 className="text-raiz-gray-950 text-lg md:text-[23px] font-semibold leading-10">
            Payer details
          </h2>
        </header>
        <p className="text-raiz-gray-700 text-[13px] md:text-[15px] font-normal leading-snug">
          Provide your information to continue. You will only this once.
        </p>
      </div>
      <form
        className="flex flex-col justify-between gap-3 h-full mt-3 md:mt-5 overflow-y-auto"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-[15px] pb-4">
          <InputField
            label="Email"
            type="email"
            {...formik.getFieldProps("email")}
            status={
              formik.touched.email && formik.errors.email ? "error" : null
            }
            errorMessage={formik.touched.email && formik.errors.email}
          />
          <InputField
            label="First name"
            {...formik.getFieldProps("first_name")}
            status={
              formik.touched.first_name && formik.errors.first_name
                ? "error"
                : null
            }
            errorMessage={formik.touched.first_name && formik.errors.first_name}
          />
          <InputField
            label="Last name"
            {...formik.getFieldProps("last_name")}
            status={
              formik.touched.last_name && formik.errors.last_name ? "error" : null
            }
            errorMessage={formik.touched.last_name && formik.errors.last_name}
          />
          <PhoneNumberInput
            defaultCountry={(formik.values.country_code || "KE") as Country}
            label="Phone number"
            value={formik.values.phone_number}
            onChange={(value) =>
              formik.setFieldValue("phone_number", value || "")
            }
            error={formik.errors.phone_number}
            touched={formik.touched.phone_number}
          />
          <SelectField
            label="Country"
            name="country_code"
            placeholder="Select country"
            options={countryOptions}
            value={
              formik.values.country_code
                ? countryOptions.find(
                    (option) => option.value === formik.values.country_code,
                  ) || null
                : null
            }
            onChange={(option) =>
              formik.setFieldValue("country_code", option?.value || "")
            }
            height="auto"
          />
          <AddressAutocomplete
            label="Residential address"
            value={formik.values.address}
            onChange={(value) => formik.setFieldValue("address", value)}
            onAddressSelect={(components) => {
              formik.setFieldValue(
                "address",
                components.address ?? formik.values.address,
              );
              formik.setFieldTouched("address", true, false);
            }}
            placeholder="Start typing address..."
            touched={formik.touched.address}
            error={formik.errors.address}
            required
          />
          <InputField
            label="Date of birth"
            placeholder="MM/DD/YYYY"
            {...formik.getFieldProps("dob")}
            status={formik.touched.dob && formik.errors.dob ? "error" : null}
            errorMessage={formik.touched.dob && formik.errors.dob}
          />
          <SelectField
            label="ID type"
            name="id_type"
            options={ID_TYPES}
            value={
              ID_TYPES.find((option) => option.value === formik.values.id_type) ||
              null
            }
            onChange={(option) =>
              formik.setFieldValue("id_type", option?.value || "")
            }
            height="auto"
          />
          <InputField
            label="ID number"
            {...formik.getFieldProps("id_number")}
            status={
              formik.touched.id_number && formik.errors.id_number
                ? "error"
                : null
            }
            errorMessage={formik.touched.id_number && formik.errors.id_number}
          />
          {formError && (
            <p className="text-sm text-red-600 leading-snug">{formError}</p>
          )}
        </div>
        <Button
          disabled={registerMutation.isPending || requestOtpMutation.isPending}
          loading={registerMutation.isPending || requestOtpMutation.isPending}
          type="submit"
        >
          Continue
        </Button>
      </form>
    </section>
  );
};

export default GuestPayerRegister;
