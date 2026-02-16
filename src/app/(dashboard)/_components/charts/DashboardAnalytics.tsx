"use client";
import Image from "next/image";
import InflowOutflow from "./InflowOutflow";
import ActivityTypesChart from "./ActivityTypesChart";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { findWalletByCurrency } from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";
import { useState } from "react";
import SelectAccount from "../SelectAccount";

const DashboardAnalytics = () => {
  const [openModal, setOpenModal] = useState<
    "selectAcct" | "createNGN" | "createCrypto" | null
  >(null);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const { user, refetch, isLoading, setShowBalance, showBalance } = useUser();
  const { selectedCurrency } = useCurrencyStore();
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

  const openNGNModal = () => {
    setOpenModal("createNGN");
  };

  const openCryptoModal = () => {
    setOpenModal("createCrypto");
  };

  const chartTypeArr = [
    {
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.49023 13.4448C1.69298 13.9232 2.07719 14.3066 2.55566 14.5093C2.13661 14.3321 1.78994 14.0167 1.57422 13.6196L1.49023 13.4448Z"
            className={`${chartType === "line" ? "stroke-[#1E1924] fill-[#1E1924]" : " stroke-[#E4E0EA] fill-[#E4E0EA]"} `}
          />
          <path
            d="M3.33289 11.8335C3.21956 11.8335 3.09956 11.7935 3.00622 11.7135C2.79956 11.5335 2.77289 11.2202 2.95289 11.0069L6.01289 7.43354C6.34622 7.04687 6.82622 6.81354 7.33289 6.79354C7.83956 6.78021 8.33956 6.96687 8.69956 7.32687L9.33289 7.96021C9.49956 8.12687 9.71289 8.20687 9.95289 8.20687C10.1862 8.20021 10.3996 8.09354 10.5529 7.91354L13.6129 4.34021C13.7929 4.13354 14.1062 4.10687 14.3196 4.28687C14.5262 4.46687 14.5529 4.78021 14.3729 4.99354L11.3129 8.56687C10.9796 8.95354 10.4996 9.18687 9.99289 9.20687C9.47956 9.22021 8.98622 9.03354 8.62622 8.67354L7.99956 8.04021C7.83289 7.87354 7.61289 7.78687 7.37956 7.79354C7.14622 7.80021 6.93289 7.90687 6.77956 8.08687L3.71956 11.6602C3.61289 11.7735 3.47289 11.8335 3.33289 11.8335Z"
            className={`${chartType === "line" ? "stroke-[#1E1924] fill-[#1E1924]" : " stroke-[#E4E0EA] fill-[#E4E0EA]"} `}
          />
        </svg>
      ),
      type: "line",
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M14.6668 14.6665H1.3335C1.06016 14.6665 0.833496 14.4398 0.833496 14.1665C0.833496 13.8932 1.06016 13.6665 1.3335 13.6665H14.6668C14.9402 13.6665 15.1668 13.8932 15.1668 14.1665C15.1668 14.4398 14.9402 14.6665 14.6668 14.6665Z"
            className={`${chartType === "bar" ? "stroke-[#1E1924] fill-[#1E1924]" : " stroke-[#E4E0EA] fill-[#E4E0EA]"} `}
          />
          <path
            d="M6.5 2.66683V14.6668H9.5V2.66683C9.5 1.9335 9.2 1.3335 8.3 1.3335H7.7C6.8 1.3335 6.5 1.9335 6.5 2.66683Z"
            className={`${chartType === "bar" ? " stroke-[#1E1924] fill-[#1E1924]" : "stroke-[#E4E0EA] fill-[#E4E0EA]"} `}
          />
          <path
            d="M2 6.66683V14.6668H4.66667V6.66683C4.66667 5.9335 4.4 5.3335 3.6 5.3335H3.06667C2.26667 5.3335 2 5.9335 2 6.66683Z"
            className={`${chartType === "bar" ? "stroke-[#1E1924] fill-[#1E1924]" : " stroke-[#E4E0EA] fill-[#E4E0EA]"} `}
          />
          <path
            d="M11.3335 9.99984V14.6665H14.0002V9.99984C14.0002 9.2665 13.7335 8.6665 12.9335 8.6665H12.4002C11.6002 8.6665 11.3335 9.2665 11.3335 9.99984Z"
            className={`${chartType === "bar" ? " stroke-[#1E1924] fill-[#1E1924]" : "stroke-[#E4E0EA] fill-[#E4E0EA]"} `}
          />
        </svg>
      ),
      type: "bar",
    },
  ];

  return (
    <>
      <section className=" w-1/2 flex flex-col  justify-between gap-5 bg-white rounded-2xl border border-[#F3F1F6]">
        {/* Balance info */}
        <div className="gap-3 flex flex-col p-4 ">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <p className="text-raiz-gray-950 text-[29px] font-semibold  leading-9">
                {showBalance
                  ? `${currentWallet ? selectedCurrency.sign : ""} ${
                      currentWallet?.account_balance.toLocaleString() || "0.00"
                    }`
                  : `${currentWallet ? selectedCurrency.sign : ""} X.XX`}
              </p>
              {/* update hide icon here */}
              <button
                className="size-8 flex items-center justify-center"
                onClick={() => setShowBalance(!showBalance)}
              >
                <Image
                  src={`${
                    !showBalance
                      ? "/icons/show-balance.svg"
                      : "/icons/hide-balance.svg"
                  }`}
                  alt={`${!showBalance ? "show balance" : "hide balance"} `}
                  width={18}
                  height={18}
                />
              </button>
            </div>
            <div className="flex">
              {chartTypeArr.map((each) => (
                <button
                  key={each.type}
                  onClick={() => setChartType(each.type as "bar" | "line")}
                  className={`w-[30px] h-[30px]   ${chartType === each.type ? "bg-[#EAECFF99] border border-[#B692F6]" : "bg-[#F8F7FA] "}  flex items-center justify-center first:rounded-l-lg last:rounded-r-lg`}
                >
                  {each.icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 items-center">
              <Image
                src={selectedCurrency.logo}
                alt={selectedCurrency.name}
                width={16}
                height={16}
                className="size-4 rounded-full"
              />
              <span className="text-sm text-raiz-gray-900">
                {selectedCurrency.name}
              </span>
            </div>
            <div className="size-1 rounded-full bg-raiz-gray-300" />
            <button
              onClick={() => setOpenModal("selectAcct")}
              className="px-3 py-1 bg-violet-100/60 rounded-3xl inline-flex justify-center items-center gap-2"
            >
              <span className=" text-zinc-900 text-xs font-semibold font-brSonoma leading-5">
                Switch Account
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.5195 6.96684L13.9995 4.48682L11.5195 2.00684"
                  stroke="#1E1924"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 4.48682H14"
                  stroke="#1E1924"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.47998 9.03369L2 11.5137L4.47998 13.9937"
                  stroke="#1E1924"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 11.5137H2"
                  stroke="#1E1924"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className={`${" h-[300px]"}  w-full`}>
          {chartType === "bar" ? <ActivityTypesChart /> : <InflowOutflow />}
        </div>
      </section>
      {openModal === "selectAcct" && (
        <SelectAccount
          close={() => setOpenModal(null)}
          openNgnModal={openNGNModal}
          openCryptoModal={openCryptoModal}
        />
      )}
    </>
  );
};

export default DashboardAnalytics;
