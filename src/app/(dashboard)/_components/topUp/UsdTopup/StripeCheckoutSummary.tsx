"use client";
import Button from "@/components/ui/Button";
import ListDetailItem from "@/components/ui/ListDetailItem";
import Overlay from "@/components/ui/Overlay";
import { useTopupStore } from "@/store/TopUp";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";
import React from "react";

interface Props {
  goNext: () => void;
  goBack: () => void;
}

const StripeCheckoutSummary = ({ goNext, goBack }: Props) => {
  const { amount, stripeDetail, topupCurrency } = useTopupStore();
  const handleSend = () => {
    goNext();
  };
  return (
    <Overlay close={close} width="400px">
      <div className="flex flex-col  h-full py-8 px-5 w-full">
        <p className="text-center   text-xl  font-bold mb-4  leading-tight">
          Confirm Payment
        </p>
        <div className="flex flex-col h-full justify-between items-center w-full">
          <div className="w-full flex flex-col gap-[15px]">
            <ListDetailItem
              title="Amount"
              value={`${getCurrencySymbol(topupCurrency?.currency || "USD")}
              ${formatAmount(Number(amount))}`}
            />

            <ListDetailItem
              title="Transaction fee"
              value={`$
              ${((stripeDetail?.fee || 0) / 100).toLocaleString()}`}
            />
          </div>
          <div className="w-full mt-4 flex flex-col gap-3">
            <Button
              onClick={handleSend}
              //   loading={loading}
            >
              Send
            </Button>
            <Button onClick={goBack} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default StripeCheckoutSummary;
