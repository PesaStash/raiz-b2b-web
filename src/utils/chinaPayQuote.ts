import type { ChinaPayQuote, ChinaPayQuoteRequest } from "../types/chinaPay";
import { parseServerTime } from "../lib/swapQuote.ts";

/** Compare nonnegative decimal money without converting it to floating point. */
export function compareDecimalAmounts(left: string, right: string): number {
  if (!/^\d+(\.\d+)?$/.test(left) || !/^\d+(\.\d+)?$/.test(right)) throw new Error("Invalid money amount");
  const [li,lf=""] = left.split(".");
  const [ri,rf=""] = right.split(".");
  const places=Math.max(lf.length,rf.length);
  const l=BigInt(li+lf.padEnd(places,"0"));
  const r=BigInt(ri+rf.padEnd(places,"0"));
  return l===r ? 0 : l>r ? 1 : -1;
}
export function usableChinaPayQuote(quote: ChinaPayQuote | undefined, request: ChinaPayQuoteRequest, now=Date.now()): quote is ChinaPayQuote {
  if(!quote) return false;
  try {
    const expiresAt = parseServerTime(quote.expires_at);
    return !!quote.quote_id && quote.channel===request.channel && quote.destination_money.currency==="CNY" && quote.funding_money.currency===request.funding_currency && quote.total_debit.currency===request.funding_currency && compareDecimalAmounts(quote.destination_money.amount,request.destination_amount)===0 && compareDecimalAmounts(quote.total_debit.amount,"0")>0 && compareDecimalAmounts(quote.funding_money.amount,"0")>=0 && Array.isArray(quote.fees) && quote.fees.every(f=>/^\d+(\.\d+)?$/.test(f.amount.amount) && !!f.amount.currency) && Number.isFinite(expiresAt) && expiresAt>now;
  } catch {return false;}
}
export function chinaPayError(error: unknown): {code: string; message: string; status?: number} {
  const response=(error as {response?:{status?:number;data?:{error?:{code?:string;message?:string};message?:string}}})?.response;
  return {code:response?.data?.error?.code || "",message:response?.status===404 ? "China Pay funding quotes are currently unavailable. Please try again later." : response?.data?.error?.message || response?.data?.message || "Unable to process this request. Please try again.",status:response?.status};
}
