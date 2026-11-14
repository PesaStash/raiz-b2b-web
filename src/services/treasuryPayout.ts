import { AuthAxios } from "@/lib/authAxios";
import type {
  CryptoPayoutQuoteRequest,
  ForeignPayoutQuoteRequest,
  TreasuryPayoutExecuteRequest,
  TreasuryPayoutQuote,
  TreasuryPayoutResult,
} from "@/types/treasuryPayout";

const base = "/business/transactions/v2";

export async function QuoteForeignPayoutApi(payload: ForeignPayoutQuoteRequest, idempotencyKey: string): Promise<TreasuryPayoutQuote> {
  const response = await AuthAxios.post(`${base}/foreign-payouts/quotes/`, payload, { headers: { "Idempotency-Key": idempotencyKey } });
  return response.data;
}

export async function SendForeignPayoutApi(payload: TreasuryPayoutExecuteRequest, idempotencyKey: string): Promise<TreasuryPayoutResult> {
  const response = await AuthAxios.post(`${base}/foreign-payouts/`, payload, { headers: { "Idempotency-Key": idempotencyKey } });
  return response.data;
}

export async function QuoteCryptoPayoutApi(payload: CryptoPayoutQuoteRequest, idempotencyKey: string): Promise<TreasuryPayoutQuote> {
  const response = await AuthAxios.post(`${base}/crypto-payouts/quotes/`, payload, { headers: { "Idempotency-Key": idempotencyKey } });
  return response.data;
}

export async function SendCryptoPayoutApi(payload: TreasuryPayoutExecuteRequest, idempotencyKey: string): Promise<TreasuryPayoutResult> {
  const response = await AuthAxios.post(`${base}/crypto-payouts/`, payload, { headers: { "Idempotency-Key": idempotencyKey } });
  return response.data;
}
