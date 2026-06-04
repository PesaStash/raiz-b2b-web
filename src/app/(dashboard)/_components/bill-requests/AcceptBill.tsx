import Overlay from "@/components/ui/Overlay";
import React from "react";
// import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { IBillRequest } from "@/types/transactions";
import { getCurrencySymbol } from "@/utils/helpers";
import Button from "@/components/ui/Button";

interface Props {
  close: () => void;
  request: IBillRequest;
  openPayModal: () => void;
}

const AcceptBill = ({ close, request, openPayModal }: Props) => {
  const user = request?.third_party_account;
  return (
    <Overlay close={close} width="400px">
      <div className="flex flex-col h-full py-6 sm:py-8 px-4 sm:px-5 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div className="">
            <h3 className="text-zinc-900 text-lg md:text-xl font-bold leading-normal">
              Bill Request
            </h3>
            <p className="text-zinc-600 md:text-zinc-900 text-xs md:text-sm leading-tight">
              {user?.account_name} sent a request
            </p>
          </div>
          {/* <button>
            <Image
              src={"/icons/trash.svg"}
              width={24}
              height={24}
              alt="delete"
            />
          </button> */}
        </div>
        <div className="flex flex-col justify-center items-center mt-11">
          <Avatar name={user?.account_name} src={user?.selfie_image} />
          {/* Amount */}
          <div className="w-full flex justify-between items-center text-zinc-900 pb-3 border-b border-zinc-200">
            <span className="text-xs font-normal leading-tight">Amount</span>
            <span className="text-sm md:text-base font-semibold font-brSonoma leading-tight tabular-nums">
              {getCurrencySymbol(request?.currency)}
              {request.transaction_amount?.toLocaleString()}
            </span>
          </div>
          {/* Narration */}
          <div className="w-full flex justify-between items-center text-zinc-900 mt-[15px]">
            <span className="text-xs font-normal leading-tight">Purpose</span>
            <span className="text-sm md:text-base font-semibold font-brSonoma leading-tight text-right max-w-[55%] break-words">
              {request?.narration || "Nil"}
            </span>
          </div>

          <div className="mt-8 sm:mt-[80px] w-full">
            <Button onClick={openPayModal} className="w-full bg-pink-600">
              Pay
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default AcceptBill;
