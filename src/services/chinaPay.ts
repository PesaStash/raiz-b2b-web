import { AuthAxios } from "@/lib/authAxios";
import type { ChinaPayQuote, ChinaPayQuoteRequest, ChinaPayResult, ChinaPaySendRequest } from "@/types/chinaPay";

export async function QuoteChinaPayApi(payload: ChinaPayQuoteRequest, idempotencyKey: string): Promise<ChinaPayQuote> {
  const response = await AuthAxios.post("/business/transactions/alipay-wechat/quotes/",payload,{headers:{"Idempotency-Key":idempotencyKey}});
  return response.data;
}
export async function SendChinaPayApi(payload: ChinaPaySendRequest, idempotencyKey: string): Promise<ChinaPayResult> {
  const response = await AuthAxios.post("/business/transactions/alipay-wechat/send-v2/",payload,{headers:{"Idempotency-Key":idempotencyKey}});
  return response.data;
}
