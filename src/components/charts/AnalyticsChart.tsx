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
  TooltipItem,
  ChartOptions,
} from "chart.js";
import { IoIosArrowDown } from "react-icons/io";
import { DateOption } from "@/app/(dashboard)/_components/analytics/page";
import dayjs from "dayjs";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import SelectAccount from "@/app/(dashboard)/_components/SelectAccount";
import { useState } from "react";
import CreateNgnAcct from "@/app/(dashboard)/_components/createNgnAcct/CreateNgnAcct";
import CreateCryptoWallet from "@/app/(dashboard)/_components/crypto/dashboard/CreateCryptoWallet";
import { useQuery } from "@tanstack/react-query";
import { FetchTransactionReportChartApi } from "@/services/business";
import { ITxnReportPayload } from "@/types/services";
import { findWalletByCurrency, formatAmount } from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";

ChartJS.register(
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Filler,
);

interface DataPoint {
  date: string;
  credit_amount: number;
  debit_amount: number;
}

interface Props {
  opened: boolean;
  open: () => void;
  close: () => void;
  selectedRange: DateOption;
}

const AnalyticsChart = ({ open, close, opened, selectedRange }: Props) => {
  const [numberOfDays, setNumberOfDays] = useState(30);
  const { selectedCurrency } = useCurrencyStore();
  const [openModal, setOpenModal] = useState<
    "selectAcct" | "createNGN" | "createCrypto" | null
  >(null);

  const { user } = useUser();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const GBPAcct = findWalletByCurrency(user, "GBP");
  const EURAcct = findWalletByCurrency(user, "EUR");
  const SBCAcct = findWalletByCurrency(user, "SBC");

  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    } else if (selectedCurrency.name === "GBP") {
      return GBPAcct;
    } else if (selectedCurrency.name === "EUR") {
      return EURAcct;
    } else if (selectedCurrency.name === "SBC") {
      return SBCAcct;
    }
  };

  const currentWallet = getCurrentWallet();

  const { data, isLoading } = useQuery({
    queryKey: [
      "income-expense-chart",
      {
        wallet_id: currentWallet?.wallet_id,
        number_of_days: numberOfDays,
        // selectedRange.value !== "custom" ? selectedRange?.days : numberOfDays,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, ITxnReportPayload];
      return FetchTransactionReportChartApi(params);
    },
    enabled: !!currentWallet?.wallet_id,
  });

  const labels =
    data?.analytics.map((item) => dayjs(item.date).format("MMM D")) ?? [];
  const incomeData = data?.analytics.map((item) => item.credit_amount) ?? [];
  const expensesData = data?.analytics.map((item) => item.debit_amount) ?? [];

  const openNGNModal = () => {
    setOpenModal("createNGN");
  };

  const openCryptoModal = () => {
    setOpenModal("createCrypto");
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Income",
        data: incomeData,
        borderColor: "#0496FF",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(4, 150, 255, 0.15)");
          gradient.addColorStop(1, "rgba(4, 150, 255, 0.0)");
          return gradient;
        },
        pointBackgroundColor: "#0496FF",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2,
      },
      {
        label: "Expenses",
        data: expensesData,
        borderColor: "#5215B6",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(82, 21, 182, 0.15)");
          gradient.addColorStop(1, "rgba(82, 21, 182, 0.0)");
          return gradient;
        },
        pointBackgroundColor: "#5215B6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
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

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${selectedCurrency.sign}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${selectedCurrency.sign}${(value / 1000).toFixed(0)}K`;
    }
    return `${selectedCurrency.sign}${value.toFixed(0)}`;
  };

  const handleRangeToggle = () => {
    if (opened) {
      close();
    } else {
      open();
    }
  };

  return (
    <>
      <div className="h-[370px] w-full p-4 mt-[30px] bg-raiz-gray-50 rounded-2xl shadow-[0px_3.1904757022857666px_15.952378273010254px_0px_rgba(238,238,238,0.50)] border-[1.5px] border-raiz-gray-100">
        <div className="flex justify-between w-full items-center mb-10">
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
                {selectedCurrency.name !== "SBC"
                  ? selectedCurrency?.name
                  : "Crypto"}
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
          <div className="mt-4 flex justify-center items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#0496FF]" />
              <span className="text-raiz-gray-700 text-sm leading-tight">
                Income
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#5215B6]" />
              <span className="text-raiz-gray-700 text-sm leading-tight">
                Expenses
              </span>
            </div>
          </div>
        </div>

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
                    {formatCurrency(data?.total_income || 0)}
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
                    {formatCurrency(data?.total_expense || 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="relative w-full h-[220px]">
          {isLoading ? (
            <Skeleton height={220} />
          ) : (
            <Line data={chartData} options={options} />
          )}
        </div>

        {openModal === "selectAcct" && (
          <SelectAccount
            close={() => setOpenModal(null)}
            openNgnModal={openNGNModal}
            openCryptoModal={openCryptoModal}
          />
        )}
        {openModal === "createNGN" && (
          <CreateNgnAcct close={() => setOpenModal(null)} />
        )}
        {openModal === "createCrypto" && (
          <CreateCryptoWallet close={() => setOpenModal(null)} />
        )}
      </div>
    </>
  );
};

export default AnalyticsChart;
