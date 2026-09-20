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

  const isLoading =
    readinessMutation.isPending || requestOtpMutation.isPending;

  return (
    <section className="flex flex-col h-full px-4">
      <div className="mt-4">
        
        <header className="flex items-center justify-between">
          <h2 className="text-raiz-gray-950 text-lg md:text-[23px] font-semibold leading-10">
            Verify your email
          </h2>
        </header>
        <p className="text-raiz-gray-700 text-[13px] md:text-[15px] font-normal leading-snug">
          Enter your email and select your country to continue.
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
            label="Email"
            type="email"
            {...formik.getFieldProps("email")}
            status={
              formik.touched.email && formik.errors.email ? "error" : null
            }
            errorMessage={formik.touched.email && formik.errors.email}
          />

          <div>
            <p className="text-zinc-900 text-sm font-medium mb-3 font-brSonoma leading-normal">
              Your currency
            </p>
            <div className="flex justify-between items-center p-3.5 bg-gray-100 rounded-xl">
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
              <button
                type="button"
                onClick={() => setShowCurrency(true)}
                className="px-1.5 py-1 bg-zinc-200 rounded-lg text-zinc-700 text-xs font-medium font-brSonoma leading-tight shrink-0"
              >
                {selectedCurrency ? "Change" : "Select"}
              </button>
            </div>
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
          Continue
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
