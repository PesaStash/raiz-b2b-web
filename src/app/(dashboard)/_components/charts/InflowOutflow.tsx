"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Filler,
  Title,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import dayjs from "dayjs";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { FetchTransactionReportChartApi } from "@/services/business";
import { useUser } from "@/lib/hooks/useUser";
import { ITxnReportPayload } from "@/types/services";
import { findWalletByCurrency } from "@/utils/helpers";
import { useState } from "react";
import SelectAccount from "../SelectAccount";
import ActivityTypesChart from "./ActivityTypesChart";

ChartJS.register(
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Filler,
  Title,
);

const InflowOutflow = () => {
  const { user } = useUser();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const { selectedCurrency } = useCurrencyStore();
  const [numberOfDays, setNumberOfDays] = useState(30);

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
      "income-expense-chart",
      {
        wallet_id: currentWallet?.wallet_id,
        number_of_days: numberOfDays,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, ITxnReportPayload];
      return FetchTransactionReportChartApi(params);
    },
    enabled: !!currentWallet?.wallet_id,
  });

  const labels =
    data?.analytics?.map((item) => dayjs(item.date).format("MMM D")) ?? [];
  const inflow = data?.analytics?.map((item) => item.credit_amount) ?? [];
  const outflow = data?.analytics?.map((item) => item.debit_amount) ?? [];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${selectedCurrency.sign}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${selectedCurrency.sign}${(value / 1000).toFixed(0)}K`;
    }
    return `${selectedCurrency.sign}${value.toFixed(0)}`;
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Inflow",
        data: inflow,
        borderColor: "#7F56D9",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(127, 86, 217, 0.15)");
          gradient.addColorStop(1, "rgba(127, 86, 217, 0.0)");
          return gradient;
        },
        pointBackgroundColor: "#7F56D9",
        pointBorderColor: "#fff",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: "Outflow",
        data: outflow,
        borderColor: "#B692F6",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(182, 146, 246, 0.15)");
          gradient.addColorStop(1, "rgba(182, 146, 246, 0.0)");
          return gradient;
        },
        pointBackgroundColor: "#B692F6",
        pointBorderColor: "#fff",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#1F2937",
        titleColor: "#F9FAFB",
        bodyColor: "#F9FAFB",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          label: (ctx: TooltipItem<"line">) =>
            `${ctx.dataset.label}: ${formatCurrency(Number(ctx.raw))}`,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: false,
        },
        ticks: {
          color: "#9CA3AF",
          font: {
            size: 12,
            weight: 400,
          },
          autoSkip: true,
          maxTicksLimit: 6,
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          display: false,
          // drawBorder: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  const periodOptions = [
    { label: "Last 7 days", value: 7 },
    { label: "Last 30 days", value: 30 },
    { label: "Last 90 days", value: 90 },
    { label: "Last 365 days", value: 365 },
  ];

  return (
    <div className="bg-white rounded-lg ">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="relative">
          <select
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(Number(e.target.value))}
            className="appearance-none bg-transparent text-raiz-gray-600 text-[13px] font-brSonoma font-medium pr-8 pl-0 py-1 cursor-pointer focus:outline-none"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="#9CA3AF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex items-center gap-5">
          {isLoading ? (
            <Skeleton width={100} height={20} count={2} inline />
          ) : (
            <>
              <div className="flex items-center gap-1">
                <svg
                  width="29"
                  height="29"
                  viewBox="0 0 29 29"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.997 9.13342L19.1506 9.13342L19.1506 16.287"
                    stroke="#079455"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.13317 19.1506L19.0503 9.2334"
                    stroke="#079455"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-semibold text-raiz-gray-900">
                  {formatCurrency(data?.total_income ?? 0)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <svg
                  width="29"
                  height="29"
                  viewBox="0 0 29 29"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.13342 11.9975L9.13342 19.151L16.287 19.151"
                    stroke="#D92D20"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.1506 9.13365L9.2334 19.0508"
                    stroke="#D92D20"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-semibold text-raiz-gray-900">
                  −{formatCurrency(data?.total_expense ?? 0)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[240px]">
        {isLoading ? (
          <Skeleton height={220} width={"92%"} className="mx-5" />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default InflowOutflow;
