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
import React, { useEffect, useMemo, useState } from "react";
import { sanitizePaymentInstructionHtml } from "./africaPayinUtils";

interface Props {
  onCancel?: () => void;
  cancelling?: boolean;
}

const GuestPaymentInstructions = ({ onCancel, cancelling }: Props) => {
  const { payment_instruction, amount, payout_currency, expires_at, status } =
    useGuestSendStore();
  const [timeLeft, setTimeLeft] = useState(0);

  const safeHtml = useMemo(
    () => sanitizePaymentInstructionHtml(payment_instruction || ""),
    [payment_instruction],
  );

  useEffect(() => {
    if (!expires_at) return;
    const expiryTime = dayjs(convertTime(expires_at)).valueOf();
    const tick = () => {
      setTimeLeft(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expires_at]);

  return (
    <section className="flex flex-col h-full">
      <div className="mt-10">
        <header className="flex items-center justify-between mt-2">
          <h2 className="text-raiz-gray-950 text-[23px] font-semibold leading-10">
            Complete your payment
          </h2>
        </header>
        <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
          Follow the instructions below to pay{" "}
          <span className="font-semibold">
            {getCurrencySymbol(payout_currency)}
            {Number(amount).toLocaleString()}
          </span>
          .
        </p>
      </div>

      <div className="mt-5 p-5 bg-[#EAECFF99] rounded-[20px] w-full overflow-y-auto max-h-[45vh]">
        {safeHtml ? (
          <div
            className="prose prose-sm max-w-none text-zinc-900 [&_a]:text-primary2 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <p className="text-sm text-zinc-700">
            Payment instructions will appear here once they are ready.
          </p>
        )}
      </div>

      <div className="mt-5 p-5 bg-indigo-100 bg-opacity-60 rounded-[20px] flex gap-2 items-start">
        <Image src={"/icons/timer.svg"} width={20} height={20} alt="timer" />
        <div className="text-zinc-900 text-xs leading-tight">
          <p className="font-semibold mb-1">
            {status === "pending" || !status
              ? "Waiting for payment"
              : `Status: ${status}`}
          </p>
          <p>
            We are waiting for your payment to be confirmed. This can take a few
            minutes depending on your bank or mobile money provider.
          </p>
          {expires_at && timeLeft > 0 && (
            <p className="mt-2">
              Session expires in{" "}
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </p>
          )}
        </div>
      </div>

      {onCancel && (
        <div className="mt-auto pt-6 pb-2">
          <Button
            type="button"
            className="bg-zinc-200 text-zinc-900"
            onClick={onCancel}
            loading={cancelling}
          >
            Cancel payment
          </Button>
        </div>
      )}
    </section>
  );
};

export default GuestPaymentInstructions;
