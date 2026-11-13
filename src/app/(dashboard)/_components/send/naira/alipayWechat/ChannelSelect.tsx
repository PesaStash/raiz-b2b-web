"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  FlowHeader,
  FlowCard,
  FlowActions,
} from "@/components/transactions/send-flow/Flow";

interface Props {
  onBack: () => void;
  onSelect: (channel: "alipay" | "wechat") => void;
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

const ChannelSelect = ({ onSelect, onBack }: Props) => {
  const [selected, setSelected] = useState<Channel>("alipay");
  return (
    <>
      <FlowHeader
        title="China Pay"
        subtitle="Send CNY to Alipay or WeChat Pay"
        onBack={onBack}
      />
      <FlowCard>
        <h2 className="text-sm font-semibold">Payment type</h2>
        {channels.map((ch) => (
          <button
            key={ch.key}
            type="button"
            aria-pressed={selected === ch.key}
              onClick={() => setSelected(ch.key)}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left ${selected === ch.key ? "border-primary2 bg-[#f3f1fd]" : "border-[#eaecf0]"}`}
          >
            <Image src={ch.icon} width={28} height={28} alt="" />
            <span className="flex-1">
              <strong className="block text-sm">{ch.label}</strong>
              <span className="text-xs text-[#79708d]">{ch.description}</span>
            </span>
            <span
              aria-hidden
              className={`size-5 rounded-full border-2 ${selected === ch.key ? "border-primary2 bg-primary2 ring-4 ring-inset ring-white" : "border-[#c9c5d4]"}`}
            />
          </button>
        ))}
        <FlowActions
          onNext={() => onSelect(selected)}
          tone="purple"
        />
      </FlowCard>
    </>
  );
};
export default ChannelSelect;
