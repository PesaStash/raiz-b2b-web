"use client";
import { AnimatePresence } from "motion/react";
import React from "react";
import SideModalWrapper from "../SideModalWrapper";
import Image from "next/image";
// import AnalyticsChart from "@/components/charts/AnalyticsChart";
// import { IoIosArrowDown } from "react-icons/io";
// import RangeModal from "./RangeModal";
// import dayjs from "dayjs";
// import { useQuery } from "@tanstack/react-query";
// import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
// import { useUser } from "@/lib/hooks/useUser";
// import { ITxnReportPayload } from "@/types/services";
// import {
//   FetchTransactionReportCategoryApi,
//   FetchTransactionReportChartApi,
// } from "@/services/business";
// import { useCurrencyStore } from "@/store/useCurrencyStore";
// import Skeleton from "react-loading-skeleton";
// import EmptyList from "@/components/ui/EmptyList";

interface Props {
  close: () => void;
}

export interface DateOption {
  label: string;
  value: string;
  dateRange: string;
  days: number | null;
}

const Analytics = ({ close }: Props) => {
  // const getDateRanges = () => {
  //   const today = dayjs();
  //   return [
  //     {
  //       label: "Weekly",
  //       value: "weekly",
  //       dateRange: `${today
  //         .subtract(7, "day")
  //         .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
  //       days: 7,
  //     },
  //     {
  //       label: "Monthly",
  //       value: "monthly",
  //       dateRange: `${today
  //         .subtract(1, "month")
  //         .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
  //       days: 30,
  //     },
  //     {
  //       label: "Three (3) Months",
  //       value: "three_months",
  //       dateRange: `${today
  //         .subtract(3, "month")
  //         .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
  //       days: 90,
  //     },
  //     {
  //       label: "Six (6) Months",
  //       value: "six_months",
  //       dateRange: `${today
  //         .subtract(6, "month")
  //         .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
  //       days: 180,
  //     },
  //     {
  //       label: "1 year",
  //       value: "one_year",
  //       dateRange: `${today
  //         .subtract(1, "year")
  //         .format("DD MMM YYYY")} - ${today.format("DD MMM YYYY")}`,
  //       days: 365,
  //     },
  //     {
  //       label: "Custom",
  //       value: "custom",
  //       dateRange: "Pick a specific period of time to date",
  //       days: null,
  //     },
  //   ];
  // };

  // const dateRanges = getDateRanges();
  // const [showRange, setShowRange] = useState(false);
  // const [selectedRange, setSelectedRange] = useState<DateOption>(dateRanges[0]);
  // const [showCategoryRange, setShowCategoryRange] = useState(false);
  // const [selectedCategoryRange, setSelectedCategoryRange] =
  //   useState<DateOption>(dateRanges[0]);
  // const { user } = useUser();
  // const currentWallet = useCurrentWallet(user);
  // const { selectedCurrency } = useCurrencyStore();
  // const { data, isLoading } = useQuery({
  //   queryKey: [
  //     "income-expense-chart",
  //     {
  //       wallet_id: currentWallet?.wallet_id,
  //       number_of_days:
  //         selectedRange.value !== "custom" ? selectedRange?.days : 0,
  //     },
  //   ],
  //   queryFn: ({ queryKey }) => {
  //     const [, params] = queryKey as [string, ITxnReportPayload];
  //     return FetchTransactionReportChartApi(params);
  //   },
  //   enabled: !!currentWallet?.wallet_id,
  // });
  // const { data: categoryData, isLoading: categoryLoading } = useQuery({
  //   queryKey: [
  //     "transaction-report-categories",
  //     {
  //       wallet_id: currentWallet?.wallet_id,
  //       number_of_days:
  //         selectedCategoryRange.value !== "custom"
  //           ? selectedCategoryRange?.days
  //           : 0,
  //     },
  //   ],
  //   queryFn: ({ queryKey }) => {
  //     const [, params] = queryKey as [string, ITxnReportPayload];
  //     return FetchTransactionReportCategoryApi(params);
  //   },
  //   enabled: !!currentWallet?.wallet_id,
  // });

  // const handleOpenRange = () => {
  //   setShowRange(true);
  // };
  // const handleCloseRange = () => {
  //   setShowRange(false);
  // };

  return (
    <>
      <AnimatePresence>
        <SideModalWrapper close={close}>
          <div className="pb-8 flex flex-col">
            {/* header */}
            <div className="flex justify-between items-center mb-4">
              <button onClick={close}>
                <Image
                  src={"/icons/arrow-left.svg"}
                  width={18.48}
                  height={18.48}
                  alt="back"
                />
              </button>
              <h5 className="text-raiz-gray-950 text-sm font-bold  leading-tight">
                Analytics
              </h5>
              <div />
            </div>
            <div className="flex gap-4 pt-5">
              {/* income total */}
              {/* <div className="rounded-[20px] pl-5 py-3.5  w-1/2 outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex flex-col justify-start items-start gap-2 xl:gap-3.5">
                <div className="w-12 h-12 flex items-center justify-center relative bg-violet-100/60 rounded-3xl ">
                  <Image
                    src={"/icons/income.svg"}
                    width={28.8}
                    height={28.8}
                    alt="income"
                  />
                </div>
                <p className="text-zinc-900 text-xs xl:text-base font-bold leading-tight">
                  {selectedCurrency.sign}
                  {isLoading ? (
                    <Skeleton height={15} width={60} />
                  ) : (
                    data?.total_income.toLocaleString() || 0
                  )}
                </p>

                <p className=" text-zinc-700 text-sm leading-tight">Income</p>
              </div> */}
              {/* expense total */}
              {/* <div className="rounded-[20px] pl-5 py-3.5  w-1/2 outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex flex-col justify-start items-start gap-2 xl:gap-3.5">
                <div className="w-12 h-12 flex items-center justify-center relative bg-violet-100/60 rounded-3xl ">
                  <Image
                    src={"/icons/expense.svg"}
                    width={28.8}
                    height={28.8}
                    alt="expense"
                  />
                </div>

                <p className="text-zinc-900 text-xs xl:text-base font-bold leading-tight">
                  {selectedCurrency.sign}
                  {isLoading ? (
                    <Skeleton height={15} width={60} />
                  ) : (
                    data?.total_expense.toLocaleString() || 0
                  )}
                </p>

                <p className=" text-zinc-700 text-sm leading-tight">Expenses</p>
              </div> */}
            </div>
            {/* <AnalyticsChart
              opened={showRange}
              open={handleOpenRange}
              close={handleCloseRange}
              selectedRange={selectedRange}
              data={data?.analytics || []}
              loading={isLoading}
              totalExpenses={data?.total_expense || 0}
              totalIncome={data?.total_income || 0}
            /> */}

            {/* Expenses Categories */}
            {/* <div className="">
              <div className="flex items-center w-full justify-between mt-[30px] mb-4">
                <h5 className="text-zinc-900 text-base font-semibold leading-tight tracking-tight">
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
              {categoryLoading ? (
                <div className="grid grid-cols-2 gap-[17px]">
                  <Skeleton height={100} />
                  <Skeleton height={100} />
                </div>
              ) : categoryData && categoryData?.length > 0 ? (
                <div className="grid grid-cols-2 gap-[17px]">
                  {categoryData?.map((each, index) => (
                    <div
                      key={index}
                      className="pl-5 py-3.5 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex flex-col justify-start items-start"
                    >
                      <Image
                        className="mb-[15px]"
                        src={each?.category_emoji || "/icons/notif-promo.svg"}
                        width={32}
                        height={32}
                        alt=""
                      />
                      <p className="text-zinc-900 text-sm mb-1 font-bold leading-none">
                        {selectedCurrency.sign}
                        {each.total_amount.toLocaleString()}
                      </p>
                      <p className="opacity-50 text-zinc-900 text-xs leading-tight">
                        {each?.transaction_category}
                      </p>
                      <p className="mt-2 text-zinc-900 text-sm font-bold leading-none">
                        {each.percentage}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyList text="No expenses yet" />
              )}
            </div> */}
          </div>
        </SideModalWrapper>
      </AnimatePresence>
      {/* {showRange && (
        <RangeModal
          close={handleCloseRange}
          options={dateRanges}
          selectedRange={selectedRange}
          setSelectedRange={setSelectedRange}
        />
      )}
      {showCategoryRange && (
        <RangeModal
          close={() => setShowCategoryRange(false)}
          options={dateRanges}
          selectedRange={selectedCategoryRange}
          setSelectedRange={setSelectedCategoryRange}
        />
      )} */}
    </>
  );
};

export default Analytics;
