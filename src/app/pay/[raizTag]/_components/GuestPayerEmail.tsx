"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { useMutation, useQuery } from "@tanstack/react-query";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import { useGuestSendStore } from "@/store/GuestSend";
import {
  GetAfricaPayinCountriesApi,
  GetRaizPaymentsPayerReadinessApi,
  RequestRaizPaymentsPayerEmailOtpApi,
} from "@/services/business";
import {
  filterAfricaPayinCountries,
  getAfricaCountryFlagUrl,
  mapAfricaPayinError,
} from "./africaPayinUtils";
import { toast } from "sonner";
import GuestSelectCurrency from "./GuestSelectCurrency";
import { IIntCountry } from "@/constants/send";
import { IntCountryType, IntCurrencyCode } from "@/types/services";

interface Props {
  goBack: () => void;
  onNeedRegister: () => void;
  onNeedVerify: () => void;
  onVerified: () => void;
}

const GuestPayerEmail = ({
  goBack,
  onNeedRegister,
  onNeedVerify,
  onVerified,
}: Props) => {
  const { payer_email, guestLocalCurrency, actions } = useGuestSendStore();
  const [formError, setFormError] = useState<string | null>(null);
  const [showCurrency, setShowCurrency] = useState(false);

  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ["afican-payin-countries"],
    queryFn: GetAfricaPayinCountriesApi,
  });

  const countriesArr: IIntCountry[] = useMemo(
    () =>
      filterAfricaPayinCountries(countries).map((each) => ({
        name: each.country_name,
        value: each.country_code as IntCountryType,
        currency: each.currency as IntCurrencyCode,
        logo: getAfricaCountryFlagUrl(each.country_code),
      })),
    [countries],
  );

  const selectedCurrency = useMemo(() => {
    if (!guestLocalCurrency) return null;
    return (
      countriesArr.find((item) => item.value === guestLocalCurrency.value) ||
      guestLocalCurrency
    );
  }, [countriesArr, guestLocalCurrency]);

  const clearChannelSelection = () => {
    actions.setFields({
      channel_id: "",
      channel_name: "",
      network_id: "",
      network_name: "",
      account_type: "",
      guestAccount: "",
      min: 1,
      max: 20000,
    });
  };

  const requestOtpMutation = useMutation({
    mutationFn: (email: string) => RequestRaizPaymentsPayerEmailOtpApi(email),
    onSuccess: () => {
      toast.success("OTP sent to your email");
      onNeedVerify();
    },
    onError: (error) => {
      const mapped = mapAfricaPayinError(error);
      setFormError(mapped.message);
      toast.error(mapped.message);
    },
  });

  const readinessMutation = useMutation({
    mutationFn: (email: string) => GetRaizPaymentsPayerReadinessApi(email),
    onSuccess: (res, email) => {
      actions.setFields({
        payer_email: email,
        payer_exists: !!res.exists,
        payer_email_verified: !!res.email_verified,
        payer_id: res.payer_id || "",
        payer_first_name: res.first_name || "",
        payer_last_name: res.last_name || "",
        payer_country_code: res.country_code || "",
        sender_name:
          res.first_name && res.last_name
            ? `${res.first_name} ${res.last_name}`.trim()
            : "",
      });

      if (!res.exists) {
        onNeedRegister();
        return;
      }
      if (!res.email_verified) {
        requestOtpMutation.mutate(email);
        return;
      }
      onVerified();
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
      country_code: guestLocalCurrency?.value || "",
    },
    validationSchema: toFormikValidationSchema(
      z.object({
        email: z
          .string({ required_error: "Email is required" })
          .email("Enter a valid email"),
        country_code: z
          .string({ required_error: "Select a country" })
          .min(2, "Select a country"),
      }),
    ),
    onSubmit: (values) => {
      setFormError(null);
      if (!guestLocalCurrency) {
        setFormError("Select a country to continue.");
        return;
      }
      readinessMutation.mutate(values.email.trim().toLowerCase());
    },
  });

  const isLoading = readinessMutation.isPending || requestOtpMutation.isPending;

  return (
    <section className="flex flex-col h-full">
      <div>
        <header className="flex items-center justify-between">
          <h2 className="text-raiz-gray-950 mt-7 md:mt-0 text-xl md:text-[23px] font-bold md:font-semibold leading-tight md:leading-10">
            <span className="md:hidden">Verify your Email</span>
            <span className="hidden md:inline">Pay Locally</span>
          </h2>
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
        <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug mt-1">
          <span className="md:hidden">
            Enter your email and select your country
          </span>
          <span className="hidden md:inline">
            Send money using your local payment method
          </span>
        </p>
      </div>
      <form
        className="flex flex-col justify-between gap-3 h-full mt-3 md:mt-5"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-[15px]">
          <InputField
            placeholder="payer@example.com"
            label="Email Address"
            type="email"
            {...formik.getFieldProps("email")}
            status={
              formik.touched.email && formik.errors.email ? "error" : null
            }
            errorMessage={formik.touched.email && formik.errors.email}
          />

          <div>
            <p className="text-zinc-900 text-sm font-medium mb-3 font-brSonoma leading-normal">
              Your Currency
            </p>
            <button
              type="button"
              onClick={() => setShowCurrency(true)}
              className="flex justify-between items-center p-3.5 bg-gray-100 rounded-xl w-full"
            >
              <div className="flex gap-2 items-center min-w-0">
                <Image
                  src={selectedCurrency?.logo ?? "/icons/website.svg"}
                  width={24}
                  height={24}
                  alt=""
                  className="rounded-full object-cover"
                  unoptimized={!!selectedCurrency?.logo}
                />
                <span className="text-zinc-900 text-[13px] md:text-sm font-normal leading-tight truncate">
                  {selectedCurrency
                    ? `${selectedCurrency.name} (${selectedCurrency.currency})`
                    : countriesLoading
                      ? "Loading countries..."
                      : "Select currency"}
                </span>
              </div>
              <Image
                src="/icons/arrow-down.svg"
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
            </button>
            {formik.touched.country_code && formik.errors.country_code && (
              <p className="mt-1.5 text-xs text-red-500">
                {formik.errors.country_code}
              </p>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-600 leading-snug">{formError}</p>
          )}
        </div>
        <Button disabled={isLoading} loading={isLoading} type="submit">
          <span className="md:hidden">Continue to amount</span>
          <span className="hidden md:inline">Continue</span>
        </Button>
      </form>

      {showCurrency && (
        <GuestSelectCurrency
          close={() => setShowCurrency(false)}
          onSelect={(currency) => {
            clearChannelSelection();
            formik.setFieldValue("country_code", currency.value);
            formik.setFieldTouched("country_code", true, false);
          }}
        />
      )}
    </section>
  );
};

export default GuestPayerEmail;
