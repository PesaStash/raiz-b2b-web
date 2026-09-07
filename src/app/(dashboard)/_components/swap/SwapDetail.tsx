import SideWrapperHeader from "@/components/SideWrapperHeader";
import { useSwapStore } from "@/store/Swap";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import React, { useState } from "react";
import { z } from "zod";
import Image from "next/image";
import Button from "@/components/ui/Button";
import SelectCurrencyModal from "./SelectCurrencyModal";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";
import {
  getSwapRateDisplay,
} from "./swapRateDisplay";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useUser } from "@/lib/hooks/useUser";
import { toast } from "sonner";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface Props {
  close: () => void;
  goNext: () => void;
  exchangeRate: number | undefined;
  inverseRate?: number;
  recipientAmount: string;
  timeLeft: number;
  loading: boolean;
  cryptoFee?: number;
}

const SwapDetail = ({
  close,
  goNext,
  exchangeRate,
  inverseRate,
  recipientAmount,
  timeLeft,
  loading,
  cryptoFee,
}: Props) => {
  const { user } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const {
    amount,
    actions,
    swapFromCurrency,
    swapToCurrency,
    swapFromWallet,
    swapToWallet,
  } = useSwapStore();

  // Always read the from-wallet balance live from the user object so it
  // reflects the real balance and updates immediately when direction changes.
  const liveFromWallet = user?.business_account?.wallets?.find(
    (w) => w.wallet_type.currency === swapFromCurrency,
  );
  const fromBalance = liveFromWallet?.account_balance ?? swapFromWallet?.account_balance ?? 0;
  const [showCurrency, setShowCurrency] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [rawAmount, setRawAmount] = useState("");

  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
    .refine((val) => parseFloat(val) >= 1, {
      message: "Amount must be at least 1",
    })
    .refine(
      (val) => {
        return parseFloat(val) <= fromBalance;
      },
      {
        message: `Amount cannot exceed available balance`,
      },
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
    const num = Number(amount);
    return isNaN(num)
      ? ""
      : `${getCurrencySymbol(swapFromCurrency)}${num.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
  };

  const handleNext = () => {
    // Validate that both wallets exist
    if (!swapFromWallet || !swapToWallet) {
      toast.warning("Both source and destination wallets are required");
      return;
    }

    // Additional validation for specific swap pairs if needed
    if (!actions.isValidSwapPair(swapFromCurrency, swapToCurrency)) {
      toast.error("This swap pair is not allowed");
      return;
    }

    goNext();
  };

  const rateDisplay = getSwapRateDisplay(
    swapFromCurrency,
    swapToCurrency,
    exchangeRate,
    inverseRate,
  );

  const showFee = () => {
    let fee = 0;
    if (swapFromCurrency === "SBC" || swapToCurrency === "SBC") {
      if (cryptoFee) fee = cryptoFee;
    } else {
      fee = 0;
    }
    return formatAmount(fee, { currency: selectedCurrency.name });
  };

  return (
    <div>
      <CenterModalHeader close={close} />
      <SideWrapperHeader
        title={`Swap ${swapFromCurrency}`}
        close={close}
        titleColor="text-zinc-900"
        backArrow={false}
      />
      <div className="flex flex-col justify-between xl:h-[75vh] bg-raiz-gray-50 rounded-[20px] p-2 md:p-6">
        <div className="mt-5">
          <h6 className="text-center justify-start text-zinc-900 md:text-base text-sm font-normal leading-normal">
            How much do you want to swap?
          </h6>
          <div className="flex flex-col items-center">
            <input
              autoFocus
              className="outline-none h-[91px] bg-transparent w-full xl:mx-auto text-center text-zinc-900 placeholder:text-zinc-900 text-3xl font-semibold leading-10"
              placeholder="0.00"
              value={displayValue()}
              onChange={handleAmountChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {error && amount && <ErrorMessage message={error} />}
          </div>
          <div className="px-4 py-2 mx-auto bg-indigo-100 bg-opacity-60 rounded-2xl flex w-fit flex-col justify-center items-center gap-2">
            <p className="text-zinc-900 text-xs font-normal leading-tight">
              Balance:
              <span className="text-zinc-900 text-xs font-bold leading-tight">
                {" "}
                {getCurrencySymbol(swapFromCurrency)}
                {fromBalance.toLocaleString()}{" "}
              </span>
              <span>({swapFromCurrency})</span>
            </p>
          </div>
        </div>

        <div className="pb-5 mt-2 md:mt-0">
          <p className="text-zinc-900 md:text-sm text-xs font-medium mb-3 font-brSonoma leading-normal">
            Swap Destination
          </p>
          <div className="flex justify-between items-center p-3.5 bg-gray-100 rounded-xl">
            <div className="flex gap-1 items-center">
              <Image
                src={
                  swapToCurrency === "NGN"
                    ? "/icons/ngn.svg"
                    : swapToCurrency === "USD"
                      ? "/icons/dollar.svg"
                      : swapToCurrency === "GBP"
                        ? "/icons/flag-gb.png"
                        : swapToCurrency === "EUR"
                          ? "/icons/flag-fr.png"
                          : "/icons/bsc.svg"
                }
                width={24}
                height={24}
                alt={swapToCurrency}
              />
              <span className="text-zinc-900 text-sm font-normal leading-tight">
                {swapToWallet?.wallet_type?.wallet_type_name || swapToCurrency}
              </span>
            </div>
            <button
              onClick={() => setShowCurrency(true)}
              className="px-1.5 py-1 bg-zinc-200 rounded-lg text-zinc-700 text-xs font-medium font-brSonoma leading-tight"
            >
              Change
            </button>
          </div>

          <div className="mt-11 p-3.5 mb-3 bg-gray-100 w-full rounded-lg outline outline-1 outline-offset-[-1px] outline-white inline-flex flex-col justify-center items-start gap-2">
            {/* Recipient gets */}
            <div className="w-full flex justify-between items-center">
              <span className="text-cyan-700 text-xs font-normal font-brSonoma leading-normal">
                You get:
              </span>
              <div className="h-0.5 w-[50%] px-4 bg-white"></div>
              <span className="text-zinc-900 text-xs font-semibold leading-none">
                {recipientAmount
                  ? `${getCurrencySymbol(swapToCurrency)}${recipientAmount}`
                  : "Calculating..."}
              </span>
            </div>
            {/* {(swapFromCurrency === "SBC" || swapToCurrency === "SBC") && ( */}
            <div className="w-full flex justify-between items-center">
              <span className="text-cyan-700 text-xs font-normal font-brSonoma leading-normal">
                Fee:
              </span>
              <div className="h-0.5 w-[75%] px-4 bg-white"></div>
              <span className="text-zinc-900  text-xs font-semibold leading-none">
                {loading ? "..." : `${showFee()}`}
              </span>
            </div>
            {/* )} */}

            {/* Rate */}
            {rateDisplay && (
              <div className="w-full flex justify-between items-center">
                <span className="text-cyan-700 text-xs font-normal font-brSonoma leading-normal whitespace-nowrap">
                  {rateDisplay.base}
                </span>
                <div className="h-0.5 w-[75%] px-4 bg-white"></div>
                <span className="text-zinc-900 text-xs font-semibold leading-none">
                  {rateDisplay.quote}
                </span>
              </div>
            )}
          </div>

          <div className="p-5 mb-3 bg-indigo-100 bg-opacity-60 rounded-[20px] inline-flex justify-start items-start gap-2 w-full">
            <Image
              src={"/icons/timer.svg"}
              width={20}
              height={20}
              alt="timer"
            />
            <p className="text-zinc-900 text-xs leading-tight">
              Confirm swap in the next{" "}
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </p>
          </div>

          <Button disabled={loading || !!error || !amount} onClick={handleNext}>
            {loading ? "Fetching rates..." : "Continue"}
          </Button>
        </div>
      </div>

      {showCurrency && (
        <SelectCurrencyModal close={() => setShowCurrency(false)} />
      )}
    </div>
  );
};

export default SwapDetail;
