import React from "react";
import { sbcType } from "../send/CryptoSend";
import Overlay from "@/components/ui/Overlay";
import Image from "next/image";
import Radio from "@/components/ui/Radio";
import { useCryptoSwapStore } from "@/store/CryptoSwap";

interface Props {
  close: () => void;
  goNext: () => void;
}

const SwapCoinType = ({ close, goNext }: Props) => {
  const { actions, coinType } = useCryptoSwapStore();
  const handleClick = (i: sbcType) => {
    actions.setCoinType(i);
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
            Select the coin you want to swap
          </p>
        </div>
        <button onClick={close}>
          <Image src={"/icons/close.svg"} width={16} height={16} alt="close" />
        </button>
      </div>
      <div className="flex  flex-col gap-5">
        {/* USDC */}
        <div
          onClick={() => handleClick("USDC")}
          className={`border ${
            coinType === "USDC" ? "border-indigo-900" : "border-zinc-200"
          } rounded-[20px] cursor-pointer flex flex-col justify-center items-center w-full pt-[19px] pb-[21px]`}
        >
          <div className="flex justify-between w-full px-[30px] mb-5">
            <span />
            <Image width={30} height={30} src={"/icons/usdc.svg"} alt="USDC" />
            <Radio
              checked={coinType === "USDC"}
              onChange={() => actions.setCoinType("USDC")}
            />
          </div>
          <p className="text-zinc-900 text-sm font-bold leading-none">USDC</p>
          <p className="text-center  text-zinc-900 text-xs font-normal  leading-tight">
            Swap USDC
          </p>
        </div>
        {/* USDT */}
        <div
          onClick={() => handleClick("USDT")}
          className={`border ${
            coinType === "USDT" ? "border-indigo-900" : "border-zinc-200"
          } rounded-[20px] flex flex-col cursor-pointer justify-center items-center w-full pt-[19px] pb-[21px]`}
        >
          <div className="flex justify-between w-full px-[30px] mb-5">
            <span />
            <Image width={30} height={30} src={"/icons/usdt.svg"} alt="USDT" />
            <Radio
              checked={coinType === "USDT"}
              onChange={() => actions.setCoinType("USDT")}
            />
          </div>
          <p className="text-zinc-900 text-sm font-bold leading-none">USDT</p>
          <p className="text-center  text-zinc-900 text-xs font-normal  leading-tight">
            Swap USDT
          </p>
        </div>
      </div>
    </div>
    // </Overlay>
  );
};

export default SwapCoinType;
