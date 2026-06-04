"use client";

import React from "react";
import Image from "next/image";
import { usdSendOptions } from "@/constants/send";
import { useSendStore } from "@/store/Send";
import DailyTransactionLimit from "../DailyTransactionLimit";
import { useQuery } from "@tanstack/react-query";
import { FetchTodayOutflowApi } from "@/services/user";
import { findWalletByCurrency } from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import MobileSheetHeader from "@/components/mobile/MobileSheetHeader";

interface Props {
  close: () => void;
}

const SendOptions = ({ close }: Props) => {
  const { user } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");

  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    }
  };

  const currentWallet = getCurrentWallet();
  const { actions } = useSendStore();
  const { data } = useQuery({
    queryKey: ["today-outflow"],
    queryFn: () => FetchTodayOutflowApi(currentWallet?.wallet_id || ""),
    enabled: !!currentWallet?.wallet_id,
  });
  const dailyLimit =
    user?.business_account?.entity?.wallet_tier?.dollar_limit || 0;

  return (
    <div className="flex flex-col min-h-0">
      {isMobile ? (
        <MobileSheetHeader title="Send money" onBack={close} />
      ) : (
        <button type="button" onClick={close} className="mb-4">
          <Image
            src={"/icons/arrow-left.svg"}
            alt="back"
            width={18.48}
            height={18.48}
          />
        </button>
      )}

      {!isMobile && (
        <div className="flex justify-between mt-4 mb-8">
          <div>
            <h5 className="text-raiz-gray-950 text-xl font-semibold leading-10">
              Choose your send option
            </h5>
            <p className="text-raiz-gray-700 text-sm font-normal leading-5">
              Select your preferred send action
            </p>
          </div>
          <Image
            src={"/icons/send-2.svg"}
            alt=""
            width={40}
            height={40}
            className="w-10 h-10"
          />
        </div>
      )}

      {/* {isMobile && (
        <p className="text-sm text-raiz-gray-600 mb-4">
          How would you like to send USD?
        </p>
      )} */}

      <div className="flex flex-col gap-1 pb-6 p-3 md:p-6 bg-raiz-gray-50 rounded-2xl">
        <DailyTransactionLimit limit={dailyLimit} used={data || 0} />
        {usdSendOptions.map((each, index) => (
          <button
            type="button"
            key={index}
            className="w-full px-4 py-4 md:py-5 hover:bg-[#e5ebff]/60 active:bg-[#e5ebff]/40 rounded-2xl flex justify-between gap-4 items-center text-left transition-colors"
            onClick={() => actions.selectUSDSendOption(each.key)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">{each.icon}</div>
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <p className="text-raiz-gray-950 text-sm font-bold leading-tight">
                  {each.title}
                </p>
                <p className="text-raiz-gray-600 text-xs md:text-[13px] leading-snug">
                  {each.subtitle}
                </p>
              </div>
            </div>
            <Image
              src={"/icons/arrow-right.svg"}
              alt=""
              width={20}
              height={20}
              className="shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SendOptions;
