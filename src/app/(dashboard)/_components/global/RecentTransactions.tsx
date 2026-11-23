"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";
import SelectField from "@/components/ui/SelectField";
import StatusBadge from "@/components/ui/StatusBadge";
import { FetchTransactionReportApi } from "@/services/transactions";
import { ITransaction } from "@/types/transactions";
import {
  formatMoney,
  receivingInstructions,
  spendableBalances,
  walletInstructions,
} from "@/lib/globalBalance";
import { hasBankDetails } from "@/lib/businessWallets";
import { useUser } from "@/lib/hooks/useUser";
import { toTransactionView, type TransactionView } from "@/lib/transactionView";
import { FetchReceivingAccountsApi } from "@/services/globalBalance";
import TransactionDetailsPanel from "@/app/(dashboard)/transactions/_components/TransactionDetailsPanel";
import { DesignIcon, primaryButton, secondaryButton } from "./GlobalUI";
import { AccountDetails } from "./AccountDetails";
import { truncateString } from "@/utils/helpers";

export default function RecentTransactions({
  entityId,
  walletId,
  currency,
  global,
  onShare,
  onAddMoney,
  canWrite,
  atLimit,
  onSend,
}: {
  entityId?: string;
  walletId?: string;
  currency: string;
  global: boolean;
  onShare?: () => void;
  onAddMoney: () => void;
  canWrite: boolean;
  atLimit?: boolean;
  onSend?: () => void;
}) {
  const router = useRouter();
  const { user } = useUser();
  const account = user?.business_account;
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<ITransaction | null>(null);
  const [accountDetailId, setAccountDetailId] = useState<string | null>(null);
  const receivingQuery = useQuery({
    queryKey: ["receiving-accounts", entityId],
    queryFn: FetchReceivingAccountsApi,
    enabled: global && !!entityId,
  });
  const receiving =
    receivingQuery.data?.accounts ?? account?.receiving_accounts ?? [];
  const walletCurrencyById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const balance of spendableBalances(account)) {
      map[balance.wallet_id] = balance.currency;
    }
    for (const wallet of account?.wallets ?? []) {
      map[wallet.wallet_id] = wallet.wallet_type.currency;
    }
    return map;
  }, [account]);
  const instructions = useMemo(() => {
    const bank = (account?.wallets ?? [])
      .filter(
        (wallet) =>
          hasBankDetails(wallet) &&
          (wallet.wallet_type.currency === "USD" ||
            wallet.wallet_type.currency === "NGN" ||
            (!global &&
              (wallet.wallet_type.currency === "EUR" ||
                wallet.wallet_type.currency === "GBP"))),
      )
      .map((wallet) =>
        walletInstructions(wallet, account?.business_name ?? ""),
      );
    return [...bank, ...receiving.map(receivingInstructions)];
  }, [account?.business_name, account?.wallets, global, receiving]);
  const selectedView = selected
    ? toTransactionView(selected, {
        receivingAccounts: receiving,
        businessName: account?.business_name,
        walletCurrencyById,
      })
    : null;
  const handlePrimaryAction = (view: TransactionView) => {
    if (view.primaryAction === "account_details" && view.receiveAsset) {
      const match = instructions.find((item) => item.asset === view.receiveAsset);
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
      if (!onSend) {
        toast.info("Sending isn’t available on this wallet right now.");
        return;
      }
      setSelected(null);
      onSend();
    }
  };
  const handleSeeHistory = (name: string) => {
    const params = new URLSearchParams();
    if (filter) params.set("currency", filter);
    params.set("search", name);
    setSelected(null);
    router.push(`/transactions?${params.toString()}`);
  };
  const query = {
    ...(filter ? { currency: filter } : { wallet_id: walletId }),
    limit: 6,
    page: 1,
  };
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-transactions", entityId, query],
    queryFn: () => FetchTransactionReportApi(query),
    enabled: !!entityId && (!!walletId || !!filter),
  });
  const rows = data?.transaction_reports ?? [];
  const filterOptions = [
    { value: "", label: `${currency} balance activity` },
    ...["USD", "NGN", "EUR", "GBP", "USDT", "USDC"].map((asset) => ({
      value: asset,
      label: `${asset} payments`,
    })),
  ];
  return (
    <section className="rounded-2xl border border-kyb-border bg-white p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Transactions</h2>
        <div className="flex items-center gap-4">
          {global && (
            <SelectField
              instanceId="recent-transaction-currency"
              name="Filter by original transaction currency"
              isSearchable={false}
              bgColor="#ffffff"
              className="!shadow-none"
              width="160px"
              height="36px"
              minHeight="36px"
              controlPadding="0 4px"
              options={filterOptions}
              value={
                filterOptions.find((option) => option.value === filter) ?? null
              }
              onChange={(option) =>
                setFilter(option ? String(option.value) : "")
              }
            />
          )}
          <Link
            className="text-xs font-semibold text-primary2"
            href={filter ? `/transactions?currency=${filter}` : "/transactions"}
          >
            See all ›
          </Link>
        </div>
      </header>
      {isLoading ? (
        <div
          role="status"
          className="h-60 animate-pulse rounded-xl bg-kyb-field"
        >
          <span className="sr-only">Loading transactions</span>
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-sm">
          <p>Unable to load transactions.</p>
          <button
            className="mt-3 text-primary2 underline"
            onClick={() => refetch()}
          >
            Try again
          </button>
        </div>
      ) : !rows.length ? (
        <div className="flex flex-col items-center rounded-xl bg-kyb-soft px-4 py-16 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#e8f7ef]">
            <DesignIcon name="wallet-empty-transactions.svg" />
          </span>
          <h3 className="font-semibold">{atLimit ? "Make room to receive more" : "No transactions yet"}</h3>
          <p className="mt-2 max-w-sm text-sm text-kyb-muted">
            {atLimit ? "Spend or send money to make room for incoming payments."
              : "When you receive or send money, it shows up here."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {atLimit && onSend && <button onClick={onSend} className={`${primaryButton} !bg-primary2`}>Send money</button>}
            {!atLimit && onShare && <button onClick={onShare} className={secondaryButton}>
              Share account details
            </button>}
            {canWrite && (
              <button onClick={onAddMoney} className={primaryButton}>
                Add money
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-kyb-soft text-xs font-normal text-kyb-muted">
              <tr>
                <th className="rounded-l-xl px-3 py-2 font-normal">
                  Transaction
                </th>
                <th className="hidden px-3 py-2 font-normal md:table-cell">
                  Method
                </th>
                <th className="hidden px-3 py-2 font-normal sm:table-cell">
                  Date
                </th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="rounded-r-xl px-3 py-2 text-right font-normal">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kyb-border">
              {rows.map((row) => {
                const status =
                  row.transaction_status?.transaction_status ?? "pending";
                const impact = row.settlement?.wallet_impact;
                const original = row.display_money ?? {
                  amount: String(row.transaction_amount),
                  currency: row.currency,
                };
                const posted =
                  status === "completed" &&
                  impact &&
                  impact.direction !== "none";
                const primary = posted ? impact.net : original;
                const debit = posted
                  ? impact.direction === "debit"
                  : row.transaction_type?.transaction_type === "debit";
                return (
                  <tr
                    key={row.transaction_report_id}
                    className="hover:bg-kyb-soft"
                  >
                    <td className="px-3 py-4">
                      <button
                        onClick={() => setSelected(row)}
                        className="flex items-center gap-3 text-left"
                      >
                        <Avatar
                          name={row.third_party_name || row.currency}
                          src={row.third_party_profile_image_url}
                        />
                        <span>
                          <span className="block text-sm font-semibold">
                            {row.third_party_name ||
                              row.transaction_description ||
                              `${row.currency} payment`}
                          </span>
                          <span className="mt-1 block  text-xs text-kyb-muted">
                            {row.transaction_category?.transaction_category ||
                              truncateString(row.transaction_remarks, 50)}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="hidden px-3 py-4 md:table-cell">
                      <p className="text-sm">
                        {row.payment_method?.payment_method ||
                          `${row.currency} transfer`}
                      </p>
                      <p className="mt-1 text-xs text-kyb-muted">
                        {debit ? "Sent" : "Received"} in {row.currency}
                      </p>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-4 sm:table-cell">
                      <p className="text-sm">
                        {dayjs(row.transaction_date_time).format("D MMM")}
                      </p>
                      <p className="mt-1 text-xs text-kyb-muted">
                        {dayjs(row.transaction_date_time).format("h:mm A")}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge
                        label={status.replaceAll("_", " ")}
                        tone={
                          status === "completed"
                            ? "success"
                            : status === "pending" ||
                                status === "reconciliation_required"
                              ? "warning"
                              : status === "failed"
                                ? "danger"
                                : "neutral"
                        }
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      <p
                        className={`text-sm font-semibold ${debit ? "text-red-700" : ""}`}
                      >
                        {debit
                          ? "−"
                          : posted || status === "completed"
                            ? "+"
                            : ""}
                        {formatMoney(primary.amount, primary.currency)}
                      </p>
                      {posted && original.currency !== primary.currency && (
                        <p className="mt-1 text-xs text-kyb-muted">
                          {formatMoney(original.amount, original.currency)}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedView && (
        <TransactionDetailsPanel
          view={selectedView}
          close={() => setSelected(null)}
          onSeeHistory={handleSeeHistory}
          onPrimaryAction={handlePrimaryAction}
        />
      )}
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
    </section>
  );
}
