"use client";
import Overlay from "@/components/ui/Overlay";
import React from "react";
import Image from "next/image";
import { sbcType } from "./CryptoSend";
import Radio from "@/components/ui/Radio";
import { useSendStore } from "@/store/Send";

interface Props {
  close: () => void;
  type: sbcType | null;
  setType: (type: sbcType) => void;
  goNext: () => void;
}

const CoinTypeModal = ({ close, setType, type, goNext }: Props) => {
  const { actions } = useSendStore();
  const handleClick = (i: sbcType) => {
    actions.setCryptoType(i);
    setType(i);
    goNext();
  };
  return (
    // <Overlay close={close} width="375px">
    <div className="flex flex-col  h-full py-8 px-5 w-full">
      <div className="flex justify-between items-start mb-11">
        <div className="">
          <h3 className="text-zinc-900 text-xl font-bold leading-normal">
            Coin type
          </h3>
          <p className="text-zinc-900 text-xs leading-tight">
            Select how you want to pay your recipient
          </p>
        </div>
        <button onClick={close}>
          <Image src={"/icons/close.svg"} width={16} height={16} alt="close" />
        </button>
      </div>
      <div className="flex  flex-col gap-5">
        {/* USDC */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleClick("USDC")}
          className={`border ${
            type === "USDC" ? "border-indigo-900" : "border-zinc-200"
          } rounded-[20px] flex flex-col justify-center items-center w-full pt-[19px] pb-[21px]`}
        >
          <div className="flex justify-between w-full px-[30px] mb-5">
            <span />
            <Image width={30} height={30} src={"/icons/usdc.svg"} alt="USDC" />
            <Radio checked={type === "USDC"} onChange={() => setType("USDC")} />
          </div>
          <p className="text-zinc-900 text-sm font-bold leading-none">USDC</p>
          <p className="text-center  text-zinc-900 text-xs font-normal  leading-tight">
            Pay through USDC
          </p>
        </div>
        {/* USDT */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleClick("USDT")}
          className={`border ${
            type === "USDT" ? "border-indigo-900" : "border-zinc-200"
          } rounded-[20px] flex flex-col justify-center items-center w-full pt-[19px] pb-[21px]`}
        >
          <div className="flex justify-between w-full px-[30px] mb-5">
            <span />
            <Image width={30} height={30} src={"/icons/usdt.svg"} alt="USDT" />
            <Radio checked={type === "USDT"} onChange={() => setType("USDT")} />
          </div>
          <p className="text-zinc-900 text-sm font-bold leading-none">USDT</p>
          <p className="text-center  text-zinc-900 text-xs font-normal  leading-tight">
            Pay through USDT
          </p>
        </div>
      </div>
    </div>
    // </Overlay>
  );
};

export default CoinTypeModal;
