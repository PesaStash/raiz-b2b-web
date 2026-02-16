"use client";
import Overlay from "@/components/ui/Overlay";
import React from "react";
import Image from "next/image";
import { useTopupStore } from "@/store/TopUp";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";
import Button from "@/components/ui/Button";

interface Props {
  close: () => void;
}

const TopupSuccess = ({ close }: Props) => {
  const { amount, topupCurrency } = useTopupStore();
  return (
    <Overlay close={() => {}}>
      <div className="w-full h-full bg-gradient-to-l from-indigo-900 to-violet-600 rounded-[36px]  shadow-[0px_1px_2px_0px_rgba(0,0,0,0.30)] inline-flex flex-col justify-center items-center">
        <div className="flex flex-col justify-between gap-6 h-full pt-[88px] p-[30px] items-center w-full">
          <div className="text-center w-full flex flex-col justify-center items-center">
            <Image
              src={"/icons/success.svg"}
              width={50}
              height={50}
              alt="Success"
            />
            <h4 className="mt-[15px] text-gray-100 text-xl font-bold leading-relaxed">
              {`Top up of ${getCurrencySymbol(
                topupCurrency?.currency || "USD"
              )}${formatAmount(Number(amount))} was successful`}
            </h4>
            <p className="text-gray-100 mt-3 text-xs font-normal leading-tight text-wrap">
              Account credited successfully.
            </p>
          </div>
          <Button onClick={close} className="bg-indigo-900">
            Done
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

export default TopupSuccess;
