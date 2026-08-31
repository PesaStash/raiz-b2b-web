"use client";
import Button from "@/components/ui/Button";
import { useGuestSendStore } from "@/store/GuestSend";
import {
  convertTime,
  formatTime,
  getCurrencySymbol,
} from "@/utils/helpers";
import dayjs from "dayjs";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { getChannelLabel } from "./africaPayinUtils";

interface Props {
  goBack: () => void;
  goNext: () => void;
  onCancel?: () => void;
  loading?: boolean;
  recipientName?: string;
}

const GuestTransferSummary = ({
  goBack,
  goNext,
  onCancel,
  loading,
  recipientName,
}: Props) => {
  const {
    payout_currency,
    amount,
    expires_at,
    channel_name,
    channel_id,
    sender_name,
    purpose,
    transaction_description,
    guestAccount,
  } = useGuestSendStore();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const currencySymbol = getCurrencySymbol(payout_currency);
  const methodLabel = getChannelLabel(channel_name || channel_id);
  const isMomo =
    channel_id === "momo" ||
    channel_name === "momo" ||
    channel_name === "mobile_money" ||
    channel_name === "mobile-money" ||
    channel_name?.toLowerCase().includes("mobile");

  useEffect(() => {
    if (!expires_at) return;

    const expiryTime = dayjs(convertTime(expires_at)).valueOf();

    const tick = () => {
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(secondsLeft);

      if (secondsLeft <= 0) {
        toast.info("Session expired. Please start a new transaction.");
        goBack();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expires_at, goBack]);

  return (
    <section className="flex flex-col h-full">
      <div className="mt-10">
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
          <h2 className="text-raiz-gray-950 text-[23px] font-semibold leading-10">
            Review payment
          </h2>
        </header>
        <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
          Confirm the details below before continuing.
        </p>
      </div>
      <div className="flex flex-col h-full justify-between items-center w-full mt-5">
        <div className="p-7 bg-[#EAECFF99] rounded-[20px] w-full grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="w-full flex flex-col items-start text-left">
            <span className="text-left text-sm md:text-base text-gray-500 font-normal leading-normal">
              Amount
            </span>
            <p className="text-left text-zinc-900 text-base md:text-lg font-semibold leading-normal">
              {`${currencySymbol}${Number(amount).toLocaleString()}`}
            </p>
          </div>
          <div className="w-full flex flex-col items-start text-left">
            <span className="text-left text-sm md:text-base text-gray-500 font-normal leading-normal">
              Recipient
            </span>
            <p className="text-left text-zinc-900 text-base md:text-lg font-semibold leading-normal capitalize">
              {recipientName || "Raiz user"}
            </p>
          </div>
          <div className="w-full flex flex-col items-start text-left">
            <span className="text-left text-sm md:text-base text-gray-500 font-normal leading-normal">
              Payment method
            </span>
            <p className="text-left text-zinc-900 text-base md:text-lg font-semibold leading-normal">
              {methodLabel}
            </p>
          </div>
          <div className="w-full flex flex-col items-start text-left">
            <span className="text-left text-sm md:text-base text-gray-500 font-normal leading-normal">
              Payer name
            </span>
            <p className="text-left text-zinc-900 text-base md:text-lg font-semibold leading-normal">
              {sender_name || "N/A"}
            </p>
          </div>
          <div className="w-full flex flex-col items-start text-left md:col-span-2">
            <span className="text-left text-sm md:text-base text-gray-500 font-normal leading-normal">
              Description
            </span>
            <p className="text-left text-zinc-900 text-base md:text-lg font-semibold leading-normal">
              {transaction_description || purpose || "N/A"}
            </p>
          </div>
          {isMomo && (
            <div className="w-full flex flex-col items-start text-left">
              <span className="text-left text-sm md:text-base text-gray-500 font-normal leading-normal">
                Phone number
              </span>
              <p className="text-left text-zinc-900 text-base md:text-lg font-semibold leading-normal">
                {guestAccount || "N/A"}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5 w-full mt-5">
          {expires_at && (
            <div className="p-5 bg-indigo-100 bg-opacity-60 rounded-[20px] inline-flex justify-start items-start gap-2 w-full">
              <Image src={"/icons/timer.svg"} width={20} height={20} alt="timer" />
              <p className="text-zinc-900 text-xs leading-tight">
                Confirm within the next{" "}
                <span className="font-semibold">{formatTime(timeLeft)}</span>
              </p>
            </div>
          )}
          <div className="w-full pb-2 flex flex-col gap-3">
            <Button loading={loading} onClick={goNext}>
              Continue
            </Button>
            {onCancel && (
              <Button
                type="button"
                className="bg-zinc-200 text-zinc-900"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel payment
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuestTransferSummary;
