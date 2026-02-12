import React from "react";
import Overlay from "../ui/Overlay";
import LoadingStatus from "../transactions/status/LoadingStatus";
import { PaymentStatusType } from "@/types/transactions";
import { ISearchedUser } from "@/types/user";
import { getCurrencySymbol } from "@/utils/helpers";
import PendingStatus from "../transactions/status/PendingStatus";
import FailedStatus from "../transactions/status/FailedStatus";
import SuccessStatus from "../transactions/status/SuccessStatus";
import {
  EntityBeneficiary,
  EntityForeignPayoutBeneficiary,
  IExternalAccount,
} from "@/types/services";

export type BeneficiaryType =
  | ISearchedUser
  | IExternalAccount
  | EntityBeneficiary
  | EntityForeignPayoutBeneficiary;
interface Props {
  status: PaymentStatusType;
  amount: number;
  currency: string;
  user: BeneficiaryType;
  close: () => void;
  error: string;
  tryAgain: () => void;
  viewReceipt: () => void;
  type: "p2p" | "external";
}

const getAccountName = (user: BeneficiaryType): string => {
  if ("account_name" in user) return user.account_name;
  if ("bank_account_name" in user) return user?.bank_account_name || "";
  return "Unknown Account";
};

const formatAmount = (amount: number, currency: string): string =>
  `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;

const PaymentStatusModal = ({
  amount,
  currency,
  user,
  close,
  error,
  status,
  tryAgain,
  viewReceipt,
  type,
}: Props) => {
  const renderStatus = () => {
    const formattedAmount = formatAmount(amount, currency);
    const accountName = getAccountName(user);

    switch (status) {
      case "loading":
        return (
          <LoadingStatus
            user={user}
            loadingText={`Sending ${formattedAmount} to`}
            type={type}
          />
        );
      case "success":
        return (
          <SuccessStatus
            text="Your payment was successful!"
            title={`${formattedAmount} sent to ${accountName}`}
            close={close}
            viewReceipt={viewReceipt}
            beneficiary={user}
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
    <Overlay close={() => {}} width="400px">
      <div className="flex flex-col h-[488px]  w-full from-indigo-900 to-violet-600">
        {renderStatus()}
      </div>
    </Overlay>
  );
};

export default PaymentStatusModal;
