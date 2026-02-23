import Overlay from "@/components/ui/Overlay";
import { useCryptoSwapStore } from "@/store/CryptoSwap";
import React from "react";
import Image from "next/image";
import ListDetailItem from "@/components/ui/ListDetailItem";
import Button from "@/components/ui/Button";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee?: number;
}
const CryptoSwapConfirmation = ({ goBack, goNext, fee }: Props) => {
  const { amount, coinType } = useCryptoSwapStore();
  const parsedAmount = parseFloat(amount);
  const totalPayable = fee ? (fee + parsedAmount)?.toLocaleString() : 0;
  return (
    <Overlay close={goBack} width="375px">
      <div className="h-full flex flex-col px-5 py-8">
        <div className="flex flex-col items-center justify-center mb-4 text-zinc-900">
          <div className="w-12 h-12 mb-4 flex mx-auto items-center justify-center bg-violet-100 bg-opacity-60 rounded-3xl">
            <Image
              className="w-12 h-12"
              src={`/icons/${coinType?.toLowerCase()}.svg`}
              alt={"coin"}
              width={48}
              height={48}
            />
          </div>
          <p className="text-center text-xl font-bold leading-normal">
            ${totalPayable?.toLocaleString()}
          </p>
          <p className="text-center   text-xs font-normal  leading-tight">
            Swap Summary
          </p>
        </div>
        <div className="w-full flex flex-col gap-[15px]">
          <ListDetailItem title="Coin" value={`${coinType}`} border />
          <ListDetailItem
            title="You swap"
            value={`${parsedAmount?.toLocaleString()} ${coinType}`}
            border
          />
          <ListDetailItem title="You get" value={`$${parsedAmount}`} border />
          <ListDetailItem
            title="Fees"
            value={`$${fee?.toLocaleString()}` || 0}
            border
          />
          <Button onClick={goNext}>Confirm Swap</Button>
          <Button onClick={goBack} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

export default CryptoSwapConfirmation;
