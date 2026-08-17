"use client";
import CopyButton from "@/components/ui/CopyButton";
import Overlay from "@/components/ui/Overlay";
import { IDeveloperApiKey } from "@/types/services";
import Image from "next/image";

interface Props {
  close: () => void;
  data: IDeveloperApiKey;
}

const NewAPIkeyModal = ({ close, data }: Props) => {
  return (
    <Overlay close={() => {}} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <div className="flex items-center justify-between mb-6">
          <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
            Your New API Key
          </h5>
          <button
            onClick={close}
            className="text-raiz-gray-950 text-xl font-bold  leading-normal"
          >
            <Image
              src={"/icons/close.svg"}
              width={16}
              height={16}
              alt="close"
            />
          </button>
        </div>
        <div className="flex flex-col gap-5">
          <div className="">
            <h6 className="text-raiz-gray-950 text-sm font-semibold font-brSonoma leading-normal mb-1.5">
              key Name
            </h6>
            <p className="text-raiz-gray-950 text-sm font-brSonoma  leading-normal">
              {data?.name}
            </p>
          </div>
          <div className="">
            <h6 className="text-raiz-gray-950 text-sm font-semibold font-brSonoma leading-normal mb-1.5">
              Permissions
            </h6>
            <div className="flex flex-wrap gap-2">
              {data?.permissions?.map((perm, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-zinc-700 bg-white shadow-sm whitespace-nowrap"
                >
                  {perm}
                </div>
              ))}
            </div>
          </div>
          <div className="">
            <h6 className="text-raiz-gray-950 text-sm font-semibold font-brSonoma leading-normal mb-1.5">
              Full API Key
            </h6>
            <div className="flex justify-between rounded-r-lg items-center bg-raiz-gray-100">
              <p
                title={data?.raw_key}
                className="text-raiz-gray-950 p-[15px]  truncate text-sm font-medium font-brSonoma  leading-normal"
              >
                {data?.raw_key ?? "—"}
              </p>
              <div className="size-[50px] flex items-center justify-center">
                {data?.raw_key && (
                  <CopyButton
                    className="bg-raiz-gray-200 size-12 flex items-center"
                    value={data.raw_key}
                    size={20}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="">
            <h6 className="text-raiz-gray-950 text-sm font-semibold font-brSonoma leading-normal mb-1.5">
               API ID
            </h6>
            <div className="flex justify-between rounded-r-lg items-center bg-raiz-gray-100">
              <p
                title={data?.id}
                className="text-raiz-gray-950 p-[15px]  truncate text-sm font-medium font-brSonoma  leading-normal"
              >
                {data?.id}
              </p>
              <div className="size-[50px] flex items-center justify-center">
                <CopyButton
                  className="bg-raiz-gray-200 size-12 flex items-center"
                  value={data?.id}
                  size={20}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#FFF3E666] flex gap-4 p-4 rounded-lg mt-5">
          <div className="size-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.35"
                d="M10.0001 18.3333C14.6025 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6025 1.66663 10.0001 1.66663C5.39771 1.66663 1.66675 5.39759 1.66675 9.99996C1.66675 14.6023 5.39771 18.3333 10.0001 18.3333Z"
                fill="#39A062"
              />
              <path
                d="M9.16675 14.1666V9.99996C9.16675 9.53996 9.54008 9.16663 10.0001 9.16663C10.4601 9.16663 10.8334 9.53996 10.8334 9.99996V14.1666C10.8334 14.6266 10.4601 15 10.0001 15C9.54008 15 9.16675 14.6266 9.16675 14.1666Z"
                fill="#39A062"
              />
              <path
                d="M10 7.5C10.6904 7.5 11.25 6.94036 11.25 6.25C11.25 5.55964 10.6904 5 10 5C9.30964 5 8.75 5.55964 8.75 6.25C8.75 6.94036 9.30964 7.5 10 7.5Z"
                fill="#39A062"
              />
            </svg>
          </div>
          <p className="text-raiz-gray-600 text-[11px] font-brSonoma  leading-normal">
            For security, we only display the full key once. After closing this
            dialog you won”t be able to retrieve it
          </p>
        </div>
      </div>
    </Overlay>
  );
};

export default NewAPIkeyModal;
