"use client";
import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/components/ui/Avatar";
import SelectField from "@/components/ui/SelectField";
import StatusBadge from "@/components/ui/StatusBadge";
import { FetchTransactionReportApi } from "@/services/transactions";
import { ITransaction } from "@/types/transactions";
import { formatMoney } from "@/lib/globalBalance";
import { GlobalDialog, primaryButton, secondaryButton } from "./GlobalUI";
import TxnReceipt from "../transaction-history/TxnReceipt";
import { truncateString } from "@/utils/helpers";

export default function RecentTransactions({
  entityId,
  walletId,
  currency,
  global,
  onShare,
  onAddMoney,
  canWrite,
}: {
  entityId?: string;
  walletId?: string;
  currency: string;
  global: boolean;
  onShare: () => void;
  onAddMoney: () => void;
  canWrite: boolean;
}) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<ITransaction | null>(null);
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
        <div className="flex flex-col items-center py-16 text-center">
          <h3 className="font-semibold">No transactions yet</h3>
          <p className="mt-2 max-w-sm text-sm text-kyb-muted">
            When you receive or send money, it shows up here. Share your account
            details to get your first payment.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={onShare} className={secondaryButton}>
              Share account details
            </button>
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
      {selected &&
        (selected.settlement ? (
          <GlobalDialog
            title="Transaction details"
            close={() => setSelected(null)}
            drawer
          >
            <h3 className="text-2xl font-semibold">
              {formatMoney(
                selected.display_money?.amount ??
                  String(selected.transaction_amount),
                selected.display_money?.currency ?? selected.currency,
              )}
            </h3>
            <p className="my-4 text-sm text-kyb-muted">
              {selected.transaction_status?.transaction_status.replaceAll(
                "_",
                " ",
              )}
            </p>
            <dl className="space-y-5 rounded-2xl border border-kyb-border bg-white p-5">
              {[
                { label: "Reference", value: selected.transaction_reference },
                {
                  label: "Gross wallet amount",
                  value: formatMoney(
                    selected.settlement.wallet_impact.gross.amount,
                    selected.settlement.wallet_impact.gross.currency,
                  ),
                },
                ...selected.settlement.wallet_impact.fees.map((f) => ({
                  label: f.label,
                  value: formatMoney(f.amount.amount, f.amount.currency),
                })),
                {
                  label:
                    selected.settlement.wallet_impact.direction === "none"
                      ? "Pending wallet impact"
                      : "Net wallet impact",
                  value: formatMoney(
                    selected.settlement.wallet_impact.net.amount,
                    selected.settlement.wallet_impact.net.currency,
                  ),
                },
              ].map((field, index) => (
                <div key={`${field.label}-${index}`}>
                  <dt className="text-xs text-kyb-muted">{field.label}</dt>
                  <dd className="mt-1 break-words text-sm font-semibold">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          </GlobalDialog>
        ) : (
          <TxnReceipt transaction={selected} close={() => setSelected(null)} />
        ))}
    </section>
  );
}
