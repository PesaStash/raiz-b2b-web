"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { LiaTimesSolid } from "react-icons/lia";
import Pagination from "@/components/ui/Pagination";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import {
  FetchTransactionCategoriesApi,
  FetchTransactionReportApi,
  GenerateStatementApi,
  GetTransactionClasses,
} from "@/services/transactions";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import {
  isGlobalBalance,
  receivingInstructions,
  spendableBalances,
  walletInstructions,
} from "@/lib/globalBalance";
import {
  filterTransactionsLocally,
  groupTransactions,
  toTransactionView,
  type TransactionView,
} from "@/lib/transactionView";
import { findWalletByCurrency } from "@/utils/helpers";
import { ITransaction } from "@/types/transactions";
import { ITransactionParams } from "@/types/services";
import { FetchReceivingAccountsApi } from "@/services/globalBalance";
import {
  AccountDetails,
} from "@/app/(dashboard)/_components/global/AccountDetails";
import NgnSend from "@/app/(dashboard)/_components/send/naira/NgnSend";
import UsdSend from "@/app/(dashboard)/_components/send/usd/UsdSend";
import ForeignSend from "@/app/(dashboard)/_components/send/foreign/ForeignSend";
import FilterHistory from "@/app/(dashboard)/_components/transaction-history/FilterHistory";
import type { FilterParams } from "@/app/(dashboard)/_components/TransactionTable";
import DateRange from "./DateRange";
import {
  TransactionRowDesktop,
  TransactionRowMobile,
} from "./TransactionRow";
import TransactionDetailsPanel from "./TransactionDetailsPanel";

type CustomDate = { day: string; month: string; year: string };

