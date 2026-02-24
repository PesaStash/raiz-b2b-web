"use client";
import Tabs from "@/components/ui/Tabs";
import Image from "next/image";
import React, { Dispatch, SetStateAction, useState } from "react";
import EmptyRequest from "./EmptyRequest";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { IBillRequest } from "@/types/transactions";
import {
  formatRelativeTime,
  getCurrencySymbol,
  groupByDate,
  truncateString,
} from "@/utils/helpers";
import { RequestStepsProps } from "./RequestHome";
import { useQuery } from "@tanstack/react-query";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { IBillRequestParams } from "@/types/services";
import { FetchSentRequestApi } from "@/services/transactions";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "react-loading-skeleton";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
dayjs.extend(relativeTime);

interface Props extends RequestStepsProps {
  setSelectedRequest: Dispatch<SetStateAction<IBillRequest | null>>;
}

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

const AllRequests = ({ setStep, setSelectedRequest }: Props) => {
  const [type, setType] = useState<undefined | 1 | 2 | 3>();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { selectedCurrency } = useCurrencyStore();
  const { data: response, isLoading } = useQuery({
    queryKey: [
      "sent-requests",
      { currency: selectedCurrency.name, status_id: type },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IBillRequestParams];
      return FetchSentRequestApi(params);
    },
  });

  const data = response?.data || [];

  const filteredData = data.filter((request) =>
    request?.third_party_account?.account_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const groupedRequests = groupByDate<IBillRequest>(filteredData, "created_at");

  const handleClickRequest = (bill: IBillRequest) => {
    setStep("single-request");
    setSelectedRequest(bill);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  return (
    <>
      <CenterModalHeader close={() => setStep("home")} />
      <div className="h-full p-[25px] xl:p-[30px] ">
        <div className="flex justify-between items-center mb-[36px]">
          <h1 className="text-zinc-900 text-base font-bold leading-tight">
            Request
          </h1>
          <div className="flex gap-4 items-center ">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-5 h-5"
            >
              <Image
                src={"/icons/search-2.svg"}
                alt="serach"
                height={22}
                width={22}
                className="w-[22px] h-[22px]"
              />
            </button>
            <button onClick={() => setStep("requests")} className="w-5 h-5">
              <Image
                src={"/icons/add.svg"}
                alt="add"
                height={22}
                width={22}
                className="w-[22px] h-[22px]"
              />
            </button>
          </div>
        </div>
        <div className="">
          <Tabs
            options={[
              { label: "All", value: undefined },
              { label: "Pending", value: 2 },
              { label: "Rejected", value: 3 },
            ]}
            selected={type}
            onChange={setType}
            // className={`${data?.length > 0 ? "mb-[50px]" : "mb-[120px]"} `}
          />
          <div
            className={`relative ${
              showSearch ? "h-12 opacity-100" : "h-0 opacity-0"
            }  w-full mb-6 transition-all`}
          >
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
          <div className="flex flex-col gap-5">
            {isLoading ? (
              <LoadingState />
            ) : Object.keys(groupedRequests).length > 0 ? (
              Object.keys(groupedRequests).map((dateLabel) => (
                <div key={dateLabel}>
                  <h4 className="text-raiz-gray-950 text-base font-medium font-brSonoma leading-tight">
                    {dateLabel}
                  </h4>
                  <div className="flex flex-col gap-5 mt-2">
                    {groupedRequests[dateLabel].map((each, index) => {
                      return (
                        <button
                          key={index}
                          onClick={() => handleClickRequest(each)}
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
                                  20,
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
                            <div
                              className={`h-[19px] w-[66px] px-2 py-0.5 
                              ${
                                each?.status_id === 1
                                  ? "bg-lime-600"
                                  : each?.status_id === 2
                                    ? "bg-amber-300"
                                    : "bg-red-400"
                              }
                               bg-opacity-20 rounded-lg inline-flex justify-center items-center gap-2`}
                            >
                              <span
                                className={`text-center capitalize  justify-center  ${
                                  each?.status_id === 1
                                    ? "text-lime-700 "
                                    : each?.status_id === 2
                                      ? "text-yellow-600 "
                                      : "text-red-500"
                                } text-[10px] font-bold leading-none"`}
                              >
                                {each?.status.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <EmptyRequest />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AllRequests;
