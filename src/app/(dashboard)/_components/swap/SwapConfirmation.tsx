"use client";
import Button from "@/components/ui/Button";
import ListDetailItem from "@/components/ui/ListDetailItem";
import Overlay from "@/components/ui/Overlay";
import { useSwapStore } from "@/store/Swap";
import { getCurrencySymbol } from "@/utils/helpers";
import Image from "next/image";
import React from "react";

interface Props {
  goBack: () => void;
  goNext: () => void;
  exchangeRate: number | undefined;
  recipientAmount: string;
  timeLeft: number;
  loading: boolean;
  cryptoFee?: number;
}

const SwapConfirmation = ({
  goBack,
  timeLeft,
  recipientAmount,
  loading,
  exchangeRate,
  goNext,
  cryptoFee,
}: Props) => {
  const { amount, swapFromCurrency, swapToCurrency } = useSwapStore();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
  };

  return (
    <Overlay close={goBack} width="375px" className="">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <div className="mb-4 flex flex-col justify-center items-center text-zinc-900 text-center">
          <h4 className="text-zinc-900 text-xl font-bold  leading-normal">
            {swapFromCurrency && getCurrencySymbol(swapFromCurrency)}
            {Number(amount)?.toLocaleString()}
          </h4>
          <p className=" text-xs font-normal  leading-tight">
            Swap {swapFromCurrency}
          </p>
        </div>
        <div className="flex flex-col gap-[15px]">
          <ListDetailItem
            title="You swap"
            value={`${
              swapFromCurrency && getCurrencySymbol(swapFromCurrency)
            }${Number(amount)?.toLocaleString()}`}
            border
          />
          <ListDetailItem
            title="Recipient gets"
            value={
              recipientAmount
                ? `${getCurrencySymbol(
                    swapToCurrency
                  )}${recipientAmount.toLocaleString()}`
                : "Calculating..."
            }
            border
          />
          <ListDetailItem
            title="Exchange rate"
            value={
              loading
                ? "Loading..."
                : `$1(USD) = ${swapToCurrency}${exchangeRate?.toFixed(2) || 1}`
            }
            border
          />
          {swapFromCurrency === "SBC" ||
            (swapToCurrency === "SBC" && (
              <ListDetailItem
                title="Fees"
                value={`$${cryptoFee?.toLocaleString()}` || 0}
                border
              />
            ))}
          <div
            className={`flex text-zinc-900 justify-between gap-4 items-start pb-3    `}
          >
            <span className="text-xs font-normal leading-tight">Timer</span>
            <div className="flex gap-1.5 items-center">
              <Image
                src={"/icons/timer.svg"}
                width={20}
                height={20}
                alt="timer"
              />
              <span className="text-sm text-right font-semibold font-brSonoma leading-tight">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[15px] w-full mt-[28px]">
          <Button disabled={loading || timeLeft === 0} onClick={goNext}>
            Confirm Swap
          </Button>
          <Button variant="secondary" onClick={goBack}>
            Cancel
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

export default SwapConfirmation;
