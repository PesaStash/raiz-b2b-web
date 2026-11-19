import type { CryptoNetwork, Money, Rate, SettlementFeeLine } from "./globalBalance";

export type ForeignPayoutCurrency = "GBP" | "EUR";
export type CryptoPayoutAsset = "USDT" | "USDC";

export interface TreasuryPayoutQuote {
  quote_id: string;
  product: "foreign_payout" | "crypto_payout";
  destination_money: Money;
  usd_principal: Money;
  fees: SettlementFeeLine[];
  total_debit: Money;
  rate: Rate;
  expires_at: string;
  status: "active" | "expired" | string;
}

export interface ForeignPayoutQuoteRequest {
  destination_currency: ForeignPayoutCurrency;
  destination_amount: string;
  beneficiary_id: string;
}

export interface CryptoPayoutQuoteRequest {
  asset: CryptoPayoutAsset;
  network: CryptoNetwork;
  destination_address: string;
  asset_amount: string;
}

export interface TreasuryPayoutExecuteRequest {
  quote_id: string;
  transaction_pin: string;
  beneficiary_id?: string;
  transaction_reason?: string;
  transaction_category_id?: number;
}

export interface TreasuryPayoutResult {
  payout_id: string;
  status: "pending" | "completed" | "failed" | string;
  transaction_report?: {
    transaction_report_id: string;
    transaction_reference: string;
    display_money: Money;
    account_balance_currency: "USD";
  };
}
