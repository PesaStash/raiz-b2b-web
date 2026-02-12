import { IIntCountry } from "@/constants/send";
import { PaymentStatusType } from "@/types/transactions";

export type TopupPaymentOptions = "zelle" | "debit-card" | "bank-transfer";
export interface ICardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
}
export interface IZelleInfo {
  expected_amount: 1;
  memo_code: string;
  wallet_id: string;
  expires_at: string;
  id: string;
  status: string;
  send_to: string;
  created_at: string;
  updated_at: string;
  completed_at: string;
}

export interface IStripeDetail {
  client_secret: string;
  payment_intent_id: string;
  customer_id: string;
  ephemeral_key: string;
  fee: number;
}

export interface TopupState {
  amount: string;
  paymentOption: TopupPaymentOptions | null;
  cardDetails: ICardDetails | null;
  status: PaymentStatusType | null;
  zelleInfo: IZelleInfo | null;
  stripeDetail: IStripeDetail | null;
  topupCurrency: IIntCountry | null;
}

export interface TopupActions {
  setAmount: (amount: string) => void;
  setPaymentOption: (opt: TopupPaymentOptions | null) => void;
  setCardDetails: (detail: ICardDetails) => void;
  setStatus: (status: PaymentStatusType | null) => void;
  setZelleInfo: (zelleInfo: IZelleInfo | null) => void;
  setStripeDetail: (s: IStripeDetail | null) => void;
  setTopupCurrency: (currency: IIntCountry | null) => void;
  reset: () => void;
}

export const initialTopupState: TopupState = {
  amount: "",
  paymentOption: null,
  cardDetails: null,
  status: null,
  zelleInfo: null,
  stripeDetail: null,
  topupCurrency: null,
};

export interface TopupSlice extends TopupState {
  actions: TopupActions;
}
