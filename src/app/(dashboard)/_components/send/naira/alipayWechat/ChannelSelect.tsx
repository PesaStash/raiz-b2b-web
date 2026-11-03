"use client";
import React, { useState } from "react";
import Image from "next/image";
import { GetAlipayWechatRateApi } from "@/services/transactions";
import Button from "@/components/ui/Button";

interface Props {
  onSelect: (channel: "alipay" | "wechat", rate: string) => void;
}

type Channel = "alipay" | "wechat";

const channels: {
  key: Channel;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "alipay",
    label: "Alipay",
    description: "Pay a recipient via Alipay",
    icon: "/icons/alipay.svg",
  },
  {
    key: "wechat",
    label: "WeChat Pay",
    description: "Pay a recipient via WeChat Pay",
    icon: "/icons/wechat.svg",
  },
];

const ChannelSelect = ({ onSelect }: Props) => {
  const [selected, setSelected] = useState<Channel>("alipay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleContinue = async () => {
    setError("");
    setLoading(true);
    try {
      const rateData = await GetAlipayWechatRateApi(selected);
      onSelect(selected, rateData.rate);
    } catch (err: unknown) {
      const status = (
        err as { status?: number; response?: { status?: number } }
      )?.response?.status;
      if (status === 404) {
        setError(
          "Alipay/WeChat payouts are temporarily unavailable. Please try again later.",
        );
      } else {
        setError("Unable to fetch rate. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="relative w-full shrink-0 mb-4">
        <Image
          className="absolute top-1/2 left-3.5 -translate-y-1/2 pointer-events-none"
          src="/icons/search.svg"
          alt=""
          width={20}
          height={20}
        />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter a username or email address"
          className="pl-11 pr-4 h-12 w-full bg-raiz-gray-50 text-sm rounded-2xl border border-raiz-gray-200 focus:outline-none focus:border-primary2/40 focus:ring-2 focus:ring-primary2/10"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="rounded-[20px] bg-raiz-gray-50 p-4 md:p-5">
          <h4 className="text-raiz-gray-950 text-sm font-bold leading-tight">
            Payment type
          </h4>
          <p className="text-raiz-gray-500 text-xs leading-tight mt-1 mb-4">
            Send to Alipay or WeChat Pay (CNY)
          </p>

          <div className="flex flex-col gap-3">
            {channels.map((ch) => {
              const isSelected = selected === ch.key;
              return (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => setSelected(ch.key)}
                  disabled={loading}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl bg-white text-left transition-all duration-200 disabled:opacity-60 ${
                    isSelected
                      ? "border border-raiz-gray-950"
                      : "border border-raiz-gray-200"
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-raiz-gray-50 flex-shrink-0">
                    <Image src={ch.icon} alt={ch.label} width={28} height={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-raiz-gray-950 text-sm font-bold leading-tight">
                      {ch.label}
                    </p>
                    <p className="text-raiz-gray-500 text-xs leading-tight mt-0.5">
                      {ch.description}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
                      isSelected
                        ? "border-[#4C1D95] border-[5px]"
                        : "border-gray-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
      </div>

      <div className="pt-4 shrink-0">
        <Button onClick={handleContinue} width="full" loading={loading}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default ChannelSelect;
