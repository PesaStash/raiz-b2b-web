"use client";

import Avatar from "@/components/ui/Avatar";
import { ITransaction } from "@/types/transactions";
import {
  convertTime,
  getCurrencySymbol,
  truncateString,
} from "@/utils/helpers";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";

type Props = {
  transactions: ITransaction[];
  onSelect: (txn: ITransaction) => void;
  isLoading?: boolean;
};

const statusStyles: Record<string, string> = {
  completed: "border-emerald-200 text-emerald-700 bg-emerald-50",
  pending: "border-amber-200 text-amber-700 bg-amber-50",
  failed: "border-red-200 text-red-700 bg-red-50",
};

export function MobileTransactionCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="lg:hidden flex flex-col bg-white rounded-2xl border border-raiz-gray-100 overflow-hidden shadow-sm">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 px-4 py-4 ${
            index > 0 ? "border-t border-raiz-gray-100" : ""
          }`}
        >
          <Skeleton circle width={40} height={40} />
          <div className="flex-1">
            <Skeleton width="70%" height={14} className="mb-2" />
            <Skeleton width="45%" height={12} />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton width={64} height={14} />
            <Skeleton width={72} height={20} borderRadius={999} />
          </div>
        </div>
      ))}
    </div>
  );
}

const MobileTransactionCards = ({
  transactions,
  onSelect,
  isLoading,
}: Props) => {
  if (isLoading) {
    return <MobileTransactionCardsSkeleton />;
  }

  if (transactions.length === 0) return null;

  return (
    <div className="mt-4 lg:hidden flex flex-col bg-white rounded-2xl border border-raiz-gray-100 overflow-hidden shadow-sm">
      {transactions.map((txn, index) => {
        const isDebit =
          txn.transaction_type?.transaction_type === "debit";
        const status =
          txn.transaction_status?.transaction_status?.toLowerCase() ?? "";
        const statusClass =
          statusStyles[status] ??
          "border-raiz-gray-200 text-raiz-gray-600 bg-raiz-gray-50";
        const category = txn.transaction_category?.transaction_category;

        return (
          <button
            key={txn.transaction_report_id}
            type="button"
            onClick={() => onSelect(txn)}
            className={`flex items-center gap-3 px-4 py-4 text-left w-full active:bg-raiz-gray-50 transition-colors ${
              index > 0 ? "border-t border-raiz-gray-100" : ""
            }`}
          >
            <Avatar
              name={txn.third_party_name || "Transaction"}
              src={txn.third_party_profile_image_url}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-raiz-gray-950 truncate">
                {truncateString(txn.third_party_name || "Transaction", 32)}
              </p>
              <p className="text-xs text-raiz-gray-500 mt-0.5 flex items-center gap-1.5">
                <span>
                  {dayjs(convertTime(txn.transaction_date_time)).format(
                    "MMM D, hh:mm A",
                  )}
                </span>
                {category ? (
                  <>
                    <span className="text-raiz-gray-300">·</span>
                    <span className="truncate">{category}</span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`text-sm font-semibold ${
                    isDebit ? "text-raiz-gray-800" : "text-emerald-600"
                  }`}
                >
                  {isDebit ? "-" : "+"}
                  {getCurrencySymbol(txn.currency)}
                  {Math.abs(txn.transaction_amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusClass}`}
                >
                  {txn.transaction_status?.transaction_status}
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-raiz-gray-300 shrink-0"
                aria-hidden
              >
                <path
                  d="M9 6L15 12L9 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MobileTransactionCards;
