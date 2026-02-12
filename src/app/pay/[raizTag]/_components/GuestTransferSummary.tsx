"use client";
import Button from "@/components/ui/Button";
import CopyButton from "@/components/ui/CopyButton";
import { useGuestSendStore } from "@/store/GuestSend";
import {
  convertTime,
  formatTime,
  getCurrencySymbol,
} from "@/utils/helpers";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  goBack: () => void;
  goNext: () => void;
}

const GuestTransferSummary = ({ goBack, goNext }: Props) => {
  const {
    payout_amount,
    payout_currency,
    collection_account_name,
    collection_account_number,
    collection_bank_name,
    amount,
    rate,
    expires_at,
    channel_name,
  } = useGuestSendStore();

  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!expires_at) return;

    const expiryTime = dayjs(convertTime(expires_at)).valueOf(); // LOCALIZED expiry time

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

  const notMomo = channel_name !== "momo";

  return (
    <section className="flex flex-col h-full">
      <div className="mt-10">
        <button onClick={goBack}>
          <Image
            className="w-4 h-4 md:w-[18px] md:h-[18px]"
            src={"/icons/arrow-left.svg"}
            width={18.48}
            height={18.48}
            alt="back"
          />
        </button>
        <header className="flex items-center justify-between mt-2">
          <h2 className="text-raiz-gray-950 text-[23px] font-semibold  leading-10">
            Send Summary
          </h2>
          <svg width="40" height="41" viewBox="0 0 40 41" fill="none">
            <path
              opacity="0.35"
              d="M30 10.48H20V3.81335H13.3333V10.48H10C7.23833 10.48 5 12.7184 5 15.48V30.48C5 33.2417 7.23833 35.48 10 35.48H30C32.7617 35.48 35 33.2417 35 30.48V15.48C35 12.7184 32.7617 10.48 30 10.48Z"
              fill="#C6ADD5"
            />
            <path
              d="M29.1667 25.48C30.5474 25.48 31.6667 24.3607 31.6667 22.98C31.6667 21.5993 30.5474 20.48 29.1667 20.48C27.786 20.48 26.6667 21.5993 26.6667 22.98C26.6667 24.3607 27.786 25.48 29.1667 25.48Z"
              fill="#493260"
            />
            <path
              d="M10 7.14669V10.48H15V3.81335H13.3333C11.4917 3.81335 10 5.30502 10 7.14669Z"
              fill="#733B9C"
            />
            <path
              d="M18.3333 10.48H26.6666V7.14669C26.6666 5.30502 25.175 3.81335 23.3333 3.81335H18.3333V10.48Z"
              fill="#733B9C"
            />
          </svg>
        </header>
        <p className="text-raiz-gray-700 text-[15px] font-normal  leading-snug">
          Payment details
        </p>{" "}
      </div>
      <div className="flex flex-col h-full justify-between items-center w-full mt-5">
        <div className="p-7 bg-[#EAECFF99] rounded-[20px] w-full grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="w-full flex flex-col items-start text-left">
            <span className="text-left text-sm md:text-base justify-start text-gray-500 text-base font-normal leading-normal">
              Amount
            </span>
            <p className="text-left justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
              {`${getCurrencySymbol(payout_currency)}${Number(
                payout_amount
              ).toLocaleString()}`}
            </p>
          </div>
          {/* Merchant name */}
          {notMomo && (
            <div className="w-full flex flex-col items-start text-left">
              <span className="text-left text-sm md:text-base justify-start text-gray-500 text-base font-normal leading-normal">
                Merchant&apos;s Account Name
              </span>
              <p className="text-left justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                {collection_account_name || "N/A"}
              </p>
            </div>
          )}
          {/* Merchant gets */}
          <div className="w-full flex flex-col items-start text-left">
            <span className="text-left text-sm md:text-base justify-start text-gray-500 text-base font-normal leading-normal">
              Merchant Gets
            </span>
            <p className="text-left justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
              {`$${Number(amount).toLocaleString()}`}
            </p>
          </div>
          {/* Merchant acct no */}
          {notMomo && (
            <div className="w-full flex flex-col items-start text-left">
              <span className="text-left text-sm md:text-base justify-start text-gray-500 text-base font-normal leading-normal">
                Merchant&apos;s Account Number
              </span>
              <p className="text-left justify-start text-zinc-900 text-base md:text-lg font-semibold leading-normal flex items-center gap-2">
                {collection_account_number || "N/A"}
                {collection_account_number && (
                  <CopyButton value={collection_account_number} />
                
                )}
              </p>
            </div>
          )}
          {/*Exchange Rate*/}
          <div className="w-full flex flex-col items-start text-left">
            <span className="text-left text-sm md:text-base justify-start text-gray-500 text-base font-normal leading-normal">
              Exchange Rate
            </span>
            <p className="text-left justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
              {`$1(USD)  =  ${getCurrencySymbol(payout_currency)}${Number(
                rate
              ).toLocaleString()}`}
            </p>
          </div>
          {/* Merchant bank name */}
          {notMomo && (
            <div className="w-full flex flex-col items-start text-left">
              <span className="text-left text-sm md:text-base  justify-start text-gray-500 text-base font-normal leading-normal">
                Merchant&apos;s Bank Name
              </span>
              <p className="text-left justify-start text-zinc-900 text-base md:text-lg font-semibold  leading-normal">
                {collection_bank_name || "N/A"}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5 w-full mt-5">
          <div className="p-5   bg-indigo-100 bg-opacity-60 rounded-[20px] inline-flex justify-start items-start gap-2 w-full">
            <Image
              src={"/icons/timer.svg"}
              width={20}
              height={20}
              alt="timer"
            />
            <p className="text-zinc-900 text-xs leading-tight">
              Confirm payment in the next{" "}
              <span className=" font-semibold"> {formatTime(timeLeft)}</span>
            </p>
          </div>
          <div className="w-full pb-2">
            <Button
              // loading={loading}
              onClick={goNext}
            >
              I&apos;ve Sent the Payment
            </Button>
            <p className="text-[13px] text-raiz-gray-900  text-center mt-2">
              Don&#39;t have Raiz? <Link
                target="_blank"
                className="font-bold"
                href={"https://raizapp.onelink.me/RiOx/webdirect"}
              >
                Download
              </Link> Raiz app |  <Link
                target="_blank"
                className="font-bold"
             href={"/register"}
              >
                Sign up{" "}
              </Link>{" "} on Raiz Business

            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuestTransferSummary;
