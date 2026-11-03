"use client";
import { useSendStore } from "@/store/Send";
import React from "react";
import Image from "next/image";
import Button from "../ui/Button";
import ListDetailItem from "../ui/ListDetailItem";
import { formatTime, getCurrencySymbol, convertTime } from "@/utils/helpers";
import { IInitialPayoutResponse } from "@/types/services";
import dayjs from "dayjs";
import CenterModalHeader from "../layouts/CenterModalHeader";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee: number;
  paymentData?: IInitialPayoutResponse;
  timeLeft: number;
  isRequoting?: boolean;
  isExpired?: boolean;
}
const InternationalSendSummary = ({
  goBack,
  goNext,
  fee,
  paymentData,
  timeLeft,
  isRequoting = false,
  isExpired = false,
}: Props) => {
  const { category, amount, purpose, intBeneficiary } = useSendStore();

  const payoutCurrency =
    paymentData?.payout_currency ||
    intBeneficiary?.foreign_payout_beneficiary?.beneficiary_currency ||
    "";
  const payoutAmount = paymentData?.payout_amount ?? Number(amount);
  const usdDebit = paymentData?.amount ?? 0;
  const totalUsdDebit = usdDebit + (paymentData?.fees ?? fee ?? 0);
  const quoteExpired = isExpired || timeLeft <= 0;

  return (
    <div className="flex flex-col h-full  overflow-auto no-scrollbar pb-5">
      <CenterModalHeader close={goBack} />
      <h5 className=" text-raiz-gray-950 text-[22px] font-semibold leading-tight mb-10">
        Send Summary
      </h5>
      <div className="flex flex-col justify-between gap-6">
        <div className="bg-raiz-gray-50 p-6 rounded-[20px] w-full">
          <div className="flex flex-col items-center justify-center mb-4 text-zinc-900">
            <div className="w-12 h-12 mb-4 flex mx-auto items-center justify-center bg-violet-100 bg-opacity-60 rounded-3xl">
              <Image
                className="w-6 h-6"
                src={category?.category_emoji || "/icons/notif-general.svg"}
                alt={category?.transaction_category || ""}
                width={24}
                height={24}
              />
            </div>
            <p className="text-center text-xl font-bold leading-normal">
              {getCurrencySymbol(payoutCurrency)}
              {Number(payoutAmount).toLocaleString()}
            </p>
            <p className="text-center text-xs font-normal leading-tight">
              Recipient receives
            </p>
          </div>
          <div className="w-full flex flex-col gap-[15px] ">
            <ListDetailItem
              title="Recipient's name"
              value={
                paymentData?.foreign_payout_beneficiary?.beneficiary_name || ""
              }
            />
            <ListDetailItem
              title="Recipient account"
              value={
                paymentData?.foreign_payout_beneficiary
                  ?.beneficiary_account_number || ""
              }
            />
            <ListDetailItem
              title="Recipient receives"
              value={`${getCurrencySymbol(payoutCurrency)}${Number(
                payoutAmount,
              ).toLocaleString()}`}
            />
            <ListDetailItem
              title="USD wallet debit"
              value={`${getCurrencySymbol("USD")}${usdDebit.toLocaleString()}`}
            />
            <ListDetailItem
              title="Transaction fee"
              value={`${getCurrencySymbol("USD")}${(
                paymentData?.fees ?? fee
              ).toLocaleString()}`}
            />
            <ListDetailItem
              title="Total USD debit"
              value={`${getCurrencySymbol("USD")}${totalUsdDebit.toLocaleString()}`}
              border
            />
            <ListDetailItem
              title="Exchange rate"
              value={`${getCurrencySymbol(payoutCurrency)}${
                paymentData?.exchange_rate?.toFixed(2) || 1
              } = $1 USD`}
            />
            <ListDetailItem
              title="Category"
              value={category?.transaction_category || ""}
            />
            <ListDetailItem title="Purpose" value={purpose} />
            <ListDetailItem
              title="Date"
              value={dayjs(convertTime(paymentData?.created_at || "")).format(
                "DD MMM YYYY @ hh:mm",
              )}
            />
            <div
              className={`flex text-zinc-900 justify-between gap-4 items-start pb-3`}
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
                  {quoteExpired
                    ? "Expired"
                    : isRequoting
                      ? "Refreshing..."
                      : formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Button
            onClick={goNext}
            disabled={quoteExpired || isRequoting}
            loading={isRequoting}
          >
            {quoteExpired ? "Quote expired" : "Send"}
          </Button>
          <Button onClick={goBack} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InternationalSendSummary;
