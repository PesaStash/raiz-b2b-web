"use client";
import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import { useUser } from "@/lib/hooks/useUser";
import {
  FetchTransactionReportCategoryApi,
  FetchTransactionReportChartApi,
} from "@/services/business";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ITxnReportPayload } from "@/types/services";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useState } from "react";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import EmptyList from "@/components/ui/EmptyList";
import { IoIosArrowDown } from "react-icons/io";

import DateRange from "../transactions/_components/DateRange";
import AnalyticsChart from "@/components/charts/AnalyticsChart";
import RangeModal from "../_components/analytics/RangeModal";
import { findWalletByCurrency } from "@/utils/helpers";

export interface DateOption {
  label: string;
  value: string;
  dateRange: string;
  days: number | null;
}

const AnalyticsPage = () => {
  const getDateRanges = () => {
    const today = dayjs();
    return [
      {
        label: "Weekly",
        value: "weekly",
        dateRange: `${today
          .subtract(7, "day")
          .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
        days: 7,
      },
      {
        label: "Monthly",
        value: "monthly",
        dateRange: `${today
          .subtract(1, "month")
          .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
        days: 30,
      },
      {
        label: "Three (3) Months",
        value: "three_months",
        dateRange: `${today
          .subtract(3, "month")
          .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
        days: 90,
      },
      {
        label: "Six (6) Months",
        value: "six_months",
        dateRange: `${today
          .subtract(6, "month")
          .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
        days: 180,
      },
      {
        label: "1 year",
        value: "one_year",
        dateRange: `${today
          .subtract(1, "year")
          .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
        days: 365,
      },
      // {
      //   label: "Custom",
      //   value: "custom",
      //   dateRange: "Pick a specific period of time to date",
      //   days: null,
      // },
    ];
  };

  const dateRanges = getDateRanges();
  const { selectedCurrency } = useCurrencyStore();
  const [showRange, setShowRange] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateOption>(dateRanges[0]);
  const [showCategoryRange, setShowCategoryRange] = useState(false);
  const [selectedCategoryRange, setSelectedCategoryRange] =
    useState<DateOption>(dateRanges[0]);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const { user } = useUser();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const SBCAcct = findWalletByCurrency(user, "SBC");
  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
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
        number_of_days:
          selectedRange.value !== "custom" ? selectedRange?.days : 0,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, ITxnReportPayload];
      return FetchTransactionReportChartApi(params);
    },
    enabled: !!currentWallet?.wallet_id,
  });
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: [
      "transaction-report-categories",
      {
        wallet_id: currentWallet?.wallet_id,
        number_of_days: selectedCategoryRange.days,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, ITxnReportPayload];
      return FetchTransactionReportCategoryApi(params);
    },
    enabled: !!currentWallet?.wallet_id,
  });
  const handleOpenRange = () => {
    setShowRange(true);
  };
  const handleCloseRange = () => {
    setShowRange(false);
  };

  const handleCustomApply = (range: { startDate?: Date; endDate?: Date }) => {
    const start = dayjs(range.startDate);
    const end = dayjs(range.endDate);
    const daysDiff = end.diff(start, "day") + 1;

    const formatted = `${start.format("DD MMM YYYY")} - ${end.format(
      "DD MMM YYYY",
    )}`;

    setSelectedCategoryRange({
      value: "custom",
      label: "Custom",
      dateRange: formatted,
      days: daysDiff,
    });

    setShowCustomCalendar(false);
  };

  return (
    <section className="mt-4">
      <div className="rounded-[20px] bg-raiz-gray-50 p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-zinc-900 text-2xl font-bold  leading-7 ">
            Report & Analytics
          </h2>
          <button
            onClick={handleOpenRange}
            className="h-8 px-3.5 py-2.5 bg-gray-100 rounded-2xl inline-flex justify-start items-center gap-2"
          >
            <span className="text-zinc-900 text-xs font-medium font-brSonoma leading-tight">
              {selectedRange.label}
            </span>
            <IoIosArrowDown className="text-[#443852] w-4 h-4 " />
          </button>
        </div>
        <div className="flex gap-4 pt-5 mb-8">
          {/* income total */}
          <div className="rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] pl-5 py-3.5  w-1/2 border border-raiz-gray-100 inline-flex flex-col justify-start items-start gap-2 xl:gap-3.5">
            <div className="w-12 h-12 flex items-center justify-center relative bg-violet-100/60 rounded-3xl ">
              <Image
                src={"/icons/income.svg"}
                width={28.8}
                height={28.8}
                alt="income"
              />
            </div>
            <p className=" text-raiz-gray-600 font-semibold text-sm leading-4">
              Income
            </p>
            <p className="text-raiz-gray-950 text-xs xl:text-base font-bold leading-6">
              {selectedCurrency.sign}
              {isLoading ? (
                <Skeleton height={15} width={60} />
              ) : (
                data?.total_income.toLocaleString() || 0
              )}
            </p>
          </div>
          {/* expense total */}
          <div className="rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] pl-5 py-3.5  w-1/2 border border-raiz-gray-100 inline-flex flex-col justify-start items-start gap-2 xl:gap-3.5">
            <div className="w-12 h-12 flex items-center justify-center relative bg-violet-100/60 rounded-3xl ">
              <Image
                src={"/icons/expense.svg"}
                width={28.8}
                height={28.8}
                alt="expense"
              />
            </div>
            <p className=" text-raiz-gray-600 font-semibold text-sm leading-4">
              Expenses
            </p>
            <p className="text-zinc-900 text-xs xl:text-base font-bold leading-tight">
              {selectedCurrency.sign}
              {isLoading ? (
                <Skeleton height={15} width={60} />
              ) : (
                data?.total_expense.toLocaleString() || 0
              )}
            </p>
          </div>
        </div>
        {/* <InflowOutflow
        type="income-expense"
        opened={showRange}
        open={handleOpenRange}
        close={handleCloseRange}
        selectedRange={selectedRange}
      /> */}
        <AnalyticsChart
          opened={showRange}
          open={handleOpenRange}
          close={handleCloseRange}
          selectedRange={selectedRange}
        />
      </div>
      {/* Expenses Categories */}
      <div className="my-8 bg-raiz-gray-50 p-8 relative rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]    border border-raiz-gray-100">
        <div className="flex items-center w-full justify-between mb-7">
          <h5 className="text-raiz-gray-950 text-lg font-semibold leading-5">
            All Expenses
          </h5>
          <button
            onClick={() => setShowCategoryRange(true)}
            className="h-8 px-3.5 py-2.5 bg-gray-100 rounded-2xl inline-flex justify-start items-center gap-2"
          >
            <span className="text-zinc-900 text-xs font-medium font-brSonoma leading-tight">
              {selectedCategoryRange.label}
            </span>
            <IoIosArrowDown className="text-[#443852] w-4 h-4 " />
          </button>
        </div>
        {!showCustomCalendar && categoryLoading ? (
          <div className="grid grid-cols-2 gap-[17px]">
            <Skeleton height={100} />
            <Skeleton height={100} />
          </div>
        ) : categoryData && categoryData?.length > 0 ? (
          <div className="grid sm:grid-cols-3 xl:grid-cols-4 gap-[17px]">
            {categoryData?.map((each, index) => (
              <div
                key={index}
                className="px-5 py-3.5 rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border border-raiz-gray-100 inline-flex flex-col justify-start items-start"
              >
                <Image
                  className="mb-[15px]"
                  src={each?.category_emoji || "/icons/notif-promo.svg"}
                  width={32}
                  height={32}
                  alt=""
                />

                <p className="opacity-50 text-zinc-900 text-xs leading-tight">
                  {each?.transaction_category}
                </p>
                <div className="flex justify-between items-center w-full mt-2">
                  <p className="text-zinc-900 text-sm mb-1 font-bold leading-none">
                    {selectedCurrency.sign}
                    {each.total_amount.toLocaleString()}
                  </p>
                  <p className=" text-zinc-900 text-sm font-bold leading-none">
                    {each.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyList text="No expenses yet" />
        )}

        {showRange && (
          <RangeModal
            close={handleCloseRange}
            options={dateRanges}
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
            onCustomSelect={() => {
              setShowRange(false);
              setShowCustomCalendar(true);
            }}
          />
        )}
      </div>

      {showCategoryRange && (
        <RangeModal
          close={() => setShowCategoryRange(false)}
          options={dateRanges}
          selectedRange={selectedCategoryRange}
          setSelectedRange={setSelectedCategoryRange}
          onCustomSelect={() => {
            setShowCategoryRange(false);
            setShowCustomCalendar(true);
          }}
        />
      )}
      {showCustomCalendar && (
        <div className=" z-50 mt-4 top-1/2  ">
          <DateRange
            onApply={handleCustomApply}
            onClose={() => setShowCustomCalendar(false)}
          />
        </div>
      )}
    </section>
  );
};

export default AnalyticsPage;
