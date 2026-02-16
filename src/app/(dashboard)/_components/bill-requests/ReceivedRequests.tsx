import React, { useRef, useState } from "react";
import SideModalWrapper from "../SideModalWrapper";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Image from "next/image";
import {
  formatRelativeTime,
  getCurrencySymbol,
  groupByDate,
  truncateString,
} from "@/utils/helpers";
import { IBillRequest } from "@/types/transactions";
import { useInfiniteQuery } from "@tanstack/react-query";
// import { IBillRequestParams, IBillRequestResponse } from "@/types/services";
import { FetchBillRequestApi } from "@/services/transactions";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import Skeleton from "react-loading-skeleton";
import Avatar from "@/components/ui/Avatar";
import EmptyList from "@/components/ui/EmptyList";

interface Props {
  close: () => void;
  setSelectedRequest: (a: IBillRequest | null) => void;
  openAccept: () => void;
  openReject: () => void;
}

const ReceivedRequests = ({
  close,
  setSelectedRequest,
  openAccept,
  openReject,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedCurrency } = useCurrencyStore();
  const limit = 10;
  const scrollDivRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["bill-requests", selectedCurrency?.name || "USD", 2],

      queryFn: async ({ queryKey, pageParam = 1 }) => {
        const [, currency, status_id] = queryKey as [string, string, number];

        const response = await FetchBillRequestApi({
          currency,
          status_id: String(status_id),
          page: pageParam,
          limit,
        });
        return response ?? { data: [], pagination_details: null };
      },

      getNextPageParam: (lastPage) => {
        const pagination = lastPage?.pagination_details;
        if (!pagination?.next_page) return undefined;

        const { current_page, total_pages } = pagination;
        return current_page < total_pages ? pagination.next_page : undefined;
      },

      initialPageParam: 1,
      enabled: !!selectedCurrency?.name,
    });

  // Flatten all pages into a single array
  const allRequests = data?.pages.flatMap((page) => page?.data || []) || [];

  const filteredData = allRequests.filter((request) =>
    request?.third_party_account?.account_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const groupedRequests = groupByDate<IBillRequest>(filteredData, "created_at");

  const handleClickRequest = (bill: IBillRequest, res: "accept" | "reject") => {
    if (res === "accept") {
      openAccept();
    } else {
      openReject();
    }
    setSelectedRequest(bill);
  };

  // Handle scroll event
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (bottom && hasNextPage && !isFetchingNextPage) {
      console.log("Fetching next page...");
      fetchNextPage();
    }
  };

  return (
    <SideModalWrapper close={close}>
      <div className="w-full h-full flex flex-col">
        <SideWrapperHeader
          title="Bill Request"
          close={close}
          titleColor="text-zinc-900"
        />
        <div className={`relative h-12 opacity-100 w-full transition-all`}>
          <Image
            className="absolute top-3.5 left-3"
            src={"/icons/search.svg"}
            alt="search"
            width={22}
            height={22}
          />
          <input
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Search a name"
            className="pl-10 h-full w-full bg-raiz-gray-50 text-sm rounded-[20px] border-raiz-gray-200 focus:outline-none outline-none border focus:border-2"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-5 pt-6 overflow-auto no-scrollbar">
            <LoadingState />
          </div>
        ) : (
          <div
            ref={scrollDivRef}
            onScroll={handleScroll}
            className="flex-1 overflow-auto no-scrollbar flex flex-col gap-5 pt-6"
            style={{ height: "calc(100vh - 180px)" }}
          >
            {Object.keys(groupedRequests).length > 0 ? (
              <>
                {Object.keys(groupedRequests).map((dateLabel) => (
                  <div key={dateLabel}>
                    <h4 className="text-raiz-gray-950 text-base font-medium font-brSonoma leading-tight">
                      {dateLabel}
                    </h4>
                    <div className="flex flex-col gap-5 mt-2">
                      {groupedRequests[dateLabel].map((each, index) => {
                        return (
                          <div
                            key={index}
                            className={`flex gap-3 w-full pb-4 border-b border-gray-100`}
                          >
                            <div className="w-12 h-12 relative">
                              <Avatar
                                name={each?.third_party_account?.account_name}
                                src={each?.third_party_account?.selfie_image}
                              />
                            </div>

                            <div className="flex justify-between w-full text-left">
                              <div className="flex flex-col gap-1.5">
                                <p className=" text-zinc-900 text-sm font-semibold leading-none">
                                  {truncateString(
                                    each?.third_party_account?.account_name,
                                    20
                                  )}
                                </p>
                                <div className="flex items-center gap-1">
                                  <p className="text-center flex text-zinc-700 text-xs font-medium font-brSonoma leading-tight">
                                    {getCurrencySymbol(each?.currency)}
                                    {each?.transaction_amount.toLocaleString()}{" "}
                                  </p>
                                  <span className="w-1 h-1 bg-zinc-900 rounded-full" />{" "}
                                  <span className="text-center justify-start text-zinc-400 text-xs font-medium font-brSonoma leading-tight">
                                    {formatRelativeTime(each?.created_at)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={() =>
                                    handleClickRequest(each, "reject")
                                  }
                                  className="px-5 py-2 bg-orange-100 rounded-3xl inline-flex justify-center items-center text-zinc-800 text-xs font-medium font-brSonoma "
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() =>
                                    handleClickRequest(each, "accept")
                                  }
                                  className="rounded-full bg-raiz-usd-primary w-7 h-7 flex items-center justify-center"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                  >
                                    <path
                                      d="M10.7601 1.97336L4.74008 3.97336C0.693412 5.3267 0.693412 7.53336 4.74008 8.88003L6.52674 9.47336L7.12008 11.26C8.46674 15.3067 10.6801 15.3067 12.0267 11.26L14.0334 5.2467C14.9267 2.5467 13.4601 1.07336 10.7601 1.97336ZM10.9734 5.56003L8.44008 8.1067C8.34008 8.2067 8.21341 8.25336 8.08674 8.25336C7.96008 8.25336 7.83341 8.2067 7.73341 8.1067C7.54008 7.91336 7.54008 7.59336 7.73341 7.40003L10.2667 4.85336C10.4601 4.66003 10.7801 4.66003 10.9734 4.85336C11.1667 5.0467 11.1667 5.3667 10.9734 5.56003Z"
                                      fill="#F4F4F4"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {isFetchingNextPage && (
                  <div className="py-4">
                    <p className="text-center text-raiz-gray-950 text-[13px]">
                      Loading more...
                    </p>
                  </div>
                )}

                {!hasNextPage && allRequests.length > 0 && (
                  <p className="text-center text-raiz-gray-950 text-[13px] py-4">
                    You&#39;re all caught up!
                  </p>
                )}
              </>
            ) : (
              <EmptyList text="No bills at the moment" />
            )}
          </div>
        )}
      </div>
    </SideModalWrapper>
  );
};

export default ReceivedRequests;

const LoadingState = () => (
  <div className="flex flex-col gap-5">
    {/* Mimic grouped sections */}
    {Array(2)
      .fill(0)
      .map((_, groupIndex) => (
        <div key={groupIndex}>
          {/* Date header */}
          <Skeleton height={20} width={150} className="mb-2" />
          {/* Request items */}
          <div className="flex flex-col gap-5">
            {Array(2)
              .fill(0)
              .map((_, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex gap-3 w-full pb-4 border-b border-gray-100"
                >
                  <Skeleton circle={true} height={48} width={48} />

                  <div className="flex justify-between w-full">
                    <div className="flex flex-col gap-0.5">
                      <Skeleton height={16} width={120} />
                      <div className="flex items-center gap-1">
                        <Skeleton height={14} width={80} />
                        <Skeleton circle={true} height={4} width={4} />
                        <Skeleton height={14} width={40} />
                      </div>
                    </div>

                    <Skeleton height={19} width={66} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
  </div>
);
