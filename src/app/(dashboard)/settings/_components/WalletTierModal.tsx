import Overlay from "@/components/ui/Overlay";
import Image from "next/image";
import React, { useState } from "react";

interface IWalletTierLimit {
  tier: number;
  ngnSingle: number;
  ngnMonthly: number;
  usdSingle: number;
  usdMonthly: number;
}

export const WALLET_TIER_LIMITS: IWalletTierLimit[] = [
  {
    tier: 1,
    ngnSingle: 1_000_000,
    ngnMonthly: 10_000_000,
    usdSingle: 500,
    usdMonthly: 1_500,
  },
  {
    tier: 2,
    ngnSingle: 2_500_000,
    ngnMonthly: 15_000_000,
    usdSingle: 1_000,
    usdMonthly: 5_000,
  },
  {
    tier: 3,
    ngnSingle: 5_000_000,
    ngnMonthly: 25_000_000,
    usdSingle: 2_500,
    usdMonthly: 10_000,
  },
  {
    tier: 4,
    ngnSingle: 10_000_000,
    ngnMonthly: 100_000_000,
    usdSingle: 5_000,
    usdMonthly: 25_000,
  },
  {
    tier: 5,
    ngnSingle: 50_000_000,
    ngnMonthly: 500_000_000,
    usdSingle: 10_000,
    usdMonthly: 50_000,
  },
  {
    tier: 6,
    ngnSingle: 100_000_000,
    ngnMonthly: 1_000_000_000,
    usdSingle: 20_000,
    usdMonthly: 100_000,
  },
  {
    tier: 7,
    ngnSingle: 250_000_000,
    ngnMonthly: 1_000_000_000,
    usdSingle: 25_000,
    usdMonthly: 250_000,
  },
];

const TIER_BADGE_STYLES = [
  { bg: "#EAECFF", text: "#5B3CB1" },
  { bg: "#F3E8FF", text: "#9333EA" },
  { bg: "#FCE7F3", text: "#DB2777" },
  { bg: "#FDDCDA", text: "#DC2626" },
  { bg: "#DBF0FB", text: "#0284C7" },
  { bg: "#FCF6D5", text: "#B99C33" },
  { bg: "#DCFCE7", text: "#16A34A" },
];

const formatAmount = (amount: number, sign: string) =>
  `${sign}${amount.toLocaleString("en-US")}`;

interface Props {
  close: () => void;
  tierName?: string;
  tierCode?: number;
}

const WalletTierModal = ({ close, tierName, tierCode }: Props) => {
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
  const sign = currency === "NGN" ? "₦" : "$";

  return (
    <Overlay width="420px" close={close}>
      <div className="flex flex-col max-h-[85vh] overflow-y-auto no-scrollbar py-8 px-5 text-raiz-gray-950">
        <div className="flex flex-col justify-center items-center gap-1">
          <Image 
            src="/icons/layers.svg"
            alt="wallet tier modal icon"
            width={48}
            height={48}
          />
          {/* {tierName && (
            <p className="uppercase text-center text-[#4F33C4] text-xs font-semibold leading-none mt-[11px]">
              {tierName}
            </p>
          )} */}
          {tierCode !== undefined && (
            <p className="text-center text-raiz-gray-950 text-[23px] font-bold leading-7">
              {tierCode}
            </p>
          )}
          <p className="opacity-50 text-center text-raiz-gray-950 text-xs font-semibold leading-none">
            TIER LEVEL
          </p>
        </div>

        <div className="flex flex-col mt-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold leading-[21px]">
              Levels
            </p>
            <div className="flex items-center bg-raiz-gray-100 rounded-3xl p-0.5">
              {(["NGN", "USD"] as const).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`px-3 py-1 text-xs font-semibold rounded-3xl transition-colors ${
                    currency === cur
                      ? "bg-white text-raiz-gray-950 shadow-sm"
                      : "text-raiz-gray-500"
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
          <p className="text-raiz-gray-950 text-[13px] font-normal leading-tight">
            These limits apply only to <strong>debit transactions</strong>.
            There&apos;s no limit on how much you can receive.
          </p>

          <div className="flex flex-col gap-5 mt-6">
            {WALLET_TIER_LIMITS.map((level, index) => {
              const badge = TIER_BADGE_STYLES[index % TIER_BADGE_STYLES.length];
              const isCurrent = tierCode === level.tier;
              const single =
                currency === "NGN" ? level.ngnSingle : level.usdSingle;
              const monthly =
                currency === "NGN" ? level.ngnMonthly : level.usdMonthly;

              return (
                <div className="flex gap-3" key={level.tier}>
                  <span
                    className="size-7 shrink-0 flex items-center justify-center rounded-full text-sm font-semibold"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {level.tier}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-raiz-gray-950 text-base font-semibold leading-[18px] flex items-center gap-2">
                      Tier {level.tier}
                      {isCurrent && (
                        <span className="text-[10px] font-semibold uppercase text-[#4F33C4] bg-[#EAECFF] rounded-3xl px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </h3>
                    <p className="text-raiz-gray-950 text-[13px] font-normal leading-[18px]">
                      Limit {formatAmount(single, sign)} per transaction and{" "}
                      {formatAmount(monthly, sign)} monthly
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default WalletTierModal;
