"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import ErrorMessage from "@/components/ui/ErrorMessage";
import InputField from "@/components/ui/InputField";
import { useUser } from "@/lib/hooks/useUser";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { findWalletByCurrency } from "@/utils/helpers";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Image from "next/image";
import Button from "@/components/ui/Button";
import SideModalWrapper from "../../SideModalWrapper";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee: number;
  loading?: boolean;
  minAmount?: number;
}

const SendCrypto = ({
  goBack,
  goNext,
  fee,
  minAmount,
  loading = false,
}: Props) => {
  const { amount, purpose, actions } = useSendStore();
  const { user, refetch } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [rawAmount, setRawAmount] = useState(amount);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentWallet = findWalletByCurrency(user, "SBC");
  useEffect(() => {
    refetch();
  }, []);
  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
    .refine((val) => parseFloat(val) >= 1, {
      message: "Amount must be at least 1",
    })
    .refine(
      (val) => {
        const totalAvailable = currentWallet?.account_balance || 0;
        return parseFloat(val) <= totalAvailable;
      },
      {
        message: `Amount cannot exceed available balance`,
      },
    );

  const purposeSchema = z
    .string()
    .min(3, { message: "Purpose must be at least 3 characters long" });

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
    actions.setAmountAndRemark({ amount: value, purpose });

    const result = amountSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0].message);
    } else {
      setError(null);
    }
  };

  const handlePurposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPurpose = e.target.value;
    actions.setAmountAndRemark({ amount, purpose: newPurpose });

    // Re-validate purpose
    const result = purposeSchema.safeParse(newPurpose);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Also validate amount again to clear error if both are valid
    const amountResult = amountSchema.safeParse(amount || "0");
    if (!amountResult.success) {
      setError(amountResult.error.errors[0].message);
      return;
    }

    setError(null);
  };

  const displayValue = () => {
    if (isFocused || !amount)
      return amount ? `${selectedCurrency.sign}${rawAmount}` : "";
    const num = parseFloat(rawAmount);
    return isNaN(num) ? "" : `${selectedCurrency.sign}${num.toFixed(2)}`;
  };

  const handleNext = () => {
    const parsedAmount = parseFloat(amount || "0");
    const totalAvailable = currentWallet?.account_balance || 0;

    if (parsedAmount + fee > totalAvailable) {
      toast.warning("Account balance too low to carry out this transaction");
      return;
    }

    if (minAmount && parsedAmount < minAmount) {
      toast.warning(
        `Amount must be at least ${selectedCurrency?.sign}${minAmount}`,
      );
      return;
    }

    goNext();
  };

  return (
    <CenterModalWrapper close={goBack}>
      <div className="w-full flex flex-col h-full p-6">
        <CenterModalHeader close={goBack} />
        <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
          Send Money
        </h2>
        <div className="flex flex-col h-full justify-between items-center w-full">
          <div className="w-full h-full">
            <div className="flex flex-col justify-center items-center">
              {" "}
              <p className="text-center mt-10 justify-start text-zinc-900 text-base mb-3">
                How much do you want to send?
              </p>
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  autoFocus
                  className="outline-none h-[91px] bg-transparent w-fit xl:mx-auto text-center text-zinc-900 placeholder:text-zinc-900 text-3xl font-semibold leading-10"
                  placeholder={`${selectedCurrency.sign}0.00`}
                  value={displayValue()}
                  onChange={handleAmountChange}
                  onFocus={() => setIsFocused(true)}
                />
              </div>
              <div className="px-4  py-2 bg-indigo-100 bg-opacity-60 rounded-2xl inline-flex flex-col justify-center items-center gap-2">
                <p className="text-zinc-900 text-xs font-normal leading-tight">
                  Balance:
                  <span className="text-zinc-900 text-xs font-bold leading-tight">
                    {selectedCurrency?.sign}
                    {currentWallet?.account_balance?.toLocaleString()}{" "}
                  </span>
                  <span>({selectedCurrency.name})</span>
                </p>
              </div>
              <div className="w-full mt-10">
                <div className="flex items-center justify-between  font-brSonoma font-medium mb-3 w-full">
                  <p className="text-zinc-900 text-sm leading-normal">
                    Purpose
                  </p>
                  <div className="flex gap-1 items-center">
                    <Image
                      src={"/icons/bsc.svg"}
                      alt="currency"
                      width={16}
                      height={16}
                    />
                    <span className="text-zinc-700 text-xs leading-tight">
                      {selectedCurrency?.name}
                    </span>
                  </div>
                </div>
                <InputField
                  name="purpose"
                  placeholder="What is the purpose?"
                  value={purpose || ""}
                  onChange={handlePurposeChange}
                />
                {error && <ErrorMessage message={error} />}
              </div>
            </div>
          </div>
          <div className="w-full py-6">
            <div className=" p-3.5 mb-3 bg-gray-100 w-full rounded-lg outline outline-1 outline-offset-[-1px] outline-white inline-flex flex-col justify-center items-start gap-2">
              <div className="w-full flex justify-between items-center">
                <span className="text-cyan-700 text-xs font-normal font-brSonoma leading-normal">
                  Recipient gets:
                </span>
                <div className="h-0.5 w-[50%] px-4 bg-white"></div>
                <span className="text-zinc-900  text-xs font-semibold leading-none">
                  {selectedCurrency?.sign}
                  {parseFloat(amount || "0").toFixed(2)}
                </span>
              </div>

              <div className="w-full flex justify-between items-center">
                <span className="text-cyan-700 text-xs font-normal font-brSonoma leading-normal">
                  Fee:
                </span>
                <div className="h-0.5 w-[75%] px-4 bg-white"></div>
                <span className="text-zinc-900  text-xs font-semibold leading-none">
                  {loading
                    ? "..."
                    : `${selectedCurrency?.sign}${fee?.toFixed(2) || 0.0}`}
                </span>
              </div>
            </div>
            <Button
              disabled={!!error || !purpose || !amount || loading}
              loading={loading}
              onClick={handleNext}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </CenterModalWrapper>
  );
};

export default SendCrypto;
