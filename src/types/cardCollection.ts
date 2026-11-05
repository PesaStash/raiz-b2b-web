export type UUID = string;
export type ISODateTime = string;
/** Money values stay as backend decimal strings; never use them for float math. */
export type DecimalMoney = string;

export type CardPaymentProvider = "paystack" | "flutterwave";

export type CardCollectionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "review"
  | "disputed";

export type CardSettlementStatus = "unsettled" | "credited" | "review";

export interface CardCollectionInitializeRequest {
  provider: CardPaymentProvider;
  wallet_id: UUID;
  amount: DecimalMoney;
  description?: string | null;
}

export interface CardCollectionInitializeResponse {
  provider: CardPaymentProvider;
  collection_id: UUID;
  reference: string;
  authorization_url: string;
  principal_amount: DecimalMoney;
  fee_amount: DecimalMoney;
  total_amount: DecimalMoney;
  currency: "NGN";
  status: CardCollectionStatus;
}

export interface CardCollectionStatusResponse {
  provider: CardPaymentProvider;
  collection_id: UUID;
  reference: string;
  principal_amount: DecimalMoney;
  fee_amount: DecimalMoney;
  total_amount: DecimalMoney;
  currency: "NGN";
  status: CardCollectionStatus;
  settlement_status: CardSettlementStatus;
  transaction_report_id: UUID | null;
  paid_at: ISODateTime | null;
  credited_at: ISODateTime | null;
}

export interface PendingCardCheckout {
  provider: CardPaymentProvider;
  actor: "personal" | "business";
  collection_id: UUID;
  reference: string;
  wallet_id: UUID;
  principal_amount: DecimalMoney;
  fee_amount: DecimalMoney;
  total_amount: DecimalMoney;
  started_at: ISODateTime;
}

export type CardPaymentViewState =
  | "processing"
  | "success"
  | "failed"
  | "review"
  | "disputed";

export type CardCollectionErrorKind =
  | "wallet_reselect"
  | "wallet_not_ready"
  | "wallet_restricted"
  | "amount_limit"
  | "validation"
  | "auth"
  | "account_restricted"
  | "verification_required"
  | "collection_not_found"
  | "duplicate"
  | "rate_limited"
  | "provider_unavailable"
  | "not_configured"
  | "network"
  | "unknown";

export interface CardCollectionError {
  kind: CardCollectionErrorKind;
  status?: number;
  message: string;
  /** Field-level messages from FastAPI 422 responses, keyed by request field. */
  fieldErrors?: Partial<Record<"wallet_id" | "amount" | "description" | "provider", string>>;
  /** Correlation ID from the backend error payload, when present. */
  correlationId?: string;
  /** Retrying the same submit (same idempotency key) is safe and may succeed. */
  canRetry: boolean;
}
