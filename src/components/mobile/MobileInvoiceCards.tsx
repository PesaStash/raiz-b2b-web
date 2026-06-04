"use client";

import Avatar from "@/components/ui/Avatar";
import { IInvoice } from "@/types/invoice";
import {
  convertField,
  convertTime,
  formatAmount,
  getCurrencySymbol,
  truncateString,
} from "@/utils/helpers";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";

type Props = {
  invoices: IInvoice[];
  onSelect: (invoice: IInvoice) => void;
  isLoading?: boolean;
};

const statusDot: Record<string, string> = {
  paid: "bg-green-500",
  pending: "bg-yellow-500",
  draft: "bg-[#CED3D2]",
  sent: "bg-[#0D90DC]",
  awaiting_payment: "bg-[#0D90DC]",
};

export function MobileInvoiceCardsSkeleton({ count = 5 }: { count?: number }) {
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

const MobileInvoiceCards = ({ invoices, onSelect, isLoading }: Props) => {
  if (isLoading) {
    return <MobileInvoiceCardsSkeleton />;
  }

  if (invoices.length === 0) return null;

  return (
    <div className="lg:hidden flex flex-col bg-white rounded-2xl border border-raiz-gray-100 overflow-hidden shadow-sm">
      {invoices.map((invoice, index) => {
        const customerName =
          invoice.customer?.business_name || invoice.customer?.full_name || "—";
        const status = invoice.status?.toLowerCase() ?? "";
        const dotColor = statusDot[status] ?? "bg-red-500";

        return (
          <button
            key={invoice.invoice_id}
            type="button"
            onClick={() => onSelect(invoice)}
            className={`flex items-center gap-3 px-4 py-4 text-left w-full active:bg-raiz-gray-50 transition-colors ${
              index > 0 ? "border-t border-raiz-gray-100" : ""
            }`}
          >
            <Avatar name={customerName} src="" size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-raiz-gray-950 truncate">
                {truncateString(customerName, 28)}
              </p>
              <p className="text-xs text-raiz-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{invoice.invoice_number}</span>
                <span className="text-raiz-gray-300">·</span>
                <span>
                  {invoice.created_at
                    ? dayjs(convertTime(invoice.created_at)).format(
                        "MMM D, YYYY",
                      )
                    : "—"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-sm font-semibold text-raiz-gray-800">
                  {getCurrencySymbol(invoice.currency)}
                  {formatAmount(invoice.total_amount)}
                </span>
                <span className="flex items-center gap-1 capitalize text-[10px] font-medium px-2 py-0.5 rounded-full border border-raiz-gray-200 text-raiz-gray-600 bg-raiz-gray-50">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  {convertField(status)}
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

export default MobileInvoiceCards;
