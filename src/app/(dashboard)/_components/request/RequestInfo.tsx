import React from "react";
import { RequestStepsProps } from "./RequestHome";
import { IBillRequest } from "@/types/transactions";
import { formatRelativeTime, getCurrencySymbol } from "@/utils/helpers";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import { useUser } from "@/lib/hooks/useUser";
import dayjs from "dayjs";

import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(advancedFormat);

interface Props extends RequestStepsProps {
  request: IBillRequest;
}

const RequestInfo = ({ setStep, request }: Props) => {
  const { user } = useUser();
  return (
    <div className="h-full p-[25px] xl:p-[30px] flex flex-col">
      <div className="flex justify-between w-full items-start">
        <div>
          <h4 className="text-zinc-900 text-xl font-bold leading-normal">
            Request Info
          </h4>
          <div className="flex items-center gap-1">
            <p className="text-center flex text-zinc-700 text-xs font-medium font-brSonoma leading-tight">
              {getCurrencySymbol(request.currency)}
              {request?.transaction_amount.toLocaleString()}{" "}
            </p>
            <span className="w-1 h-1 bg-zinc-900 rounded-full" />{" "}
            <span className="text-center justify-start text-zinc-400 text-xs font-medium font-brSonoma leading-tight">
              {formatRelativeTime(request?.created_at)}
            </span>
          </div>
        </div>
        <button className="w-4 h-4" onClick={() => setStep("all")}>
          <Image
            className="w-4 h-4"
            src={"/icons/close.svg"}
            alt="close"
            width={16}
            height={16}
          />
        </button>
      </div>
      <div className="mt-10">
        <Avatar
          className="mx-auto mb-4"
          src={request.third_party_account.selfie_image}
          name={request.third_party_account.account_name}
        />
        <div className="flex flex-col gap-[15px]">
          {/* Amount */}
          <div className="flex justify-between items-center pb-3 border-b-[0.5px] border-zinc-200">
            <span className="text-zinc-900 text-xs font-normal leading-tight">
              Amount
            </span>
            <span className="text-zinc-900 text-sm font-semibold font-brSonoma leading-tight">
              {" "}
              {getCurrencySymbol(request?.currency)}
              {request?.transaction_amount.toLocaleString()}{" "}
            </span>
          </div>

          {/* Requester */}
          <div className="flex justify-between items-center pb-3 border-b-[0.5px] border-zinc-200">
            <span className="text-zinc-900 text-xs font-normal leading-tight">
              Requester
            </span>
            <span className="text-zinc-900 text-sm font-semibold font-brSonoma leading-tight">
              {`${user?.first_name} ${user?.last_name} (you)`}
            </span>
          </div>

          {/* Purpose */}
          <div className="flex justify-between items-center pb-3 border-b-[0.5px] border-zinc-200">
            <span className="text-zinc-900 text-xs font-normal leading-tight">
              Purpose
            </span>
            <span className="text-zinc-900 text-sm font-semibold font-brSonoma leading-tight">
              {request.narration || "Nil"}
            </span>
          </div>

          {/* Request Sent Date */}
          <div className="flex justify-between items-center pb-3 border-b-[0.5px] border-zinc-200">
            <span className="text-zinc-900 text-xs font-normal leading-tight">
              Request Sent Date
            </span>
            <span className="text-zinc-900 text-sm font-semibold font-brSonoma leading-tight">
              {dayjs(request.created_at).format("Do MMM YYYY")}
            </span>
          </div>

          {/* Receipient */}
          <div className="flex justify-between items-center pb-3 border-b-[0.5px] border-zinc-200">
            <span className="text-zinc-900 text-xs font-normal leading-tight">
              Recipient
            </span>
            <span className="text-zinc-900 text-sm font-semibold font-brSonoma leading-tight">
              {request.third_party_account.account_name}
            </span>
          </div>

          {/* Request Approved Date */}
          {(request?.status_id === 1 || request?.status_id === 3) && (
            <div className="flex justify-between items-center pb-3 ">
              <span className="text-zinc-900 text-xs font-normal leading-tight">
                {request?.status_id === 3
                  ? "Request Rejection date"
                  : request?.status_id === 1
                  ? "Request Approved Date"
                  : ""}
              </span>
              <span className="text-zinc-900 text-sm font-semibold font-brSonoma leading-tight">
                {dayjs(request.updated_at).format("Do MMMM YYYY")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestInfo;
