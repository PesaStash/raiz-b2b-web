import React from "react";
import {
  FlowCard,
  FlowActions,
  FlowRow,
  useSendFlow,
} from "../transactions/send-flow/Flow";
import FlowOverlay from "../transactions/send-flow/FlowOverlay";
import SendProcessing from "../transactions/send-flow/SendProcessing";
import Image from "next/image";
import { useSendStore } from "@/store/Send";
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
  IAlipayWechatBeneficiary,
  IExternalAccount,
  IForeignBeneficiary,
  ISwiftBeneficiary,
} from "@/types/services";

export type BeneficiaryType =
  | ISearchedUser
  | IExternalAccount
  | EntityBeneficiary
  | EntityForeignPayoutBeneficiary
  | IForeignBeneficiary
  | ISwiftBeneficiary
  | IAlipayWechatBeneficiary;
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
  /** Overrides the default “Sending {amount} to {name}” loading title. */
  processingTitle?: string;
  /** Overrides the default loading subtitle. */
  processingSubtitle?: string;
}

const getAccountName = (user: BeneficiaryType): string => {
  if ("alipay_wechat_beneficiary_id" in user) return user.name || "";
  if ("account_name" in user) return user.account_name;
  if ("bank_account_name" in user) return user?.bank_account_name || "";
  if ("usd_beneficiary" in user) return user.usd_beneficiary.account_name || "";
  if ("foreign_currency_beneficiary" in user)
    return user.foreign_currency_beneficiary.account_name || "";
  if ("foreign_payout_beneficiary" in user)
    return user.foreign_payout_beneficiary.beneficiary_name || "";
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
  processingTitle,
  processingSubtitle,
}: Props) => {
  const flow = useSendFlow();
  const transaction = useSendStore((state) => state.transactionDetail);
  const accountName = getAccountName(user);
  const formattedAmount = formatAmount(amount, currency);
  if (flow) {
    if (status === "loading") {
      return (
        <SendProcessing
          title={
            processingTitle ?? `Sending ${formattedAmount} to ${accountName}`
          }
          subtitle={processingSubtitle}
        />
      );
    }
    const title =
      status === "success"
        ? `${formattedAmount} sent to ${accountName}`
        : status === "pending"
          ? "Your transfer is on its way"
          : "Transfer didn’t go through";
    return (
      <FlowOverlay label={title}>
        <FlowCard className="!gap-5 !pt-9">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="size-24 rounded-full bg-[#EAECFF99] flex items-center justify-center">
              <Image
                src={`/images/send/${status === "success" ? "success" : status === "pending" ? "pending" : "failed"}.svg`}
                width={48}
                height={48}
                alt=""
              />
            </div>
            <h1 className="text-[28px] font-semibold mt-1">{title}</h1>
            <p className="text-sm text-[#79708d]">
              {status === "failed"
                ? error || "Check the recipient details before trying again."
                : status === "pending"
                  ? "We’ll update the transaction when processing is complete."
                  : "Your payment was successful."}
            </p>
          </div>
          <div className="border border-[#eaecf0] rounded-2xl px-4">
            <FlowRow label="Recipient">{accountName}</FlowRow>
            <FlowRow label="Amount">{formattedAmount}</FlowRow>
            <FlowRow label="Status">
              {status === "success"
                ? "Completed"
                : status === "pending"
                  ? "Pending"
                  : status === "failed"
                    ? "Failed"
                    : "Processing"}
            </FlowRow>
            {transaction?.transaction_reference && (
              <FlowRow label="Reference">
                {transaction.transaction_reference}
              </FlowRow>
            )}
          </div>
          {status === "failed" ? (
            <FlowActions
              onBack={close}
              backLabel="Done"
              onNext={tryAgain}
              nextLabel="Check details and try again"
            />
          ) : transaction ? (
            <FlowActions
              onBack={close}
              backLabel="Done"
              onNext={viewReceipt}
              nextLabel="View transfer details"
            />
          ) : (
            <FlowActions onNext={close} nextLabel="Done" />
          )}
        </FlowCard>
      </FlowOverlay>
    );
  }
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
