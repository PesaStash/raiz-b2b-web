"use client";
import React, { useState } from "react";
import Image from "next/image";
import { GetAlipayWechatRateApi } from "@/services/transactions";

interface Props {
  onSelect: (channel: "alipay" | "wechat", rate: string) => void;
}

type Channel = "alipay" | "wechat";

const channels: { key: Channel; label: string; icon: string }[] = [
  { key: "alipay", label: "Alipay", icon: "/icons/alipay.svg" },
  { key: "wechat", label: "WeChat Pay", icon: "/icons/wechat.svg" },
];

const ChannelSelect = ({ onSelect }: Props) => {
  const [loading, setLoading] = useState<Channel | null>(null);
  const [error, setError] = useState<string>("");

  const handleSelect = async (ch: Channel) => {
    setError("");
    setLoading(ch);
    try {
      const rateData = await GetAlipayWechatRateApi(ch);
      onSelect(ch, rateData.rate);
    } catch (err: unknown) {
      const status = (err as { status?: number; response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError(
          "Alipay/WeChat payouts are temporarily unavailable. Please try again later."
        );
      } else {
        setError("Unable to fetch rate. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto no-scrollbar">
      <h3 className="text-raiz-gray-950 text-base font-bold leading-tight mb-2">
        Select payment channel
      </h3>
      <p className="text-raiz-gray-500 text-sm leading-tight mb-8">
        Choose whether you want to pay via Alipay or WeChat Pay.
      </p>

      <div className="flex flex-col gap-4">
        {channels.map((ch) => (
          <button
            key={ch.key}
            onClick={() => handleSelect(ch.key)}
            disabled={loading !== null}
            className="flex items-center gap-4 p-4 rounded-2xl border border-raiz-gray-200 bg-white hover:border-raiz-purple-500 hover:bg-raiz-purple-50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-raiz-gray-100 flex-shrink-0">
              <Image src={ch.icon} alt={ch.label} width={28} height={28} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-raiz-gray-950 text-sm font-bold leading-tight">
                {ch.label}
              </p>
              <p className="text-raiz-gray-500 text-xs leading-tight mt-0.5">
                Send NGN, recipient receives {ch.key === "alipay" ? "Alipay" : "WeChat"} balance
              </p>
            </div>
            {loading === ch.key ? (
              <div className="w-5 h-5 border-2 border-raiz-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="flex-shrink-0 text-raiz-gray-400"
              >
                <path
                  d="M6 3L11 8L6 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ChannelSelect;
