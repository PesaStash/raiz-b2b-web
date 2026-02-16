"use client";

import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ITransactionParams } from "@/types/services";
import {
  FetchTransactionCategoriesApi,
  FetchTransactionReportApi,
} from "@/services/transactions";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import {
  convertTime,
  findWalletByCurrency,
  getCurrencySymbol,
  truncateString,
} from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";
import { ITransaction } from "@/types/transactions";
import Skeleton from "react-loading-skeleton";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { useSendStore } from "@/store/Send";
import NgnSend from "./send/naira/NgnSend";
import UsdSend from "./send/usd/UsdSend";
import { AnimatePresence } from "motion/react";
import SideModalWrapper from "./SideModalWrapper";
import Pagination from "@/components/ui/Pagination";
import Image from "next/image";
import DateRange from "../transactions/_components/DateRange";
import { format } from "date-fns";
import { LiaTimesSolid } from "react-icons/lia";
import TransactionMoreOptions from "../transactions/_components/TransactionMoreOptions";
import TxnReceipt from "./transaction-history/TxnReceipt";
import FilterHistory from "./transaction-history/FilterHistory";
import { GetTransactionClasses } from "@/services/transactions";
import { toast } from "sonner";

type customDateType = {
  day: string;
  month: string;
  year: string;
};

interface Props {
  pagination?: boolean;
  topRightOpts: "link" | "opts";
}

export type FilterParams = {
  transaction_class_id: number;
  start_date?: string;
  end_date?: string;
  transaction_category_id: number;
  transaction_status_id: number;
};

const columnHelper = createColumnHelper<ITransaction>();

