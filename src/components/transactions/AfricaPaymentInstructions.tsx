"use client";
import Button from "@/components/ui/Button";
import {
  convertTime,
  formatTime,
  getCurrencySymbol,
} from "@/utils/helpers";
import dayjs from "dayjs";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  copyToClipboard,
  getChannelLabel,
  isMomoChannel,
  scrubProviderNames,
} from "@/app/pay/[raizTag]/_components/africaPayinUtils";
import { toast } from "sonner";

export interface AfricaPaymentInstructionsProps {
  /** Local-currency amount the payer must transfer. */
  amount: string;
  payoutCurrency: string;
  /** Original USD amount requested by the payer. */
  usdAmount?: string;
  expiresAt?: string | null;
  status?: string | null;
  paymentInstruction?: string | null;
  collectionBankName?: string | null;
  collectionAccountName?: string | null;
  collectionAccountNumber?: string | null;
  collectionMethod?: string | null;
  accountType?: string | null;
  channelName?: string | null;
  /** Mobile money number the prompt was sent to. */
  momoAccountNumber?: string | null;
  networkName?: string | null;
  onCancel?: () => void;
  cancelling?: boolean;
  /** When false, hide the waiting/expiry status card (authenticated top-up). */
  showWaitingStatus?: boolean;
  onDone?: () => void;
  title?: string;
  subtitle?: string;
}

const MOMO_STEPS = [
  "Check your phone",
  "Approve the payment",
  "Enter your MoMo PIN",
] as const;

const CopyRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-900 break-all">{value}</p>
    </div>
    <button
      type="button"
      className="text-xs font-semibold text-indigo-900"
      onClick={async () => {
        const ok = await copyToClipboard(value);
        toast[ok ? "success" : "error"](
          ok ? "Copied" : "Unable to copy",
        );
      }}
    >
      Copy
    </button>
  </div>
);

const AfricaPaymentInstructions = ({
  amount,
  payoutCurrency,
  usdAmount,
  expiresAt,
  status,
  collectionBankName,
  collectionAccountName,
  collectionAccountNumber,
  collectionMethod,
  accountType,
  channelName,
  momoAccountNumber,
  networkName,
  onCancel,
  cancelling,
  showWaitingStatus = true,
  onDone,
  title,
  subtitle,
}: AfricaPaymentInstructionsProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const isMomo = isMomoChannel(
    null,
    accountType || collectionMethod,
    channelName,
    collectionMethod,
  );

  const bankName = scrubProviderNames(collectionBankName);
  const accountName = scrubProviderNames(collectionAccountName);
  const hasStructuredBankFields = !!(
    bankName ||
    accountName ||
    collectionAccountNumber
  );

  const localAmountLabel = `${getCurrencySymbol(payoutCurrency)}${Number(
    amount || 0,
  ).toLocaleString()} ${payoutCurrency}`;
  const usdAmountLabel = usdAmount
    ? `$${Number(usdAmount).toLocaleString()} USD`
    : null;
  const displayTitle =
    title || (isMomo ? "Check your phone" : "Complete your payment");

  useEffect(() => {
    if (!showWaitingStatus || !expiresAt) return;
    const expiryTime = dayjs(convertTime(expiresAt)).valueOf();
    const tick = () => {
      setTimeLeft(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, showWaitingStatus]);

  return (
    <section className="flex flex-col h-full">
      <div className="mt-10">
        <header className="flex items-center justify-between mt-2">
          <h2 className="text-raiz-gray-950 text-[23px] font-semibold leading-10">
            {displayTitle}
          </h2>
        </header>
        <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
          {subtitle ||
            (isMomo ? (
              <>
                A payment request has been sent to your mobile money number
                {momoAccountNumber ? (
                  <>
                    {" "}
                    <span className="font-semibold">{momoAccountNumber}</span>
                  </>
                ) : null}
                . Approve{" "}
                <span className="font-semibold">{localAmountLabel}</span>
                {usdAmountLabel ? (
                  <>
                    {" "}
                    (<span className="font-semibold">{usdAmountLabel}</span>)
                  </>
                ) : null}{" "}
                on your phone to continue.
              </>
            ) : (
              <>
                Follow the instructions below to pay{" "}
                <span className="font-semibold">{localAmountLabel}</span>
                {usdAmountLabel && (
                  <>
                    {" "}
                    for{" "}
                    <span className="font-semibold">{usdAmountLabel}</span>
                  </>
                )}
                .
              </>
            ))}
        </p>
      </div>

      <div className="mt-5 p-5 bg-[#EAECFF99] rounded-[20px] w-full overflow-y-auto max-h-[45vh] space-y-4">
        {isMomo ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/icons/mobile.svg"
                width={28}
                height={28}
                alt="Mobile money"
              />
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Mobile money
                  {networkName ? ` · ${networkName}` : ""}
                </p>
                {momoAccountNumber && (
                  <p className="text-xs text-zinc-600 break-all">
                    {momoAccountNumber}
                  </p>
                )}
              </div>
            </div>
            <ol className="space-y-3 list-none pl-0">
              {MOMO_STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-zinc-900">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-zinc-900 pt-0.5">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : hasStructuredBankFields ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-zinc-900">
              {getChannelLabel(collectionMethod || channelName || "bank")}
            </p>
            {bankName && <CopyRow label="Bank name" value={bankName} />}
            {accountName && (
              <CopyRow label="Account name" value={accountName} />
            )}
            {collectionAccountNumber && (
              <CopyRow
                label="Account number"
                value={collectionAccountNumber}
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-700">
            Payment instructions will appear here once they are ready.
          </p>
        )}
      </div>

      {showWaitingStatus && (
        <div className="mt-5 p-5 bg-indigo-100 bg-opacity-60 rounded-[20px] flex gap-2 items-start">
          <Image src={"/icons/timer.svg"} width={20} height={20} alt="timer" />
          <div className="text-zinc-900 text-xs leading-tight">
            <p className="font-semibold mb-1">
              {status === "pending" || !status
                ? "Waiting for payment"
                : status === "process" || status === "processing"
                  ? "Processing payment"
                  : `Status: ${status}`}
            </p>
            <p>
              {isMomo
                ? "Keep this page open while you approve the request on your phone. Confirmation can take a few minutes."
                : "We are waiting for your payment to be confirmed. This can take a few minutes depending on your bank."}
            </p>
            {expiresAt && timeLeft > 0 && (
              <p className="mt-2">
                Session expires in{" "}
                <span className="font-semibold">{formatTime(timeLeft)}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {(onDone || onCancel) && (
        <div className="mt-auto pt-6 pb-2 flex flex-col gap-3">
          {onDone && (
            <Button type="button" onClick={onDone}>
              Done
            </Button>
          )}
          {onCancel && (
            <Button
              type="button"
              className="bg-zinc-200 text-zinc-900"
              onClick={onCancel}
              loading={cancelling}
            >
              Cancel payment
            </Button>
          )}
        </div>
      )}
    </section>
  );
};

export default AfricaPaymentInstructions;
