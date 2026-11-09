import type { Money, BalanceCurrency } from "./globalBalance";
import type { IAlipayWechatSendResponse } from "./services";
export type ChinaPayChannel = "alipay" | "wechat";
export interface ChinaPayQuote {
  quote_id: string;
  channel: ChinaPayChannel;
  destination_money: Money;
  funding_money: Money;
  fees: { code: string; label: string; amount: Money }[];
  total_debit: Money;
  rate: { value: string; base_currency: string; quote_currency: string; source: string; observed_at: string };
  expires_at: string;
  /** Legacy NGN quotes do not have a server quote id or expiry. */
  legacy?: boolean;
}
export interface ChinaPayQuoteRequest { channel: ChinaPayChannel; destination_amount: string; funding_currency: BalanceCurrency; }
export interface ChinaPaySendRequest { quote_id: string; beneficiary_id: string; transaction_pin: string; }
export type ChinaPayResult = Omit<IAlipayWechatSendResponse,"naira_amount"|"status"|"rate"> & {
  naira_amount?: string;
  funding_currency: BalanceCurrency;
  funding_amount: string;
  destination_currency: string;
  quote_id: string;
  status: "pending"|"completed"|"failed"|"reversed"|"reconciliation_required";
  rate?: string;
};
