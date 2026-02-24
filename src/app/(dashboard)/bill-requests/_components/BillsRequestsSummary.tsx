"use client";

import Button from "@/components/ui/Button";
import {
  FetchBillRequestApi,
  FetchSentRequestApi,
} from "@/services/transactions";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { IBillRequestParams } from "@/types/services";
import { useQuery } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";

const BillsRequestsSummary = () => {
  const { selectedCurrency } = useCurrencyStore();
  const {
    data: receivedRequests,
    isLoading: receivedRequestsLoading,
    refetch: receivedRequestsRefetch,
  } = useQuery({
    queryKey: [
      "bill-requests",
      { currency: selectedCurrency.name, status_id: 2 },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IBillRequestParams];
      return FetchBillRequestApi(params);
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: sentRequests,
    isLoading: sentRequestsLoading,
    refetch: sentRequestsRefetch,
  } = useQuery({
    queryKey: ["sent-requests", { currency: selectedCurrency.name }],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IBillRequestParams];
      return FetchSentRequestApi(params);
    },
  });

  return (
    <section className="bg-raiz-gray-50 p-8 rounded-[20px] ">
      <div className="flex justify-between items-center">
        <div className="">
          <h2 className=" text-zinc-900 text-2xl font-semibold leading-7">
            Bill Requests
          </h2>
          <p className="text-zinc-900 text-base font-normal leading-6">
            Manage incoming and outgoing bill requests across multiple
            currencies.
          </p>
        </div>
        <Button className="h-10  w-fit px-[18px] py-2   rounded-3xl justify-center items-center gap-1.5 inline-flex">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.3188 0.330472L3.79375 2.83047C-1.26458 4.52214 -1.26458 7.28047 3.79375 8.9638L6.02708 9.70547L6.76875 11.9388C8.45208 16.9971 11.2188 16.9971 12.9021 11.9388L15.4104 4.42214C16.5271 1.04714 14.6938 -0.794528 11.3188 0.330472ZM11.5854 4.81381L8.41875 7.99714C8.29375 8.12214 8.13542 8.18047 7.97708 8.18047C7.81875 8.18047 7.66042 8.12214 7.53542 7.99714C7.29375 7.75547 7.29375 7.35547 7.53542 7.11381L10.7021 3.93047C10.9438 3.68881 11.3437 3.68881 11.5854 3.93047C11.8271 4.17214 11.8271 4.57214 11.5854 4.81381Z"
              fill="#F4F4F4"
            />
          </svg>

          <span className=" lg:text-sm xl:text-base font-medium font-brSonoma leading-tight tracking-tight">
            Send Request
          </span>
        </Button>
      </div>
      <div className="mt-8 flex justify-between items-center gap-6">
        <div className="flex flex-col gap-6 w-1/3 bg-raiz-gray-50 rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-[1.5px] border-raiz-gray-100 p-6">
          <p className="text-raiz-gray-950 text-base font-semibold leading-6">
            Received (Total)
          </p>
          {receivedRequestsLoading ? (
            <Skeleton height={40} width={100} />
          ) : (
            <p className="text-raiz-gray-950 text-4xl font-semibold leading-10">
              {receivedRequests?.pagination_details?.total_results || 0}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-6 w-1/3 bg-raiz-gray-50 rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-[1.5px] border-raiz-gray-100 p-6">
          <p className="text-raiz-gray-950 text-base font-semibold leading-6">
            Sent (Total)
          </p>
          {sentRequestsLoading ? (
            <Skeleton height={40} width={100} />
          ) : (
            <p className="text-raiz-gray-950 text-4xl font-semibold leading-10">
              {sentRequests?.pagination_details?.total_results || 0}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-6 w-1/3 bg-raiz-gray-50 rounded-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-[1.5px] border-raiz-gray-100 p-6">
          <p className="text-raiz-gray-950 text-base font-semibold leading-6">
            Pending Approval
          </p>
          <p className="text-raiz-gray-950 text-4xl font-semibold leading-10">
            200
          </p>
        </div>
      </div>
    </section>
  );
};

export default BillsRequestsSummary;
