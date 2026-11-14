import { conversionEstimate, formatMoney } from "./globalBalance.ts";
import type { Money } from "../types/globalBalance.ts";
import type { SwapPairCurrency, SwapPreview, SwapQuote } from "../types/swap.ts";
import type { IUsdBaseExchangeRateResponse } from "../types/services.ts";

const LIVE_QUOTE_TTL_MS = 30_000;

function toCents(value: string): bigint | null {
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole + fraction.padEnd(2, "0").slice(0, 2));
}

/** True when `amount` is strictly greater than `balance` (decimal strings). */
export function exceedsBalance(amount: string, balance: string): boolean {
  const a = toCents(amount);
  const b = toCents(balance);
  if (a === null || b === null) return false;
  return a > b;
}

/** Server timestamps are UTC. Extra fraction digits and a missing zone are normalized before parse. */
export function parseServerTime(value: string): number {
  const trimmed = value.trim();
  const withMillis = trimmed.replace(/(\.\d{3})\d+/, "$1");
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(withMillis)
    ? withMillis
    : `${withMillis}Z`;
  return Date.parse(zoned);
}

export function secondsUntil(expiresAt: string, now = Date.now()): number {
  const parsed = parseServerTime(expiresAt);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.ceil((parsed - now) / 1000));
}

export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Rate label written from the paying side:
 * USD→NGN: "$1 = ₦1,532.00"
 * NGN→USD: "₦1,542.00 = $1"
 */
export function formatSwapRateLabel(
  sourceCurrency: SwapPairCurrency,
  rateValue: string,
): string {
  if (!/^\d+(\.\d+)?$/.test(rateValue)) return "—";
  if (sourceCurrency === "USD") {
    return `$1 = ${formatMoney(rateValue, "NGN")}`;
  }
  return `${formatMoney(rateValue, "NGN")} = $1`;
}

export function feeTotal(fees: { amount: Money }[] | undefined): Money | null {
  if (!fees?.length) return null;
  const currency = fees[0].amount.currency;
  if (fees.some((f) => f.amount.currency !== currency)) return null;
  let cents = BigInt(0);
  for (const fee of fees) {
    const value = toCents(fee.amount.amount);
    if (value === null) return null;
    cents += value;
  }
  return {
    amount: `${cents / BigInt(100)}.${String(cents % BigInt(100)).padStart(2, "0")}`,
    currency,
  };
}

function asMoney(value: Money | undefined | null): Money | null {
  if (!value || typeof value.amount !== "string" || !value.currency) return null;
  return { amount: value.amount, currency: value.currency };
}

export function previewFromV2Quote(
  quote: SwapQuote,
  sourceCurrency: SwapPairCurrency,
): SwapPreview | null {
  const sourceMoney = asMoney(quote.source_money);
  const destinationMoney = asMoney(quote.destination_money);
  const totalDebit =
    asMoney(quote.total_debit) ?? sourceMoney;
  const rateValue = quote.rate?.value;
  if (!sourceMoney || !destinationMoney || !totalDebit || !rateValue) {
    return null;
  }
  if (!quote.expires_at) return null;

  return {
    quoteId: quote.quote_id ?? null,
    sourceMoney,
    destinationMoney,
    fee: feeTotal(quote.fees) ?? {
      amount: "0.00",
      currency: sourceMoney.currency,
    },
    totalDebit,
    rateLabel: formatSwapRateLabel(sourceCurrency, rateValue),
    expiresAt: quote.expires_at,
    mode: "v2",
  };
}

/**
 * Live buy/sell preview. Destination uses decimal-safe conversionEstimate.
 * Fee is null (never invent a fee). Total debit equals the source amount.
 */
export function previewFromLiveRate(
  sourceCurrency: SwapPairCurrency,
  destinationCurrency: SwapPairCurrency,
  sourceAmount: string,
  rate: IUsdBaseExchangeRateResponse,
  now = Date.now(),
): SwapPreview | null {
  if (!/^\d+(\.\d{0,2})?$/.test(sourceAmount) || Number(sourceAmount) <= 0) {
    return null;
  }

  const sell = String(rate.sell_rate ?? "");
  const buy = String(rate.buy_rate ?? "");
  const payingUsd = sourceCurrency === "USD";
  const rateValue = payingUsd ? sell : buy;
  if (!/^\d+(\.\d+)?$/.test(rateValue) || Number(rateValue) <= 0) return null;

  const destinationAmount = conversionEstimate(
    sourceAmount,
    rateValue,
    !payingUsd,
  );
  if (!destinationAmount) return null;

  return {
    quoteId: null,
    sourceMoney: { amount: sourceAmount, currency: sourceCurrency },
    destinationMoney: {
      amount: destinationAmount,
      currency: destinationCurrency,
    },
    fee: null,
    totalDebit: { amount: sourceAmount, currency: sourceCurrency },
    rateLabel: formatSwapRateLabel(sourceCurrency, rateValue),
    expiresAt: new Date(now + LIVE_QUOTE_TTL_MS).toISOString(),
    mode: "live",
  };
}

export function isInsufficient(
  preview: SwapPreview | null,
  availableBalance: string,
): boolean {
  const debit = preview?.totalDebit?.amount;
  if (!debit) return false;
  return exceedsBalance(debit, availableBalance);
}

const EXPIRED_MESSAGE =
  "The rate changed. Review the updated quote before continuing.";

function errorPayload(error: unknown): {
  status?: number;
  body: Record<string, unknown>;
} {
  const value = (error ?? {}) as {
    status?: number;
    data?: unknown;
    response?: { status?: number; data?: unknown };
  };
  const response = value.response ?? value;
  const body =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : {};
  return { status: response.status, body };
}

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join(" ");
  return "";
}

/** Structured `quote_expired`, or a live body such as `{ detail: "Swap quote has expired" }`. */
export function readQuoteExpiry(error: unknown): {
  expired: boolean;
  message: string;
  replacement: SwapQuote | null;
} {
  const { body } = errorPayload(error);
  const nested =
    body.error && typeof body.error === "object"
      ? (body.error as Record<string, unknown>)
      : {};
  const code = String(nested.code ?? body.code ?? "").toLowerCase();
  const raw = nested.replacement_quote ?? body.replacement_quote;
  const replacement =
    raw && typeof raw === "object" ? (raw as SwapQuote) : null;
  const message =
    textOf(nested.message) ||
    textOf(body.message) ||
    textOf(body.detail) ||
    textOf(body.error) ||
    EXPIRED_MESSAGE;
  const expired =
    code === "quote_expired" ||
    (/quote/.test(message.toLowerCase()) && /expired/.test(message.toLowerCase()));
  return {
    expired,
    message: expired ? message : EXPIRED_MESSAGE,
    replacement,
  };
}

export function debitIncreased(
  previous: string | undefined,
  next: string | undefined,
): boolean {
  if (!previous || !next) return false;
  const before = toCents(previous);
  const after = toCents(next);
  if (before === null || after === null) return false;
  return after > before;
}