export default function TransactionHistory({
  initialCurrencyFilter = "",
}: {
  initialCurrencyFilter?: string;
}) {
  const { user } = useUser();
  const account = user?.business_account;
  const global = isGlobalBalance(account);
  const { selectedCurrency } = useCurrencyStore();
  const balances = spendableBalances(account);
  const selectedBalance = balances.find(
    (b) => b.currency === selectedCurrency.name,
  );
  const legacyWallet = findWalletByCurrency(user, selectedCurrency.name);
  const walletId = global
    ? selectedBalance?.wallet_id
    : legacyWallet?.wallet_id;

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDateRange, setShowDateRange] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<ITransaction | null>(null);
  const [accountDetailId, setAccountDetailId] = useState<string | null>(null);
  const [originalCurrency, setOriginalCurrency] = useState(
    initialCurrencyFilter && initialCurrencyFilter !== "NGN"
      ? initialCurrencyFilter
      : "",
  );
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
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
  const [customStartDate, setCustomStartDate] = useState<CustomDate>({
    day: "",
    month: "",
    year: "",
  });
  const [customEndDate, setCustomEndDate] = useState<CustomDate>({
    day: "",
    month: "",
    year: "",
  });
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    walletId,
    selectedCurrency.name,
    originalCurrency,
    debouncedSearch,
    filterParams,
    dateRange.startDate,
    dateRange.endDate,
  ]);

  useEffect(() => {
    if (initialCurrencyFilter && initialCurrencyFilter !== "NGN") {
      setOriginalCurrency(initialCurrencyFilter);
    }
  }, [initialCurrencyFilter]);

  const start_date = dateRange.startDate
    ? format(dateRange.startDate, "yyyy-MM-dd")
    : filterParams.start_date;
  const end_date = dateRange.endDate
    ? format(dateRange.endDate, "yyyy-MM-dd")
    : filterParams.end_date;

  const currencyFilter =
    global && selectedCurrency.name === "USD" && originalCurrency
      ? originalCurrency
      : undefined;
  // Only send reference-shaped queries to the API; name/amount stay client-side
  // so a counterparty search does not empty the page via a false reference match.
  const referenceQuery =
    debouncedSearch &&
    !/\s/.test(debouncedSearch) &&
    debouncedSearch.length >= 6
      ? debouncedSearch
      : undefined;

  const queryKey = [
    "transactions-report",
    {
      wallet_id: walletId,
      ...(currencyFilter ? { currency: currencyFilter } : {}),
      entity_id: account?.entity_id,
      page: currentPage,
      limit: pageSize,
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
      ...(referenceQuery && { transaction_reference: referenceQuery }),
    },
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: ({ queryKey: key }) => {
      const [, params] = key as [string, ITransactionParams & { entity_id?: string }];
      const { entity_id: _entityId, ...filters } = params;
      return FetchTransactionReportApi(filters);
    },
    enabled: !!user && !!walletId,
  });

  const { data: classes } = useQuery({
    queryKey: ["transaction-classes"],
    queryFn: GetTransactionClasses,
  });
  const { data: categories } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: FetchTransactionCategoriesApi,
  });
  const receivingQuery = useQuery({
    queryKey: ["receiving-accounts", account?.entity_id],
    queryFn: FetchReceivingAccountsApi,
    enabled: global && !!account?.entity_id,
  });

  const receiving =
    receivingQuery.data?.accounts ?? account?.receiving_accounts ?? [];
  const walletCurrencyById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const balance of balances) map[balance.wallet_id] = balance.currency;
    for (const wallet of account?.wallets ?? []) {
      map[wallet.wallet_id] = wallet.wallet_type.currency;
    }
    return map;
  }, [account?.wallets, balances]);

  const transactions = data?.transaction_reports ?? [];
  const views = useMemo(
    () =>
      filterTransactionsLocally(
        transactions.map((tx) =>
          toTransactionView(tx, {
            receivingAccounts: receiving,
            businessName: account?.business_name,
            walletCurrencyById,
          }),
        ),
        debouncedSearch,
      ),
    [
      transactions,
      receiving,
      account?.business_name,
      walletCurrencyById,
      debouncedSearch,
    ],
  );
  const groups = useMemo(() => groupTransactions(views), [views]);
  const selectedView = selected
    ? toTransactionView(selected, {
        receivingAccounts: receiving,
        businessName: account?.business_name,
        walletCurrencyById,
      })
    : null;

  const totalPages = data?.pagination_details?.total_pages || 1;
  const paramPresent = !!(
    filterParams.end_date ||
    filterParams.start_date ||
    filterParams.transaction_category_id ||
    filterParams.transaction_class_id ||
    filterParams.transaction_status_id ||
    originalCurrency
  );

  const instructions = useMemo(() => {
    const bank = (account?.wallets ?? [])
      .filter(
        (w) =>
          w.wallet_type.currency === "USD" ||
          w.wallet_type.currency === "NGN" ||
          (!global &&
            (w.wallet_type.currency === "EUR" ||
              w.wallet_type.currency === "GBP")),
      )
      .map((w) => walletInstructions(w, account?.business_name ?? ""));
    return [...bank, ...receiving.map(receivingInstructions)];
  }, [account?.business_name, account?.wallets, global, receiving]);

  const clearFilters = () => {
    setFilterParams({
      transaction_class_id: 0,
      start_date: "",
      end_date: "",
      transaction_category_id: 0,
      transaction_status_id: 0,
    });
    setOriginalCurrency("");
  };

  const handleExport = async () => {
    if (!walletId) {
      toast.warning("Select a balance before exporting.");
      return;
    }
    const start =
      start_date ||
      format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
    const end = end_date || format(new Date(), "yyyy-MM-dd");
    setExporting(true);
    try {
      const result = await GenerateStatementApi({
        wallet_id: walletId,
        startDate: start,
        endDate: end,
      });
      if (typeof result === "string") {
        window.open(result, "_blank");
      } else if (result?.url) {
        window.open(result.url, "_blank");
      } else if (result?.download_url) {
        window.open(result.download_url, "_blank");
      } else {
        toast.success("Statement requested.");
      }
    } catch {
      toast.error("Unable to export statement.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrimaryAction = (view: TransactionView) => {
    if (view.primaryAction === "account_details" && view.receiveAsset) {
      const match = instructions.find((a) => a.asset === view.receiveAsset);
      if (match) {
        setAccountDetailId(match.id);
        return;
      }
      toast.info(`${view.receiveAsset} account details are not available yet.`);
      return;
    }
    if (view.primaryAction === "track") {
      toast.info("Tracking details are shown above for this transfer.");
      return;
    }
    if (view.primaryAction === "send_again") {
      setShowSend(true);
    }
  };

  const handleSeeHistory = (name: string) => {
    setSearch(name);
    setSelected(null);
  };

  return (
    <section className="min-w-0 rounded-[20px] bg-[#fcfcfd] p-4 md:p-8">
      <div className="mb-5 flex flex-col gap-3 xl:mb-[41px] xl:grid xl:grid-cols-[173px_340px_minmax(0,1fr)] xl:items-center xl:gap-x-[68px]">
        <h2 className="text-[18px] font-semibold leading-[22px] text-[#19151e]">
          Transaction history
        </h2>
        <div className="relative h-11 min-w-0">
          <Image
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60"
            src="/images/dashboard/32532-history-search.svg"
            alt=""
            width={22}
            height={22}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, reference or amount"
            className="h-11 w-full rounded-2xl border border-white bg-[#f8f7fa] pl-[46px] pr-4 text-sm text-[#19151e] outline-none placeholder:text-[#a89ab9] focus:ring-2 focus:ring-[#e4e0ea]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 xl:justify-end xl:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDateRange((open) => !open)}
              className="flex h-10 min-w-[143px] items-center justify-center gap-1.5 rounded-xl border border-[#e4e0ea] bg-white px-3.5 text-sm font-semibold text-[#2c2435] shadow-[0px_1px_2px_rgba(16,24,40,0.05)]"
            >
              <Image
                src="/images/dashboard/32532-history-calendar.svg"
                alt=""
                width={20}
                height={20}
              />
              {dateRange.startDate && dateRange.endDate
                ? `${format(dateRange.startDate, "dd MMM")} - ${format(
                    dateRange.endDate,
                    "dd MMM",
                  )}`
                : "Select dates"}
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
              type="button"
              aria-label="Clear dates"
              onClick={() => setDateRange({})}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e0ea] bg-white"
            >
              <LiaTimesSolid />
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilter(true)}
              className="flex h-10 min-w-[136px] items-center justify-center gap-1.5 rounded-xl border border-[#e4e0ea] bg-white px-3.5 text-sm font-semibold text-[#2c2435] shadow-[0px_1px_2px_rgba(16,24,40,0.05)]"
            >
              <Image
                src="/images/dashboard/32532-history-sort.svg"
                alt=""
                width={20}
                height={20}
              />
              Apply filter
            </button>
            {paramPresent && (
              <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-red-600" />
            )}
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExport()}
            className="flex h-10 min-w-[103px] items-center justify-center gap-1.5 rounded-xl border border-[#e4e0ea] bg-white px-3.5 text-sm font-semibold text-[#2c2435] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] disabled:opacity-60"
          >
            <Image
              src="/images/dashboard/32532-history-export.svg"
              alt=""
              width={20}
              height={20}
            />
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <TransactionTableSkeleton />
      ) : isError ? (
        <div className="rounded-2xl bg-white py-16 text-center text-sm">
          <p>Unable to load transactions.</p>
          <button
            type="button"
            className="mt-3 text-primary2 underline"
            onClick={() => refetch()}
          >
            Try again
          </button>
        </div>
      ) : !views.length ? (
        <div className="flex flex-col items-center rounded-2xl bg-white py-16 text-center">
          <h3 className="font-semibold text-raiz-gray-950">
            {paramPresent || dateRange.startDate || debouncedSearch
              ? "No transactions found"
              : "No transactions yet"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-raiz-gray-600">
            {paramPresent || dateRange.startDate || debouncedSearch
              ? "We couldn't find any transactions matching your filters."
              : "When you receive or send money, it shows up here."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {groups.map((group) => (
              <div key={group.key} className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-raiz-gray-500">
                  {group.label}
                </p>
                {group.items.map((view) => {
                  const tx = transactions.find(
                    (item) => item.transaction_report_id === view.id,
                  );
                  return (
                    <TransactionRowMobile
                      key={view.id}
                      view={view}
                      selected={selected?.transaction_report_id === view.id}
                      onSelect={() => tx && setSelected(tx)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1056px] table-fixed text-left">
              <colgroup>
                <col className="w-[320px]" />
                <col className="w-[180px]" />
                <col className="w-[160px]" />
                <col className="w-[120px]" />
                <col className="w-[140px]" />
                <col className="w-[116px]" />
              </colgroup>
              <thead>
                <tr className="h-10 bg-[#f8f7fa] text-xs font-normal text-[#6b6b80]">
                  <th className="rounded-l-xl pl-5 font-normal">
                    Transaction
                  </th>
                  <th className="font-normal">Amount</th>
                  <th className="font-normal">Rail</th>
                  <th className="font-normal">Category</th>
                  <th className="font-normal">Date</th>
                  <th className="rounded-r-xl font-normal">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <FragmentGroup
                    key={group.key}
                    label={group.label}
                    items={group.items}
                    transactions={transactions}
                    selectedId={selected?.transaction_report_id}
                    onSelect={setSelected}
                  />
                ))}
              </tbody>
            </table>
          </div>

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
      )}

      <AnimatePresence>
        {selectedView && selected && (
          <TransactionDetailsPanel
            view={selectedView}
            close={() => setSelected(null)}
            onSeeHistory={handleSeeHistory}
            onPrimaryAction={handlePrimaryAction}
          />
        )}
        {showFilter && (
          <CenterModalWrapper close={() => setShowFilter(false)}>
            <FilterHistory
              close={() => setShowFilter(false)}
              activities={classes || []}
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
              originalCurrency={originalCurrency}
              setOriginalCurrency={
                global && selectedCurrency.name === "USD"
                  ? setOriginalCurrency
                  : undefined
              }
            />
          </CenterModalWrapper>
        )}
        {showSend ? (
          selectedCurrency.name === "NGN" ? (
            <CenterModalWrapper sendFlow close={() => setShowSend(false)}>
              <NgnSend close={() => setShowSend(false)} />
            </CenterModalWrapper>
          ) : selectedCurrency.name === "USD" ? (
            <CenterModalWrapper sendFlow close={() => setShowSend(false)}>
              <UsdSend close={() => setShowSend(false)} />
            </CenterModalWrapper>
          ) : (
            <CenterModalWrapper sendFlow close={() => setShowSend(false)}>
              <ForeignSend close={() => setShowSend(false)} />
            </CenterModalWrapper>
          )
        ) : null}
        {accountDetailId && (
          <AccountDetails
            accounts={instructions}
            initialId={accountDetailId}
            businessName={account?.business_name ?? ""}
            entityId={account?.entity_id ?? ""}
            global={global}
            close={() => setAccountDetailId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function Bone({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-full bg-[#f0eef4] ${className}`} />;
}

function TransactionTableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, index) => index);
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading transactions</span>
      <div className="space-y-2 lg:hidden">
        <Bone className="ml-1 h-3 w-16 rounded" />
        {rows.map((row) => (
          <div
            key={row}
            className="flex items-start gap-3 rounded-2xl border border-[#f4f4f8] px-3 py-3"
          >
            <Bone className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Bone className="h-3.5 w-36 rounded" />
                  <Bone className="mt-2 h-3 w-24 rounded" />
                </div>
                <Bone className="h-3.5 w-16 rounded" />
              </div>
              <div className="mt-3 flex gap-2">
                <Bone className="h-5 w-20 rounded-full" />
                <Bone className="h-3 w-24 self-center rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden lg:block">
        <table className="w-full min-w-[1056px] table-fixed text-left">
          <colgroup>
            <col className="w-[320px]" />
            <col className="w-[180px]" />
            <col className="w-[160px]" />
            <col className="w-[120px]" />
            <col className="w-[140px]" />
            <col className="w-[116px]" />
          </colgroup>
          <thead>
            <tr className="h-10 bg-[#f8f7fa] text-xs font-normal text-[#6b6b80]">
              {["Transaction", "Amount", "Rail", "Category", "Date", "Status"].map(
                (label, index) => (
                  <th
                    key={label}
                    className={`font-normal ${index === 0 ? "rounded-l-xl pl-5" : ""} ${index === 5 ? "rounded-r-xl" : ""}`}
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="h-[34px] pl-5 pt-2">
                <Bone className="h-3 w-16 rounded" />
              </td>
            </tr>
            {rows.map((row) => (
              <tr key={row} className="h-16 border-b border-[#f4f4f8]">
                <td className="pl-5">
                  <div className="flex items-center gap-2.5">
                    <Bone className="h-10 w-10 shrink-0" />
                    <span>
                      <Bone className="h-3.5 w-32 rounded" />
                      <Bone className="mt-2 h-3 w-24 rounded" />
                    </span>
                  </div>
                </td>
                <td>
                  <Bone className="h-3.5 w-16 rounded" />
                  <Bone className="mt-2 h-3 w-20 rounded" />
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Bone className="h-[18px] w-[18px]" />
                    <Bone className="h-3 w-20 rounded" />
                  </div>
                </td>
                <td>
                  <Bone className="h-6 w-16" />
                </td>
                <td>
                  <Bone className="h-3 w-24 rounded" />
                </td>
                <td>
                  <Bone className="h-[22px] w-[88px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentGroup({
  label,
  items,
  transactions,
  selectedId,
  onSelect,
}: {
  label: string;
  items: TransactionView[];
  transactions: ITransaction[];
  selectedId?: string;
  onSelect: (tx: ITransaction) => void;
}) {
  return (
    <>
      <tr className="bg-white">
        <td
          colSpan={6}
          className="h-[34px] pl-5 pt-2 text-xs font-semibold text-[#6b6b80]"
        >
          {label}
        </td>
      </tr>
      {items.map((view) => {
        const tx = transactions.find(
          (item) => item.transaction_report_id === view.id,
        );
        return (
          <TransactionRowDesktop
            key={view.id}
            view={view}
            selected={selectedId === view.id}
            onSelect={() => tx && onSelect(tx)}
          />
        );
      })}
    </>
  );
}
