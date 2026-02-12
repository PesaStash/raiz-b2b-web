import Button from "@/components/ui/Button";
import { useSendStore } from "@/store/Send";
import { convertTime, getCurrencySymbol } from "@/utils/helpers";
import dayjs from "dayjs";
import Image from "next/image";
import React from "react";

interface Props {
  close: () => void;
}

const PendingStatus = ({ close }: Props) => {
  const { transactionDetail } = useSendStore();

  // Function to handle support click with fallback
  const handleSupportClick = () => {
    if (!transactionDetail) {
      alert(
        "Transaction details are unavailable. Please contact support at support@raiz.app or visit https://raiz.app/support."
      );
      return;
    }

    const emailSubject = encodeURIComponent(
      `Payment Issue - Transaction ${
        transactionDetail.transaction_reference || "Unknown"
      }`
    );
    const emailBody = encodeURIComponent(
      `Hello Support Team,\n\nI'm having an issue with a payment. Here are the details:\n` +
        `Reference No: ${transactionDetail.transaction_reference || "N/A"}\n` +
        `Amount: ${
          transactionDetail.currency
            ? `${getCurrencySymbol(transactionDetail.currency)}${
                transactionDetail.transaction_amount?.toFixed(2) || "N/A"
              }`
            : "N/A"
        }\n` +
        `Date: ${
          transactionDetail.transaction_date_time
            ? dayjs(
                convertTime(transactionDetail.transaction_date_time)
              ).format("MMM DD, YYYY")
            : "N/A"
        }\n` +
        `Status: ${
          transactionDetail.transaction_status?.transaction_status || "Pending"
        }\n\n` +
        `Please assist me with this matter.\nThank you!`
    );
    const mailtoLink = `mailto:support@raiz.app?subject=${emailSubject}&body=${emailBody}`;

    // Attempt to open the mailto link
    const newWindow = window.open(mailtoLink, "_blank");

    // Fallback if the email client doesn't open
    setTimeout(() => {
      if (
        !newWindow ||
        newWindow.closed ||
        typeof newWindow.closed === "undefined"
      ) {
        alert(
          "It seems your email client is not configured. Please contact support at support@raiz.app or visit our support page at https://raiz.app/contact-us ."
        );
      }
    }, 1000);
  };
  return (
    <div className="w-full h-full bg-gradient-to-l from-indigo-900 to-violet-600 rounded-[36px]  shadow-[0px_1px_2px_0px_rgba(0,0,0,0.30)] inline-flex flex-col justify-center items-center">
      <div className="flex flex-col justify-between gap-6 h-full pt-[88px] p-[30px] items-center">
        <div className="text-center flex flex-col justify-center items-center">
          <Image
            src={"/icons/pending.svg"}
            width={50}
            height={50}
            alt="pending"
          />
          <h4 className="mt-[15px] text-gray-100 text-xl font-bold leading-relaxed">
            Processing Payment
          </h4>
          <p className="text-gray-100 mt-3 text-xs font-normal leading-tight">
            Your transaction is currently pending. Please wait while we process
            it. This may take a few moments.
          </p>
        </div>
        <div className="flex justify-between w-full gap-[15px]">
          <Button
            onClick={handleSupportClick}
            className="bg-zinc-200 text-zinc-900  whitespace-nowrap"
          >
            Contact Support
          </Button>

          <Button onClick={close} className="bg-indigo-900 w-1/2">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingStatus;
