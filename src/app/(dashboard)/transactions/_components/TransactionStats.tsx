"use client";
import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import { useUser } from "@/lib/hooks/useUser";
import { GetTransactionsAnalyticsStatusApi } from "@/services/transactions";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React from "react";
import { GoArrowUp } from "react-icons/go";
import Skeleton from "react-loading-skeleton";

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
          change: 0, // API doesn't return % diff for failed transactions
        },
      ]
    : [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-[2rem] ">
      {isLoading
        ? [1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="p-6 lg:p-3 xl:p-6 bg-raiz-gray-50 rounded-xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border border-raiz-gray-100 flex-col justify-start items-start gap-6 inline-flex w-full"
            >
              <div className="flex justify-between w-full">
                <Skeleton width={150} height={20} />
              </div>
              <div className="flex flex-col w-full justify-between gap-2">
                <Skeleton width="30%" height={15} />
                <div className="flex w-full justify-between items-end gap-3">
                  <Skeleton width={60} height={20} />
                  <Skeleton width={100} height={65} />
                </div>
              </div>
            </div>
          ))
        : txnData.map((each, index) => {
            const value =
              each.change > 0
                ? "positive"
                : each.change < 0
                ? "negative"
                : "zero";

            return (
              <div
                key={index}
                className="p-6 lg:p-3 xl:p-6 bg-raiz-gray-50 rounded-xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border border-raiz-gray-100 flex-col justify-start items-start gap-6 inline-flex w-full"
              >
                <div className="flex justify-between w-full">
                  <span className="text-zinc-900  font-semibold">
                    {each.title}
                  </span>
                  {/* <button>
                <Image
                  src={"/icons/more.svg"}
                  alt="options"
                  width={20}
                  height={20}
                />
              </button> */}
                </div>
                <div className="flex flex-col w-full justify-between  ">
                  <span className="text-gray-950 text-[1.2rem] xl:text-[2rem] font-semibold font-monzo  leading-[38.40px]">
                    {each.value.toLocaleString()}
                  </span>
                  <div className="flex w-full justify-between items-end gap-2 xl:gap-3">
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
                        } text-center text-[10px] xl:text-sm font-bold leading-[16.80px]`}
                      >
                        {each.change !== 0 ? `${each.change}%` : "0%"}{" "}
                        <span className="text-raiz-gray-700 font-normal">
                          vs last month
                        </span>
                      </span>
                    </div>

                    <Image
                      className="w-[100px]"
                      src={
                        value === "positive"
                          ? "/icons/positiveChart2.svg"
                          : value === "negative"
                          ? "/icons/NegativeChart2.svg"
                          : "/icons/zeroChart.svg"
                      }
                      alt="chart"
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
