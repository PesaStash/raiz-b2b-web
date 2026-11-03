"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";
import Avatar from "@/components/ui/Avatar";
import EmptyList from "@/components/ui/EmptyList";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import { FetchGatewaySubaccountsApi } from "@/services/gateway";
import { IGatewaySubaccount } from "@/types/services";
import { truncateString } from "@/utils/helpers";
import {
  GatewaySummaryFilterKey,
  getCurrencyFlagSrc,
  getGatewayStatusLabel,
  getGatewayStatusTone,
  getSubaccountDisplayName,
} from "../_utils/subaccountHelpers";
import MobileSubaccountCards, {
  MobileSubaccountCardsSkeleton,
} from "./MobileSubaccountCards";

const columnHelper = createColumnHelper<IGatewaySubaccount>();
const pageSize = 10;

type Props = {
  statusFilter: GatewaySummaryFilterKey;
};

const CurrencyFlags = ({
  requested,
  accounts,
}: {
  requested: string[];
  accounts: string[];
}) => {
  if (!requested.length) {
    return <span className="text-sm text-raiz-gray-500">—</span>;
  }
  const accountSet = new Set(accounts.map((c) => c.toUpperCase()));
  return (
    <div className="flex flex-wrap gap-2">
      {requested.map((currency) => {
        const code = currency.toUpperCase();
        const ready = accountSet.has(code);
        return (
          <span
            key={code}
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${
              ready ? "text-[#39A062]" : "text-raiz-gray-700"
            }`}
          >
            <Image
              src={getCurrencyFlagSrc(code)}
              alt={code}
              width={18}
              height={18}
              className="rounded-full size-[18px] object-cover"
            />
            {code}
          </span>
        );
      })}
    </div>
  );
};

const SubaccountsTable = ({ statusFilter }: Props) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const statusParam =
    statusFilter === "all" ? undefined : statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: [
      "gateway-subaccounts",
      { status: statusParam, page: currentPage, limit: pageSize },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [
        string,
        { status?: string; page: number; limit: number },
      ];
      return FetchGatewaySubaccountsApi(params);
    },
  });

  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<IGatewaySubaccount, any>[] = [
    columnHelper.display({
      id: "customer",
      header: "Customer Name",
      cell: (info) => {
        const item = info.row.original;
        const name = getSubaccountDisplayName(item);
        return (
          <div className="flex items-center gap-2.5 font-brSonoma">
            <Avatar name={name} src="" />
            <p className="text-sm font-medium text-raiz-gray-950">
              {truncateString(name, 28)}
            </p>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "email",
      header: "Email Address",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {info.row.original.customer_snapshot?.email || "—"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "currency",
      header: "Currency",
      cell: (info) => {
        const item = info.row.original;
        const requested =
          item.requested_currencies ||
          item.customer_snapshot?.requested_currencies ||
          [];
        const accounts = (item.accounts || []).map((a) => a.currency);
        return <CurrencyFlags requested={requested} accounts={accounts} />;
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <StatusBadge
          label={getGatewayStatusLabel(info.getValue())}
          tone={getGatewayStatusTone(info.getValue())}
          variant="outlined"
        />
      ),
    }),
    columnHelper.accessor("created_at", {
      header: "Date",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {info.getValue()
            ? dayjs(info.getValue()).format("D MMM YYYY @ h:mm A")
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

  const openDetail = (item: IGatewaySubaccount) => {
    router.push(`/gateway/${item.subaccount_id}`);
  };

  const hasItems = items.length > 0;

  return (
    <section className="w-full min-w-0 bg-white rounded-2xl border border-raiz-gray-100 p-4 md:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <h3 className="text-raiz-gray-950 text-base md:text-lg font-semibold mb-4 md:mb-5">
        Subaccounts
      </h3>

      {isLoading ? (
        <>
          <div className="hidden lg:block w-full overflow-x-auto">
            <Skeleton count={5} className="mb-3" height={48} />
          </div>
          <MobileSubaccountCardsSkeleton />
        </>
      ) : hasItems ? (
        <>
          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="whitespace-nowrap bg-[#F8F7FA] border-b border-raiz-gray-100"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-3 rounded-tl-xl rounded-tr-xl px-4 text-raiz-gray-700 text-[13px] font-medium"
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
                  <tr
                    key={row.id}
                    onClick={() => openDetail(row.original)}
                    className="hover:bg-gray-50 whitespace-nowrap cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5">
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

          <MobileSubaccountCards items={items} onSelect={openDetail} />

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex justify-center items-center py-12 lg:py-16">
          <EmptyList
            text={
              statusFilter === "all"
                ? "No customers have requested account creation yet"
                : "No subaccounts match this status"
            }
          />
        </div>
      )}
    </section>
  );
};

export default SubaccountsTable;
