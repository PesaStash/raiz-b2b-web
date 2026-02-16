"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useCryptoSwapStore } from "@/store/CryptoSwap";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { getCurrencySymbol } from "@/utils/helpers";
import React, { useState } from "react";
import { z } from "zod";
import Image from "next/image";
import Button from "@/components/ui/Button";
import SideModalWrapper from "../../SideModalWrapper";
import SelectSwapCurrencyModal from "./SelectSwapCurrencyModal";

interface Props {
  close: () => void;
  goNext: () => void;
  exchangeRate?: number;
  fee: number;
  loading: boolean;
}

const CryptoSwapDetail = ({
  close,
  goNext,
  exchangeRate = 1,
  fee,
  loading,
}: Props) => {
  const { selectedCurrency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const {
    amount,
    actions,
    swapToCurrency,
    swapFromWallet,
    swapToWallet,
    swapFromCurrency,
    coinType,
  } = useCryptoSwapStore();
  const [showCurrency, setShowCurrency] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [rawAmount, setRawAmount] = useState(amount);
  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
    .refine((val) => parseFloat(val) >= 1, {
      message: "Amount must be at least 1",
    })
    .refine(
      (val) => {
        const totalAvailable = swapFromWallet?.account_balance || 0;
        return parseFloat(val) <= totalAvailable;
      },
      {
        message: `Amount cannot exceed available balance`,
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
    actions.setAmount(value);

    const result = amountSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0].message);
    } else {
      setError(null);
    }
  };
  const displayValue = () => {
    if (isFocused || !amount)
      return amount ? `${getCurrencySymbol(swapFromCurrency)}${rawAmount}` : "";
    const num = parseFloat(rawAmount);
    return isNaN(num)
      ? ""
      : `${getCurrencySymbol(swapFromCurrency)}${num.toFixed(2)}`;
  };

  return (
    <SideModalWrapper close={close}>
      <div>
        <SideWrapperHeader
          title={`Swap Crypto`}
          close={close}
          titleColor="text-zinc-900"
        />
        <div className="flex flex-col justify-between h-[85vh] ">
          <div className="mt-5 ">
            <h6 className="text-center justify-start text-zinc-900 text-base font-normal  leading-normal">
              How much do you want to swap?
            </h6>
            <div className="flex flex-col  items-center">
              <input
                autoFocus
                className="outline-none h-[91px] bg-transparent w-full xl:mx-auto text-center text-zinc-900 placeholder:text-zinc-900 text-3xl font-semibold leading-10"
                placeholder="0.00"
                value={displayValue()}
                onChange={handleAmountChange}
                onFocus={() => setIsFocused(true)}
              />
              {error && amount && <ErrorMessage message={error} />}
            </div>
            <div className="px-4 py-2 mx-auto bg-indigo-100 bg-opacity-60 rounded-2xl flex w-fit flex-col justify-center items-center gap-2">
              <p className="text-zinc-900 text-xs font-normal leading-tight">
                Balance:
                <span className="text-zinc-900 text-xs font-bold leading-tight">
                  ${swapFromWallet?.account_balance.toLocaleString()}{" "}
                </span>
                <span>({swapFromCurrency})</span>
              </p>
            </div>
          </div>
          <div className="pb-5">
            <p className="text-zinc-900 text-sm font-medium mb-3 font-brSonoma leading-normal">
              Swap Destination
            </p>
            <div className="flex justify-between items-center p-3.5 bg-gray-100 rounded-xl">
              <div className="flex gap-1 items-center">
                <Image
                  src={`/icons/${
                    swapToCurrency === "USD" ? "dollar" : "bsc"
                  }.svg`}
                  width={24}
                  height={14}
                  alt=""
                />
                <span className="text-zinc-900 text-sm font-normal leading-tight">
                  {swapToWallet?.wallet_type?.wallet_type_name}
                </span>
              </div>
              <button
                onClick={() => setShowCurrency(true)}
                className="px-1.5 py-1 bg-zinc-200 rounded-lg text-zinc-700 text-xs font-medium font-brSonoma leading-tight"
              >
                Change
              </button>
            </div>
            <div className="mt-11  p-3.5 mb-3 bg-gray-100 w-full rounded-lg outline outline-1 outline-offset-[-1px] outline-white inline-flex flex-col justify-center items-start gap-2">
              {/* Recipient gets */}
              <div className="w-full flex justify-between items-center">
                <span className="text-raiz-crypto-primary text-xs font-normal font-brSonoma leading-normal">
                  Recipient gets:
                </span>
                <div className="h-0.5 w-[36%] px-4 bg-white"></div>
                <span className="text-zinc-900  text-xs font-semibold leading-none">
                  {`${amount} ${coinType} `}
                </span>
              </div>
              <div className="w-full flex justify-between items-center">
                <span className="text-cyan-700 text-xs font-normal font-brSonoma leading-normal">
                  Fee:
                </span>
                <div className="h-0.5 w-[75%] px-4 bg-white"></div>
                <span className="text-zinc-900  text-xs font-semibold leading-none">
                  {loading ? "..." : `$${fee?.toFixed(2) || "0.00"}`}
                </span>
              </div>
              {/* Rate */}
              <div className="w-full flex justify-between items-center">
                <span className="text-raiz-crypto-primary text-xs font-normal font-brSonoma leading-normal">
                  $1 (USD)
                </span>
                <div className="h-0.5 w-[60%] px-6 bg-white"></div>
                <span className="text-zinc-900  text-xs font-semibold leading-none">
                  {exchangeRate || 1} {coinType}
                </span>
              </div>
            </div>
            {/* <div className="p-5 mb-3 bg-indigo-100 bg-opacity-60 rounded-[20px] inline-flex justify-start items-start gap-2 w-full">
              <Image
                src={"/icons/timer.svg"}
                width={20}
                height={20}
                alt="timer"
              />
              <p className="text-zinc-900 text-xs leading-tight">
                Confirm swap in the next{" "}
                <span className=" font-semibold"> {formatTime(timeLeft)}</span>
              </p>
            </div> */}
            <Button disabled={!!error || !amount} onClick={goNext}>
              Continue
            </Button>
          </div>
        </div>
        {showCurrency && (
          <SelectSwapCurrencyModal close={() => setShowCurrency(false)} />
        )}
      </div>
    </SideModalWrapper>
  );
};

export default CryptoSwapDetail;
