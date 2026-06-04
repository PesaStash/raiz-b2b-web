"use client";
import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import { useUser } from "@/lib/hooks/useUser";
import { GetTransactionsAnalyticsStatusApi } from "@/services/transactions";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React from "react";
import { GoArrowUp } from "react-icons/go";
import Skeleton from "react-loading-skeleton";

const MOBILE_LABELS: Record<string, string> = {
  "Completed Transactions": "Completed",
  "Pending Transactions": "Pending",
  "Failed Transactions": "Failed",
};

const TransactionStats = () => {
  const { user } = useUser();
  const currentWallet = useCurrentWallet(user);
  const { data, isLoading } = useQuery({
    queryFn: () =>
      GetTransactionsAnalyticsStatusApi(currentWallet?.wallet_id || null),
    queryKey: ["txn-analytics-status", currentWallet?.wallet_id],
  });
  const txnData = data
    ? [
        {
          title: "Completed Transactions",
          value: data.completed,
          change: data.percentage_completed_difference_since_last_month,
        },
        {
          title: "Pending Transactions",
          value: data.pending,
          change: data.percentage_pending_difference_since_last_month,
        },
        {
          title: "Failed Transactions",
          value: data.failed,
          change: 0,
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 mb-3 md:mb-0 md:grid-cols-2 lg:grid-cols-3 md:gap-5 md:mt-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 md:p-6 bg-white md:bg-raiz-gray-50 rounded-xl border border-raiz-gray-100 md:shadow-sm"
          >
            <Skeleton width="60%" height={12} className="mb-2" />
            <Skeleton width="40%" height={22} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 mb-3 md:mb-0 md:grid-cols-2 lg:grid-cols-3 md:gap-5 md:mt-8">
      {txnData.map((each, index) => {
        const value =
          each.change > 0
            ? "positive"
            : each.change < 0
              ? "negative"
              : "zero";

        return (
          <div
            key={index}
            className="p-3 md:p-6 lg:p-3 xl:p-6 bg-white md:bg-raiz-gray-50 rounded-xl shadow-sm md:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border border-raiz-gray-100 flex flex-col justify-start gap-2 md:gap-6 min-w-0"
          >
            <span className="text-raiz-gray-600 md:text-zinc-900 text-[10px] md:text-base font-semibold leading-tight truncate">
              <span className="md:hidden">{MOBILE_LABELS[each.title]}</span>
              <span className="hidden md:inline">{each.title}</span>
            </span>

            <div className="flex flex-col w-full min-w-0">
              <span className="text-raiz-gray-950 text-xl md:text-[1.2rem] xl:text-[2rem] font-bold md:font-semibold font-monzo leading-tight md:leading-[38.40px]">
                {each.value.toLocaleString()}
              </span>

              <div className="hidden md:flex w-full justify-between items-end gap-2 xl:gap-3 mt-2">
                <div className="flex items-center gap-0.5 whitespace-nowrap">
                  {each.change !== 0 && (
                    <GoArrowUp
                      size={20}
                      className={
                        value === "positive"
                          ? "text-[#079455]"
                          : value === "negative"
                            ? "text-[#D92D20] rotate-180"
                            : ""
                      }
                    />
                  )}
                  <span
                    className={`${
                      value === "positive"
                        ? "text-raiz-success-500"
                        : value === "negative"
                          ? "text-raiz-error"
                          : "text-raiz-gray-700"
                    } text-center text-sm font-bold leading-[16.80px]`}
                  >
                    {each.change !== 0
                      ? `${each.change.toFixed(2)}%`
                      : "0%"}{" "}
                    <span className="text-raiz-gray-700 font-normal">
                      vs last month
                    </span>
                  </span>
                </div>

                <Image
                  className="w-[100px] shrink-0"
                  src={
                    value === "positive"
                      ? "/icons/positiveChart2.svg"
                      : value === "negative"
                        ? "/icons/NegativeChart2.svg"
                        : "/icons/zeroChart.svg"
                  }
                  alt=""
                  width={128}
                  height={64}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionStats;
