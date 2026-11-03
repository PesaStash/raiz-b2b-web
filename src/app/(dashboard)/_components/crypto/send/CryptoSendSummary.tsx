"use client";
import Overlay from "@/components/ui/Overlay";
import React from "react";
import Image from "next/image";
import { useSendStore } from "@/store/Send";
import { CHAINS } from "@/constants/misc";
import ListDetailItem from "@/components/ui/ListDetailItem";
import { copyToClipboard, truncateString } from "@/utils/helpers";
import dayjs from "dayjs";
import Button from "@/components/ui/Button";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee: number;
}

const CryptoSendSummary = ({ goBack, goNext, fee }: Props) => {
  const { cryptoNetwork, amount, purpose, cryptoAddress } = useSendStore();
  const chain = CHAINS.find((i) => i.value === cryptoNetwork);
  const totalPayable = fee ? parseFloat(amount) + fee : amount;
  return (
    <Overlay close={goBack} width="375px" className="!z-[110]">
      <div className="h-full flex flex-col px-6 py-8">
        <div className="flex flex-col items-center justify-center mb-4 text-zinc-900">
          <div className="w-12 h-12 mb-4 flex mx-auto items-center justify-center bg-violet-100 bg-opacity-60 rounded-3xl">
            <Image
              className="w-6 h-6"
              src={chain?.icon || ""}
              alt={chain?.name || ""}
              width={24}
              height={24}
            />
          </div>
          <p className="text-center text-xl font-bold leading-normal">
            ${totalPayable.toLocaleString()}
          </p>
          <p className="text-center   text-xs font-normal  leading-tight">
            Send Summary
          </p>
        </div>
        <div className="w-full flex flex-col gap-[15px]">
          <ListDetailItem title="Network" value={`${chain?.name}`} border />
          <ListDetailItem title="Purpose" value={purpose} border />
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-xs font-normal leading-tight">Address</span>
            <div className="flex gap-1 items-center">
              <span className="text-sm text-right font-semibold font-brSonoma leading-tight">
                {truncateString(cryptoAddress, 19)}
              </span>
              <button onClick={() => copyToClipboard(cryptoAddress)}>
                <Image
                  src={"/icons/copy.svg"}
                  alt={"copy"}
                  width={16}
                  height={16}
                />
              </button>
            </div>
          </div>
          <ListDetailItem title="You send" value={`$${totalPayable}`} border />
          <ListDetailItem title="Recipient gets" value={`$${amount}`} border />
          <ListDetailItem title="Fees" value={`$${fee}`} border />
          <ListDetailItem
            title="Date"
            value={dayjs(new Date()).format("DD MMM YYYY @ hh:mm")}
          />
          <Button onClick={goNext}>Confirm Send</Button>
          <Button onClick={goBack} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

export default CryptoSendSummary;
