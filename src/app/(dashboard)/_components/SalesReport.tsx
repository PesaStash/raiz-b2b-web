"use client";
import LineChart from "@/components/charts/LineChart";
import { months } from "@/constants/misc";
import { useUser } from "@/lib/hooks/useUser";
import { FetchTransactionReportChartApi } from "@/services/business";
import { ITxnReportPayload } from "@/types/services";
import {
  findWalletByCurrency,
  getDaysBetween,
  getLastThreeMonths,
} from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import dayjs from "dayjs";
import Analytics from "./analytics/page";
import { useCurrencyStore } from "@/store/useCurrencyStore";

export type PeriodTitle =
  | "12 months"
  | "3 months"
  | "30 days"
  | "7 days"
  | "24 hours";

const SalesReport = () => {
  const [showModal, setShowModal] = useState(false);
  const periodTabs: { title: PeriodTitle; labels: string[]; day: number }[] = [
    {
      title: "12 months",
      labels: months,
      day: getDaysBetween(dayjs().subtract(1, "year"), dayjs()),
    },
    {
      title: "3 months",
      labels: getLastThreeMonths(),
      day: getDaysBetween(dayjs().subtract(3, "month"), dayjs()),
    },
    {
      title: "30 days",
      labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
      day: 30,
    },
    {
      title: "7 days",
      labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      day: 7,
    },
    {
      title: "24 hours",
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      day: 1,
    },
  ];
  const [activePeriod, setActivePeriod] = useState(periodTabs[0]);
  const { user } = useUser();
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
  const { data, isLoading } = useQuery({
    queryKey: [
      "sales-sreport",
      { wallet_id: currentWallet?.wallet_id, number_of_days: activePeriod.day },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, ITxnReportPayload];
      return FetchTransactionReportChartApi(params);
    },
    enabled: !!currentWallet?.wallet_id,
  });

  const formatDateLabel = (date: string, period: PeriodTitle) => {
    switch (period) {
      case "12 months":
        return dayjs(date).format("MMM"); // "Jan", "Feb", etc.
      case "3 months":
        return dayjs(date).format("MMM DD"); // "Mar 07", "Mar 08"
      case "30 days":
        return dayjs(date).format("DD"); // "07", "08"
      case "7 days":
        return dayjs(date).format("ddd"); // "Mon", "Tue"
      case "24 hours":
        return dayjs(date).format("HH:00"); // "14:00", "15:00"
      default:
        return date; // Fallback to raw date
    }
  };

  const chartData = {
    labels:
      data?.analytics.map((item) =>
        formatDateLabel(item.date, activePeriod.title)
      ) || [],
    data: data?.analytics.map((item) => item.credit_amount) || [],
    actualData: data?.analytics.map((item) => item.credit_amount) || [],
  };

  return (
    <div className=" h-[361px] w-full mt-6 bg-raiz-gray-50 rounded-xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border border-raiz-gray-100 flex-col justify-start items-start inline-flex p-6">
      <div className="flex justify-between items-center w-full">
        <h6 className="text-raiz-gray-950 text-lg font-bold   leading-snug">
          Sales Report
        </h6>
        <button
          onClick={() => setShowModal(true)}
          className="h-[37px]  px-3.5 py-2.5 bg-raiz-gray-50 hover:border-raiz-gray-200 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border border-raiz-gray-100 justify-center items-center gap-1 inline-flex "
        >
          <span className="text-raiz-gray-700 text-sm font-bold  leading-[16.80px]">
            View Report
          </span>
        </button>
      </div>

      {/* periods */}
      <div className="flex gap mt-5 gap-1 items-center">
        {periodTabs.map((tab, i) => (
          <button
            onClick={() => setActivePeriod(tab)}
            key={i}
            className="px-3 py-2 bg-[#fcfcfd] rounded-md justify-center items-center gap-2 inline-flex"
          >
            <span
              className={`${
                activePeriod.title === tab.title
                  ? "text-raiz-gray-700 font-bold"
                  : "text-raiz-gray-600 font-semibold"
              } text-sm   leading-[16.80px]`}
            >
              {tab.title}
            </span>
          </button>
        ))}
      </div>

      {/* chart */}
      <div className="mt-6 w-full">
        <LineChart
          graphData={chartData}
          period={activePeriod.title}
          loading={isLoading}
        />
      </div>

      {showModal && <Analytics close={() => setShowModal(false)} />}
    </div>
  );
};

export default SalesReport;
