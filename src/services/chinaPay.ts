import { AuthAxios } from "@/lib/authAxios";
import type { ChinaPayQuote, ChinaPayQuoteRequest, ChinaPayResult, ChinaPaySendRequest } from "@/types/chinaPay";
import {
  AlipayWechatAmountQuoteApi,
  AlipayWechatSendApi,
} from "@/services/transactions";
import type { IAlipayWechatSendPayload } from "@/types/services";

export async function QuoteChinaPayApi(payload: ChinaPayQuoteRequest, idempotencyKey: string): Promise<ChinaPayQuote> {
  if (payload.funding_currency === "NGN") {
    const legacy = await AlipayWechatAmountQuoteApi({
      payload: {
        channel: payload.channel,
        amount: Number(payload.destination_amount),
      },
    });
    return {
      quote_id: `legacy:${payload.channel}:${legacy.destination_amount}:${legacy.naira_amount}`,
      channel: legacy.channel,
      destination_money: {
        amount: legacy.destination_amount,
        currency: "CNY",
      },
      funding_money: { amount: legacy.naira_amount, currency: "NGN" },
      fees: [],
      total_debit: { amount: legacy.naira_amount, currency: "NGN" },
      rate: {
        value: legacy.rate,
        base_currency: "CNY",
        quote_currency: "NGN",
        source: "legacy_alipay_wechat",
        observed_at: new Date().toISOString(),
      },
      // The deployed legacy amount endpoint has no expiring quote object.
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      legacy: true,
    };
  }
  const response = await AuthAxios.post("/business/transactions/v2/alipay-wechat/quotes/",payload,{headers:{"Idempotency-Key":idempotencyKey}});
  return response.data;
}
export async function SendChinaPayApi(payload: ChinaPaySendRequest, idempotencyKey: string): Promise<ChinaPayResult> {
  const response = await AuthAxios.post("/business/transactions/v2/alipay-wechat/send-v2/",payload,{headers:{"Idempotency-Key":idempotencyKey}});
  return response.data;
}

export async function SendLegacyChinaPayApi(
  payload: IAlipayWechatSendPayload,
): Promise<ChinaPayResult> {
  const response = await AlipayWechatSendApi(payload);
  return {
    ...response,
    funding_currency: "NGN",
    funding_amount: response.naira_amount,
    destination_currency: "CNY",
    quote_id: `legacy:${response.channel}:${response.destination_amount}:${response.naira_amount}`,
  };
}
