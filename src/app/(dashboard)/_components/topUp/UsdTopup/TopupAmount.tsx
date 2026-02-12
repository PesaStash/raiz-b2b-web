"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
// import SideModalWrapper from "../../../SideModalWrapper";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import z from "zod";
import { useTopupStore } from "@/store/TopUp";
import Button from "@/components/ui/Button";
import Image from "next/image";
import GuestSelectCurrency from "@/app/pay/[raizTag]/_components/GuestSelectCurrency";
import useCountryStore from "@/store/useCountryStore";
import { IIntCountry } from "@/constants/send";
import { IntCountryType, IntCurrencyCode } from "@/types/services";
import {
  formatAmount,
  getCurrencySymbol,
  toMinorUnitByCurrency,
} from "@/utils/helpers";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createStripeTopPaymentIntent,
  GetAllRates,
  InitiateZelleTopApi,
} from "@/services/transactions";
import SideModalWrapper from "../../SideModalWrapper";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrencyStore } from "@/store/useCurrencyStore";

interface Props {
  close: () => void;
  goNext: () => void;
}

const TopupAmount = ({ close, goNext }: Props) => {
  const { amount, actions, topupCurrency, paymentOption } = useTopupStore();
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [rawAmount, setRawAmount] = useState(amount);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const { countries, fetchCountries, loading: isLoading } = useCountryStore();
  const { selectedCurrency: appCurrency } = useCurrencyStore();
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
    .refine((val) => parseFloat(val) >= 1, {
      message: "Amount must be at least 1",
    });

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
    actions.setAmount(value);

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
        ? `${getCurrencySymbol(topupCurrency?.currency || "")}${rawAmount}`
        : "";
    }
    if (!rawAmount) return "";
    const cleaned = rawAmount.replace(/,/g, "");
    const num = Number(cleaned);

    if (isNaN(num)) return "";

    return `${getCurrencySymbol(
      topupCurrency?.currency || ""
    )}${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const { data: ratesData } = useQuery({
    queryKey: ["rates"],
    queryFn: GetAllRates,
  });
  const selectedCurrency = ratesData?.find(
    (item) => item.currency === topupCurrency?.currency
  );

  const dollarRate = selectedCurrency
    ? Number(amount) / selectedCurrency?.buy_rate || 0
    : 0;

  const currentWallet = useMemo(() => {
    if (!user || !user?.business_account?.wallets || !appCurrency?.name)
      return null;
    return user?.business_account?.wallets.find(
      (wallet) => wallet.wallet_type.currency === appCurrency.name
    );
  }, [user, appCurrency]);

  const zelleMutation = useMutation({
    mutationFn: (payload: { expected_amount: number }) =>
      InitiateZelleTopApi(currentWallet?.wallet_id || null, payload),
    onSuccess: (res) => {
      actions.setZelleInfo(res);
      goNext();
    },
  });

  const DebitCardMutation = useMutation({
    mutationFn: () =>
      createStripeTopPaymentIntent(toMinorUnitByCurrency(dollarRate, "USD")),
    onSuccess: (res) => {
      actions.setStripeDetail(res);
      goNext();
    },
  });

  const handleNext = () => {
    if (paymentOption === "zelle") {
      if (!currentWallet?.wallet_id) {
        console.error("No wallet found");
        return;
      }
      zelleMutation.mutate({ expected_amount: Number(amount) || 0 });
    } else {
      DebitCardMutation.mutate();
    }
  };

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    if (isLoading || !countries.length) return;
    if (topupCurrency) return;

    const defaultUSA = countries.find((i) => i.country_code === "US");

    const defaultOpt: IIntCountry = {
      name: defaultUSA?.country_name || "",
      value: defaultUSA?.country_code as IntCountryType,
      currency: defaultUSA?.currency as IntCurrencyCode,
      logo: defaultUSA?.country_flag || "",
    };
    actions.setTopupCurrency(defaultOpt);
  }, [isLoading, countries, topupCurrency, actions]);
  return (
    <SideModalWrapper close={close}>
      <SideWrapperHeader
        close={close}
        title="Top Up"
        titleColor="text-zinc-900"
      />
      <div className="flex flex-col h-full justify-between items-center w-full">
        <div className="flex flex-col justify-center items-center">
          <p className="text-center mt-10 justify-start text-zinc-900 text-base mb-3">
            How much do you want to top up?
          </p>
          <div className="flex items-center">
            <input
              ref={inputRef}
              autoFocus
              className="outline-none h-[91px] bg-transparent w-fit xl:mx-auto text-center text-zinc-900 placeholder:text-zinc-900 text-3xl font-semibold leading-10"
              placeholder={`${getCurrencySymbol(
                topupCurrency?.currency || "$"
              )}0.00`}
              value={displayValue()}
              onChange={handleAmountChange}
              onFocus={() => setIsFocused(true)}
            />
          </div>
          {paymentOption === "debit-card" && (
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="text-sm flex  justify-center mx-auto text-raiz-gray-950 hover:text-gray-800 bg-[#E6EBFF99] px-4 py-2 rounded-[16px]"
            >
              Change:{" "}
              <span className="font-semibold">
                {" "}
                ({topupCurrency?.currency || "USD"})
              </span>
              <Image
                className="ml-1.5"
                src="/icons/arrow-down.svg"
                alt="arrow-down"
                width={16}
                height={16}
              />
            </button>
          )}
        </div>
        <div className="w-full py-6">
          <div className=" p-3.5 mb-3 bg-gray-100 w-full rounded-lg outline outline-1 outline-offset-[-1px] outline-white inline-flex flex-col justify-center items-start gap-2">
            <div className="w-full flex justify-between items-center">
              <span className="text-cyan-700 text-xs font-normal font-brSonoma leading-normal">
                You get:
              </span>
              <div className="h-0.5 w-[50%] px-4 bg-white"></div>
              <span className="text-zinc-900  text-xs font-semibold leading-none">
                {`$
                          ${formatAmount(dollarRate)}`}
              </span>
            </div>
          </div>
          <Button
            disabled={
              !!error ||
              !amount ||
              DebitCardMutation.isPending ||
              zelleMutation.isPending
            }
            loading={DebitCardMutation.isPending || zelleMutation.isPending}
            onClick={handleNext}
          >
            Continue
          </Button>
        </div>
      </div>
      {showCurrencyModal && (
        <GuestSelectCurrency
          close={() => setShowCurrencyModal(false)}
          onSelect={(selectedCurrency) =>
            actions.setTopupCurrency(selectedCurrency)
          }
        />
      )}
    </SideModalWrapper>
  );
};

export default TopupAmount;
function toMinorUnit(dollarRate: number): number {
  throw new Error("Function not implemented.");
}
