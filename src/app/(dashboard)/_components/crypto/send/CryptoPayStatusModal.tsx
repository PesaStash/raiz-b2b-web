"use client";
import FailedStatus from "@/components/transactions/status/FailedStatus";
import LoadingStatus from "@/components/transactions/status/LoadingStatus";
import PendingStatus from "@/components/transactions/status/PendingStatus";
import SuccessStatus from "@/components/transactions/status/SuccessStatus";
import Overlay from "@/components/ui/Overlay";
import { useSendStore } from "@/store/Send";
import { PaymentStatusType } from "@/types/transactions";
import React from "react";

interface Props {
  close: () => void;
  error: string;
  tryAgain: () => void;
  viewReceipt: () => void;
  status: PaymentStatusType;
  amount: number;
}

const CryptoPayStatusModal = ({
  close,
  tryAgain,
  viewReceipt,
  error,
  status,
  amount,
}: Props) => {
  const { cryptoAddress, cryptoType } = useSendStore();
  const formattedAmount = `${amount} ${cryptoType}`;

  const renderStatus = () => {
    switch (status) {
      case "loading":
        return (
          <LoadingStatus
            loadingText={`Sending ${formattedAmount} to`}
            type={"crypto"}
          />
        );
      case "success":
        return (
          <SuccessStatus
            title={`${formattedAmount}  sent to `}
            text={` ${cryptoAddress}`}
            close={close}
            viewReceipt={viewReceipt}
          />
        );
      case "failed":
        return <FailedStatus close={close} error={error} tryAgain={tryAgain} />;
      case "pending":
        return <PendingStatus close={close} />;
      default:
        return null;
    }
  };
  return (
    <Overlay close={() => {}} width="400px" className="!z-[110]">
      <div className="flex flex-col h-[488px]  w-full from-indigo-900 to-violet-600">
        {renderStatus()}
      </div>
    </Overlay>
  );
};

export default CryptoPayStatusModal;
