"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { GetAllRates } from "@/services/transactions";
import useCountryStore from "@/store/useCountryStore";
import { useExchangeRatePreferenceStore } from "@/store/useExchangeRatePreferenceStore";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

interface ExchangeRateListProps {
  close: () => void;
}

const ExchangeRateList: React.FC<ExchangeRateListProps> = ({ close }) => {
  const [search, setSearch] = useState("");
  const { data: rates, isLoading } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: GetAllRates,
  });

  const { countries, fetchCountries } = useCountryStore();
  const { selectedCurrencies, setSelectedCurrencies } =
    useExchangeRatePreferenceStore();
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    if (selectedCurrencies.length > 0) {
      setTempSelected(selectedCurrencies);
    } else if (rates && rates.length > 0) {
      // Default to first 14 if none selected
      setTempSelected(rates.slice(0, 14).map((r) => r.currency));
    }
  }, [selectedCurrencies, rates]);

  const getFlag = (currencyCode: string) => {
    const country = countries.find((c) => c.currency === currencyCode);
    if (country?.country_flag) return country.country_flag;

    const fallbackFlags: Record<string, string> = {
      GBP: "/icons/flag-gb.png",
      EUR: "/icons/flag-fr.png",
      NGN: "/icons/flag-ng.png",
      CAD: "/icons/flag-ca.png",
      USD: "/icons/flag-us.webp",
    };

    return fallbackFlags[currencyCode] || `/icons/flag-not.png`;
  };

  const filteredRates = useMemo(() => {
    if (!rates) return [];
    return rates.filter(
      (rate) =>
        rate.currency.toLowerCase().includes(search.toLowerCase()) ||
        rate.country_name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [rates, search]);

  const handleToggle = (currency: string) => {
    setTempSelected((prev) => {
      if (prev.includes(currency)) {
        return prev.filter((c) => c !== currency);
      } else {
        if (prev.length >= 14) {
          toast.info(
            "You can only select up to 14 currencies, unselect some to add more",
          );
          return prev;
        }
        return [...prev, currency];
      }
    });
  };

  const handleSave = () => {
    setSelectedCurrencies(tempSelected);
    toast.success("Preferences saved successfully");
    close();
  };

  return (
    <div className="w-full  xl:max-h-[85vh] lg:max-h-[80vh] flex flex-col font-brSonoma">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
          Exchange Rates
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-raiz-gray-50 border border-raiz-gray-200 rounded-xl outline-none focus:border-primary2 transition-colors text-sm"
          />
          <Image
            src="/icons/search.svg"
            alt="search"
            width={18}
            height={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
          />
        </div>
      </div>

      <div className="flex-1 rounded-[20px] bg-white p-6 overflow-y-auto mb-6  custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {isLoading ? (
            <div className="col-span-full py-10 text-center text-raiz-gray-500">
              Loading rates...
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="col-span-full py-10 text-center text-raiz-gray-500">
              No currencies found
            </div>
          ) : (
            filteredRates.map((rate, index) => {
              const isChecked = tempSelected.includes(rate.currency);
              return (
                <div key={index} className="flex items-center gap-3">
                  <Checkbox
                    checked={isChecked}
                    onChange={() => handleToggle(rate.currency)}
                    // bgStyle="bg-primary2 border-primary2"
                    className=""
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-0.5">
                      <Image
                        src={getFlag(rate.currency)}
                        alt={rate.currency}
                        width={16}
                        height={16}
                        className="rounded-full object-cover size-4"
                      />
                      <span className="text-sm font-brSonoma leading-5 font-semibold text-raiz-gray-950">
                        {rate.country_name || rate.currency}
                      </span>
                    </div>
                    <span className="text-xs text-raiz-gray-800 font-normal">
                      {rate.currency} {rate.buy_rate.toFixed(2)} = $1 USD
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Button onClick={handleSave} className="py-4">
        Save Changes
      </Button>
    </div>
  );
};

export default ExchangeRateList;
