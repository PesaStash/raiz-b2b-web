import type { BalanceCurrency, Money } from "./globalBalance";

export type SwapPairCurrency = BalanceCurrency;

export interface SwapQuoteRequest {
  source_currency: SwapPairCurrency;
  destination_currency: SwapPairCurrency;
  source_amount: string;
}

export interface SwapQuoteFee {
  code: string;
  label: string;
  amount: Money;
}

export interface SwapQuoteRate {
  value: string;
  base_currency: string;
  quote_currency: string;
  source?: string;
  observed_at?: string;
}

export interface SwapQuote {
  quote_id: string;
  source_money: Money;
  destination_money: Money;
  fees?: SwapQuoteFee[];
  total_debit?: Money;
  rate: SwapQuoteRate;
  expires_at: string;
  status?: string;
}

export interface SwapExecuteRequest {
  quote_id: string;
  transaction_pin: string;
}

export interface SwapExecuteResult {
  quote_id?: string;
  transaction_id?: string;
  transaction_reference?: string;
  reference?: string;
  status?: string;
  transaction_status?: { transaction_status?: string };
  source_money?: Money;
  destination_money?: Money;
  total_debit?: Money;
  rate?: SwapQuoteRate | string;
}

/** Unified preview used by the UI for both v2 quotes and the live buy/sell fallback. */
export interface SwapPreview {
  quoteId: string | null;
  sourceMoney: Money;
  destinationMoney: Money;
  fee: Money | null;
  totalDebit: Money;
  rateLabel: string;
  expiresAt: string;
  mode: "v2" | "live";
}
