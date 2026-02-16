"use client";
import ZelleTopupInfo from "@/app/(dashboard)/_components/topUp/UsdTopup/ZelleTopupInfo";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { InitiateGuestZellePaymentApi } from "@/services/transactions";
import { useTopupStore } from "@/store/TopUp";
import { IBusinessPaymentData } from "@/types/services";
import { useMutation } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

interface Props {
  data: IBusinessPaymentData;
}

const GuestPayWithZelle = ({ data }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { actions, amount } = useTopupStore();
  const [rawAmount, setRawAmount] = useState(amount);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showZelleInfo, setShowZelleInfo] = useState(false);
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
    setError(!result.success ? result.error.errors[0].message : null);
  };

  const displayValue = () => {
    if (isFocused) {
      // While typing, show rawAmount with $
      return rawAmount ? `$${rawAmount}` : "";
    }

    if (!rawAmount) return "";

    const cleaned = rawAmount.replace(/,/g, "");
    const num = Number(cleaned);

    if (isNaN(num)) return "";

    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const USDAcct = data?.wallets?.find(
    (acct: { wallet_type: { currency: string } }) =>
      acct.wallet_type.currency === "USD"
  );

  const zelleMutation = useMutation({
    mutationFn: (payload: { expected_amount: number }) =>
      InitiateGuestZellePaymentApi(USDAcct?.wallet_id || null, payload),
    onSuccess: (res) => {
      actions.setZelleInfo(res);
      setShowZelleInfo(true);
    },
  });

  const handleDone = () => {
    actions.reset();
    setShowZelleInfo(false);
    setRawAmount("");
  };
  return (
    <>
      <div className="flex h-[80%] flex-col gap-8 justify-between">
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
                // disabled={!!amountFromLink}
                placeholder={`$0.00`}
                className="w-full h-16 bg-transparent text-center text-[32px] font-semibold focus:outline-none"
              />
            </div>
            {error && <ErrorMessage message={error} />}
          </div>
        </div>
        <Button
          loading={zelleMutation.isPending}
          disabled={!amount || zelleMutation.isPending}
          onClick={() =>
            zelleMutation.mutate({ expected_amount: parseFloat(amount || "0") })
          }
        >
          Continue
        </Button>
      </div>
      {showZelleInfo && (
        <ZelleTopupInfo
          goBack={() => setShowZelleInfo(false)}
          goNext={() => {
            handleDone();
            toast.success(
              "Zelle top-up submitted — funds will reflect once verified."
            );
          }}
          type="guest"
        />
      )}
    </>
  );
};

export default GuestPayWithZelle;
