import Button from "@/components/ui/Button";
import ListDetailItem from "@/components/ui/ListDetailItem";
import Overlay from "@/components/ui/Overlay";
import { useGuestSendStore } from "@/store/GuestSend";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";
import React from "react";

interface Props {
  close: () => void;
  goNext: () => void;
  // handlePay: () => void;
  loading: boolean;
  dollarRate: number;
}

const ConfirmPayment = ({ close, goNext, loading, dollarRate }: Props) => {
  const { amount, guestLocalCurrency } = useGuestSendStore();
  const handleSend = () => {
    // handlePay();
    goNext();
  };
  const parsedAmount = Number(amount);
  // + (Number(stripeDetail?.fee) / 100 || 0);
  const totalAmount = dollarRate;
  return (
    <Overlay close={close} width="400px">
      <div className="flex flex-col  h-full py-8 px-5 w-full">
        <div className="flex flex-col items-center justify-center mb-6 text-zinc-900">
          <div className="w-12 h-12 mb-4 flex mx-auto items-center justify-center bg-violet-100 bg-opacity-60 rounded-3xl">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="48"
                height="48"
                rx="24"
                fill="#EAECFF"
                fillOpacity="0.6"
              />
              <path
                d="M32.5 21H16.5C15.395 21 14.5 21.895 14.5 23V31C14.5 32.105 15.395 33 16.5 33H32.5C33.605 33 34.5 32.105 34.5 31V23C34.5 21.895 33.605 21 32.5 21Z"
                fill="#B3DDE7"
              />
              <path
                d="M17.257 21L30.621 18.047C30.856 17.995 31.09 17.994 31.315 18.024L30.198 16.026C29.659 15.062 28.44 14.717 27.476 15.256L17.207 21H17.257Z"
                fill="#B3DDE7"
              />
              <g clipPath="url(#clip0_25216_9252)">
                <path
                  opacity="0.35"
                  d="M24.5 31.1666C26.8012 31.1666 28.6667 29.3012 28.6667 27C28.6667 24.6988 26.8012 22.8333 24.5 22.8333C22.1989 22.8333 20.3334 24.6988 20.3334 27C20.3334 29.3012 22.1989 31.1666 24.5 31.1666Z"
                  fill="#528F3F"
                />
                <path
                  d="M26.5833 26.5833H25.3333C25.1033 26.5833 24.9167 26.3967 24.9167 26.1667V24.9167C24.9167 24.6867 24.73 24.5 24.5 24.5C24.27 24.5 24.0833 24.6867 24.0833 24.9167V26.1667C24.0833 26.3967 23.8967 26.5833 23.6667 26.5833H22.4167C22.1867 26.5833 22 26.77 22 27C22 27.23 22.1867 27.4167 22.4167 27.4167H23.6667C23.8967 27.4167 24.0833 27.6033 24.0833 27.8333V29.0833C24.0833 29.3133 24.27 29.5 24.5 29.5C24.73 29.5 24.9167 29.3133 24.9167 29.0833V27.8333C24.9167 27.6033 25.1033 27.4167 25.3333 27.4167H26.5833C26.8133 27.4167 27 27.23 27 27C27 26.77 26.8133 26.5833 26.5833 26.5833Z"
                  fill="#528F3F"
                />
              </g>
              <path
                d="M31.5 28C32.0523 28 32.5 27.5523 32.5 27C32.5 26.4477 32.0523 26 31.5 26C30.9477 26 30.5 26.4477 30.5 27C30.5 27.5523 30.9477 28 31.5 28Z"
                fill="#528F3F"
              />
              <path
                d="M17.5 28C18.0523 28 18.5 27.5523 18.5 27C18.5 26.4477 18.0523 26 17.5 26C16.9477 26 16.5 26.4477 16.5 27C16.5 27.5523 16.9477 28 17.5 28Z"
                fill="#528F3F"
              />
              <path
                d="M32.5001 21C32.8121 21 33.1041 21.078 33.3671 21.205L33.0051 19.569C32.7671 18.49 31.6991 17.809 30.6211 18.048L17.2571 21H32.5001Z"
                fill="#528F3F"
              />
              <defs>
                <clipPath id="clip0_25216_9252">
                  <rect
                    width="10"
                    height="10"
                    fill="white"
                    transform="translate(19.5 22)"
                  />
                </clipPath>
              </defs>
            </svg>
          </div>
          <p className="text-center text-xl font-bold leading-normal">
            ${formatAmount(Number(totalAmount) || 0)}
          </p>
          <p className="text-center   text-[13px] font-normal my-1 leading-tight">
            Send Summary
          </p>
        </div>
        <div className="flex flex-col h-full justify-between items-center w-full">
          <div className="w-full flex flex-col gap-[15px]">
            {/* <ListDetailItem
              title="You Sent"
              value={`$
              ${amount.toLocaleString()}`}
              border
            /> */}
            <ListDetailItem
              title={`Entered Amount (${
                guestLocalCurrency?.currency || "USD"
              })`}
              value={`${getCurrencySymbol(guestLocalCurrency?.currency || "$")}
              ${formatAmount(parsedAmount || 0)}`}
              border
            />

            <ListDetailItem
              title="You're sending USD Equivalent of:"
              value={`$
              ${formatAmount(dollarRate)}`}
            />
            {/* <ListDetailItem
              title="Transaction fee"
              // value={`$
              // ${((stripeDetail?.fee || 0) / 100).toLocaleString()}`}
              // border
              value={"0"}
            /> */}
          </div>
          <div className="w-full flex flex-col mt-2 gap-3">
            <Button onClick={handleSend} loading={loading}>
              Send
            </Button>
            <Button onClick={close} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default ConfirmPayment;
