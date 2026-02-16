"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { GetAllRates } from "@/services/transactions";
import useCountryStore from "@/store/useCountryStore";
import { useExchangeRatePreferenceStore } from "@/store/useExchangeRatePreferenceStore";
import Skeleton from "react-loading-skeleton";
import SideModalWrapper from "../SideModalWrapper";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import ExchangeRateList from "./ExchangeRateList";
import { AnimatePresence } from "motion/react";

const ExchangeRateCard = () => {
  const [showMore, setShowMore] = useState(false);
  const { data: rates, isLoading } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: GetAllRates,
  });

  const { countries, fetchCountries } = useCountryStore();
  const { selectedCurrencies } = useExchangeRatePreferenceStore();

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const getFlag = (currencyCode: string) => {
    const country = countries.find((c) => c.currency === currencyCode);
    if (country?.country_flag) return country.country_flag;

    // Fallback mapping for common currencies if country store doesn't have them
    const fallbackFlags: Record<string, string> = {
      GBP: "/icons/flag-gb.png",
      EUR: "/icons/flag-fr.png", // Using France as a representative for EUR if no EU flag
      NGN: "/icons/flag-ng.png",
      CAD: "/icons/flag-ca.png",
      USD: "/icons/flag-us.webp",
    };

    return fallbackFlags[currencyCode] || `/icons/flag-not.png`;
  };

  const displayedRates = rates
    ? selectedCurrencies.length > 0
      ? rates.filter((r) => selectedCurrencies.includes(r.currency))
      : rates.slice(0, 14)
    : [];

  return (
    <>
      <div className="bg-white rounded-[24px]  border border-gray-100 px-3 pb-5 desktop:px-5 shadow-sm w-1/2">
        <div className="flex justify-between items-center pt-5  pb-7">
          <h2 className="text-lg font-bold text-raiz-gray-950 leading-5">
            Exchange rates
          </h2>
          <button
            onClick={() => setShowMore(true)}
            className="px-3.5 py-2 border border-raiz-gray-200 rounded-lg text-xs font-bold text-raiz-gray-800 hover:bg-gray-50 transition-colors"
          >
            See more
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-28 xl:gap-x-10  gap-y-7 overflow-x-auto">
          {isLoading ? (
            <>
              <Skeleton
                width="100%"
                height={20}
                count={10}
                inline
                className="mb-2"
              />
              <Skeleton
                width="100%"
                height={20}
                count={10}
                inline
                className="mb-2"
              />
            </>
          ) : (
            displayedRates.map((rate, index) => (
              <div
                key={index}
                className="flex items-center gap-4 font-brSonoma leading-5"
              >
                <div className="flex items-center gap-2 min-w-[90px] whitespace-nowrap">
                  <Image
                    src={getFlag(rate.currency)}
                    alt={rate.currency}
                    width={16}
                    height={16}
                    className="size-4 rounded-full object-cover"
                  />
                  <span className="lg:text-xs desktop:text-sm font-medium text-raiz-gray-950">
                    {rate.currency} {rate.buy_rate.toFixed(2)}
                  </span>
                </div>
                <div className="size-4 mr-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.7935 1.3335H5.20683C2.78016 1.3335 1.3335 2.78016 1.3335 5.20683V10.7868C1.3335 13.2202 2.78016 14.6668 5.20683 14.6668H10.7868C13.2135 14.6668 14.6602 13.2202 14.6602 10.7935V5.20683C14.6668 2.78016 13.2202 1.3335 10.7935 1.3335ZM11.9002 9.40016C11.8735 9.46016 11.8402 9.5135 11.7935 9.56016L9.76683 11.5868C9.66683 11.6868 9.54016 11.7335 9.4135 11.7335C9.28683 11.7335 9.16016 11.6868 9.06016 11.5868C8.86683 11.3935 8.86683 11.0735 9.06016 10.8802L10.2335 9.70683H4.56683C4.2935 9.70683 4.06683 9.48016 4.06683 9.20683C4.06683 8.9335 4.2935 8.70683 4.56683 8.70683H11.4402C11.5068 8.70683 11.5668 8.72016 11.6335 8.74683C11.7535 8.80016 11.8535 8.8935 11.9068 9.02016C11.9468 9.14016 11.9468 9.28016 11.9002 9.40016ZM11.4335 7.28683H4.56683C4.50016 7.28683 4.44016 7.2735 4.3735 7.24683C4.2535 7.1935 4.1535 7.10016 4.10016 6.9735C4.04683 6.8535 4.04683 6.7135 4.10016 6.5935C4.12683 6.5335 4.16016 6.48016 4.20683 6.4335L6.2335 4.40683C6.42683 4.2135 6.74683 4.2135 6.94016 4.40683C7.1335 4.60016 7.1335 4.92016 6.94016 5.1135L5.7735 6.28683H11.4402C11.7135 6.28683 11.9402 6.5135 11.9402 6.78683C11.9402 7.06016 11.7135 7.28683 11.4335 7.28683Z"
                      fill="#B5A8C4"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Image
                    src="/icons/flag-us.webp"
                    alt="USD"
                    width={16}
                    height={16}
                    className="size-4 rounded-full object-cover"
                  />
                  <span className="lg:text-xs desktop:text-sm font-medium text-raiz-gray-950 text-right whitespace-nowrap">
                    $1 USD
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <AnimatePresence>
        {showMore && (
          <CenterModalWrapper close={() => setShowMore(false)}>
            <ExchangeRateList close={() => setShowMore(false)} />
          </CenterModalWrapper>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExchangeRateCard;
