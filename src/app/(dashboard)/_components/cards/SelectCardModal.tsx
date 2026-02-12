"use client";
import Overlay from "@/components/ui/Overlay";
import React from "react";
import Image from "next/image";

interface Props {
  close: () => void;
}

const SelectCardModal = ({ close }: Props) => {
  const handleVirtualCard = () => {
    close();
  };
  const handleJitCard = () => {
    close();
  };
  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5  text-raiz-gray-950">
        <h4 className="text-xl font-semibold">Select Card</h4>
        <div className="flex flex-col mt-4">
          <button
            onClick={handleVirtualCard}
            className={`px-3 py-4  justify-between items-center gap-10 rounded-[20px] w-full  inline-flex bg-white `}
          >
            <div className="flex gap-3">
              <Image
                src={"/icons/card-purple.svg"}
                alt="Regular card"
                width={40}
                height={40}
              />
              <div className="flex flex-col gap-1 items-start">
                <p className="text-raiz-gray-900 text-base font-medium font-brSonoma leading-tight">
                  Get Regular USD Virtual Card
                </p>
                <p className="opacity-50 text-raiz-gray-950 text-[13px] font-normal  leading-tight">
                  Regular Card
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={handleJitCard}
            className={`px-3 py-4  justify-between items-center gap-10 rounded-[20px] w-full  inline-flex bg-white `}
          >
            <div className="flex gap-3">
              <Image
                src={"/icons/card-blue.svg"}
                alt="Regular card"
                width={40}
                height={40}
              />
              <div className="flex flex-col gap-1 items-start">
                <p className="text-raiz-gray-900 text-base font-medium font-brSonoma leading-tight">
                  Get Just In Time (JIT) Card
                </p>
                <p className="opacity-50 text-raiz-gray-950 text-[13px] font-normal  leading-tight">
                  Just In Time (JIT) Card
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Overlay>
  );
};

export default SelectCardModal;
