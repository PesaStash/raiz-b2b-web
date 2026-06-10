import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Overlay from "@/components/ui/Overlay";
import { useSendStore } from "@/store/Send";
import React from "react";

interface Props {
  close: () => void;
  goNext: () => void;
}

const ReviewModal = ({ close, goNext }: Props) => {
  const { cryptoAddress, cryptoNetwork } = useSendStore();
  return (
    <Overlay close={close} width="375px" className="!z-[110]">
      <div className="flex flex-col  h-full py-8 px-5 w-full">
        <p className="text-center   text-xl  font-bold mb-4  leading-tight">
          Review Recipient
        </p>
        <div className="flex flex-col gap-5">
          <InputField
            label="Address"
            disabled
            value={cryptoAddress}
            name="address"
            className="pr-12"
            icon={
              <svg
                className=" h-full"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M8.00004 14.6666C11.6667 14.6666 14.6667 11.6666 14.6667 7.99992C14.6667 4.33325 11.6667 1.33325 8.00004 1.33325C4.33337 1.33325 1.33337 4.33325 1.33337 7.99992C1.33337 11.6666 4.33337 14.6666 8.00004 14.6666Z"
                  stroke="#14AA5B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.16663 7.99995L7.05329 9.88661L10.8333 6.11328"
                  stroke="#14AA5B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <InputField
            label="Network of Recipient"
            disabled
            value={cryptoNetwork.toLocaleUpperCase()}
            name="network"
            icon={
              <svg
                className="bg-transparent h-full"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M8.00004 14.6666C11.6667 14.6666 14.6667 11.6666 14.6667 7.99992C14.6667 4.33325 11.6667 1.33325 8.00004 1.33325C4.33337 1.33325 1.33337 4.33325 1.33337 7.99992C1.33337 11.6666 4.33337 14.6666 8.00004 14.6666Z"
                  stroke="#14AA5B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.16663 7.99995L7.05329 9.88661L10.8333 6.11328"
                  stroke="#14AA5B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <Button onClick={goNext}>Confirm</Button>
          <Button variant="secondary" onClick={close}>
            Change Details
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

export default ReviewModal;
