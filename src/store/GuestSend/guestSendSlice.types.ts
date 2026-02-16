import { IIntCountry } from "@/constants/send";
import { GuestPayStatusType } from "@/types/transactions";
import { IStripeDetail } from "../TopUp/topupSlice.types";
import { IP2pTransferResponse } from "@/types/services";

export type BillingDetailsType = {
  firstName: string;
  lastName: string;
  email: string;
  purpose: string
};

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
  amount: string;
  payout_amount: string;
  guestLocalCurrency: IIntCountry | null;
  expires_at: Date | null;
  collection_account_number: string;
  collection_bank_name: string;
  collection_account_name: string;
  purpose: string;
  max: number;
  min: number;
  guestAccount: string;
  payout_currency: string;
  status: GuestPayStatusType | null;
  stripeDetail: IStripeDetail | null;
  billingDetails: BillingDetailsType | null;
  transactionDetail: IP2pTransferResponse | null;
}

export interface GuestSendActions {
  setField: (
    key: keyof GuestSendState,
    value: GuestSendState[keyof GuestSendState]
  ) => void;
  setFields: (fields: Partial<GuestSendState>) => void;
  reset: () => void;
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
  payout_amount: "",
  guestLocalCurrency: null,
  expires_at: null,
  collection_account_number: "",
  collection_bank_name: "",
  collection_account_name: "",
  purpose: "",
  max: 0,
  min: 0,
  guestAccount: "",
  payout_currency: "",
  status: null,
  stripeDetail: null,
  billingDetails: null,
  transactionDetail: null,
};

export interface GuestSendSlice extends GuestSendState {
  actions: GuestSendActions;
}
