import { AuthAxios } from "@/lib/authAxios";
import { readApiError } from "@/lib/apiError";
import { readQuoteExpiry } from "@/lib/swapQuote";
import type {
  SwapExecuteRequest,
  SwapExecuteResult,
  SwapQuote,
  SwapQuoteRequest,
} from "@/types/swap";

const QUOTE_PATH = "/business/transactions/v2/swaps/quotes/";
const EXECUTE_PATH = "/business/transactions/v2/swaps/";

export function isSwapApiUnavailable(error: unknown): boolean {
  const { status } = readApiError(error);
  return status === 404 || status === 501;
}

export function isQuoteExpired(error: unknown): boolean {
  return readQuoteExpiry(error).expired;
}

export async function QuoteSwapApi(
  payload: SwapQuoteRequest,
  idempotencyKey: string,
): Promise<SwapQuote> {
  const response = await AuthAxios.post(QUOTE_PATH, payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function ExecuteSwapApi(
  payload: SwapExecuteRequest,
  idempotencyKey: string,
): Promise<SwapExecuteResult> {
  const response = await AuthAxios.post(EXECUTE_PATH, payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}
