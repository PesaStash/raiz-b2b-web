"use client";
import PayStepActions from "./PayStepActions";
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
import { getChannelLabel, isMomoChannel } from "./africaPayinUtils";

interface Props {
  goBack: () => void;
  goNext: () => void;
  loading?: boolean;
  recipientName?: string;
}

const GuestTransferSummary = ({
  goBack,
  goNext,
  loading,
  recipientName,
}: Props) => {
  const {
    payout_currency,
    amount,
    local_amount,
    expires_at,
    channel_name,
    channel_id,
    sender_name,
    purpose,
    transaction_description,
    guestAccount,
    account_type,
    payer_email,
    network_name,
  } = useGuestSendStore();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const localCurrencySymbol = getCurrencySymbol(payout_currency);
  const methodLabel = getChannelLabel(channel_name || channel_id || account_type);
  const isMomo = isMomoChannel(null, account_type, channel_name, channel_id);

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

  const rows: { label: string; value: string }[] = [
    {
      label: "Amount to recipient",
      value: `$${Number(amount).toLocaleString()} USD`,
    },
    {
      label: "You pay",
      value: `${localCurrencySymbol}${Number(local_amount).toLocaleString()} ${payout_currency}`,
    },
    {
      label: "Recipient",
      value: recipientName || "Raiz user",
    },
    {
      label: "Recipient wallet",
      value: isMomo
        ? `Mobile Wallet${network_name ? ` (${network_name})` : ""}`
        : methodLabel,
    },
    {
      label: "Your name",
      value: sender_name || "You",
    },
  ];

  if (payer_email) {
    rows.push({ label: "Your email", value: payer_email });
  }

  rows.push({
    label: "Description",
    value: transaction_description || purpose || "N/A",
  });

  if (isMomo && guestAccount) {
    rows.push({ label: "Mobile money account", value: guestAccount });
  }

  return (
    <section className="flex flex-col h-full">
      <div className="">
       
        <header className="flex items-start justify-between mt-2">
          <div>
            <h2 className="text-raiz-gray-950 text-xl mt-7 md:mt-0 md:text-[23px] font-bold md:font-semibold leading-tight md:leading-10">
              Review your payment
            </h2>
            <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
              <span className="md:hidden">Please double check the details.</span>
              <span className="hidden md:inline">
                Please double check the details before confirming.
              </span>
            </p>
          </div>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="hidden md:block shrink-0"
          >
            <rect
              width="48"
              height="48"
              rx="16"
              fill="#EAECFF"
              fillOpacity="0.4"
            />
            <path
              d="M34.084 16.376C33.872 15.147 32.906 14.119 31.688 13.849C30.385 13.56 29.199 14.086 28.489 15H24V33H30C31.657 33 33 31.657 33 30V19.33C33.814 18.643 34.289 17.567 34.084 16.376Z"
              fill="#F2ED9F"
            />
            <path
              d="M31 12C28.239 12 26 14.239 26 17C26 18.977 28.001 21.704 29.471 23.441C30.27 24.385 31.73 24.385 32.529 23.441C33.999 21.704 36 18.977 36 17C36 14.239 33.761 12 31 12ZM31 19.143C29.817 19.143 28.857 18.184 28.857 17C28.857 15.816 29.817 14.857 31 14.857C32.183 14.857 33.143 15.817 33.143 17C33.143 18.183 32.183 19.143 31 19.143Z"
              fill="#EDB637"
            />
            <path
              d="M18.697 13.786L16.459 15.126C15.554 15.668 15 16.645 15 17.7V31.106C15 32.38 16.39 33.167 17.482 32.512L18.696 31.785C19.098 31.544 19.547 31.415 20 31.395V13.397C19.547 13.417 19.098 13.546 18.697 13.786Z"
              fill="#F2ED9F"
            />
            <path
              d="M21.359 13.6829C20.931 13.4699 20.463 13.3759 20 13.3969V31.3949C20.464 31.3749 20.932 31.4689 21.36 31.6829L24 32.9999V14.9999L21.359 13.6829Z"
              fill="#EDB637"
            />
          </svg>
        </header>
      </div>

      <div className="flex flex-col h-full justify-between items-center w-full mt-5">
        <div className="w-full">
          <div className="w-full divide-y divide-zinc-100">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 py-3"
              >
                <span className="text-[13px] text-gray-500 font-normal leading-normal shrink-0">
                  {row.label}
                </span>
                <p className="text-right text-zinc-900 text-sm font-semibold leading-normal capitalize wrap-break-word">
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {expires_at && (
            <div className=" flex w-full justify-between items-center gap-2 border-t pt-3 border-zinc-100">
             <span className="text-gray-500 text-sm leading-normal">Confirm within the next{" "}</span>
             <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-indigo-100/60">
             <Image
                src={"/icons/timer.svg"}
                width={16}
                height={16}
                alt="timer"
              />           
                <span className="font-semibold text-xs">{formatTime(timeLeft)}</span>
             </div>
             
            </div>
          )}
        </div>

        <div className="w-full pb-2 mt-2">
          <PayStepActions
            onBack={goBack}
            onContinue={goNext}
            continueLabel="Confirm and pay locally"
            continueLoading={loading}
            backDisabled={loading}
          />
        </div>
      </div>
    </section>
  );
};

export default GuestTransferSummary;
