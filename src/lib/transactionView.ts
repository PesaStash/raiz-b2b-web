import dayjs from "dayjs";
import { formatMoney } from "./globalBalance.ts";
import type { Money, ReceivingAccount, Settlement } from "../types/globalBalance.ts";
import type { ITransaction } from "../types/transactions.ts";

export type TransactionKind =
  | "foreign_deposit"
  | "crypto_deposit"
  | "foreign_payout"
  | "crypto_payout"
  | "ngn_transfer"
  | "usd_transfer"
  | "swap"
  | "alipay_wechat"
  | "bill"
  | "card"
  | "refund"
  | "other";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "refunded";

export type AmountTone = "credit" | "debit" | "refund" | "pending";

export interface TransactionDetailRow {
  label: string;
  value: string;
  tone?: "success" | "warning" | "danger" | "refunded" | "muted";
  copyValue?: string;
}

export interface TransactionView {
  id: string;
  kind: TransactionKind;
  title: string;
  subtitle: string;
  avatarName: string;
  avatarSrc: string | null;
  flagCurrency: string | null;
  primaryAmount: Money;
  primarySign: "+" | "−" | "";
  amountTone: AmountTone;
  secondaryLine: string | null;
  railLabel: string;
  railCurrency: string | null;
  category: string | null;
  dateLabel: string;
  timeLabel: string;
  absoluteDateLabel: string;
  statusRaw: string;
  statusLabel: string;
  statusTone: StatusTone;
  stageLabel: string | null;
  isPendingGroup: boolean;
  counterpartyLine: string | null;
  accountLine: string | null;
  settledTo: string | null;
  originalMoney: Money | null;
  walletMoney: Money | null;
  walletCurrency: string | null;
  fees: { label: string; amount: Money }[];
  rateLabel: string | null;
  reference: string;
  network: string | null;
  transactionHash: string | null;
  proofUrl: string | null;
  receiveAsset: string | null;
  detailRows: TransactionDetailRow[];
  receiptHeadline: string;
  receiptRows: TransactionDetailRow[];
  primaryAction: "account_details" | "track" | "send_again" | null;
  primaryActionLabel: string | null;
}

export interface TransactionGroup {
  key: string;
  label: string;
  items: TransactionView[];
}

const CRYPTO = new Set(["USDT", "USDC"]);
const FOREIGN = new Set(["GBP", "EUR"]);

const NETWORK_LABELS: Record<string, string> = {
  ethereum: "Ethereum",
  base: "Base",
  polygon: "Polygon",
  bsc: "BSC",
  avalanche: "Avalanche",
  optimism: "Optimism",
  tron: "Tron",
  solana: "Solana",
};

const RAIL_LABELS: Record<string, string> = {
  faster_payments: "Faster Payments",
  sepa: "SEPA",
  ach: "ACH",
  wire: "Wire",
};

function money(
  amount: string | number | null | undefined,
  currency: string | null | undefined,
): Money | null {
  if (amount === null || amount === undefined || !currency) return null;
  const raw = String(amount);
  if (!raw.trim()) return null;
  return { amount: raw, currency };
}

