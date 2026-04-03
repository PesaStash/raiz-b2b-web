"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import Image from "next/image";
import React, { useState } from "react";
import SelectChain from "./SelectChain";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

const list = [
  {
    icon: "/icons/send-blue.svg",
    title: "Effortless Crypto Transfers",
    text: "Send USDC or USDT anytime on BNB Smart Chain (BEP20), Tron (TRC20), Ethereum (ERC20), and Solana.",
  },
  {
    icon: "/icons/deposit-c.svg",
    title: "Flexible Deposit Options",
    text: "Fund your wallet via USD deposits, local wallet top-ups, or direct bank transfers.",
  },
  {
    icon: "/icons/swap-c.svg",
    title: "Instant Stablecoin Swaps",
    text: "Quickly swap USDC or USDT to USD directly within your wallet.",
  },
];

const CreateCryptoWallet = ({ close }: { close: () => void }) => {
  const [showModal, setShowModal] = useState(false);

  const openChainModal = () => {
    setShowModal(true);
  };
  return (
    <>
      <div className="w-full  xl:max-h-[85vh] lg:max-h-[80vh] flex flex-col font-brSonoma">
        <CenterModalHeader close={close} />
        <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
          Create Crypto Account
        </h2>
        <div className="flex flex-col text-raiz-gray-950 justify-between gap-8 h-full pb-[30px]">
          <div className="">
            <div className="bg-raiz-gray-50 p-6 rounded-[20px] flex flex-col justify-center  gap-3">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_30165_11156)">
                  <rect width="48" height="48" rx="24" fill="#FDFFF8" />
                  <path
                    d="M21.1667 43.1667C31.476 43.1667 39.8333 34.8094 39.8333 24.5C39.8333 14.1907 31.476 5.83337 21.1667 5.83337C10.8574 5.83337 2.5 14.1907 2.5 24.5C2.5 34.8094 10.8574 43.1667 21.1667 43.1667Z"
                    fill="#C2C1FF"
                  />
                  <path
                    d="M26.7154 28.4317C26.7154 22.3883 20.0444 23.2143 20.0444 20.0643C20.0444 18.2093 21.5027 18.0133 22.0067 18.0133C22.5037 18.0133 22.9447 18.1323 23.318 18.3003C24.1954 18.697 25.236 18.3283 25.7914 17.542C26.503 16.534 26.1344 15.1177 25.0097 14.6113C24.3937 14.3337 23.6237 14.1097 22.6904 14.021V13.1437C22.6904 12.3363 22.0347 11.6807 21.2274 11.6807C20.42 11.6807 19.7644 12.3363 19.7644 13.1437V14.329C17.3167 15.1457 15.7254 17.3857 15.7254 20.2533C15.7254 26.5953 22.3147 25.4497 22.3147 28.7467C22.3147 29.3813 22.0137 30.765 20.3804 30.765C19.6547 30.765 19.027 30.5597 18.516 30.2937C17.6504 29.841 16.5747 30.1747 16.0217 30.982L15.9634 31.0683C15.324 32.0017 15.583 33.3083 16.5653 33.866C17.3913 34.335 18.4017 34.699 19.622 34.8273V35.854C19.622 36.6613 20.2777 37.317 21.085 37.317C21.8924 37.317 22.548 36.6613 22.548 35.854V34.5637C25.257 33.7353 26.7154 31.2667 26.7154 28.4317Z"
                    fill="#0055CC"
                  />
                  <path
                    d="M28.1667 5.83337C26.9697 5.83337 25.8007 5.95704 24.6667 6.17171C33.3024 7.81204 39.8334 15.3884 39.8334 24.5C39.8334 33.6117 33.3024 41.188 24.6667 42.8284C25.8007 43.043 26.9697 43.1667 28.1667 43.1667C38.4754 43.1667 46.8334 34.8087 46.8334 24.5C46.8334 14.1914 38.4754 5.83337 28.1667 5.83337Z"
                    fill="#0055CC"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_30165_11156">
                    <rect width="48" height="48" rx="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>

              <h3 className="  xl:text-xl text-lg font-bold leading-normal mt-2">
                Crypto Account Benefits
              </h3>
              <p className=" xl:text-sm text-xs font-normal  leading-tight">
                Fast, secure, and flexible crypto transactions for easy sending,
                receiving, depositing, and swapping.
              </p>
            </div>
            <div className="bg-raiz-gray-50 p-6 rounded-[20px] flex flex-col gap-[32px] mt-[30px]">
              {list.map((each, index) => (
                <div key={index} className="px-4 flex gap-4 items-start ">
                  <Image
                    src={each.icon}
                    alt={each.title}
                    width={30}
                    height={30}
                  />
                  <div className=" flex flex-col gap-1">
                    <h6 className="text-[13px] xl:text-sm font-bold  leading-[16.80px]">
                      {each.title}
                    </h6>
                    <p className=" text-xs xl:text-[13px] font-normal leading-tight">
                      {each.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button
            onClick={openChainModal}
            className="bg-raiz-crypto-primary  text-raiz-gray-50 hover:bg-raiz-crypto-primary/80 disabled:!bg-slate-500  "
          >
            Create Crypto Wallet
          </Button>
        </div>
      </div>
      {showModal && (
        <SelectChain close={() => setShowModal(false)} done={close} />
      )}
    </>
  );
};

export default CreateCryptoWallet;
