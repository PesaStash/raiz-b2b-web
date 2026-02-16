"use client";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import InputField from "@/components/ui/InputField";
import { useGuestSendStore } from "@/store/GuestSend";
import { FormikProps } from "formik";
import React, { useEffect, useRef, useState } from "react";
import z from "zod";
import Image from "next/image";
import GuestSelectCurrency from "./_components/GuestSelectCurrency";
import { getCurrencySymbol } from "@/utils/helpers";
import {
  IBusinessPaymentData,
  IntCountryType,
  IntCurrencyCode,
} from "@/types/services";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import CardDetails from "./_components/CardDetails";
import { loadStripe } from "@stripe/stripe-js";
import useCountryStore from "@/store/useCountryStore";
import { IIntCountry } from "@/constants/send";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY || ""
);

interface Props {
  goNext: (formValues: formCardValues) => void;
  data: IBusinessPaymentData;
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikProps<any>;
  amountFromLink?: string;
}

export type formCardValues = {
  firstName: string;
  lastName: string;
  email: string;
  purpose: string;
};

const GuestCardPayForm = ({ formik, goNext, loading }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { amount, actions, guestLocalCurrency } = useGuestSendStore();
  const [rawAmount, setRawAmount] = useState(amount);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  //   const { countries, fetchCountries, loading: isLoading } = useCountryStore();
  const stripe = useStripe();

  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
    .refine(
      (val) => {
        const parsed = parseFloat(val);
        return parsed >= 1;
      },
      {
        message: "Amount must be at least 1",
      }
    );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, ""); // Remove non-numeric except "."
    if (value.startsWith(".")) value = "0" + value;

    const decimalCount = value.split(".").length - 1;
    if (decimalCount > 1) return;

    const [integerPart, decimalPart] = value.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue =
      decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;

    setRawAmount(formattedValue);
    actions.setField("amount", value);

    const result = amountSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0].message);
    } else {
      setError(null);
    }
  };
  const displayValue = () => {
    if (isFocused) {
      return rawAmount
        ? `${getCurrencySymbol(guestLocalCurrency?.currency || "")}${rawAmount}`
        : "";
    }
    if (!rawAmount) return "";
    const cleaned = rawAmount.replace(/,/g, "");
    const num = Number(cleaned);

    if (isNaN(num)) return "";

    return `${getCurrencySymbol(
      guestLocalCurrency?.currency || ""
    )}${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  const { countries, fetchCountries, loading: isLoading } = useCountryStore();
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);
  useEffect(() => {
    if (isLoading || !countries.length) return;

    // Only set default if guestLocalCurrency is not already set
    if (guestLocalCurrency) return;

    const defaultUSA = countries.find((i) => i.country_code === "US");

    const defaultOpt: IIntCountry = {
      name: defaultUSA?.country_name || "",
      value: defaultUSA?.country_code as IntCountryType,
      currency: defaultUSA?.currency as IntCurrencyCode,
      logo: defaultUSA?.country_flag || "",
    };
    actions.setField("guestLocalCurrency", defaultOpt);
  }, [isLoading, countries, guestLocalCurrency, actions]);

  return (
    <>
      {/* Amount Section */}
      <div className="mb-8 text-center">
        <div className="mx-auto w-full mb-5 flex justify-center items-center">
          <svg
            width="31"
            height="31"
            viewBox="0 0 31 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.304443"
              y="0.304321"
              width="30"
              height="30"
              rx="15"
              fill="#EAECFF"
            />
            <rect
              x="0.304443"
              y="0.304321"
              width="30"
              height="30"
              rx="15"
              stroke="#E4E0EA"
              strokeWidth="0.608696"
            />
            <path
              d="M18.7545 7.77102L11.2295 10.271C6.17121 11.9627 6.17121 14.721 11.2295 16.4044L13.4629 17.146L14.2045 19.3794C15.8879 24.4377 18.6545 24.4377 20.3379 19.3794L22.8462 11.8627C23.9629 8.48769 22.1295 6.64602 18.7545 7.77102ZM19.0212 12.2544L15.8545 15.4377C15.7295 15.5627 15.5712 15.621 15.4129 15.621C15.2545 15.621 15.0962 15.5627 14.9712 15.4377C14.7295 15.196 14.7295 14.796 14.9712 14.5544L18.1379 11.371C18.3795 11.1294 18.7795 11.1294 19.0212 11.371C19.2629 11.6127 19.2629 12.0127 19.0212 12.2544Z"
              fill="#4B0082"
            />
          </svg>
        </div>
        <p className="text-sm text-raiz-gray-950 mb-3">
          How much do you want to send?
        </p>
        <div className="w-full flex justify-center items-center mb-3 flex-col">
          <div className="relative w-full mt-3">
            <input
              ref={inputRef}
              value={displayValue()}
              onChange={handleAmountChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
              // disabled={!!amountFromLink}
              placeholder={`${getCurrencySymbol(
                guestLocalCurrency?.currency || "$"
              )}0.00`}
              className="w-full h-16 bg-transparent text-center text-[32px] font-semibold focus:outline-none"
            />
          </div>
          {error && <ErrorMessage message={error} />}
        </div>
        <button
          onClick={() => setShowCurrencyModal(true)}
          className="text-sm flex  justify-center mx-auto text-raiz-gray-950 hover:text-gray-800 bg-[#E6EBFF99] px-4 py-2 rounded-[16px]"
        >
          Change:{" "}
          <span className="font-semibold">
            {" "}
            ({guestLocalCurrency?.currency || "USD"})
          </span>
          <Image
            className="ml-1.5"
            src="/icons/arrow-down.svg"
            alt="arrow-down"
            width={16}
            height={16}
          />
        </button>
      </div>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <InputField
          label="First Name"
          {...formik.getFieldProps("firstName")}
          placeholder="Enter first name"
          status={
            formik.touched.firstName && formik.errors.firstName ? "error" : null
          }
          errorMessage={
            formik.touched.firstName &&
            (typeof formik.errors.firstName === "string"
              ? formik.errors.firstName
              : undefined)
          }
        />
        <InputField
          label="Last Name"
          {...formik.getFieldProps("lastName")}
          placeholder="Enter last name"
          status={
            formik.touched.lastName && formik.errors.lastName ? "error" : null
          }
          errorMessage={
            formik.touched.lastName &&
            (typeof formik.errors.lastName === "string"
              ? formik.errors.lastName
              : undefined)
          }
        />
        <InputField
          {...formik.getFieldProps("email")}
          type="email"
          label="Email Address"
          placeholder="Enter your email address"
          status={formik.touched.email && formik.errors.email ? "error" : null}
          errorMessage={
            formik.touched.email &&
            (typeof formik.errors.email === "string"
              ? formik.errors.email
              : undefined)
          }
        />
        <InputField
          label="Purpose"
          {...formik.getFieldProps("purpose")}
          type="text"
          placeholder="What is the purpose"
          status={
            formik.touched.purpose && formik.errors.purpose ? "error" : null
          }
          errorMessage={
            formik.touched.purpose &&
            (typeof formik.errors.purpose === "string"
              ? formik.errors.purpose
              : undefined)
          }
        />
        <Button
          type="submit"
          disabled={!amount || !stripe || loading || !formik.isValid}
          loading={loading}
          onClick={() =>
            goNext({
              firstName: formik.values.firstName,
              lastName: formik.values.lastName,
              email: formik.values.email,
              purpose: formik.values.purpose,
            })
          }
        >
          Continue
        </Button>
      </form>
      {showCurrencyModal && (
        <GuestSelectCurrency close={() => setShowCurrencyModal(false)} />
      )}
      {showPayModal && (
        <CardDetails
          close={() => setShowPayModal(false)}
          loading={loading}
          formik={formik}
          disableBtn={!amount || !stripe || loading}
          goNext={goNext}
          clientSecret=""
        />
      )}
    </>
  );
};

const GuestCardPayFormWithStripe = (props: Props) => (
  <Elements stripe={stripePromise}>
    <GuestCardPayForm {...props} />
  </Elements>
);

export default GuestCardPayFormWithStripe;
