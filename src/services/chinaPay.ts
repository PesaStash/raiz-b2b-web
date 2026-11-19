import { AuthAxios } from "@/lib/authAxios";
import type { ChinaPayQuote, ChinaPayQuoteRequest, ChinaPayResult, ChinaPaySendRequest } from "@/types/chinaPay";

type QuoteFee = ChinaPayQuote["fees"][number];
type FlatQuoteFee = Omit<QuoteFee, "amount"> & QuoteFee["amount"];
type QuoteResponse = Omit<ChinaPayQuote, "fees"> & {
  fees: (QuoteFee | FlatQuoteFee)[];
};

export async function QuoteChinaPayApi(payload: ChinaPayQuoteRequest, idempotencyKey: string): Promise<ChinaPayQuote> {
  const { data } = await AuthAxios.post<QuoteResponse>(
    "/business/transactions/alipay-wechat/quotes/",
    payload,
    { headers: { "Idempotency-Key": idempotencyKey } },
  );

  return {
    ...data,
    fees: data.fees.map((fee) =>
      "currency" in fee
        ? { ...fee, amount: { amount: fee.amount, currency: fee.currency } }
        : fee,
    ),
  };
}
export async function SendChinaPayApi(payload: ChinaPaySendRequest, idempotencyKey: string): Promise<ChinaPayResult> {
  const response = await AuthAxios.post("/business/transactions/alipay-wechat/send-v2/",payload,{headers:{"Idempotency-Key":idempotencyKey}});
  return response.data;
}
