"use client";
import React from "react";
import Image from "next/image";
import { IAlipayWechatSendResponse } from "@/types/services";
import Button from "@/components/ui/Button";

interface Props {
  result: IAlipayWechatSendResponse;
  error: string;
  onDone: () => void;
}

const channelLabel: Record<"alipay" | "wechat", string> = {
  alipay: "Alipay",
  wechat: "WeChat Pay",
};

const AlipayWechatStatus = ({ result, error, onDone }: Props) => {
  const ngnAmount = parseFloat(result.naira_amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  });
  const destAmount = parseFloat(result.destination_amount).toLocaleString(
    "en-US",
    { minimumFractionDigits: 2 }
  );
  const label = channelLabel[result.channel];

  return (
    <div className="p-0 md:p-6 h-full flex flex-col items-center justify-between overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 w-full">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
          >
            <circle cx="20" cy="20" r="18" stroke="#F59E0B" strokeWidth="2" />
            <path
              d="M20 12v10M20 28h.01"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <h3 className="text-raiz-gray-950 text-lg font-bold leading-snug mb-2">
            Request submitted
          </h3>
          <p className="text-raiz-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            Your {label} payout request has been created and is being processed.
            We have debited{" "}
            <span className="font-bold text-raiz-gray-950">₦{ngnAmount}</span>{" "}
            from your wallet.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-raiz-gray-100 bg-white overflow-hidden">
          {[
            { label: "Channel", value: (
              <span className="flex items-center justify-end gap-1.5">
                <Image
                  src={`/icons/${result.channel}.svg`}
                  width={16}
                  height={16}
                  alt={label}
                />
                {label}
              </span>
            )},
            { label: "Destination amount", value: `¥${destAmount}` },
            { label: "NGN debited", value: `₦${ngnAmount}` },
            { label: "Status", value: (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium capitalize">
                {result.status}
              </span>
            )},
          ].map((row, i, arr) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-3 ${
                i !== arr.length - 1 ? "border-b border-raiz-gray-100" : ""
              }`}
            >
              <span className="text-raiz-gray-500 text-sm">{row.label}</span>
              <span className="text-raiz-gray-950 text-sm text-right">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="w-full p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-600 text-xs text-center">{error}</p>
          </div>
        )}

        <p className="text-raiz-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
          You will be notified once the payout is completed or if it fails.
          Failed payouts are reversed automatically.
        </p>
      </div>

      <Button
        onClick={onDone}
        width="full"
        className="mt-6"
      >
        Done
      </Button>
    </div>
  );
};

export default AlipayWechatStatus;