function statusOf(tx: ITransaction): string {
  return (tx.transaction_status?.transaction_status ?? "pending")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function classOf(tx: ITransaction): string {
  return (tx.transaction_class?.transaction_class ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isDebitType(tx: ITransaction): boolean {
  return tx.transaction_type?.transaction_type === "debit";
}

function formatRate(
  rate: Settlement["rate"] | null | undefined,
  fallback?: string | null,
  base?: string | null,
  quote?: string | null,
): string | null {
  if (rate?.value && rate.base_currency && rate.quote_currency) {
    return `1 ${rate.base_currency} = ${rate.value} ${rate.quote_currency}`;
  }
  if (fallback && base && quote) return `1 ${base} = ${fallback} ${quote}`;
  return null;
}

function formatNetwork(network: string | null | undefined): string | null {
  if (!network) return null;
  return NETWORK_LABELS[network.toLowerCase()] ?? network;
}

function maskAccount(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = value.replace(/\s/g, "");
  if (compact.length <= 4) return compact;
  return `····${compact.slice(-4)}`;
}

function truncateRef(value: string, max = 16): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function feeTotal(settlement: Settlement | null | undefined): Money | null {
  const fees = settlement?.wallet_impact?.fees ?? [];
  if (!fees.length) return null;
  if (fees.length === 1) return fees[0].amount;
  const currency = fees[0].amount.currency;
  if (!fees.every((f) => f.amount.currency === currency)) return fees[0].amount;
  // Server already calculated each fee; summing only when all share a currency
  // and amounts are plain decimals. Prefer showing the first fee line if unsafe.
  if (!fees.every((f) => /^-?\d+(\.\d+)?$/.test(f.amount.amount))) {
    return fees[0].amount;
  }
  const cents = fees.reduce((sum, f) => {
    const [w, frac = ""] = f.amount.amount.replace("-", "").split(".");
    return sum + BigInt(w + frac.padEnd(2, "0").slice(0, 2));
  }, BigInt(0));
  return {
    amount: `${cents / BigInt(100)}.${String(cents % BigInt(100)).padStart(2, "0")}`,
    currency,
  };
}

function paymentRailFromReceiving(
  currency: string,
  receivingAccounts?: ReceivingAccount[] | null,
): string | null {
  if (!receivingAccounts?.length) return null;
  const match = receivingAccounts.find(
    (a) => a.asset === currency && a.kind === "bank_account",
  );
  const rail =
    typeof match?.bank?.payment_rail === "string"
      ? match.bank.payment_rail
      : null;
  return rail ? (RAIL_LABELS[rail] ?? rail) : null;
}

export function detectKind(tx: ITransaction): TransactionKind {
  const status = statusOf(tx);
  if (status === "reversed" || status === "refunded") return "refund";
  if (tx.alipay_wechat) return "alipay_wechat";
  if (tx.swift) return "foreign_payout";

  const cls = classOf(tx);
  if (cls.includes("swap") || cls.includes("conversion")) return "swap";
  if (cls.includes("bill")) return "bill";
  if (cls.includes("card")) return "card";

  const currency = (tx.display_money?.currency ?? tx.currency ?? "").toUpperCase();
  const settlement = tx.settlement;
  const hasSource = !!settlement?.source_money;
  const hasDest = !!settlement?.destination_money;
  const debit = isDebitType(tx);
  const direction = settlement?.wallet_impact?.direction;

  if (CRYPTO.has(currency)) {
    if (debit || direction === "debit") return "crypto_payout";
    return "crypto_deposit";
  }
  if (FOREIGN.has(currency) || currency === "USD") {
    if (hasDest && !hasSource) return debit ? "foreign_payout" : "foreign_deposit";
    if (hasSource && !hasDest) return "foreign_deposit";
    if (hasDest) return "foreign_payout";
    if (debit) return currency === "USD" ? "usd_transfer" : "foreign_payout";
    return currency === "USD" ? "usd_transfer" : "foreign_deposit";
  }
  if (currency === "NGN") return "ngn_transfer";
  return "other";
}

export function mapStatus(tx: ITransaction): {
  raw: string;
  label: string;
  tone: StatusTone;
  stageLabel: string | null;
  isPendingGroup: boolean;
} {
  const raw = statusOf(tx);
  if (raw === "completed" || raw === "success") {
    return {
      raw,
      label: "Completed",
      tone: "success",
      stageLabel: null,
      isPendingGroup: false,
    };
  }
  if (raw === "failed") {
    return {
      raw,
      label: "Failed",
      tone: "danger",
      stageLabel: null,
      isPendingGroup: false,
    };
  }
  if (raw === "reversed" || raw === "refunded") {
    return {
      raw,
      label: "Refunded",
      tone: "refunded",
      stageLabel: null,
      isPendingGroup: false,
    };
  }
  if (raw === "reconciliation_required") {
    return {
      raw,
      label: "Under review",
      tone: "warning",
      stageLabel: "Under review",
      isPendingGroup: true,
    };
  }

  let stageLabel: string | null = null;
  if (tx.swift?.status === "pending") stageLabel = "With payout partner";
  if (tx.alipay_wechat?.status === "pending") stageLabel = "With payout partner";

  return {
    raw,
    label: "On its way",
    tone: "warning",
    stageLabel,
    isPendingGroup: true,
  };
}

function buildRail(
  tx: ITransaction,
  kind: TransactionKind,
  receivingAccounts?: ReceivingAccount[] | null,
): { label: string; currency: string | null } {
  const currency = (
    tx.display_money?.currency ??
    tx.currency ??
    ""
  ).toUpperCase();
  const network = formatNetwork(tx.settlement?.network ?? null);

  if (kind === "crypto_deposit" || kind === "crypto_payout") {
    return {
      label: network ? `${network} · ${currency}` : currency,
      currency,
    };
  }
  if (kind === "alipay_wechat") {
    const channel =
      tx.alipay_wechat?.channel === "wechat" ? "WeChat" : "Alipay";
    return { label: `${channel} · CNY`, currency: "CNY" };
  }
  if (kind === "swap") {
    const from =
      tx.settlement?.source_money?.currency ??
      (isDebitType(tx) ? currency : "NGN");
    const to =
      tx.settlement?.destination_money?.currency ??
      (isDebitType(tx) ? "USD" : currency);
    return { label: `Swap · ${from} → ${to}`, currency: null };
  }
  if (tx.swift) {
    return {
      label: tx.swift.country
        ? `SWIFT · ${tx.swift.country}`
        : `SWIFT · ${currency}`,
      currency,
    };
  }
  if (kind === "foreign_deposit" || kind === "foreign_payout") {
    const rail = paymentRailFromReceiving(currency, receivingAccounts);
    if (rail) {
      return {
        label: currency === "GBP" || currency === "EUR" ? `${rail} · ${currency}` : rail,
        currency,
      };
    }
    if (currency === "EUR") return { label: `SEPA · EUR`, currency: "EUR" };
    if (currency === "GBP")
      return { label: "Faster Payments", currency: "GBP" };
  }
  const method = tx.payment_method?.payment_method;
  if (method) {
    return {
      label: currency ? `${method} · ${currency}` : method,
      currency: currency || null,
    };
  }
  return {
    label: currency ? `${currency} transfer` : "Transfer",
    currency: currency || null,
  };
}

function buildTitleSubtitle(
  tx: ITransaction,
  kind: TransactionKind,
): { title: string; subtitle: string } {
  const currency = (
    tx.display_money?.currency ??
    tx.currency ??
    ""
  ).toUpperCase();
  const name = tx.third_party_name?.trim();
  const debit = isDebitType(tx);

  if (kind === "swap") {
    const from = tx.settlement?.source_money?.currency ?? "NGN";
    const to = tx.settlement?.destination_money?.currency ?? "USD";
    return {
      title: `Swapped ${from} to ${to}`,
      subtitle: `From ${from} balance`,
    };
  }
  if (kind === "crypto_deposit") {
    return {
      title: `${currency} deposit`,
      subtitle: networkSubtitle(tx) ?? `Received ${currency}`,
    };
  }
  if (kind === "crypto_payout") {
    return {
      title: name || `Sent ${currency}`,
      subtitle: `Sent ${currency} · Crypto`,
    };
  }
  if (kind === "alipay_wechat") {
    const channel =
      tx.alipay_wechat?.channel === "wechat" ? "WeChat" : "Alipay";
    const funding =
      tx.alipay_wechat?.funding_currency ??
      (tx.alipay_wechat?.ngn_amount ? "NGN" : null);
    return {
      title: name ? `${name} · ${channel}` : channel,
      subtitle: funding
        ? `Paid from ${funding} · China Pay`
        : `Paid · China Pay`,
    };
  }
  if (kind === "refund") {
    return {
      title: name || "Refund",
      subtitle: "Full refund",
    };
  }
  if (kind === "foreign_deposit" || (!debit && FOREIGN.has(currency))) {
    return {
      title: name || `${currency} deposit`,
      subtitle: `Received ${currency} · Bank transfer`,
    };
  }
  if (kind === "foreign_payout" || (debit && FOREIGN.has(currency))) {
    return {
      title: name || `Sent ${currency}`,
      subtitle: `Sent ${currency} · Bank transfer`,
    };
  }
  if (kind === "bill") {
    return {
      title: name || "Bill payment",
      subtitle: tx.transaction_description || "Bill",
    };
  }
  if (kind === "card") {
    return {
      title: name || "Card transaction",
      subtitle: tx.transaction_description || "Card",
    };
  }
  return {
    title:
      name ||
      tx.transaction_description ||
      `${currency || "Wallet"} payment`,
    subtitle:
      tx.transaction_category?.transaction_category ||
      (debit ? `Sent ${currency}` : `Received ${currency}`) ||
      "",
  };
}

function networkSubtitle(tx: ITransaction): string | null {
  const network = formatNetwork(tx.settlement?.network ?? null);
  if (!network) return null;
  if (network.toLowerCase() === "tron") return "Tron (TRC20) wallet";
  return `${network} wallet`;
}

function buildAccountLine(tx: ITransaction, kind: TransactionKind): string | null {
  const currency = (
    tx.display_money?.currency ??
    tx.currency ??
    ""
  ).toUpperCase();
  if (kind === "crypto_deposit" || kind === "crypto_payout") {
    const network = formatNetwork(tx.settlement?.network ?? null);
    return network ? `${network} · ${currency}` : currency;
  }
  if (tx.swift) {
    const masked = maskAccount(tx.swift.account_number_or_iban);
    return [
      tx.swift.bank_name || tx.swift.country || "Bank",
      masked,
      currency,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  const bank =
    tx.beneficiary_bank_name ||
    tx.beneficiary_bank ||
    tx.source_bank_name;
  const account =
    maskAccount(tx.beneficiary_account_number) ||
    maskAccount(tx.source_account_number);
  if (!bank && !account) return currency || null;
  return [bank, account, currency].filter(Boolean).join(" · ");
}

function buildDetailRows(
  tx: ITransaction,
  kind: TransactionKind,
  status: ReturnType<typeof mapStatus>,
  opts: {
    primary: Money;
    original: Money | null;
    wallet: Money | null;
    walletCurrency: string | null;
    fees: { label: string; amount: Money }[];
    rateLabel: string | null;
    settledTo: string | null;
    posted: boolean;
  },
): TransactionDetailRow[] {
  const rows: TransactionDetailRow[] = [];
  const push = (row: TransactionDetailRow | null | undefined) => {
    if (row?.value) rows.push(row);
  };
  const currency = (
    tx.display_money?.currency ??
    tx.currency ??
    ""
  ).toUpperCase();
  const date = dayjs(tx.transaction_date_time);
  const dateValue = date.isValid()
    ? `${date.format("MMM D, YYYY")} · ${date.format("h:mm A")}`
    : "";

  const typeLabel = (() => {
    if (kind === "foreign_deposit") return `${currency} account deposit`;
    if (kind === "foreign_payout") return `International transfer · ${currency}`;
    if (kind === "crypto_deposit") return `${currency} deposit`;
    if (kind === "crypto_payout") return `${currency} payout`;
    if (kind === "swap") return "Balance swap";
    if (kind === "alipay_wechat") {
      return tx.alipay_wechat?.channel === "wechat"
        ? "WeChat payout"
        : "Alipay payout";
    }
    if (kind === "refund") return `International transfer · ${currency}`;
    if (kind === "ngn_transfer") return "NGN transfer";
    if (kind === "usd_transfer") return "USD transfer";
    return tx.transaction_class?.transaction_class || "Transfer";
  })();

  push({ label: "Type", value: typeLabel });

  if (kind === "refund") {
    if (opts.original) {
      push({
        label: "You sent",
        value: formatMoney(opts.original.amount, opts.original.currency),
      });
    }
    for (const fee of opts.fees) {
      push({
        label: fee.label || "Fee",
        value: formatMoney(fee.amount.amount, fee.amount.currency),
      });
    }
    push({ label: "Refunded on", value: dateValue });
    if (opts.settledTo && opts.wallet) {
      push({
        label: "Refunded to",
        value: `${opts.settledTo} · full ${formatMoney(opts.wallet.amount, opts.wallet.currency)}`,
      });
    }
    push({
      label: "Reference number",
      value: truncateRef(tx.transaction_reference),
      copyValue: tx.transaction_reference,
    });
    if (tx.transaction_remarks?.trim()) {
      push({ label: "Reason", value: tx.transaction_remarks.trim() });
    }
    push({
      label: "Status",
      value: status.label,
      tone: "refunded",
    });
    return rows;
  }

  const inbound =
    kind === "foreign_deposit" ||
    kind === "crypto_deposit" ||
    (!isDebitType(tx) && kind !== "swap" && kind !== "alipay_wechat");

  if (inbound) {
    if (opts.original) {
      push({
        label: kind === "crypto_deposit" ? "Received" : "They sent",
        value: formatMoney(opts.original.amount, opts.original.currency),
      });
    }
    for (const fee of opts.fees) {
      push({
        label: fee.label || "Fee",
        value: formatMoney(fee.amount.amount, fee.amount.currency),
      });
    }
    push({ label: "Date", value: dateValue });
    push({ label: "Rate", value: opts.rateLabel ?? "" });
    push({
      label: "Reference number",
      value: truncateRef(tx.transaction_reference),
      copyValue: tx.transaction_reference,
    });
    if (opts.posted && opts.settledTo) {
      push({ label: "Settled to", value: opts.settledTo });
      if (opts.wallet) {
        push({
          label: `Added to ${opts.wallet.currency} balance`,
          value: formatMoney(opts.wallet.amount, opts.wallet.currency),
        });
      }
    }
  } else if (kind === "swap") {
    if (tx.settlement?.source_money) {
      push({
        label: "You sent",
        value: formatMoney(
          tx.settlement.source_money.amount,
          tx.settlement.source_money.currency,
        ),
      });
    }
    if (tx.settlement?.destination_money) {
      push({
        label: "You got",
        value: formatMoney(
          tx.settlement.destination_money.amount,
          tx.settlement.destination_money.currency,
        ),
      });
    }
    for (const fee of opts.fees) {
      push({
        label: fee.label || "Fee",
        value: formatMoney(fee.amount.amount, fee.amount.currency),
      });
    }
    push({ label: "Date", value: dateValue });
    push({ label: "Rate", value: opts.rateLabel ?? "" });
    push({
      label: "Reference number",
      value: truncateRef(tx.transaction_reference),
      copyValue: tx.transaction_reference,
    });
  } else {
    // Outbound
    const youSent =
      opts.wallet && opts.fees.length
        ? money(
            // Prefer gross when available so "You sent" excludes fee
            tx.settlement?.wallet_impact?.gross?.amount ?? opts.wallet.amount,
            opts.wallet.currency,
          )
        : opts.wallet;
    if (youSent) {
      push({
        label: "You sent",
        value: formatMoney(youSent.amount, youSent.currency),
      });
    }
    for (const fee of opts.fees) {
      push({
        label: fee.label || "Fee",
        value: formatMoney(fee.amount.amount, fee.amount.currency),
      });
    }
    if (opts.wallet && opts.posted) {
      push({
        label: `Total ${opts.wallet.currency} deducted`,
        value: formatMoney(opts.wallet.amount, opts.wallet.currency),
      });
    }
    push({ label: "Date", value: dateValue });
    if (opts.original) {
      push({
        label: "Recipient gets",
        value: formatMoney(opts.original.amount, opts.original.currency),
      });
    } else if (tx.settlement?.destination_money) {
      push({
        label: "Recipient gets",
        value: formatMoney(
          tx.settlement.destination_money.amount,
          tx.settlement.destination_money.currency,
        ),
      });
    }
    push({
      label: "Reference number",
      value: truncateRef(tx.transaction_reference),
      copyValue: tx.transaction_reference,
    });
    push({ label: "Rate", value: opts.rateLabel ?? "" });
  }

  if (kind === "crypto_deposit" || kind === "crypto_payout") {
    const network = formatNetwork(tx.settlement?.network ?? null);
    push({ label: "Network", value: network ?? "" });
    if (tx.settlement?.transaction_hash) {
      push({
        label: "Transaction hash",
        value: truncateRef(tx.settlement.transaction_hash, 18),
        copyValue: tx.settlement.transaction_hash,
      });
    }
  }

  push({
    label: "Status",
    value: status.stageLabel || status.label,
    tone:
      status.tone === "success"
        ? "success"
        : status.tone === "warning"
          ? "warning"
          : status.tone === "danger"
            ? "danger"
            : status.tone === "refunded"
              ? "refunded"
              : undefined,
  });

  return rows.filter((r) => !!r.value);
}

function buildReceiptRows(
  tx: ITransaction,
  kind: TransactionKind,
  detailRows: TransactionDetailRow[],
  businessName: string | null | undefined,
  walletCurrency: string | null,
): TransactionDetailRow[] {
  const rows: TransactionDetailRow[] = [];
  const debit = isDebitType(tx) || kind === "foreign_payout" || kind === "crypto_payout" || kind === "alipay_wechat";
  const beneficiary = debit
    ? tx.third_party_name || tx.swift?.recipient_name || ""
    : businessName || "";
  const sender = debit
    ? businessName || ""
    : tx.third_party_name || "";

  if (beneficiary) rows.push({ label: "Beneficiary", value: beneficiary });
  if (sender) rows.push({ label: "Sender", value: sender });
  if (walletCurrency) {
    rows.push({
      label: debit ? "Paid from" : "Settled to",
      value: `${walletCurrency} balance`,
    });
  }

  const account =
    tx.swift?.account_number_or_iban ||
    tx.beneficiary_account_number ||
    tx.source_account_number;
  if (account) {
    rows.push({
      label: "Recipient account",
      value: maskAccount(account) ?? account,
    });
  }

  // Prefer specific receipt labels while reusing server values already in detailRows.
  const skip = new Set(["Settled to", "Added to USD balance", "Added to NGN balance"]);
  for (const row of detailRows) {
    if (skip.has(row.label)) continue;
    if (rows.some((r) => r.label === row.label)) continue;
    rows.push(row);
  }
  return rows;
}

export function toTransactionView(
  tx: ITransaction,
  options?: {
    receivingAccounts?: ReceivingAccount[] | null;
    businessName?: string | null;
    walletCurrencyById?: Record<string, string>;
  },
): TransactionView {
  const kind = detectKind(tx);
  const status = mapStatus(tx);
  const settlement = tx.settlement ?? null;
  const impact = settlement?.wallet_impact;
  const direction = impact?.direction ?? "none";
  const posted = !!impact && direction !== "none";
  const original =
    tx.display_money ??
    settlement?.destination_money ??
    settlement?.source_money ??
    money(tx.transaction_amount, tx.currency);
  const wallet = posted ? impact.net : null;
  const primary = posted && wallet ? wallet : original ?? money("0", tx.currency)!;
  const fees = (impact?.fees ?? []).map((f) => ({
    label: f.label || "Fee",
    amount: f.amount,
  }));
  const fee = feeTotal(settlement);
  const debit =
    posted
      ? direction === "debit"
      : kind === "refund"
        ? false
        : isDebitType(tx);
  const refund = kind === "refund" || direction === "reversal";
  const amountTone: AmountTone = refund
    ? "refund"
    : !posted
      ? "pending"
      : debit
        ? "debit"
        : "credit";
  const primarySign: "+" | "−" | "" = refund || (!debit && (posted || status.raw === "completed"))
    ? "+"
    : debit
      ? "−"
      : "";

  let secondaryLine: string | null = null;
  if (kind === "refund") secondaryLine = "Full refund";
  else if (kind === "swap" && settlement?.destination_money && settlement?.source_money) {
    const other = debit ? settlement.destination_money : settlement.source_money;
    secondaryLine = formatMoney(other.amount, other.currency);
  } else if (
    original &&
    primary.currency !== original.currency
  ) {
    secondaryLine = `${formatMoney(original.amount, original.currency)}${
      debit ? " sent" : ""
    }`;
  } else if (fee && !posted) {
    secondaryLine = `Fee ${formatMoney(fee.amount, fee.currency)}`;
  } else if (!posted && status.isPendingGroup) {
    secondaryLine = "Not charged";
  }

  const walletCurrency =
    impact?.net?.currency ??
    tx.account_balance_currency ??
    (options?.walletCurrencyById && impact?.wallet_id
      ? options.walletCurrencyById[impact.wallet_id]
      : null) ??
    null;
  const settledTo = walletCurrency ? `${walletCurrency} balance` : null;

  const rateLabel = formatRate(
    settlement?.rate,
    tx.alipay_wechat?.rate ?? null,
    tx.alipay_wechat
      ? (tx.alipay_wechat.destination_currency ?? "CNY")
      : original?.currency ?? null,
    tx.alipay_wechat
      ? (tx.alipay_wechat.funding_currency ?? "NGN")
      : walletCurrency,
  );

  const { title, subtitle } = buildTitleSubtitle(tx, kind);
  const rail = buildRail(tx, kind, options?.receivingAccounts);
  const date = dayjs(tx.transaction_date_time);
  const today = dayjs().startOf("day");
  const dateLabel = !date.isValid()
    ? ""
    : date.isSame(today, "day")
      ? "Today"
      : date.isSame(today.subtract(1, "day"), "day")
        ? "Yesterday"
        : date.format("MMM D");
  const timeLabel = date.isValid() ? date.format("h:mm A") : "";

  const receiveAsset =
    kind === "foreign_deposit" || kind === "crypto_deposit"
      ? (original?.currency ?? null)
      : null;

  const detailRows = buildDetailRows(tx, kind, status, {
    primary,
    original,
    wallet,
    walletCurrency,
    fees,
    rateLabel,
    settledTo,
    posted,
  });

  const receiptHeadline = (() => {
    if (refund) return `Refunded to ${walletCurrency ?? "wallet"} balance`;
    if (debit && walletCurrency) return `Total ${walletCurrency} deducted`;
    if (!debit && walletCurrency) return `Added to ${walletCurrency} balance`;
    return "Transaction receipt";
  })();

  const primaryAction = ((): TransactionView["primaryAction"] => {
    if (
      (kind === "foreign_deposit" || kind === "crypto_deposit") &&
      receiveAsset &&
      ["GBP", "EUR", "USDT", "USDC"].includes(receiveAsset)
    ) {
      return "account_details";
    }
    if (status.isPendingGroup && (kind === "foreign_payout" || kind === "crypto_payout" || kind === "alipay_wechat")) {
      return "track";
    }
    if (
      (kind === "foreign_payout" ||
        kind === "crypto_payout" ||
        kind === "ngn_transfer" ||
        kind === "usd_transfer" ||
        kind === "refund" ||
        kind === "alipay_wechat") &&
      isDebitType(tx)
    ) {
      return "send_again";
    }
    if (kind === "refund") return "send_again";
    return null;
  })();

  const primaryActionLabel =
    primaryAction === "account_details" && receiveAsset
      ? `Get ${receiveAsset} account details`
      : primaryAction === "track"
        ? "Track transfer"
        : primaryAction === "send_again"
          ? "Send again"
          : null;

  return {
    id: tx.transaction_report_id,
    kind,
    title,
    subtitle,
    avatarName: tx.third_party_name || original?.currency || tx.currency || "TX",
    avatarSrc: tx.third_party_profile_image_url,
    flagCurrency: original?.currency ?? tx.currency ?? null,
    primaryAmount: primary,
    primarySign,
    amountTone,
    secondaryLine,
    railLabel: rail.label,
    railCurrency: rail.currency,
    category: tx.transaction_category?.transaction_category || null,
    dateLabel,
    timeLabel,
    absoluteDateLabel: date.isValid()
      ? `${dateLabel} · ${timeLabel}`
      : "",
    statusRaw: status.raw,
    statusLabel: status.label,
    statusTone: status.tone,
    stageLabel: status.stageLabel,
    isPendingGroup: status.isPendingGroup,
    counterpartyLine: tx.third_party_name || null,
    accountLine: buildAccountLine(tx, kind),
    settledTo,
    originalMoney: original,
    walletMoney: wallet,
    walletCurrency,
    fees,
    rateLabel,
    reference: tx.transaction_reference,
    network: formatNetwork(settlement?.network ?? null),
    transactionHash: settlement?.transaction_hash ?? null,
    proofUrl:
      tx.swift?.payment_proof_url ||
      tx.alipay_wechat?.payment_proof_url ||
      null,
    receiveAsset,
    detailRows,
    receiptHeadline,
    receiptRows: buildReceiptRows(
      tx,
      kind,
      detailRows,
      options?.businessName,
      walletCurrency,
    ),
    primaryAction,
    primaryActionLabel,
  };
}

export function groupTransactions(views: TransactionView[]): TransactionGroup[] {
  const pending: TransactionView[] = [];
  const byDay = new Map<string, TransactionView[]>();

  for (const view of views) {
    if (view.isPendingGroup) {
      pending.push(view);
      continue;
    }
    const key = view.dateLabel || "Earlier";
    const list = byDay.get(key) ?? [];
    list.push(view);
    byDay.set(key, list);
  }

  const groups: TransactionGroup[] = [];
  if (pending.length) {
    groups.push({ key: "pending", label: "Pending", items: pending });
  }
  for (const [label, items] of byDay) {
    groups.push({ key: label.toLowerCase(), label, items });
  }
  return groups;
}

export function filterTransactionsLocally(
  views: TransactionView[],
  query: string,
): TransactionView[] {
  const q = query.trim().toLowerCase();
  if (!q) return views;
  return views.filter((v) => {
    const haystack = [
      v.title,
      v.subtitle,
      v.reference,
      v.primaryAmount.amount,
      v.originalMoney?.amount,
      v.counterpartyLine,
      v.railLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function heroStatusLabel(view: TransactionView): string {
  if (view.kind === "refund") return "Payment refunded";
  if (view.isPendingGroup) return view.stageLabel || "On its way";
  if (view.amountTone === "credit") return "Money received";
  if (view.statusTone === "danger") return "Payment failed";
  return view.statusLabel === "Completed" ? "Money sent" : view.statusLabel;
}
