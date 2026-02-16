"use client";
import { ITransaction } from "@/types/transactions";
import Image from "next/image";
import React from "react";
import SideModalWrapper from "../SideModalWrapper";
import {
  convertTime,
  copyToClipboard,
  getCurrencySymbol,
  truncateString,
} from "@/utils/helpers";
import ListDetailItem from "@/components/ui/ListDetailItem";
import dayjs from "dayjs";
import Button from "@/components/ui/Button";

interface Props {
  close: () => void;
  transaction: ITransaction;
  goNext: () => void;
}

const TxnReceiptDetail = ({ close, transaction, goNext }: Props) => {
  const status = transaction?.transaction_status?.transaction_status;

  // Function to handle mailto link click with fallback
  const handleSupportClick = () => {
    const emailSubject = encodeURIComponent(
      `Payment Issue - Transaction ${transaction.transaction_reference}`
    );
    const emailBody = encodeURIComponent(
      `Hello Support Team,\n\nI'm having an issue with a payment. Here are the details:\n` +
        `Reference No: ${transaction.transaction_reference}\n` +
        `Amount: ${getCurrencySymbol(
          transaction.currency
        )}${transaction.transaction_amount.toFixed(2)}\n` +
        `Date: ${dayjs(convertTime(transaction.transaction_date_time)).format(
          "MMM DD, YYYY"
        )}\n` +
        `Status: ${transaction.transaction_status.transaction_status}\n\n` +
        `Please assist me with this matter.\nThank you!`
    );
    const mailtoLink = `mailto:support@raiz.app?subject=${emailSubject}&body=${emailBody}`;

    // Attempt to open the mailto link
    const newWindow = window.open(mailtoLink, "_blank");

    // Fallback if the email client doesn't open (e.g., after a short delay)
    setTimeout(() => {
      if (
        !newWindow ||
        newWindow.closed ||
        typeof newWindow.closed === "undefined"
      ) {
        alert(
          "It seems your email client is not configured. Please contact support at support@raiz.app or visit our support page at https://www.raiz.app/contact-us"
        );
      }
    }, 1000);
  };

  return (
    <SideModalWrapper close={close} wrapperStyle={`bg-[#F3F1F6]`}>
      <div className={`flex flex-col h-screen`}>
        <button onClick={close}>
          <Image src={"/icons/close.svg"} width={16} height={16} alt="close" />
        </button>
        <div className="flex flex-col justify-between h-[90%] mt-2">
          <div className="w-full bg-white">
            <div className="w-full mt-[26px] shadow-[0px_7.342465877532959px_22.02739715576172px_0px_rgba(170,170,170,0.12)] rounded-xl inline-flex flex-col justify-center items-center gap-5">
              {/* Status */}
              <div className="relative px-6 py-5 flex w-full flex-col justify-center items-center gap-1 pb-5 border-b border-dashed">
                <Image
                  src={`/icons/status-${
                    status === "completed"
                      ? "success"
                      : status === "failed"
                      ? "failed"
                      : "pending"
                  }.svg`}
                  width={64}
                  height={64}
                  alt="status"
                />
                <p className="text-center capitalize text-zinc-900 text-opacity-80 text-sm font-normal leading-none">
                  Payment {transaction.transaction_status.transaction_status}!
                </p>
                <p className="text-zinc-900 text-xl font-bold leading-normal">
                  {getCurrencySymbol(transaction.currency)}
                  {transaction?.transaction_amount?.toLocaleString()}
                </p>
                <div className="w-5 h-4 rounded-full bg-[#F3F1F6] absolute left-[-10px] top-1/2" />
                <div className="w-5 h-4 rounded-full bg-[#F3F1F6] absolute right-[-10px] top-1/2" />
              </div>

              {/* Details */}
              <div className="flex flex-col px-6 py-5 gap-3 w-full">
                <ListDetailItem
                  title="Transaction Type"
                  value={transaction?.transaction_type.transaction_type}
                />

                <ListDetailItem
                  title="Beneficiary"
                  value={transaction?.third_party_name}
                />

                <ListDetailItem
                  title="Date"
                  value={dayjs(
                    convertTime(transaction?.transaction_date_time)
                  ).format("MMM DD, YYYY")}
                />
                <ListDetailItem
                  title="Purpose"
                  value={transaction?.transaction_remarks}
                />
                <div className="flex justify-between items-center pb-3">
                  <span className="text-xs font-normal leading-tight">
                    Reference No
                  </span>
                  <div className="flex gap-1 items-center">
                    <span className="text-sm text-right font-semibold font-brSonoma leading-tight">
                      {truncateString(transaction?.transaction_reference, 13)}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(transaction?.transaction_reference)
                      }
                    >
                      <Image
                        src={"/icons/copy.svg"}
                        alt={"copy"}
                        width={16}
                        height={16}
                      />
                    </button>
                  </div>
                </div>
                {transaction?.session_id && (
                  <ListDetailItem
                    title="SessionID"
                    value={transaction?.session_id}
                  />
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-normal leading-tight">
                    Status
                  </span>
                  <span
                    className={`${
                      status === "completed"
                        ? "text-green-600"
                        : status === "failed"
                        ? "text-red-600"
                        : "text-orange-400"
                    } text-sm font-semibold leading-snug capitalize`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSupportClick}
              className="mt-5 px-4 py-5 rounded-xl bg-gray-100 flex gap-2 w-full"
            >
              <svg width="43" height="42" viewBox="0 0 43 42" fill="none">
                <rect
                  x="0.0273438"
                  width="42"
                  height="42"
                  rx="21"
                  fill="#F0F2F5"
                />
                <path
                  d="M30 21C30 16.0291 25.9709 12 21 12C16.0291 12 12 16.0291 12 21C12 25.9699 16.0291 30 21 30C25.9709 30 30 25.9699 30 21Z"
                  stroke="#5633E3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.9473 25.2245V25.1963"
                  stroke="#5633E3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.9462 22.7496C20.9345 21.8583 21.745 21.4808 22.3473 21.1373C23.0819 20.7326 23.5791 20.0875 23.5791 19.1933C23.5791 17.8681 22.5078 16.8047 21.1914 16.8047C19.8662 16.8047 18.8027 17.8681 18.8027 19.1933"
                  stroke="#5633E3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex gap-3 items-center">
                <div className="flex flex-col gap-1">
                  <p className="text-zinc-900 text-opacity-90 text-sm font-semibold leading-none">
                    Trouble with this payment?
                  </p>
                  <p className="text-zinc-900 text-opacity-60 text-xs font-normal leading-none">
                    Contact the Support team now!
                  </p>
                </div>
                <Image
                  src={"/icons/arrow-right.svg"}
                  alt=""
                  width={20}
                  height={20}
                />
              </div>
            </button>
          </div>
          <div className="flex flex-col w-full py-5">
            <Button
              onClick={goNext}
              className="gap-1.5 items-center"
              variant="secondary"
            >
              <Image src={"/icons/upload.svg"} alt="" width={24} height={24} />
              Share Receipt
            </Button>
          </div>
        </div>
      </div>
    </SideModalWrapper>
  );
};

export default TxnReceiptDetail;
