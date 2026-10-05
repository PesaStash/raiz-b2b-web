"use client";
import React, { useMemo, useState } from "react";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useMutation, useQuery } from "@tanstack/react-query";
import InputField from "@/components/ui/InputField";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import PayStepActions from "./PayStepActions";
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
  { label: "National Identity Card", value: "national_id" },
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
          .min(1, "Enter your date of birth")
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
          .refine((value) => {
            const date = new Date(`${value}T00:00:00`);
            if (Number.isNaN(date.getTime())) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date <= today;
          }, "Date of birth cannot be in the future"),
        id_type: z.string().min(1, "Select an ID type"),
        id_number: z.string().trim().min(3, "Enter a valid ID number"),
      }),
    ),
    onSubmit: (values) => {
      setFormError(null);
      const [year, month, day] = values.dob.split("-");
      registerMutation.mutate({
        email: values.email.trim().toLowerCase(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone_number: values.phone_number.trim(),
        country_code: values.country_code.toUpperCase(),
        address: values.address.trim(),
        dob: `${month}/${day}/${year}`,
        id_type: values.id_type,
        id_number: values.id_number.trim(),
      });
    },
  });

  return (
    <section className="flex flex-col h-full px-0 md:px-4">
      <div className="mt-2 md:mt-4">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-raiz-gray-950 text-xl md:text-[23px] font-bold md:font-semibold leading-tight md:leading-10">
              Your Information
            </h2>
            <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
              <span className="md:hidden">
                Provide identity verification details
              </span>
              <span className="hidden md:inline">
                Provide identity verification details for smooth transfer
                routing.
              </span>
            </p>
          </div>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="hidden md:block shrink-0"
          >
            <rect
              width="48"
              height="48"
              rx="16"
              fill="#EAECFF"
              fillOpacity="0.4"
            />
            <path
              d="M34.084 16.376C33.872 15.147 32.906 14.119 31.688 13.849C30.385 13.56 29.199 14.086 28.489 15H24V33H30C31.657 33 33 31.657 33 30V19.33C33.814 18.643 34.289 17.567 34.084 16.376Z"
              fill="#F2ED9F"
            />
            <path
              d="M31 12C28.239 12 26 14.239 26 17C26 18.977 28.001 21.704 29.471 23.441C30.27 24.385 31.73 24.385 32.529 23.441C33.999 21.704 36 18.977 36 17C36 14.239 33.761 12 31 12ZM31 19.143C29.817 19.143 28.857 18.184 28.857 17C28.857 15.816 29.817 14.857 31 14.857C32.183 14.857 33.143 15.817 33.143 17C33.143 18.183 32.183 19.143 31 19.143Z"
              fill="#EDB637"
            />
            <path
              d="M18.697 13.786L16.459 15.126C15.554 15.668 15 16.645 15 17.7V31.106C15 32.38 16.39 33.167 17.482 32.512L18.696 31.785C19.098 31.544 19.547 31.415 20 31.395V13.397C19.547 13.417 19.098 13.546 18.697 13.786Z"
              fill="#F2ED9F"
            />
            <path
              d="M21.359 13.6829C20.931 13.4699 20.463 13.3759 20 13.3969V31.3949C20.464 31.3749 20.932 31.4689 21.36 31.6829L24 32.9999V14.9999L21.359 13.6829Z"
              fill="#EDB637"
            />
          </svg>
        </header>
      </div>
      <form
        className="flex flex-col justify-between gap-2 h-full mt-3 md:mt-5 overflow-y-auto"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-[15px] pb-4">
          <div className="grid grid-cols-2 gap-3 md:gap-[15px]">
            <InputField
              label="First Name"
              {...formik.getFieldProps("first_name")}
              status={
                formik.touched.first_name && formik.errors.first_name
                  ? "error"
                  : null
              }
              errorMessage={
                formik.touched.first_name && formik.errors.first_name
              }
            />
            <InputField
              label="Last Name"
              {...formik.getFieldProps("last_name")}
              status={
                formik.touched.last_name && formik.errors.last_name
                  ? "error"
                  : null
              }
              errorMessage={formik.touched.last_name && formik.errors.last_name}
            />
          </div>
          <AddressAutocomplete
            label="Full Address"
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
          <SelectField
            label="ID Type"
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
            label="ID Number"
            {...formik.getFieldProps("id_number")}
            status={
              formik.touched.id_number && formik.errors.id_number
                ? "error"
                : null
            }
            errorMessage={formik.touched.id_number && formik.errors.id_number}
          />
          <InputField
            label="Email"
            type="email"
            {...formik.getFieldProps("email")}
            status={
              formik.touched.email && formik.errors.email ? "error" : null
            }
            errorMessage={formik.touched.email && formik.errors.email}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
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
            <InputField
              label="Date of birth"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              min="1900-01-01"
              {...formik.getFieldProps("dob")}
              status={formik.touched.dob && formik.errors.dob ? "error" : null}
              errorMessage={formik.touched.dob && formik.errors.dob}
            />
          </div>
          {formError && (
            <p className="text-sm text-red-600 leading-snug">{formError}</p>
          )}
        </div>
        <PayStepActions
          onBack={goBack}
          continueType="submit"
          continueLabel="Continue to description"
          continueDisabled={
            registerMutation.isPending || requestOtpMutation.isPending
          }
          continueLoading={
            registerMutation.isPending || requestOtpMutation.isPending
          }
        />
      </form>
    </section>
  );
};

export default GuestPayerRegister;
