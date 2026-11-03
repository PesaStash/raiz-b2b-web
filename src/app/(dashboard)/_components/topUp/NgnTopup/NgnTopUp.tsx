"use client";

import { useState } from "react";
import Image from "next/image";
import Overlay from "@/components/ui/Overlay";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import TopUp from "../TopUp";
import PaystackCardTopUp from "./PaystackCardTopUp";

type FundingMethod = "bank-transfer" | "paystack-card";

interface Props {
  close: () => void;
}

const METHODS: { value: FundingMethod; title: string; subtitle: string; icon: string }[] = [
  {
    value: "bank-transfer",
    title: "Bank Transfer",
    subtitle: "Transfer to your Raiz NGN account number",
    icon: "/icons/ngn.svg",
  },
  {
    value: "paystack-card",
    title: "Debit card ",
    subtitle: "Top up with a Nigeria-issued debit card",
    icon: "/icons/bank-cards.svg",
  },
];

const NgnTopUp = ({ close }: Props) => {
  const [method, setMethod] = useState<FundingMethod | null>(null);

  if (method === "bank-transfer") {
    return (
      <CenterModalWrapper close={close}>
        <TopUp close={close} />
      </CenterModalWrapper>
    );
  }

  if (method === "paystack-card") {
    return <PaystackCardTopUp close={close} goBack={() => setMethod(null)} />;
  }

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col h-full py-8 px-5">
        <div className="flex justify-between items-start mb-11">
          <div>
            <h3 className="text-zinc-900 text-xl font-bold leading-normal">Add Funds</h3>
            <p className="text-zinc-900 text-xs leading-tight">Select how you want to fund your NGN wallet</p>
          </div>
          <button onClick={close} aria-label="Close" className="hover:opacity-70 transition-opacity">
            <Image src="/icons/close.svg" width={16} height={16} alt="" />
          </button>
        </div>
        <div className="flex flex-col gap-5">
          {METHODS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMethod(option.value)}
              className="border border-zinc-200 rounded-[20px] flex flex-col justify-center items-center w-full pt-[19px] pb-[21px] transition-all hover:border-indigo-900 hover:bg-indigo-50"
            >
              <Image width={30} height={30} src={option.icon} alt="" className="mb-5" />
              <span className="text-zinc-900 text-sm font-bold leading-none">{option.title}</span>
              <span className="text-center text-zinc-900 text-xs font-normal leading-tight mt-1">
                {option.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
};

export default withBusinessWrite(NgnTopUp);
