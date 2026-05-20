"use client";
import React from "react";
import Image from "next/image";
import {
  IAlipayWechatAmountQuoteResponse,
  IAlipayWechatBeneficiary,
} from "@/types/services";
import Button from "@/components/ui/Button";

interface Props {
  channel: "alipay" | "wechat";
  beneficiary: IAlipayWechatBeneficiary;
  destinationAmount: string;
  quote: IAlipayWechatAmountQuoteResponse;
  onConfirm: () => void;
  onBack: () => void;
}

const channelLabel: Record<"alipay" | "wechat", string> = {
  alipay: "Alipay",
  wechat: "WeChat Pay",
};

const AlipayWechatSummary = ({
  channel,
  beneficiary,
  destinationAmount,
  quote,
  onConfirm,
  onBack,
}: Props) => {
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Channel",
      value: (
        <span className="flex items-center gap-1.5">
          <Image
            src={`/icons/${channel}.svg`}
            width={16}
            height={16}
            alt={channelLabel[channel]}
          />
          {channelLabel[channel]}
        </span>
      ),
    },
    { label: "Recipient", value: beneficiary.name },
    { label: "Recipient email", value: beneficiary.email },
    {
      label: "Destination amount",
      value: `¥${parseFloat(destinationAmount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`,
    },
    {
      label: "Exchange rate",
      value: `¥1 = ₦${parseFloat(quote.rate).toLocaleString("en-NG")}`,
    },
    {
      label: "You pay (NGN)",
      value: (
        <span className="font-bold text-raiz-gray-950">
          ₦
          {parseFloat(quote.naira_amount).toLocaleString("en-NG", {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto no-scrollbar">
      <button onClick={onBack} className="mb-6 self-start">
        <Image src="/icons/arrow-left.svg" width={18} height={18} alt="back" />
      </button>

      <h3 className="text-raiz-gray-950 text-base font-bold leading-tight mb-2">
        Review transaction
      </h3>
      <p className="text-raiz-gray-500 text-sm leading-tight mb-6">
        Confirm the details below before proceeding.
      </p>

      {beneficiary.qr_code_url && (
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-raiz-gray-100">
            <img
              src={beneficiary.qr_code_url}
              alt="Recipient QR code"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-raiz-gray-100 bg-white overflow-hidden mb-8">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-4 py-3 ${
              i !== rows.length - 1 ? "border-b border-raiz-gray-100" : ""
            }`}
          >
            <span className="text-raiz-gray-500 text-sm">{row.label}</span>
            <span className="text-raiz-gray-950 text-sm text-right max-w-[55%]">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <p className="text-raiz-gray-400 text-xs text-center mb-4 leading-relaxed">
          Your NGN wallet will be debited immediately. This request is processed
          manually and may take some time to complete.
        </p>
        <Button
          onClick={onConfirm}
          width="full"
        
        >
          Confirm & enter PIN
        </Button>
      </div>
    </div>
  );
};

export default AlipayWechatSummary;
