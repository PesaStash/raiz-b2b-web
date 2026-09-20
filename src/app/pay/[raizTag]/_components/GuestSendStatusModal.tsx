"use client";
import FailedStatus from "@/components/transactions/status/FailedStatus";
import PendingStatus from "@/components/transactions/status/PendingStatus";
import SuccessStatus from "@/components/transactions/status/SuccessStatus";
import Overlay from "@/components/ui/Overlay";
import Button from "@/components/ui/Button";
import { GuestPayStatusType } from "@/types/transactions";
import {
  isCancelledAfricaPayinStatus,
  isExpiredAfricaPayinStatus,
  isProcessingAfricaPayinStatus,
  isSuccessAfricaPayinStatus,
} from "@/store/GuestSend";
import { getCurrencySymbol } from "@/utils/helpers";
import Image from "next/image";

interface Props {
  status: GuestPayStatusType;
  close: () => void;
  error: string;
  tryAgain: () => void;
  viewReceipt: () => void;
  currency: string;
  amount: string;
  merchantName: string;
}

const TerminalMessage = ({
  title,
  message,
  tryAgain,
  close,
  icon = "/icons/pending.svg",
}: {
  title: string;
  message: string;
  tryAgain: () => void;
  close: () => void;
  icon?: string;
}) => (
  <div className="w-full h-full bg-gradient-to-l from-indigo-900 to-violet-600 rounded-[36px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.30)] inline-flex flex-col justify-center items-center">
    <div className="flex flex-col justify-between gap-6 h-full pt-[88px] p-[30px] items-center w-full">
      <div className="text-center w-full flex flex-col justify-center items-center">
        <Image src={icon} width={50} height={50} alt={title} />
        <h4 className="mt-[15px] text-gray-100 text-xl font-bold leading-relaxed">
          {title}
        </h4>
        <p className="text-gray-100 mt-3 text-xs font-normal leading-tight text-wrap">
          {message}
        </p>
      </div>
      <div className="flex justify-between w-full gap-[15px]">
        <Button onClick={tryAgain} className="bg-zinc-200 text-zinc-900">
          Start again
        </Button>
        <Button onClick={close} className="bg-indigo-900">
          Done
        </Button>
      </div>
    </div>
  </div>
);

const GuestSendStatusModal = ({
  status,
  close,
  error,
  tryAgain,
  viewReceipt,
  amount,
  currency,
  merchantName,
}: Props) => {
  const amountLabel = `${getCurrencySymbol(currency)}${Number(amount).toLocaleString()}`;

  const displayStatus = () => {
    if (isSuccessAfricaPayinStatus(status)) {
      return (
        <SuccessStatus
          text="Your payment has been confirmed."
          title={`You've successfully sent ${amountLabel} to ${merchantName}`}
          close={close}
          viewReceipt={viewReceipt}
        />
      );
    }

    if (status === "failed") {
      return <FailedStatus close={close} error={error} tryAgain={tryAgain} />;
    }

    if (isExpiredAfricaPayinStatus(status)) {
      return (
        <TerminalMessage
          title="Payment expired"
          message={
            error ||
            "This payment expired before it was completed. Start a new payment to continue."
          }
          tryAgain={tryAgain}
          close={close}
        />
      );
    }

    if (isCancelledAfricaPayinStatus(status)) {
      return (
        <TerminalMessage
          title="Payment cancelled"
          message="This payment was cancelled. You can start a new payment anytime."
          tryAgain={tryAgain}
          close={close}
        />
      );
    }

    if (
      status === "pending" ||
      isProcessingAfricaPayinStatus(status)
    ) {
      return <PendingStatus close={close} />;
    }

    return null;
  };

  return (
    <Overlay close={() => {}} width={"400px"}>
      <div className="flex flex-col h-[400px] sm:h-[488px] w-full from-indigo-900 to-violet-600">
        {displayStatus()}
      </div>
    </Overlay>
  );
};

export default GuestSendStatusModal;
