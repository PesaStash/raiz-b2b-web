"use client";

import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import Button from "@/components/ui/Button";
import ListDetailItem from "@/components/ui/ListDetailItem";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ITransactionCategory } from "@/types/transactions";
import { formatAmount } from "@/utils/helpers";
import Image from "next/image";

interface Props {
  goBack: () => void;
  goNext: () => void;
  amount: string;
  narration: string;
  category: ITransactionCategory | null;
  loading: boolean;
}

const RequestConfirmation = ({
  goBack,
  goNext,
  amount,
  narration,
  category,
  loading,
}: Props) => {
  const { selectedCurrency } = useCurrencyStore();
  return (
    <div className="h-full flex flex-col overflow-auto no-scrollbar pb-5">
      <CenterModalHeader close={goBack} />
      <h5 className=" text-raiz-gray-950 text-[22px] font-semibold leading-tight mb-10">
        Request Summary
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
              {formatAmount(Number(amount))}
            </p>
            <p className="text-center   text-xs font-normal  leading-tight">
              Request Summary
            </p>
          </div>
          <div className="w-full flex flex-col gap-[15px]">
            {/* Amount */}
            <ListDetailItem
              title="Amount"
              value={`${selectedCurrency?.sign}
              ${formatAmount(Number(amount))}`}
            />

            <ListDetailItem title="Purpose" value={narration} />
            <ListDetailItem
              title="Category"
              value={category?.transaction_category || ""}
            />
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Button loading={loading} disabled={loading} onClick={goNext}>
            Confirm Request
          </Button>
          <Button disabled={loading} onClick={goBack} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestConfirmation;
