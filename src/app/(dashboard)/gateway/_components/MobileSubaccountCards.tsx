"use client";

import React from "react";
import Image from "next/image";
import dayjs from "dayjs";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import { IGatewaySubaccount } from "@/types/services";
import { truncateString } from "@/utils/helpers";
import {
  getCurrencyFlagSrc,
  getGatewayStatusLabel,
  getGatewayStatusTone,
  getSubaccountDisplayName,
} from "../_utils/subaccountHelpers";
import Skeleton from "react-loading-skeleton";

type Props = {
  items: IGatewaySubaccount[];
  onSelect: (subaccount: IGatewaySubaccount) => void;
  isLoading?: boolean;
};

export function MobileSubaccountCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="lg:hidden flex flex-col overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 py-4 ${
            index > 0 ? "border-t border-raiz-gray-100" : ""
          }`}
        >
          <Skeleton circle width={44} height={44} />
          <div className="flex-1 min-w-0">
            <Skeleton width="60%" height={14} className="mb-2" />
            <Skeleton width="80%" height={12} className="mb-1.5" />
            <Skeleton width="50%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

const MobileSubaccountCards = ({ items, onSelect, isLoading }: Props) => {
  if (isLoading) return <MobileSubaccountCardsSkeleton />;
  if (items.length === 0) return null;

  return (
    <div className="lg:hidden flex flex-col overflow-hidden">
      {items.map((item, index) => {
        const name = getSubaccountDisplayName(item);
        const email = item.customer_snapshot?.email;
        const requested =
          item.requested_currencies ||
          item.customer_snapshot?.requested_currencies ||
          [];
        const accountSet = new Set(
          (item.accounts || []).map((a) => a.currency.toUpperCase()),
        );

        return (
          <button
            type="button"
            key={item.subaccount_id}
            onClick={() => onSelect(item)}
            className={`flex items-start gap-3 py-4 text-left w-full hover:bg-raiz-gray-50 ${
              index > 0 ? "border-t border-raiz-gray-100" : ""
            }`}
          >
            <Avatar name={name} src="" size={44} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-raiz-gray-950 truncate">
                  {truncateString(name, 32)}
                </p>
                <StatusBadge
                  label={getGatewayStatusLabel(item.status)}
                  tone={getGatewayStatusTone(item.status)}
                  variant="outlined"
                />
              </div>
              {email ? (
                <p className="text-xs text-raiz-gray-600 truncate mt-0.5">
                  {email}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {requested.map((currency) => {
                  const code = currency.toUpperCase();
                  const ready = accountSet.has(code);
                  return (
                    <span
                      key={code}
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        ready ? "text-[#39A062]" : "text-raiz-gray-600"
                      }`}
                    >
                      <Image
                        src={getCurrencyFlagSrc(code)}
                        alt={code}
                        width={14}
                        height={14}
                        className="rounded-full size-3.5 object-cover"
                      />
                      {code}
                    </span>
                  );
                })}
              </div>
              {item.created_at ? (
                <p className="text-xs text-raiz-gray-500 mt-1.5">
                  {dayjs(item.created_at).format("D MMM YYYY @ h:mm A")}
                </p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MobileSubaccountCards;
