"use client";
import { useSendStore } from "@/store/Send";
import React from "react";
import Image from "next/image";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import Button from "../ui/Button";
import ListDetailItem from "../ui/ListDetailItem";
import CenterModalHeader from "../layouts/CenterModalHeader";
import { formatAmount } from "@/utils/helpers";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee: number;
}

const SendSummary = ({ goBack, goNext, fee }: Props) => {
  const { category, amount, purpose } = useSendStore();
  const { selectedCurrency } = useCurrencyStore();

  const totalPayable = fee ? parseFloat(amount) + fee : amount;

  return (
    <div className="h-full flex flex-col overflow-auto no-scrollbar pb-5">
      <CenterModalHeader close={goBack} />
      <h5 className=" text-raiz-gray-950 text-[22px] font-semibold leading-tight mb-10">
        Send Summary
      </h5>
      <div className="flex h-full flex-col justify-between pb-5 ">
        <div className="rounded-[20px] flex flex-col bg-raiz-gray-50 px-6 lg:py-6 xl:py-10 desktop:py-16  mb-6">
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
              {selectedCurrency?.sign}
              {formatAmount(Number(totalPayable))}
            </p>
            <p className="text-center   text-xs font-normal  leading-tight">
              Send Summary
            </p>
          </div>
          <div className="w-full flex flex-col gap-[15px]">
            {/* Amount */}
            <ListDetailItem
              title="Amount"
              value={`${selectedCurrency?.sign}
              ${formatAmount(Number(amount))}`}
            />
            <ListDetailItem
              title="Transaction fee"
              value={`${selectedCurrency?.sign}
              ${fee.toLocaleString()}`}
            />
            <ListDetailItem title="Purpose" value={purpose} />
            <ListDetailItem
              title="Category"
              value={category?.transaction_category || ""}
            />
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Button
            // disabled={!fee}
            onClick={goNext}
          >
            Send
          </Button>
          <Button onClick={goBack} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendSummary;
