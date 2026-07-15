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
import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import EmptyList from "@/components/ui/EmptyList";
import { IoIosArrowDown } from "react-icons/io";

import DateRange from "../transactions/_components/DateRange";
import AnalyticsChart from "@/components/charts/AnalyticsChart";
import RangeModal from "../_components/analytics/RangeModal";
import { findWalletByCurrency } from "@/utils/helpers";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";

export interface DateOption {
  label: string;
  value: string;
  dateRange: string;
  days: number | null;
}

const AnalyticsPage = () => {
  useEffect(() => {
    pushDataLayerEvent("report_viewed", {
      report_type: "income_expense",
    });
  }, []);

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
    <section className="mt-0 md:mt-4 min-w-0">
      <div className="rounded-none md:rounded-[20px] bg-transparent md:bg-raiz-gray-50 p-0 md:p-6">
        <div className="flex items-center justify-between gap-2 mb-3 md:mb-8">
          <h2 className="hidden md:block text-zinc-900 text-xl md:text-2xl font-bold leading-7">
            Report & Analytics
          </h2>
          <p className="md:hidden text-[11px] font-semibold uppercase tracking-widest text-raiz-gray-500">
            Overview
          </p>
          <button
            onClick={handleOpenRange}
            className="h-9 max-w-[55vw] sm:max-w-none px-3 py-2 bg-white md:bg-gray-100 border border-raiz-gray-100 md:border-0 rounded-xl md:rounded-2xl inline-flex justify-start items-center gap-1.5 shadow-sm md:shadow-none shrink-0"
          >
            <span className="text-zinc-900 text-xs font-medium font-brSonoma leading-tight truncate">
              {selectedRange.label}
            </span>
            <IoIosArrowDown className="text-[#443852] w-4 h-4 shrink-0" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 md:mb-8">
          {/* income total */}
          <div className="rounded-2xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] p-3.5 sm:pl-5 sm:py-3.5 border border-raiz-gray-100 flex flex-col justify-start items-start gap-2 bg-white md:bg-transparent">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-sky-50 rounded-2xl sm:rounded-3xl">
              <Image
                src={"/icons/income.svg"}
                width={28.8}
                height={28.8}
                alt="income"
                className="size-6 sm:size-7"
              />
            </div>
            <p className="text-raiz-gray-600 font-semibold text-xs sm:text-sm leading-4">
              Income
            </p>
            <p className="text-raiz-gray-950 text-sm sm:text-base font-bold leading-tight truncate w-full">
              {selectedCurrency.sign}
              {isLoading ? (
                <Skeleton height={15} width={60} />
              ) : (
                data?.total_income.toLocaleString() || 0
              )}
            </p>
          </div>
          {/* expense total */}
          <div className="rounded-2xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] p-3.5 sm:pl-5 sm:py-3.5 border border-raiz-gray-100 flex flex-col justify-start items-start gap-2 bg-white md:bg-transparent">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-violet-100/60 rounded-2xl sm:rounded-3xl">
              <Image
                src={"/icons/expense.svg"}
                width={28.8}
                height={28.8}
                alt="expense"
                className="size-6 sm:size-7"
              />
            </div>
            <p className="text-raiz-gray-600 font-semibold text-xs sm:text-sm leading-4">
              Expenses
            </p>
            <p className="text-zinc-900 text-sm sm:text-base font-bold leading-tight truncate w-full">
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
      <div className="my-4 md:my-8 bg-white md:bg-raiz-gray-50 p-4 sm:p-6 lg:p-8 relative rounded-2xl md:rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border border-raiz-gray-100">
        <div className="flex items-center w-full justify-between gap-2 mb-4 sm:mb-7">
          <h5 className="text-raiz-gray-950 text-base sm:text-lg font-semibold leading-5">
            All Expenses
          </h5>
          <button
            onClick={() => setShowCategoryRange(true)}
            className="h-8 max-w-[48vw] sm:max-w-none px-2.5 sm:px-3.5 py-2 bg-gray-100 rounded-xl sm:rounded-2xl inline-flex justify-start items-center gap-1.5 shrink-0"
          >
            <span className="text-zinc-900 text-xs font-medium font-brSonoma leading-tight truncate">
              {selectedCategoryRange.label}
            </span>
            <IoIosArrowDown className="text-[#443852] w-4 h-4 shrink-0" />
          </button>
        </div>
        {!showCustomCalendar && categoryLoading ? (
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton height={64} className="sm:!h-[100px]" />
            <Skeleton height={64} className="sm:!h-[100px]" />
            <Skeleton height={64} className="sm:!h-[100px]" />
          </div>
        ) : categoryData && categoryData?.length > 0 ? (
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-[17px]">
            {categoryData?.map((each, index) => (
              <div
                key={index}
                className="flex items-center gap-3 sm:flex-col sm:items-start px-3 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border border-raiz-gray-100 bg-white"
              >
                <Image
                  className="shrink-0 sm:mb-[15px]"
                  src={each?.category_emoji || "/icons/notif-promo.svg"}
                  width={32}
                  height={32}
                  alt=""
                />

                <div className="flex-1 min-w-0 sm:w-full">
                  <p className="text-zinc-500 sm:opacity-50 text-xs leading-tight truncate">
                    {each?.transaction_category}
                  </p>
                  <div className="flex justify-between items-center w-full mt-1 sm:mt-2 gap-2">
                    <p className="text-zinc-900 text-sm font-bold leading-none truncate">
                      {selectedCurrency.sign}
                      {each.total_amount.toLocaleString()}
                    </p>
                    <p className="text-zinc-900 text-sm font-bold leading-none shrink-0">
                      {each.percentage}%
                    </p>
                  </div>
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
