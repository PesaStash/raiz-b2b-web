"use client";
import Avatar from "@/components/ui/Avatar";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { IBusinessPaymentData } from "@/types/services";
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import Image from "next/image";
import GuestSelectCurrency from "./GuestSelectCurrency";
import SelectField from "@/components/ui/SelectField";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useGuestSendStore } from "@/store/GuestSend";
import { getCurrencySymbol } from "@/utils/helpers";

const PAYMENT_METHODS = [
  { label: "Bank transfer", value: "bank" },
  { label: "Mobile money", value: "momo" },
] as const;

interface Props {
  data: IBusinessPaymentData;
  goBack: () => void;
  goNext: () => void;
  paymentMethod: string | null;
  setPaymentMethod: (v: string | null) => void;
  amountFromLink?: string;
}

const PayLocalAmount = ({
  data,
  goBack,
  goNext,
  paymentMethod,
  setPaymentMethod,
  amountFromLink,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { amount, guestLocalCurrency, actions, max, min } = useGuestSendStore();
  const [rawAmount, setRawAmount] = useState(amount);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);

  const currencySymbol = getCurrencySymbol(guestLocalCurrency?.currency || "");

  useEffect(() => {
    if (amountFromLink) {
      actions.setField("amount", amountFromLink);
      setRawAmount(amountFromLink);
    }
  }, [amountFromLink, actions]);

  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
    .refine((val) => {
      const parsed = parseFloat(val);
      return !Number.isNaN(parsed) && parsed >= 1;
    }, { message: "Amount must be at least 1" })
    .refine((val) => {
      const parsed = parseFloat(val);
      return Number.isNaN(parsed) || parsed <= 20000;
    }, { message: "Amount must not exceed 20,000" });

  useEffect(() => {
    if (amount) {
      const result = amountSchema.safeParse(amount);
      if (!result.success) {
        setError(result.error.errors[0].message);
      } else {
        setError(null);
      }
    }
  }, [min, max, amount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");
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
    if (isFocused || !amount) return amount ? `${currencySymbol}${rawAmount}` : "";
    const num = parseFloat(rawAmount);
    return isNaN(num) ? "" : `${currencySymbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const goNextHandler = () => {
    if (!paymentMethod || error || !amount || !guestLocalCurrency) return;
    goNext();
  };

  return (
    <section className="flex flex-col h-full">
      {/* <div className="mt-10">
        <button type="button" onClick={goBack}>
          <Image
            className="w-4 h-4 md:w-[18px] md:h-[18px]"
            src={"/icons/arrow-left.svg"}
            width={18.48}
            height={18.48}
            alt="back"
          />
        </button>
        <header className="flex items-center justify-between mt-2">
          <h2 className="text-raiz-gray-950 text-xl md:text-[23px] font-semibold leading-10">
            Pay {data?.account_user?.username || ""} locally
          </h2>
        </header>
        <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
          Pay with bank transfer or mobile money. The recipient receives USD once
          the payment is confirmed.
        </p>
      </div> */}
      <div className="flex flex-col h-full justify-between items-center w-full px-4 md:px-0 mt-5">
        <div className="w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <div className="relative w-10 h-10">
              <Avatar
                src={data?.account_user?.selfie_image}
                name={data?.account_user?.username}
              />
            </div>
            <p className="text-center mt-4 justify-start text-zinc-900 text-sm font-bold leading-none capitalize">
              {data?.account_user?.username}
            </p>
            <p className="text-center mt-10 justify-start text-zinc-900 text-sm md:text-base mb-3">
              How much do you want to send?
            </p>
            <div className="relative w-full mt-3">
              <input
                ref={inputRef}
                value={displayValue()}
                onChange={handleAmountChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={!!amountFromLink}
                placeholder={`${currencySymbol || ""}0.00`}
                className="w-full h-16 bg-transparent text-center text-2xl md:text-4xl font-bold focus:outline-none"
              />
            </div>
            <div className="py-2 px-4 rounded-2xl flex items-center gap-3 text-zinc-900 text-[10px] md:text-xs bg-indigo-100/60">
              <div className="flex items-center gap-1">
                <span>Min</span>
                <span className="font-bold">
                  {`${currencySymbol}${(min || 1).toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Max</span>
                <span className="font-bold">
                  {`${currencySymbol}${(max || 20000).toLocaleString()}`}
                </span>
              </div>
            </div>

            {error && <ErrorMessage message={error} />}
          </div>
          <div className="mt-8 mb-5">
            <p className="text-zinc-900 text-sm font-medium mb-3 font-brSonoma leading-normal">
              Your currency
            </p>
            <div className="flex justify-between items-center p-3.5 bg-gray-100 rounded-xl">
              <div className="flex gap-1 items-center">
                <Image
                  src={guestLocalCurrency?.logo ?? "/icons/website.svg"}
                  width={24}
                  height={14}
                  alt=""
                />
                <span className="text-zinc-900 text-[13px] md:text-sm font-normal leading-tight">
                  {guestLocalCurrency
                    ? `${guestLocalCurrency.name} (${guestLocalCurrency.currency})`
                    : "Select currency"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCurrency(true)}
                className="px-1.5 py-1 bg-zinc-200 rounded-lg text-zinc-700 text-xs font-medium font-brSonoma leading-tight"
              >
                {guestLocalCurrency ? "Change" : "Select"}
              </button>
            </div>
          </div>
          <SelectField
            label="Payment method"
            placeholder="Select a payment method"
            name="method"
            options={[...PAYMENT_METHODS]}
            onChange={(i) => {
              if (!i?.value) return;
              const value = String(i.value);
              setPaymentMethod(value);
              actions.setFields({
                channel_id: value,
                channel_name: value,
                max: 20000,
                min: 1,
                country_code: guestLocalCurrency?.value || "",
              });
            }}
            value={
              paymentMethod
                ? PAYMENT_METHODS.find(
                    (option) => option.value === paymentMethod,
                  ) || null
                : null
            }
            height="auto"
          />
        </div>
        <div className="w-full py-5">
          <Button
            disabled={
              !!error || !amount || !paymentMethod || !guestLocalCurrency
            }
            onClick={goNextHandler}
          >
            Continue
          </Button>
          <p className="text-[13px] text-raiz-gray-900 text-center mt-2">
            Don&#39;t have Raiz?{" "}
            <Link
              target="_blank"
              className="font-bold"
              href={"https://raizapp.onelink.me/RiOx/webdirect"}
            >
              Download
            </Link>{" "}
            Raiz app |{" "}
            <Link target="_blank" className="font-bold" href={"/register"}>
              Sign up{" "}
            </Link>{" "}
            on Raiz Business
          </p>
        </div>
      </div>
      {showCurrency && (
        <GuestSelectCurrency close={() => setShowCurrency(false)} />
      )}
    </section>
  );
};

export default PayLocalAmount;
