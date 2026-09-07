import {
  isCrossCurrencyNgnGbpEurSwap,
  type CurrencyTypeKey,
} from "@/store/Swap/swapSlice.types";
import { formatDisplayRate, getCurrencySymbol } from "@/utils/helpers";

export type RateDisplayParts = { base: string; quote: string };

const formatDirectRate = (
  rate: number | undefined,
  fractionDigits: number,
): string => {
  if (rate == null || !Number.isFinite(rate)) {
    return fractionDigits === 4 ? "0.0000" : "0.00";
  }
  return rate.toFixed(fractionDigits);
};

const getDirectRateDisplay = (
  swapFromCurrency: CurrencyTypeKey,
  swapToCurrency: CurrencyTypeKey,
  exchangeRate: number | undefined,
): RateDisplayParts => {
  if (swapFromCurrency === "USD" || swapToCurrency === "USD") {
    const baseCurrency =
      swapFromCurrency === "USD" ? swapFromCurrency : swapToCurrency;
    const quoteCurrency =
      swapFromCurrency === "USD" ? swapToCurrency : swapFromCurrency;

    return {
      base: `${getCurrencySymbol(baseCurrency)}1 (${baseCurrency})`,
      quote: `${getCurrencySymbol(quoteCurrency)}${formatDirectRate(
        exchangeRate,
        2,
      )}`,
    };
  }

  return {
    base: "$1 (USD)",
    quote: `₦${formatDirectRate(exchangeRate, 2)}`,
  };
};

const getCrossCurrencyRateDisplay = (
  swapFromCurrency: CurrencyTypeKey,
  swapToCurrency: CurrencyTypeKey,
  exchangeRate: number | undefined,
  inverseRate: number | undefined,
): RateDisplayParts | null => {
  const foreignCurrency =
    swapFromCurrency === "NGN" ? swapToCurrency : swapFromCurrency;

  const rate = swapFromCurrency === "NGN" ? inverseRate : exchangeRate;

  if (rate == null || !Number.isFinite(rate)) {
    return null;
  }

  return {
    base: `${getCurrencySymbol(foreignCurrency)}1 (${foreignCurrency})`,
    quote: `${getCurrencySymbol("NGN")}${formatDisplayRate(rate)}`,
  };
};

export const getSwapRateDisplay = (
  swapFromCurrency: CurrencyTypeKey,
  swapToCurrency: CurrencyTypeKey,
  exchangeRate: number | undefined,
  inverseRate?: number,
): RateDisplayParts | null => {
  if (isCrossCurrencyNgnGbpEurSwap(swapFromCurrency, swapToCurrency)) {
    return getCrossCurrencyRateDisplay(
      swapFromCurrency,
      swapToCurrency,
      exchangeRate,
      inverseRate,
    );
  }

  return getDirectRateDisplay(swapFromCurrency, swapToCurrency, exchangeRate);
};

export const getSwapRateDisplayString = (
  swapFromCurrency: CurrencyTypeKey,
  swapToCurrency: CurrencyTypeKey,
  exchangeRate: number | undefined,
  inverseRate?: number,
): string | null => {
  const parts = getSwapRateDisplay(
    swapFromCurrency,
    swapToCurrency,
    exchangeRate,
    inverseRate,
  );
  if (!parts) return null;
  return `${parts.base} = ${parts.quote}`;
};
