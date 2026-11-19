export type BalanceCurrency = "NGN" | "USD";
export type ReceivingAsset = "GBP" | "EUR" | "USDT" | "USDC";
export interface Money { amount: string; currency: string }
export interface SpendableBalance {
  wallet_id: string;
  currency: BalanceCurrency;
  available_balance: string;
  pending_debits: string;
  status: string;
  supported_receive_assets: string[] | null;
  supported_send_assets: string[] | null;
}
export interface LegacyBalance {
  legacy_wallet_id: string;
  currency: string;
  balance: string;
  state: string;
  blockers: string[];
  conversion_deadline: string | null;
}
export interface ReceivingAccount {
  receiving_account_id: string;
  asset: ReceivingAsset;
  kind: "bank_account" | "crypto_address";
  status: string;
  settlement_wallet_id: string | null;
  settlement_currency: "USD";
  provider: string;
  bank: Record<string, unknown> | null;
  crypto: Record<string, unknown> | null;
  disclosures: string[];
  created_at: string;
  legacy_wallet_id?: string | null;
  balance_model?: string;
}
export interface FeeCatalogComponent {
  code: string;
  label: string;
  calculation_kind: string;
  configured_value: string;
  value_unit: string;
  fee_currency: string;
  basis: string | null;
  minimum_fee: string | null;
  maximum_fee: string | null;
  condition: string | null;
}
export interface FeeCatalogItem {
  service: string;
  display_name: string;
  direction: string;
  transaction_currency: string;
  payment_rail: string | null;
  asset: string | null;
  schedule_version: string;
  components: FeeCatalogComponent[];
  quote_required: boolean;
  reward_discount_may_apply: boolean;
  notes: string[];
}
export interface FeeCatalogResponse {
  balance_model: string;
  generated_at: string;
  personalized: boolean;
  fees: FeeCatalogItem[];
}
export type CryptoNetwork =
  | "ethereum"
  | "base"
  | "polygon"
  | "bsc"
  | "avalanche"
  | "optimism"
  | "tron"
  | "solana"
  | string;

export interface Rate {
  value: string;
  base_currency: string;
  quote_currency: string;
  source?: "bridge" | "admin_fallback" | "parity" | "admin_config" | string;
  observed_at?: string;
}

export interface FeeLineCalculation {
  kind: "flat_usd" | "percent_of_usd_equivalent" | string;
  configured_value: string;
  basis: Money;
}

export interface SettlementFeeLine {
  code: string;
  label: string;
  amount: Money;
  calculation?: FeeLineCalculation;
}

export interface WalletImpact {
  wallet_id: string;
  direction: "credit" | "debit" | "reversal" | "none" | string;
  gross: Money;
  fees: SettlementFeeLine[];
  net: Money;
  balance_after: Money | null;
}

export interface Settlement {
  source_money: Money | null;
  destination_money: Money | null;
  wallet_impact: WalletImpact;
  rate?: Rate | null;
  quote_id?: string | null;
  provider_reference?: string | null;
  network?: CryptoNetwork | null;
  transaction_hash?: string | null;
}