const TransactionTable = ({ pagination, topRightOpts }: Props) => {
  const { user } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const SBCAcct = findWalletByCurrency(user, "SBC");
  const { currency } = useSendStore();
  const [showSend, setShowSend] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDateRange, setShowDateRange] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<ITransaction | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const pageSize = 10;
  const [filterParams, setFilterParams] = useState<FilterParams>({
    transaction_class_id: 0,
    start_date: "",
    end_date: "",
    transaction_category_id: 0,
    transaction_status_id: 0,
  });
  const [activity, setActivity] = useState(0);
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState({ label: "", id: 0 });
  const [category, setCategory] = useState(0);
  const [customStartDate, setCustomStartDate] = useState<customDateType>({
    day: "",
    month: "",
    year: "",
  });
  const [customEndDate, setCustomEndDate] = useState<customDateType>({
    day: "",
    month: "",
    year: "",
  });

  const handleViewDetails = (transaction: ITransaction) => {
    setSelectedTxn(transaction);
  };

  const closeReceipt = () => {
    setSelectedTxn(null);
  };
  const { data: activities } = useQuery({
    queryKey: ["transaction-class"],
    queryFn: GetTransactionClasses,
  });

  const { data: categories } = useQuery({
    queryKey: ["transactions-category"],
    queryFn: FetchTransactionCategoriesApi,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<ITransaction, any>[] = [
    columnHelper.accessor("third_party_name", {
      header: "Transaction",
      cell: (info) => (
        <div className="flex items-center gap-2 font-brSonoma">
          <Avatar
            name=""
            src={info?.row?.original?.third_party_profile_image_url}
          />
          <span className="text-sm font-medium text-raiz-gray-950">
            {truncateString(info.getValue(), 18)}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("transaction_amount", {
      header: "Amount",
      cell: (info) => {
        const isDebit =
          info.row.original?.transaction_type?.transaction_type === "debit";

        return (
          <span
            className={`text-sm font-normal  font-brSonoma ${
              isDebit ? " text-raiz-gray-700" : "text-[#079455]"
            }`}
          >
            {`${isDebit ? "-" : "+"} ${getCurrencySymbol(
              info.row.original?.currency,
            )}${Math.abs(info?.getValue())?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          </span>
        );
      },
    }),
    columnHelper.accessor("transaction_category.transaction_category", {
      header: "Category",
      cell: (info) => {
        if (info?.row?.original?.transaction_category?.transaction_category) {
          return (
            <div className="w-fit flex items-center px-1.5 py-0.5 gap-1 text-xs font-brSonoma border border-raiz-gray-200 rounded-md">
              {info.getValue()}
            </div>
          );
        } else {
          return null;
        }
      },
    }),
    columnHelper.accessor("transaction_date_time", {
      header: "Date",
      cell: (info) => (
        <span className="text-sm font-brSonoma text-raiz-gray-700">
          {dayjs(convertTime(info.getValue())).format("DD MMM YYYY @ h:mm A")}
        </span>
      ),
    }),
    columnHelper.accessor("transaction_status.transaction_status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        const dotColor =
          status === "completed"
            ? "bg-green-500"
            : status === "pending"
              ? "bg-yellow-500"
              : "bg-red-500";

        return (
          <div className="w-fit flex items-center px-1.5 py-0.5 gap-1 text-xs font-brSonoma border border-raiz-gray-200 rounded-md">
            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
            {status}
          </div>
        );
      },
    }),
    columnHelper.accessor("transaction_report_id", {
      header: "",
      cell: (info) => {
        const isLast =
          info.row.index >= info.table.getRowModel().rows.length - 3;
        return (
          <TransactionMoreOptions
            transaction={info.row.original}
            isLast={isLast}
            onViewDetails={handleViewDetails}
          />
        );
      },
    }),
  ];

  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    } else if (selectedCurrency.name === "SBC") {
      return SBCAcct;
    }
  };

  const currentWallet = getCurrentWallet();
  const start_date = dateRange.startDate
    ? format(dateRange.startDate, "yyyy-MM-dd")
    : filterParams.start_date;

  const end_date = dateRange.endDate
    ? format(dateRange.endDate, "yyyy-MM-dd")
    : filterParams.end_date;

  const queryKey = [
    "transactions-report",
    {
      wallet_id: currentWallet?.wallet_id,
      ...(pagination && { page: currentPage, limit: pageSize }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
      ...(filterParams.transaction_class_id && {
        transaction_class_id: filterParams.transaction_class_id,
      }),
      ...(filterParams.transaction_category_id && {
        transaction_category_id: filterParams.transaction_category_id,
      }),
      ...(filterParams.transaction_status_id && {
        transaction_status_id: filterParams.transaction_status_id,
      }),
    },
  ];
  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, ITransactionParams];
      return FetchTransactionReportApi(params);
    },
    enabled: !!currentWallet?.wallet_id,
  });
  // Reset page when wallet or currency changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentWallet?.wallet_id, selectedCurrency.name]);
  const pathName = usePathname();
  useEffect(() => {
    refetch();
  }, [pathName, refetch]);
  const transactions = data?.transaction_reports || [];
  const totalPages =
    pagination && data?.pagination_details?.total_pages
      ? data.pagination_details.total_pages
      : Math.ceil(transactions.length / pageSize) || 1;
  const paginatedTransactions = pagination ? transactions : transactions;
  const table = useReactTable({
    data: paginatedTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const clearFilters = () => {
    setFilterParams({
      transaction_class_id: 0,
      start_date: "",
      end_date: "",
      transaction_category_id: 0,
      transaction_status_id: 0,
    });
  };

  const paramPresent =
    filterParams?.end_date ||
    filterParams?.start_date ||
    filterParams?.transaction_category_id ||
    filterParams?.transaction_class_id ||
    filterParams.transaction_status_id;

  const handleSendButton = () => {
    if (!currentWallet) {
      toast.warning(
        "You do not have a wallet for this currency. Create one first!",
      );
    } else {
      setShowSend(true);
    }
  };
  return (
    <section className="w-full mt-8">
      <div className="flex justify-between items-center mb-6">
        {topRightOpts === "opts" && (
          <h3 className="text-lg font-bold  leading-snug text-raiz-gray-900">
            Transaction history
          </h3>
        )}
        {topRightOpts ===
        "link" ? //   className="text-raiz-gray-700 text-sm font-bold py-2 px-3.5  border border-[#E4E0EA] shadow rounded-md" // <Link
        //   href={"/transactions"}
        // >
        //   See more
        // </Link>
        null : (
          <div className="flex gap-3 items-center">
            {/* dates */}
            <div className="relative">
              <button
                onClick={() => setShowDateRange(!showDateRange)}
                className="flex gap-1.5 items-center px-3.5 py-2.5 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200 "
              >
                <Image
                  src={"/icons/calendar.svg"}
                  alt="calendar"
                  width={20}
                  height={20}
                />
                <span className="text-zinc-800 text-sm font-bold leading-none">
                  {dateRange.startDate && dateRange.endDate
                    ? `${format(dateRange.startDate, "dd MMM")} - ${format(
                        dateRange.endDate,
                        "dd MMM",
                      )}`
                    : "Select dates"}
                </span>
              </button>
              {showDateRange && (
                <DateRange
                  onApply={setDateRange}
                  onClose={() => setShowDateRange(false)}
                />
              )}
            </div>
            {dateRange.startDate && (
              <button
                onClick={() => setDateRange({})}
                className="flex items-center justify-center w-10 h-10 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200"
              >
                <LiaTimesSolid />
              </button>
            )}
            {/* filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilter(true)}
                className="flex gap-1.5 items-center px-3.5 py-2.5 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200 "
              >
                <Image
                  src={"/icons/filter.svg"}
                  alt="Filter"
                  width={20}
                  height={20}
                />
                <span className="text-zinc-800 text-sm font-bold leading-none">
                  Apply filter
                </span>
              </button>
              {paramPresent ? (
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 absolute top-0 right-0" />
              ) : null}
            </div>
            {/* export */}
            {/* <button className="flex gap-1.5 items-center px-3.5 py-2.5 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200 ">
              <Image
                src={"/icons/export.svg"}
                alt="Export"
                width={20}
                height={20}
              />
              <span className="text-zinc-800 text-sm font-bold leading-none">
                Export
              </span>
            </button> */}
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="w-full overflow-x-auto ">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b ">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="whitespace-nowrap">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="py-3 px-4 text-raiz-gray-700 text-[13px] font-normal font-monzo"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
              <tr />
            </thead>
            <tbody className="divide-y">
              <tr>
                <td colSpan={6}>
                  <Skeleton count={4} className="mb-3" height={48} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : transactions.length > 0 ? (
        <>
          <div className="w-full overflow-x-auto h-full ">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b ">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="whitespace-nowrap">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-3 px-4 text-raiz-gray-700 text-[13px] font-normal font-monzo"
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
              <tbody className="divide-y">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 whitespace-nowrap"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 ">
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
          {pagination && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col justify-center  items-center bg-[url('/images/txnBg.png')] bg-no-repeat bg-bottom py-6 pb-12">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M15.9998 29.3332C23.3636 29.3332 29.3332 23.3636 29.3332 15.9998C29.3332 8.63604 23.3636 2.6665 15.9998 2.6665C8.63604 2.6665 2.6665 8.63604 2.6665 15.9998C2.6665 23.3636 8.63604 29.3332 15.9998 29.3332Z"
              fill="#ECC8FF"
            />
            <path
              d="M20.2706 18.3852L18.7146 16.3732C18.248 15.7692 17.964 15.0438 17.8946 14.2838L17.3333 7.99984C17.3333 7.26384 16.736 6.6665 16 6.6665C15.264 6.6665 14.6666 7.26384 14.6666 7.99984L14.1586 14.5132C14.0586 15.7932 14.58 17.0438 15.56 17.8745L18.3853 20.2705C18.9066 20.7918 19.7506 20.7918 20.2706 20.2705C20.792 19.7505 20.792 18.9052 20.2706 18.3852Z"
              fill="#B35EE1"
            />
          </svg>
          <h2 className="text-raiz-gray-950 text-sm font-semibold mb-[14px]">
            No transactions yet
          </h2>
          <p className="w-80 mb-6 text-center text-raiz-gray-950 text-xs leading-none">
            Once transactions start flowing in, you&#39;ll see them listed here
            in real time.
          </p>
          <Button
            onClick={() => handleSendButton()}
            className="h-10 w-[191px] px-[18px] py-2  rounded-3xl justify-center items-center gap-1.5 inline-flex"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
              <path
                d="M13.7836 2.4667L6.25859 4.9667C1.20026 6.65837 1.20026 9.4167 6.25859 11.1L8.49193 11.8417L9.23359 14.075C10.9169 19.1334 13.6836 19.1334 15.3669 14.075L17.8753 6.55837C18.9919 3.18337 17.1586 1.3417 13.7836 2.4667ZM14.0503 6.95004L10.8836 10.1334C10.7586 10.2584 10.6003 10.3167 10.4419 10.3167C10.2836 10.3167 10.1253 10.2584 10.0003 10.1334C9.75859 9.8917 9.75859 9.4917 10.0003 9.25004L13.1669 6.0667C13.4086 5.82504 13.8086 5.82504 14.0503 6.0667C14.2919 6.30837 14.2919 6.70837 14.0503 6.95004Z"
                fill="#FDFDFD"
              />
            </svg>
            <span className="text-[#fcfcfc] lg:text-sm xl:text-base font-medium font-brSonoma leading-tight tracking-tight">
              Send Money
            </span>
          </Button>
        </div>
      )}
      <AnimatePresence>
        {selectedTxn && (
          <TxnReceipt transaction={selectedTxn} close={closeReceipt} />
        )}
        {showFilter && (
          <SideModalWrapper close={() => setShowFilter(false)}>
            <FilterHistory
              close={() => setShowFilter(false)}
              activities={activities || []}
              setParams={setFilterParams}
              period={period}
              activity={activity}
              customEndDate={customEndDate}
              customStartDate={customStartDate}
              setActivity={setActivity}
              setCustomStartDate={setCustomStartDate}
              setCustomEndDate={setCustomEndDate}
              setPeriod={setPeriod}
              clearAll={clearFilters}
              status={status}
              setStatus={setStatus}
              category={category}
              setCategory={setCategory}
              categories={categories || []}
            />
          </SideModalWrapper>
        )}
        {showSend ? (
          currency === "NGN" ? (
            <SideModalWrapper close={() => setShowSend(false)}>
              <NgnSend />
            </SideModalWrapper>
          ) : (
            <SideModalWrapper close={() => setShowSend(false)}>
              <UsdSend close={() => setShowSend(false)} />
            </SideModalWrapper>
          )
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default TransactionTable;
