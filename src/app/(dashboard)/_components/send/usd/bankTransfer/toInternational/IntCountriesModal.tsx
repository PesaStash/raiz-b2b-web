"use client";
import Overlay from "@/components/ui/Overlay";
import { IIntCountry } from "@/constants/send";
import { GetAllRates } from "@/services/transactions";
import useCountryStore from "@/store/useCountryStore";
import { IntCountryType } from "@/types/services";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

interface Props {
  countryCodes: string[];
  setCountry: (arg: IIntCountry) => void;
  close: () => void;
}

type CountryListItem = IIntCountry & {
  flag: string;
  currencyCode?: string;
  sellRate?: number;
};

const isIsoCountryCode = (code: string) => /^[A-Za-z]{2}$/.test(code);

const getCountryName = (code: string) => {
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

const getCountryFlag = (code: string) => {
  const normalized = code.toUpperCase();
  if (!isIsoCountryCode(normalized)) return "🏳️";
  return String.fromCodePoint(
    ...normalized.split("").map((char) => 127397 + char.charCodeAt(0)),
  );
};

const formatSellRate = (currencyCode: string, sellRate: number) =>
  `${currencyCode} ${sellRate.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} = $1 USD`;

const IntCountriesModal = ({ countryCodes, close, setCountry }: Props) => {
  const [search, setSearch] = useState("");
  const { countries: countryMetadata, fetchCountries } = useCountryStore();
  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: GetAllRates,
  });

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const ratesByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    rates?.forEach((rate) => {
      if (rate.currency) {
        map.set(rate.currency.toUpperCase(), rate.sell_rate);
      }
    });
    return map;
  }, [rates]);

  const countries: CountryListItem[] = useMemo(() => {
    const uniqueCodes = Array.from(
      new Set(
        countryCodes
          .map((code) => code.trim().toUpperCase())
          .filter(isIsoCountryCode),
      ),
    );

    return uniqueCodes
      .map((code) => {
        const metadata = countryMetadata.find(
          (country) => country.country_code?.toUpperCase() === code,
        );
        const currencyCode = metadata?.currency?.toUpperCase();
        const sellRate = currencyCode
          ? ratesByCurrency.get(currencyCode)
          : undefined;

        return {
          name: metadata?.country_name || getCountryName(code),
          value: code as IntCountryType,
          logo: metadata?.country_flag || "",
          currency: currencyCode as IIntCountry["currency"],
          flag: getCountryFlag(code),
          currencyCode,
          sellRate,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countryCodes, countryMetadata, ratesByCurrency]);

  const filteredCountries = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return countries;
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.value.toLowerCase().includes(query) ||
        country.currencyCode?.toLowerCase().includes(query),
    );
  }, [countries, search]);

  const handleSelect = (country: CountryListItem) => {
    const { flag: _flag, currencyCode: _currencyCode, sellRate: _sellRate, ...selected } =
      country;
    setCountry(selected);
    close();
  };

  return (
    <Overlay close={close} width="400px">
      <div className="flex flex-col  h-full md:py-8 py-4 md:px-5 px-4 ">
        <h5 className="text-raiz-gray-950 md:text-xl text-lg font-semibold md:font-bold  leading-normal">
          Country
        </h5>
        <div className="relative h-12 w-full min-w-0  md:mt-[15px] mt-3 mb-[30px]">
          <Image
            className="absolute top-3.5 left-3"
            src={"/icons/search.svg"}
            alt="search"
            width={22}
            height={22}
          />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search country"
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-col md:gap-5 gap-3 font-brSonoma md:h-[350px] h-[300px] overflow-y-scroll ">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <button
                onClick={() => handleSelect(country)}
                key={country.value}
                className="flex gap-2 hover:bg-slate-100 p-3 rounded-xl items-center"
              >
                <span className="text-base leading-none" aria-hidden>
                  {country.flag}
                </span>
                <div className="flex flex-col items-start gap-0.5">
                  <p className="text-raiz-gray-950 text-sm font-semibold text-left">
                    {country.name}
                  </p>
                  <p className="text-raiz-gray-700 text-xs text-left">
                    {ratesLoading
                      ? "Loading rate..."
                      : country.currencyCode &&
                          typeof country.sellRate === "number"
                        ? formatSellRate(
                            country.currencyCode,
                            country.sellRate,
                          )
                        : "Rate unavailable"}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-raiz-gray-600">
              No country found
            </p>
          )}
        </div>
      </div>
    </Overlay>
  );
};

export default IntCountriesModal;
