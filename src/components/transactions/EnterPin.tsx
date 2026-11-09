"use client";
import React, { useEffect, useState } from "react";
import {
  FlowCurrency,
  FlowHeader,
  FlowCard,
  FlowActions,
  useSendFlow,
} from "./send-flow/Flow";
import FlowOverlay from "./send-flow/FlowOverlay";
import Overlay from "../ui/Overlay";
import NumberKeypad from "../ui/NumberKeyPad";
import Image from "next/image";
import { formatMoney } from "@/lib/globalBalance";

interface Props {
  pin: string;
  setPin: (value: string) => void;
  close: () => void;
  disabled?: boolean;
  error?: string;
  onNewQuote?: () => void;
  transfer?: {
    recipient: string;
    amount: number | string;
    currency: string;
    debit?: number | string;
    sourceCurrency: string;
  };
}

const EnterPin = ({
  pin,
  setPin,
  close,
  disabled = false,
  transfer,
  error,
  onNewQuote,
}: Props) => {
  const flow = useSendFlow();
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!error) return;
    setSubmitted(false);
    setDraft("");
  }, [error]);
  if (flow)
    return (
      <FlowOverlay label="Authorise your transfer">
        <FlowHeader title="Authorise your transfer" onBack={close} />
        <FlowCard>
          {transfer && (
            <div className="flex items-center gap-3 rounded-[14px] bg-[#f3f1fd] px-4 py-3 text-sm font-semibold">
              <FlowCurrency currency={transfer.sourceCurrency} size={28} />
              <Image
                src="/images/send/route-arrow.svg"
                width={16}
                height={16}
                alt="to"
              />
              <FlowCurrency currency={transfer.currency} size={28} />
              <span>
                {formatMoney(transfer.amount, transfer.currency)} to {transfer.recipient}
              </span>
            </div>
          )}
          <h2 className="text-2xl font-semibold">Enter your transaction PIN</h2>
          <p className="text-sm text-[#79708d]">
            {transfer?.debit !== undefined
              ? `Authorise ${formatMoney(transfer.debit, transfer.sourceCurrency)} from your ${transfer.sourceCurrency} balance.`
              : "Confirm the transfer you just reviewed."}
          </p>
          <label className="relative block">
            <span className="sr-only">4-digit transaction PIN</span>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={draft}
              disabled={submitted}
              onChange={(e) =>
                setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="absolute inset-0 opacity-0 w-full cursor-text"
            />
            <span
              className="grid grid-cols-4 gap-4 pointer-events-none"
              aria-hidden
            >
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`h-[82px] rounded-xl bg-[#f4f4f8] flex items-center justify-center text-primary2 text-3xl ${draft.length === index ? "ring-1 ring-primary2" : ""}`}
                >
                  {draft[index] ? "•" : ""}
                </span>
              ))}
            </span>
          </label>
          {error ? (
            <p role="alert" className="text-sm font-medium text-[#d92d20]">
              {error}
            </p>
          ) : (
            <p className="text-xs text-[#79708d]">
              Type your 4-digit PIN using your keyboard.
            </p>
          )}
          <FlowActions
            onNext={() => {
              if (draft.length !== 4 || submitted || disabled) return;
              setSubmitted(true);
              setPin(draft);
            }}
            nextLabel="Authorise transfer"
            disabled={draft.length !== 4 || submitted || disabled}
            loading={submitted}
          />
          {onNewQuote ? (
            <button
              type="button"
              onClick={onNewQuote}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-[#d0d5dd] bg-white px-6 text-[15px] font-semibold text-[#14141e]"
            >
              Get new quote
            </button>
          ) : null}
        </FlowCard>
      </FlowOverlay>
    );
  return (
    <Overlay width="385px" close={close} className="!z-[110]">
      <div
        className={`flex flex-col lg:h-[90%] xl:h-full
        }  py-8 px-5  text-raiz-gray-950 overflow-y-scroll`}
      >
        <div className="flex justify-between px-6">
          <h2 className=" text-lg md:text-xl font-bold  leading-normal">
            Enter Pin
          </h2>
          <button onClick={close}>
            <Image
              src={"/icons/close.svg"}
              alt="close"
              width={16}
              height={16}
            />
          </button>
        </div>
        <div className="my-[30px]">
          <NumberKeypad otpValue={pin} setOtpValue={setPin} />
          {error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-[#d92d20]">
              {error}
            </p>
          ) : null}
          {onNewQuote ? (
            <button
              type="button"
              onClick={onNewQuote}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-[#d0d5dd] bg-white px-6 text-[15px] font-semibold text-[#14141e]"
            >
              Get new quote
            </button>
          ) : null}
        </div>
      </div>
    </Overlay>
  );
};

export default EnterPin;
