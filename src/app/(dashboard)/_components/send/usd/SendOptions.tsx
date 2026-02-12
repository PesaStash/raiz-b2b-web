import React from "react";
import Image from "next/image";
import { usdSendOptions } from "@/constants/send";
import { useSendStore } from "@/store/Send";

interface Props {
  close: () => void;
}

const SendOptions = ({ close }: Props) => {
  const { actions } = useSendStore();
  return (
    <div>
      <button onClick={close}>
        <Image
          src={"/icons/arrow-left.svg"}
          alt="back"
          width={18.48}
          height={18.48}
        />
      </button>
      <div className="flex justify-between mt-4 mb-11">
        <div className="">
          <h5 className="text-raiz-gray-950 text-[23px] font-semibold leading-10">
            Choose your send option
          </h5>
          <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
            Select your preferred send action
          </p>
        </div>
        <Image
          src={"/icons/send-2.svg"}
          alt="back"
          width={40}
          height={40}
          className="w-10  h-10"
        />
      </div>
      {/* options */}
      <div className="flex flex-col gap-0.5 lg:mt-8 xl:mt-11 pb-10">
        {usdSendOptions.map((each, index) => {
          return (
            <div
              role="button"
              className="px-4 py-5 hover:bg-[#e5ebff]/60 rounded-[20px] justify-between gap-4 items-center inline-flex cursor-pointer"
              key={index}
              onClick={() => actions.selectUSDSendOption(each.key)}
            >
              <div className="flex items-center gap-2">
                <div className="">{each.icon}</div>
                <div className="flex flex-col items-start gap-1">
                  <p className="text-raiz-gray-950 text-sm font-bold  leading-[16.80px]">
                    {each.title}
                  </p>
                  <p className="text-raiz-gray-950 text-[13px] font-normal  leading-[18.20px] text-left">
                    {each.subtitle}
                  </p>
                </div>
              </div>
              <Image
                src={"/icons/arrow-right.svg"}
                alt=""
                width={20}
                height={20}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SendOptions;
