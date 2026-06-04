import React from "react";
import { PartChildProps } from "./HelpSupportNav";
import Image from "next/image";

const HelpCenter = ({ setPart }: PartChildProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mt-3 md:mt-0">
        <button onClick={() => setPart(0)}>
          <Image
            src="/icons/arrow-left.svg"
            alt="arrow-left"
            width={18}
            height={18}
            className="size-3 md:size-[18px]"
          />
        </button>
        <span className="text-raiz-gray-950 text-sm md:text-base font-bold leading-tight">
          Help Center
        </span>
        <div />
      </div>
      <div className="mt-5 flex flex-col gap-5">
        <button
          onClick={() => setPart(6)}
          className="flex items-center justify-between"
        >
          <div className="flex gap-[15px] items-center">
            <div className="w-10 h-10 rounded-full bg-[#F3F1F6] flex m-auto justify-center">
              <Image
                src="/icons/money.svg"
                alt="money"
                width={24}
                height={24}
              />
            </div>

            <span className="text-raiz-gray-950 text-[15px] font-semibold leading-snug tracking-tight">
              Transactions
            </span>
          </div>
          <Image
            src="/icons/arrow-right.svg"
            alt="arrow-right"
            width={18}
            height={18}
          />
        </button>
        <button
          onClick={() => setPart(7)}
          className="flex items-center justify-between"
        >
          <div className="flex gap-[15px] items-center">
            <div className="w-10 h-10 rounded-full bg-[#F3F1F6] flex m-auto justify-center">
              <Image
                src="/icons/security.svg"
                alt="security"
                width={24}
                height={24}
              />
            </div>
            <span className="text-raiz-gray-950 text-[15px] font-semibold leading-snug tracking-tight">
              Account Security
            </span>
          </div>
          <Image
            src="/icons/arrow-right.svg"
            alt="arrow-right"
            width={18}
            height={18}
          />
        </button>
      </div>
    </div>
  );
};

export default HelpCenter;
