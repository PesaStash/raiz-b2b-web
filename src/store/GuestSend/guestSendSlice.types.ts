import { IIntCountry } from "@/constants/send";
import { GuestPayStatusType } from "@/types/transactions";
import { IStripeDetail } from "../TopUp/topupSlice.types";
import { IP2pTransferResponse } from "@/types/services";

export type BillingDetailsType = {
  firstName: string;
  lastName: string;
  email: string;
  purpose: string;
};

export type GuestAfricaPayinStep =
  | "details"
  | "payer_email"
  | "payer_register"
  | "payer_verify"
  | "summary"
  | "instructions"
  | "status"
  | "receipt";

export interface GuestSendState {
  country_code: string;
  channel_id: string;
  channel_name: string;
  network_name: string;
  network_id: string;
  account_type: string;
  sender_name: string;
  transaction_description: string;
  payin_id: string;
  rate: number;
  /** USD amount entered by the payer. */
  amount: string;
  /** Local-currency amount returned by Africa payin initiation. */
  local_amount: string;
  payout_amount: string;
  guestLocalCurrency: IIntCountry | null;
  expires_at: string | null;
  collection_account_number: string;
  collection_bank_name: string;
  collection_account_name: string;
  payment_instruction: string;
  collection_method: string;
  provider: string;
  purpose: string;
  max: number;
  min: number;
  guestAccount: string;
  payout_currency: string;
  status: GuestPayStatusType | null;
  lifecycleStep: GuestAfricaPayinStep;
  stripeDetail: IStripeDetail | null;
  billingDetails: BillingDetailsType | null;
  transactionDetail: IP2pTransferResponse | null;
  payer_email: string;
  payer_id: string;
  payer_first_name: string;
  payer_last_name: string;
  payer_country_code: string;
  payer_email_verified: boolean;
  payer_exists: boolean;
}

export interface GuestSendActions {
  setField: (
    key: keyof GuestSendState,
    value: GuestSendState[keyof GuestSendState],
  ) => void;
  setFields: (fields: Partial<GuestSendState>) => void;
  reset: () => void;
  resetPaymentSession: () => void;
}

export const initialGuestSendState: GuestSendState = {
  country_code: "",
  channel_id: "",
  channel_name: "",
  network_name: "",
  network_id: "",
  account_type: "",
  sender_name: "",
  transaction_description: "",
  payin_id: "",
  rate: 0,
  amount: "",
  local_amount: "",
  payout_amount: "",
  guestLocalCurrency: null,
  expires_at: null,
  collection_account_number: "",
  collection_bank_name: "",
  collection_account_name: "",
  payment_instruction: "",
  collection_method: "",
  provider: "",
  purpose: "",
  max: 20000,
  min: 1,
  guestAccount: "",
  payout_currency: "",
  status: null,
  lifecycleStep: "payer_email",
  stripeDetail: null,
  billingDetails: null,
  transactionDetail: null,
  payer_email: "",
  payer_id: "",
  payer_first_name: "",
  payer_last_name: "",
  payer_country_code: "",
  payer_email_verified: false,
  payer_exists: false,
};

export interface GuestSendSlice extends GuestSendState {
  actions: GuestSendActions;
}

export interface AfricaPayinSessionSnapshot {
  username: string;
  payin_id: string;
  lifecycleStep: GuestAfricaPayinStep;
  /** USD amount entered by the payer. */
  amount: string;
  /** Local-currency amount returned by Africa payin initiation. */
  local_amount: string;
  payout_currency: string;
  channel_id: string;
  channel_name: string;
  network_id?: string;
  network_name?: string;
  account_type?: string;
  sender_name: string;
  purpose: string;
  transaction_description: string;
  expires_at: string | null;
  payment_instruction: string;
  collection_account_number?: string;
  collection_bank_name?: string;
  collection_account_name?: string;
  collection_method: string;
  status: GuestPayStatusType | null;
  guestLocalCurrency: IIntCountry | null;
  guestAccount?: string;
  payer_email?: string;
  payer_id?: string;
  payer_first_name?: string;
  payer_last_name?: string;
  payer_country_code?: string;
  payer_email_verified?: boolean;
  payer_exists?: boolean;
}
