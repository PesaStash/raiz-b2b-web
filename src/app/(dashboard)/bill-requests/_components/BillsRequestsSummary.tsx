"use client";

import Button from "@/components/ui/Button";
import { FetchBillRequestMetricsApi } from "@/services/transactions";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import Request from "../../_components/request/Request";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";

const BillsRequestsSummary = () => {
  const { selectedCurrency } = useCurrencyStore();
  const [showReuest, setShowRequest] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["bill-requests-metrics", { currency: selectedCurrency.name }],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [
        string,
        { start_date?: string; end_date?: string },
      ];
      return FetchBillRequestMetricsApi(params);
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return (
    <section className="p-4 md:p-6 lg:p-8 bg-white md:bg-raiz-gray-50 rounded-2xl md:rounded-[20px] min-w-0 border border-raiz-gray-100 md:border-0 shadow-sm md:shadow-none">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0">
          <h2 className="text-zinc-900 text-lg md:text-2xl font-semibold leading-6 md:leading-7">
            Bill Requests
          </h2>
          <p className="text-zinc-600 md:text-zinc-900 text-xs md:text-base font-normal leading-5 md:leading-6 mt-1">
            Manage incoming and outgoing bill requests across multiple
            currencies.
          </p>
        </div>
        <Button
          onClick={() => setShowRequest(true)}
          className="h-11 w-[175px] sm:shrink-0 px-[18px] py-2 rounded-3xl"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M11.3188 0.330472L3.79375 2.83047C-1.26458 4.52214 -1.26458 7.28047 3.79375 8.9638L6.02708 9.70547L6.76875 11.9388C8.45208 16.9971 11.2188 16.9971 12.9021 11.9388L15.4104 4.42214C16.5271 1.04714 14.6938 -0.794528 11.3188 0.330472ZM11.5854 4.81381L8.41875 7.99714C8.29375 8.12214 8.13542 8.18047 7.97708 8.18047C7.81875 8.18047 7.66042 8.12214 7.53542 7.99714C7.29375 7.75547 7.29375 7.35547 7.53542 7.11381L10.7021 3.93047C10.9438 3.68881 11.3437 3.68881 11.5854 3.93047C11.8271 4.17214 11.8271 4.57214 11.5854 4.81381Z"
                fill="#F4F4F4"
              />
            </svg>
          }
        >
          <span className="text-xs ml-2 md:text-sm font-medium font-brSonoma">
            Send Request
          </span>
        </Button>
      </div>

      <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        {[
          { label: "Received (Total)", value: metrics?.received?.total || 0 },
          { label: "Sent (Total)", value: metrics?.sent?.total || 0 },
          {
            label: "Pending Approval",
            value: metrics?.pending_approval?.total || 0,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-2 sm:gap-6 bg-raiz-gray-50 rounded-2xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-[1.5px] border-raiz-gray-100 p-4 sm:p-6"
          >
            <p className="text-raiz-gray-950 text-xs md:text-base font-semibold leading-5 md:leading-6">
              {item.label}
            </p>
            {metricsLoading ? (
              <Skeleton height={32} width={72} />
            ) : (
              <p className="text-raiz-gray-950 text-2xl md:text-4xl font-semibold leading-8 md:leading-10 tabular-nums">
                {item.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {showReuest && (
        <CenterModalWrapper close={() => setShowRequest(false)}>
          <Request close={() => setShowRequest(false)} />
        </CenterModalWrapper>
      )}
    </section>
  );
};

export default BillsRequestsSummary;
