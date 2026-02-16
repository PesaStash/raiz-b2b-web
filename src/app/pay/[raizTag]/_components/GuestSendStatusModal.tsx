"use client";
import FailedStatus from "@/components/transactions/status/FailedStatus";
import PendingStatus from "@/components/transactions/status/PendingStatus";
import SuccessStatus from "@/components/transactions/status/SuccessStatus";
import Overlay from "@/components/ui/Overlay";
import { GuestPayStatusType } from "@/types/transactions";

interface Props {
  status: GuestPayStatusType;
  //   amount: number;
  close: () => void;
  error: string;
  tryAgain: () => void;
  viewReceipt: () => void;
  currency: string;
  amount: string;
  merchantName: string;
}

const GuestSendStatusModal = ({
  status,
  close,
  error,
  tryAgain,
  amount,
  merchantName,
}: Props) => {
  //   const user = {
  //     entity_id: "",
  //     account_name: "",
  //     username: "",
  //     selfie_image: null,
  //   };
  const displayStatus = () => {
    switch (status) {
      //   case "processing":
      //     return (
      //       <LoadingStatus
      //         user={user}
      //         loadingText={`Sending ${currency}${amount} to ${merchantName}`}
      //         type="p2p"
      //       />
      //     );
      case "complete":
        return (
          <SuccessStatus
            text=""
            title={`You've successfully sent $${amount} to ${merchantName}`}
            close={close}
          />
        );
      case "failed":
        return <FailedStatus close={close} error={error} tryAgain={tryAgain} />;
      case "processing":
      case "process":
        return <PendingStatus close={close} />;
      default:
        break;
    }
  };

  return (
    <Overlay close={() => {}} width={"400px"}>
      <div className="flex flex-col h-[400px] sm:h-[488px]  w-full from-indigo-900 to-violet-600">
        {displayStatus()}
      </div>
    </Overlay>
  );
};

export default GuestSendStatusModal;
