import React from "react";
import Image from "next/image";
import LabelValueDisplay from "@/components/ui/LabelValueDisplay";
import { copyToClipboard } from "@/utils/helpers";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface Props {
  close: () => void;
}

const PayWithBankTransfer = ({ close }: Props) => {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div>
        <button className="mt-12" onClick={close}>
          <Image
            src={"/icons/arrow-left.svg"}
            alt="back"
            width={18.48}
            height={18.48}
          />
        </button>
        <div className="flex justify-between mt-4 mb-11">
          <div className="">
            <h5 className="text-raiz-gray-950 text-xl lg:text-[23px] font-semibold leading-10">
              Pay with Bank Transfer
            </h5>
            <p className="text-raiz-gray-700 text-[15px] font-normal leading-snug">
              Send money through an bank transfer
            </p>
          </div>
          <div className="w-10  h-10">
            <svg width="40" height="41" viewBox="0 0 40 41" fill="none">
              <path
                opacity="0.35"
                d="M30 10.48H20V3.81331H13.3333V10.48H10C7.23833 10.48 5 12.7183 5 15.48V30.48C5 33.2416 7.23833 35.48 10 35.48H30C32.7617 35.48 35 33.2416 35 30.48V15.48C35 12.7183 32.7617 10.48 30 10.48Z"
                fill="#C6ADD5"
              />
              <path
                d="M29.1667 25.48C30.5475 25.48 31.6667 24.3607 31.6667 22.98C31.6667 21.5993 30.5475 20.48 29.1667 20.48C27.786 20.48 26.6667 21.5993 26.6667 22.98C26.6667 24.3607 27.786 25.48 29.1667 25.48Z"
                fill="#493260"
              />
              <path
                d="M10 7.14665V10.48H15V3.81331H13.3333C11.4917 3.81331 10 5.30498 10 7.14665Z"
                fill="#733B9C"
              />
              <path
                d="M18.3333 10.48H26.6666V7.14665C26.6666 5.30498 25.1749 3.81331 23.3333 3.81331H18.3333V10.48Z"
                fill="#733B9C"
              />
            </svg>
          </div>
        </div>
        <div
          className={`flex h-11 p-1 bg-[#FCFCFD] border-4 border-[#F3F1F6] rounded-2xl justify-center items-center `}
        >
          <h5 className="text-raiz-gray-950 text-sm font-bold">
            Bank Transfer
          </h5>
        </div>
        <div className="p-7 bg-violet-100/60 rounded-[20px] inline-flex flex-col justify-center items-center gap-5 w-full my-[30px]">
          <LabelValueDisplay label="Bank Name" value="Providus Bank Plc" />
          <LabelValueDisplay label="Account Number">
            <>
              <p className="text-center text-zinc-900 text-lg font-semibold leading-normal">
                {"1223445996"}
              </p>
              <button onClick={() => copyToClipboard("1223445996")}>
                <Image
                  src="/icons/copy.svg"
                  alt="copy"
                  width={16}
                  height={16}
                />
              </button>
            </>
          </LabelValueDisplay>
          <LabelValueDisplay label="Beneficiary" value="Raiz App" />
        </div>
      </div>
      <div>
        <Button onClick={() => {}} className="mt-5 mb-4">
          I&apos;ve Sent the Money
        </Button>
        <p className="text-[13px] text-raiz-gray-900  text-center mt-2">
          Don&#39;t have Raiz? <Link
            target="_blank"
            className="font-bold"
            href={"https://raizapp.onelink.me/RiOx/webdirect"}
          >
            Download
          </Link> Raiz app |  <Link
            target="_blank"
            className="font-bold"
           href={"/register"}
          >
            Sign up{" "}
          </Link>{" "} on Raiz Business

        </p>
      </div>
    </div>
  );
};

export default PayWithBankTransfer;
