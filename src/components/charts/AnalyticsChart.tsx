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
  TooltipItem,
} from "chart.js";
import { IoIosArrowDown } from "react-icons/io";
import { DateOption } from "@/app/(dashboard)/_components/analytics/page";
import dayjs from "dayjs";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import Skeleton from "react-loading-skeleton";

ChartJS.register(
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
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
  data: DataPoint[] | undefined;
  loading: boolean;
  totalIncome: number;
  totalExpenses: number;
}

const AnalyticsChart = ({
  open,
  close,
  opened,
  selectedRange,
  data,
  loading,
  totalExpenses,
  totalIncome,
}: Props) => {
  const labels = data?.map((item) => dayjs(item.date).format("DD MMM"));
  const incomeData = data?.map((item) => item.credit_amount);
  const expensesData = data?.map((item) => item.debit_amount);
  const { selectedCurrency } = useCurrencyStore();
  const chartData = {
    labels,
    datasets: [
      {
        label: "Income",
        data: incomeData,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Expenses",
        data: expensesData,
        borderColor: "#6b21a8",
        backgroundColor: "rgba(107, 33, 168, 0.2)",
        pointBackgroundColor: "#6b21a8",
        pointBorderColor: "#fff",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: TooltipItem<"line">) => {
            const value = context.raw as number;
            return ` ${selectedCurrency.sign}${value.toLocaleString()}`;
          },
        },
        bodyFont: {
          size: 14,
        },
      },
    },
    scales: {
      x: {
        display: false,
        title: {
          display: true,
          text: "Month",
          color: "#6B7280",
          font: {
            weight: 500,
          },
        },
        ticks: {
          color: "#6B7280",
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "USD $",
          color: "#6B7280",
          font: {
            weight: 500,
          },
        },
        ticks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (value: any) => {
            return `${Number(value) / 1000}K`;
          },
          color: "#6B7280",
        },
        grid: {
          color: "#F3F4F6",
        },
      },
    },
  };

  const handleRangeToggle = () => {
    if (opened) {
      close();
    } else {
      open();
    }
  };

  return (
    <div className="h-[370px] w-full p-4 mt-[30px] bg-white rounded-2xl shadow-[0px_3.1904757022857666px_15.952378273010254px_0px_rgba(238,238,238,0.50)] border-[0.80px] border-gray-50">
      <div className="flex justify-between w-full items-center mb-4">
        <h5 className="text-indigo-950 text-lg font-bold leading-tight">
          Analytic Report
        </h5>
        <button
          onClick={handleRangeToggle}
          className="h-8 px-3.5 py-2.5 bg-gray-100 rounded-2xl inline-flex justify-start items-center gap-2"
        >
          <span className="text-zinc-900 text-xs font-medium whitespace-nowrap font-brSonoma leading-tight">
            {selectedRange.label}
          </span>
          <IoIosArrowDown className="text-[#443852] w-4 h-4 " />
        </button>
      </div>
      {loading ? (
        <Skeleton height={150} />
      ) : (
        <div className="relative w-full ">
          <Line data={chartData} options={options} />
        </div>
      )}

      <div className="mt-4 flex justify-center items-center gap-8 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="8"
            viewBox="0 0 18 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.44641 3.99973H16.6012"
              stroke="#0080DA"
              strokeWidth="2.39286"
              strokeLinecap="round"
            />
            <ellipse
              cx="9.02373"
              cy="3.99999"
              rx="3.58929"
              ry="3.57387"
              fill="#0496FF"
            />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="opacity-50 text-zinc-900 text-xs leading-tight">
              Income
            </span>
            <span className="text-slate-800 text-xs font-medium font-brSonoma leading-none">
              {selectedCurrency.sign}
              {totalIncome?.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="w-[0.80px] h-5 bg-slate-300" />
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="8"
            viewBox="0 0 18 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.3988 3.99997H16.5536"
              stroke="#4B0082"
              strokeWidth="2.39286"
              strokeLinecap="round"
            />
            <ellipse
              cx="8.97613"
              cy="3.99999"
              rx="3.58929"
              ry="3.57387"
              fill="#5F1893"
            />
          </svg>

          <div className="flex flex-col gap-1">
            <span className="opacity-50 text-zinc-900 text-xs leading-tight">
              Expenses
            </span>
            <span className="text-slate-800 text-xs font-medium font-brSonoma leading-none">
              {selectedCurrency.sign}
              {totalExpenses?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
