"use client";
import React, { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import { RequestStep } from "./Request";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

export interface RequestStepsProps {
  close: () => void;
  setStep: Dispatch<SetStateAction<RequestStep>>;
}

const RequestHome = ({ close, setStep }: RequestStepsProps) => {
  return (
    <>
      <CenterModalHeader close={close} title="Request" />
      <div className="h-full  flex flex-col">
        {/* <h2 className="text-lg md:text-xl font-bold text-raiz-gray-950 mb-3 md:mb-4">
          Request
        </h2> */}
        <div className="flex flex-col justify-between h-full pb-[30px]">
          <div className="flex flex-col justify-center items-center  gap-3">
            <div className="md:my-10 mt-0 mb-5 md:mb-0 md:mt-10 flex  gap-6 flex-col justify-center items-center">
              <div className="flex flex-col bg-raiz-gray-50 items-center md:items-start p-4 md:p-6 rounded-2xl md:rounded-[20px] w-full">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="48" height="48" rx="24" fill="#F3F1F6" />
                  <path
                    d="M14.6668 26.1867C11.7202 26.1867 9.3335 28.5733 9.3335 31.52C9.3335 34.4667 11.7202 36.8533 14.6668 36.8533C17.6135 36.8533 20.0002 34.4667 20.0002 31.52C20.0002 28.5733 17.6135 26.1867 14.6668 26.1867ZM16.0002 31.0933C16.0002 31.9067 15.5602 32.68 14.8669 33.0933L13.8535 33.7067C13.6935 33.8 13.5202 33.8533 13.3468 33.8533C13.0135 33.8533 12.6802 33.68 12.4935 33.3734C12.2135 32.9067 12.3602 32.28 12.8402 32L13.8535 31.3867C13.9468 31.3334 14.0135 31.2133 14.0135 31.1067V29.8667C14.0135 29.32 14.4668 28.8667 15.0135 28.8667C15.5602 28.8667 16.0135 29.32 16.0135 29.8667V31.0933H16.0002Z"
                    fill="#608200"
                  />
                  <path
                    opacity="0.4"
                    d="M37.3332 19.52V27.52C37.3332 32.1867 34.6665 34.1867 30.6665 34.1867H19.2665C19.7332 33.4 19.9998 32.4933 19.9998 31.52C19.9998 28.5733 17.6132 26.1867 14.6665 26.1867C13.0665 26.1867 11.6398 26.8933 10.6665 28V19.52C10.6665 14.8533 13.3332 12.8533 17.3332 12.8533H30.6665C34.6665 12.8533 37.3332 14.8533 37.3332 19.52Z"
                    fill="#3AAA82"
                  />
                  <path
                    d="M23.9998 26.8533C25.8408 26.8533 27.3332 25.361 27.3332 23.52C27.3332 21.6791 25.8408 20.1867 23.9998 20.1867C22.1589 20.1867 20.6665 21.6791 20.6665 23.52C20.6665 25.361 22.1589 26.8533 23.9998 26.8533Z"
                    fill="#608200"
                  />
                  <path
                    d="M32.6665 27.1867C32.1198 27.1867 31.6665 26.7333 31.6665 26.1867V20.8533C31.6665 20.3067 32.1198 19.8533 32.6665 19.8533C33.2132 19.8533 33.6665 20.3067 33.6665 20.8533V26.1867C33.6665 26.7333 33.2132 27.1867 32.6665 27.1867Z"
                    fill="#608200"
                  />
                </svg>
                <h3 className="text-raiz-gray-950 text-sm md:text-xl font-bold leading-normal mt-4 md:mt-5 mb-2 md:mb-3">
                  How Request Works
                </h3>
                <p className="text-raiz-gray-900 text-center md:text-left text-xs md:text-sm font-normal leading-relaxed">
                  Request allows you to ask for money from a single user or a
                  group of users
                </p>
              </div>
              <div className="flex flex-col bg-raiz-gray-50 p-0 md:p-6 rounded-2xl md:rounded-[20px] w-full">
                {/* Single request */}
                <div className="flex gap-4">
                  <Image
                    src={"/icons/single-req.svg"}
                    width={30}
                    height={30}
                    alt=""
                  />
                  <div className="flex flex-col justify-start items-start gap-1">
                    <h6 className="text-raiz-gray-950 text-[13px] md:text-sm font-bold leading-none">
                      Single Request
                    </h6>
                    <p className="text-raiz-gray-950 text-[11px] md:text-xs font-normal leading-relaxed text-left">
                      Single request money allows you to ask a single user for a
                      payment
                    </p>
                  </div>
                </div>

                {/* Multile request */}
                {/* <button className="flex gap-4 mt-[22px]">
              <Image
                src={"/icons/multiple-req.svg"}
                width={30}
                height={30}
                alt=""
              />
              <div className="flex flex-col justify-start items-start gap-1">
                <h6 className="text-neutral-50 text-sm font-bold  leading-none">
                  Multiple Request (Split Bills)
                </h6>
                <p className=" text-neutral-50 text-xs font-normal leading-tight text-left">
                  Multiple request also known as split bills allows you to ask a
                  group of users for a payment
                </p>
              </div>
            </button> */}
              </div>
            </div>
          </div>
          <Button
            onClick={() => setStep("requests")}
            className="w-full !bg-pink-600 text-raiz-gray-50 hover:!bg-pink-700 mt-5 md:mt-0 text-sm md:text-base"
          >
            Continue
          </Button>
        </div>
      </div>
    </>
  );
};

export default RequestHome;
