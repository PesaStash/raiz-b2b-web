"use client";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
import ListDetailItem from "../ui/ListDetailItem";
import dayjs from "dayjs";
import { convertTime } from "@/utils/helpers";
import html2canvas from "html2canvas";
import { ITransaction } from "@/types/transactions";
import { useUser } from "@/lib/hooks/useUser";
import QRCode from "react-qr-code";

export interface IRaizReceipt {
  close: () => void;
  data: ITransaction;
  type?: "guest";
  senderName?: string;
  beneficiaryName?: string
}

const RaizReceipt = ({ close, data, type, senderName, beneficiaryName }: IRaizReceipt) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const handleShareReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      // Convert the receipt component to canvas
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        y: receiptRef.current.offsetTop - 24, // Adjust to capture the logo
        height: receiptRef.current.offsetHeight + 24, // Include extra space for logo
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `receipt-${data?.transaction_reference}.png`;
      link.href = dataUrl;
      link.click();

      link.remove();
    } catch (error) {
      console.error("Error generating receipt:", error);
      alert("Failed to generate receipt. Please try again.");
    }
  };
  const { user } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      handleShareReceipt();
      // Optionally close the modal after download
      // close();
    }, 500);

    // Cleanup timeout on unmount
    return () => clearTimeout(timer);
  }, []);

  const getSender = () => {
    let sender = "";
    if (type === "guest" && senderName) {
      return senderName;
    }

    if (data?.transaction_type?.transaction_type === "credit") {
      sender = data.third_party_name;
    }

    if (data?.transaction_type?.transaction_type === "debit") {
      sender = user?.business_account?.business_name || "";
    }

    return sender;
  };

  const getBeneficiary = () => {
    let beneficiary = "";
    if (type === "guest" && beneficiaryName) {
      return beneficiaryName;
    }
    if (data?.transaction_type?.transaction_type === "credit") {
      beneficiary = user?.business_account?.business_name || "";
    }

    if (data?.transaction_type?.transaction_type === "debit") {
      beneficiary = data.third_party_name;
    }

    return beneficiary;
  };

  return (
    <div>
      <button onClick={close}>
        <Image src={"/icons/close.svg"} alt="close" width={16} height={16} />
      </button>
      <div className="relative mt-10">
        <div
          ref={receiptRef}
          className="relative flex flex-col items-center justify-center text-zinc-900 border-t border-r border-l rounded-b-xl rounded-t-xl border-stone-700/30 overflow-visible"
        >
          <Image
            className="absolute -top-6 -translate-x-1/2 left-1/2" // Keep original logo positioning
            src={"/icons/logoWText.svg"}
            alt="logo"
            width={55}
            height={55}
          />
          <h6 className="text-zinc-700 text-xs mt-10 font-normal leading-tight">
            Receipt
          </h6>
          <p className="text-zinc-900 text-xl font-bold mt-[5px] leading-normal">
            {data?.currency}
            {data?.transaction_amount?.toLocaleString()}
          </p>
          <div className="flex flex-col gap-2 w-full mt-5 px-5 lg:px-2 xl:px-5 pt-5 border-t border-dashed border-zinc-200">
            <ListDetailItem
              title="Beneficiary"
              value={getBeneficiary() || ""}
            />
            <ListDetailItem title="Sender" value={getSender()} />
            {data?.source_account_number && (
              <ListDetailItem
                title="Account Debited"
                value={data?.source_account_number}
              />
            )}
            {data?.beneficiary_account_number && (
              <ListDetailItem
                title="Receiver Account"
                value={data?.beneficiary_account_number}
              />
            )}
            {data?.beneficiary_bank_name && (
              <ListDetailItem
                title="Receiver Bank"
                value={data?.beneficiary_bank_name}
              />
            )}
            <ListDetailItem
              title="Purpose"
              value={data?.transaction_remarks || ""}
            />
            <ListDetailItem
              title="Date"
              value={dayjs(
                convertTime(data?.transaction_date_time || "")
              ).format("MMM DD, YYYY")}
            />
            <ListDetailItem
              title="Time"
              value={dayjs(
                convertTime(data?.transaction_date_time || "")
              ).format("hh:mm a")}
            />
            <ListDetailItem
              title="Transaction Type"
              value={data?.transaction_type?.transaction_type || ""}
            />
            {data?.session_id && (
              <ListDetailItem
                title="SessionID"
                value={data?.session_id || ""}
              />
            )}
            <ListDetailItem
              title="Reference Number"
              value={data?.transaction_reference || ""}
            />
            <div className="flex justify-between items-center border-t border-zinc-200 pt-[18px]">
              <span className="text-xs font-normal leading-tight">Status</span>
              <span
                className={`${data?.transaction_status?.transaction_status === "completed"
                  ? "text-green-600"
                  : data?.transaction_status?.transaction_status === "failed"
                    ? "text-red-600"
                    : "text-orange-400"
                  } text-sm font-semibold leading-snug capitalize`}
              >
                {data?.transaction_status?.transaction_status}
              </span>
            </div>
          </div>
          <div className="rounded-b-xl mt-7 bg-primary flex gap-3 px-5 py-4 items-center w-full">
            <div className="bg-white flex justify-center items-center w-11 h-11 px-0.5 rounded">
              <QRCode
                value={"https://raizapp.onelink.me/RiOx/webdirect"}
                size={40}
              />
            </div>
            <p className="text-white text-sm font-bold leading-none">
              Download the <span className="text-amber-300">Raiz App</span>{" "}
              using the QR Code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaizReceipt;
