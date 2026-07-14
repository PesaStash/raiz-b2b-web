export type AnalyticsUserType = "individual" | "business";

export type KycStep =
  | "basic_info"
  | "document_upload"
  | "review"
  | "bridge_verification";

export type KycStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | "pending"
  | "not_started";

export type FundingMethod = "card" | "bank_transfer" | "ussd";

export type RecipientType = "internal" | "external";

export type TransactionType =
  | "topup"
  | "send"
  | "swap"
  | "bill_payment"
  | "request";

export type FailureReason =
  | "insufficient_funds"
  | "network_error"
  | "declined"
  | "cancelled"
  | "unknown";

export type CardType = "virtual" | "physical";

/** Base params shared across events — never include PII. */
export interface DataLayerEventMap {
  sign_up: {
    method: "email" | "google";
    user_id: string;
    user_type: AnalyticsUserType;
  };
  login: {
    method: "email" | "google";
    user_id: string;
    login_count?: number;
  };
  user_data: {
    user_id: string;
    user_type: AnalyticsUserType;
    account_status: "unverified" | "verified" | "restricted";
    kyc_status: string;
    preferred_currency?: string;
    days_since_signup?: number;
    plan_tier?: string;
  };
  kyc_status_update: {
    kyc_step: KycStep;
    kyc_status: KycStatus | string;
    user_type: AnalyticsUserType;
  };
  topup_completed: {
    transaction_id: string;
    value: number;
    currency: string;
    funding_method: FundingMethod;
  };
  send_completed: {
    transaction_id: string;
    value: number;
    currency: string;
    recipient_type: RecipientType;
  };
  request_completed: {
    request_id: string;
    value: number;
    currency: string;
  };
  swap_completed: {
    transaction_id: string;
    value: number;
    currency: string;
    from_currency: string;
    to_currency: string;
    amount_out?: number;
  };
  bill_payment_completed: {
    transaction_id: string;
    value: number;
    currency: string;
    bill_category?: string;
  };
  invoice_created: {
    invoice_id: string;
    value: number;
    currency: string;
    status: string;
  };
  invoice_paid: {
    invoice_id: string;
    value: number;
    currency: string;
    status: string;
  };
  customer_added: {
    user_id: string;
    customer_count?: number;
  };
  transaction_failed: {
    transaction_type: TransactionType;
    failure_reason: FailureReason | string;
    value?: number;
    currency?: string;
  };
  first_transaction_completed: {
    transaction_type: TransactionType;
    value: number;
    currency: string;
    days_since_signup?: number;
  };
  card_requested: {
    card_type: CardType;
    status: string;
  };
  card_activated: {
    card_type: CardType;
    status: string;
  };
  profile_completed: {
    completion_percent: number;
    user_type: AnalyticsUserType;
  };
  support_request_created: {
    ticket_category?: string;
    ticket_id?: string;
  };
  report_viewed: {
    report_type?: string;
  };
  api_key_generated: {
    key_environment: "live" | "test";
  };
  logout: {
    user_id?: string;
    session_duration_seconds?: number;
  };
}

export type DataLayerEventName = keyof DataLayerEventMap;

export type DataLayerPayload<T extends DataLayerEventName> =
  DataLayerEventMap[T] & {
    event: T;
  };
