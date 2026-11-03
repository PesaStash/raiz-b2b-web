"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import dayjs from "dayjs";
import { FetchTransactionReportChartApi } from "@/services/business";
import { formatMoney } from "@/lib/globalBalance";
import { DesignIcon } from "./GlobalUI";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
export function useMoneyMovement(
  entityId: string | undefined,
  walletId: string | undefined,
  days: number,
) {
  return useQuery({
    queryKey: ["global-money-movement", entityId, walletId, days],
    queryFn: () =>
      FetchTransactionReportChartApi({
        wallet_id: walletId!,
        number_of_days: days,
      }),
    enabled: !!entityId && !!walletId,
  });
}
export default function MoneyMovement({
  entityId,
  walletId,
  currency,
  visible,
}: {
  entityId?: string;
  walletId?: string;
  currency: string;
  visible: boolean;
}) {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, refetch } = useMoneyMovement(
    entityId,
    walletId,
    days,
  );
  const incoming = data?.total_income;
  const outgoing = data?.total_expense;
  const hasMovement = data?.analytics.some(
    (row) => row.credit_amount || row.debit_amount,
  );
  const color = currency === "NGN" ? "#3c2875" : "#0d6494";
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden rounded-2xl border border-[#eaecf0] bg-white p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="min-w-0 flex-1 text-[17px] font-semibold leading-normal text-[#19151e]">
          Money in and out
        </h2>
        <div className="flex gap-0.5 rounded-[10px] bg-[#f4f4f8] p-[3px]">
          {[
            { name: "Week", days: 7 },
            { name: "Month", days: 30 },
            { name: "Year", days: 365 },
          ].map((period) => (
            <button
              key={period.name}
              aria-pressed={days === period.days}
              onClick={() => setDays(period.days)}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] leading-normal ${days === period.days ? "bg-white font-semibold text-[#19151e] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]" : "text-[#6b6b80]"}`}
            >
              {period.name}
            </button>
          ))}
        </div>
      </header>
      {isLoading ? (
        <div
          role="status"
          className="my-8 h-64 animate-pulse rounded-xl bg-kyb-field"
        >
          <span className="sr-only">Loading money movement</span>
        </div>
      ) : isError ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-sm text-kyb-muted">
          <p>We couldn’t load money movement.</p>
          <button className="text-primary2 underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : !hasMovement ? (
        <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-3 rounded-[14px] bg-[rgba(243,241,253,0.5)] py-7 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf2fd]">
            <span className="relative h-7 w-7">
              <span className="absolute left-[2.333px] top-[3.5px]">
                <DesignIcon name="32261-10050-imgGroup.svg" />
              </span>
              <span className="absolute left-[2.333px] top-3.5">
                <DesignIcon name="32261-10050-imgGroup1.svg" />
              </span>
            </span>
          </span>
          <h3 className="text-[15px] font-semibold leading-normal text-[#19151e]">
            No money movement yet
          </h3>
          <p className="w-full max-w-[320px] text-[13px] leading-normal text-[#6b6b80]">
            Your {days === 365 ? "yearly" : days === 30 ? "monthly" : "weekly"} money in and out will appear here once you start
            getting paid.
          </p>
        </div>
      ) : (
        <>
          <div className="my-7 flex flex-wrap gap-6">
            {[
              { label: "Money in", value: incoming },
              { label: "Money out", value: outgoing },
              {
                label: "Net",
                value:
                  incoming !== undefined && outgoing !== undefined
                    ? incoming - outgoing
                    : undefined,
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-kyb-muted">{item.label}</p>
                <p
                  className={`mt-1 text-lg font-semibold ${item.label === "Net" ? "text-green-600" : ""}`}
                >
                  {visible ? formatMoney(item.value, currency) : "••••••"}
                </p>
              </div>
            ))}
          </div>
          <div className="relative h-56 w-full">
            <Bar
              aria-label={`${currency} money in and out for the last ${days} days`}
              data={{
                labels: data?.analytics.map((row) =>
                  dayjs(row.date).format(days === 365 ? "MMM D" : "D MMM"),
                ),
                datasets: [
                  {
                    label: "Money in",
                    data:
                      data?.analytics.map((row) =>
                        visible ? row.credit_amount : 0,
                      ) ?? [],
                    backgroundColor: color,
                    borderRadius: 5,
                    maxBarThickness: 22,
                  },
                  {
                    label: "Money out",
                    data:
                      data?.analytics.map((row) =>
                        visible ? row.debit_amount : 0,
                      ) ?? [],
                    backgroundColor: currency === "NGN" ? "#c5b8e8" : "#9cc9e3",
                    borderRadius: 5,
                    maxBarThickness: 22,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: visible },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: {
                      maxTicksLimit: 6,
                      color: "#9a9aad",
                      font: { size: 10 },
                    },
                  },
                  y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { display: false },
                    ticks: {
                      maxTicksLimit: 5,
                      color: "#9a9aad",
                      font: { size: 10 },
                    },
                  },
                },
              }}
            />
          </div>
          <p className="mt-6 rounded-xl bg-kyb-soft p-3 text-center text-xs text-kyb-muted">
            Activity in your {currency} balance · Last {days} days
          </p>
        </>
      )}
    </section>
  );
}
