"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import DateRange from "@/app/(dashboard)/transactions/_components/DateRange";
import { FetchGatewaySubaccountActivitiesApi } from "@/services/gateway";
import { IGatewaySubaccountActivity } from "@/types/services";
import {
  copyToClipboard,
  formatAmount,
  getCurrencySymbol,
  truncateString,
} from "@/utils/helpers";
import {
  getCurrencyFlagSrc,
  getRailLabel,
} from "../_utils/subaccountHelpers";

const columnHelper = createColumnHelper<IGatewaySubaccountActivity>();
const pageSize = 10;

type Props = {
  subaccountId: string;
};

const getActivityReference = (item: IGatewaySubaccountActivity) =>
  item.bridge_event_id ||
  item.bridge_deposit_id ||
  item.bridge_transfer_id ||
  null;

const getActivityStatusTone = (
  status: string,
): "success" | "warning" | "danger" | "neutral" => {
  const normalized = status?.toLowerCase() || "";
  if (["completed", "settled", "success"].includes(normalized)) {
    return "success";
  }
  if (["failed", "rejected"].includes(normalized)) return "danger";
  if (["pending", "processing", "in_progress"].includes(normalized)) {
    return "warning";
  }
  return "neutral";
};

const getActivityStatusLabel = (status: string) => {
  const normalized = status?.toLowerCase() || "";
  if (normalized === "completed") return "Settled";
  return status?.replace(/_/g, " ") || "—";
};

const SubaccountActivities = ({ subaccountId }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showDateRange, setShowDateRange] = useState(false);
  const [draftRange, setDraftRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [appliedRange, setAppliedRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});

  const hasDateFilter = !!(appliedRange.startDate || appliedRange.endDate);

  const { data, isLoading } = useQuery({
    queryKey: [
      "gateway-subaccount-activities",
      subaccountId,
      {
        page: currentPage,
        limit: pageSize,
        start_date: appliedRange.startDate
          ? dayjs(appliedRange.startDate).startOf("day").toISOString()
          : undefined,
        end_date: appliedRange.endDate
          ? dayjs(appliedRange.endDate).endOf("day").toISOString()
          : undefined,
      },
    ],
    queryFn: ({ queryKey }) => {
      const [, id, params] = queryKey as [
        string,
        string,
        {
          page: number;
          limit: number;
          start_date?: string;
          end_date?: string;
        },
      ];
      return FetchGatewaySubaccountActivitiesApi(id, params);
    },
    enabled: !!subaccountId,
  });

  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<IGatewaySubaccountActivity, any>[] = [
    columnHelper.accessor("direction", {
      header: "Dir.",
      cell: (info) => {
        const incoming = info.getValue() === "incoming";
        return (
          <span
            className={`inline-flex items-center justify-center size-8 rounded-full ${
              incoming ? "bg-[#E2F0D9] text-[#39A062]" : "bg-[#FFE6E6] text-[#DC180D]"
            }`}
            title={incoming ? "Incoming" : "Outgoing"}
          >
            {incoming ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 2.5V11.5M7 11.5L3.5 8M7 11.5L10.5 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 11.5V2.5M7 2.5L3.5 6M7 2.5L10.5 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "description",
      header: "Description",
      cell: (info) => {
        const item = info.row.original;
        const label = getRailLabel(item.rail);
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium text-raiz-gray-950 capitalize">
              {label !== "—" ? label : item.direction}
            </p>
            <p className="text-xs text-raiz-gray-500 capitalize">
              {item.direction} transfer
            </p>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "reference",
      header: "Reference ID",
      cell: (info) => {
        const ref = getActivityReference(info.row.original);
        if (!ref) {
          return <span className="text-sm text-raiz-gray-400">—</span>;
        }
        return (
          <button
            type="button"
            className="text-sm text-raiz-gray-700 font-mono hover:text-raiz-gray-950"
            onClick={() => copyToClipboard(ref)}
            title={ref}
          >
            {truncateString(ref, 14)}
          </button>
        );
      },
    }),
    columnHelper.accessor("currency", {
      header: "Currency",
      cell: (info) => {
        const code = (info.getValue() || "").toUpperCase();
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-raiz-gray-700">
            <Image
              src={getCurrencyFlagSrc(code)}
              alt={code}
              width={18}
              height={18}
              className="rounded-full size-[18px] object-cover"
            />
            {code || "—"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "amount",
      header: "Amount",
      cell: (info) => {
        const item = info.row.original;
        const incoming = item.direction === "incoming";
        const symbol = getCurrencySymbol(item.currency);
        const amount = formatAmount(Number(item.amount));
        return (
          <div>
            <p
              className={`text-sm font-semibold ${
                incoming ? "text-[#39A062]" : "text-[#DC180D]"
              }`}
            >
              {incoming ? "+" : "−"}
              {symbol}
              {amount}
            </p>
            {item.fee_amount ? (
              <p className="text-xs text-raiz-gray-500">
                Fee {symbol}
                {formatAmount(Number(item.fee_amount))}
              </p>
            ) : null}
          </div>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <StatusBadge
          label={getActivityStatusLabel(info.getValue())}
          tone={getActivityStatusTone(info.getValue())}
          variant="outlined"
        />
      ),
    }),
    columnHelper.accessor("created_at", {
      header: "Date & Time",
      cell: (info) => (
        <span className="text-sm text-raiz-gray-700">
          {info.getValue()
            ? dayjs(info.getValue()).format("MMM D, YYYY · h:mm A")
            : "—"}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleApplyFilter = () => {
    if (draftRange.startDate || draftRange.endDate) {
      setAppliedRange(draftRange);
      setCurrentPage(1);
      setShowDateRange(false);
      return;
    }
    setShowDateRange(true);
  };

  return (
    <section className="flex flex-col gap-4 bg-white rounded-2xl border border-raiz-gray-100 p-4 md:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-bold text-raiz-gray-950">
            Recent Transactions
          </h3>
          <p className="text-sm text-raiz-gray-600 mt-0.5">
            All transactions for this subaccount across USD, EUR, and GBP
            account.
          </p>
        </div>
        <div className="relative flex flex-wrap items-center gap-2">
          {hasDateFilter ? (
            <Button
              variant="secondary"
              className="!w-auto h-9 px-3 py-1.5 rounded-lg text-xs"
              onClick={() => {
                setAppliedRange({});
                setDraftRange({});
                setCurrentPage(1);
              }}
            >
              Clear dates
            </Button>
          ) : null}
          <Button
            variant="tertiary"
            className="!w-auto h-9 px-3 py-1.5 rounded-lg text-xs gap-1.5"
            onClick={() => setShowDateRange((prev) => !prev)}
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M4.667 1.167V2.917M9.333 1.167V2.917M1.75 5.25H12.25M2.917 2.333H11.083C11.727 2.333 12.25 2.856 12.25 3.5V11.083C12.25 11.727 11.727 12.25 11.083 12.25H2.917C2.273 12.25 1.75 11.727 1.75 11.083V3.5C1.75 2.856 2.273 2.333 2.917 2.333Z"
                  stroke="#443852"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            <span className="ml-2">
            {hasDateFilter
              ? `${dayjs(appliedRange.startDate).format("MMM D")} – ${dayjs(appliedRange.endDate).format("MMM D")}`
              : "Select dates"}</span>
          </Button>
          {/* <Button
            variant="secondary"
            className="!w-auto h-9 px-3 py-1.5 rounded-lg text-xs"
            onClick={handleApplyFilter}
          >
            Apply filter
          </Button> */}
          {showDateRange ? (
            <div className="absolute right-0 top-11 z-20">
              <DateRange
                onClose={() => setShowDateRange(false)}
                onApply={(range) => {
                  setDraftRange(range);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <Skeleton count={4} height={44} className="mb-2" />
      ) : items.length ? (
        <>
          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="whitespace-nowrap border-b border-raiz-gray-100"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-3 px-3 text-raiz-gray-500 text-[13px] font-medium"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-raiz-gray-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3.5 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          {hasDateFilter ? (
            <p className="text-sm text-raiz-gray-600">
              No account activity found for this date range.
            </p>
          ) : (
            <>
              <div className="size-14 rounded-full bg-[#F3F1F6] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle
                    cx="14"
                    cy="14"
                    r="10"
                    stroke="#6F5B86"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M14 9V14.5L17.5 16.5"
                    stroke="#6F5B86"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-raiz-gray-950">
                No transactions yet
              </h4>
              <p className="text-sm text-raiz-gray-600 text-center max-w-sm">
                Once transactions start flowing in and out, you&apos;ll see them
                listed here in real time.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default SubaccountActivities;
