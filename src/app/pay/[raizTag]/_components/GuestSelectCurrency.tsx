import Overlay from "@/components/ui/Overlay";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { IIntCountry } from "@/constants/send";
import { useGuestSendStore } from "@/store/GuestSend";
// import { useQuery } from "@tanstack/react-query";
// import { GetAfricaPayinCountriesApi } from "@/services/business";
import { IntCountryType, IntCurrencyCode } from "@/types/services";
import useCountryStore from "@/store/useCountryStore";

interface Props {
  close: () => void;
  onSelect?: (selectedCurrency: IIntCountry) => void;
}

const GuestSelectCurrency = ({ close, onSelect }: Props) => {
  const { actions } = useGuestSendStore();
  // const [search, setSearch] = useState("");
  const { countries, fetchCountries, loading: isLoading } = useCountryStore();
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // const { data: countries, isLoading } = useQuery({
  //   queryKey: ["afican-payin-countries"],
  //   queryFn: GetAfricaPayinCountriesApi,
  // });

  const countriesArr: IIntCountry[] = useMemo(
    () =>
      countries
        ?.map((each) => ({
          name: each.country_name,
          value: each.country_code as IntCountryType,
          currency: each.currency as IntCurrencyCode,
          logo: each.country_flag,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)) || [],
    [countries]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSelect = (selectedCurrency: IIntCountry) => {
    if (onSelect) {
      onSelect(selectedCurrency);
    } else {
      actions.setField("guestLocalCurrency", selectedCurrency);
    }
    close();
  };

  const filteredCurrencies = useMemo(() => {
    return countriesArr?.filter((currency) =>
      currency.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [countriesArr, search]);
  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Currency
        </h5>
        <div className="relative h-12 min-w-[300px]  mt-[15px] mb-[30px]">
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
            placeholder="Search"
            autoFocus
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-col gap-[20px] font-brSonoma h-[350px] overflow-y-scroll ">
          {isLoading ? (
            <p className="text-center text-sm text-raiz-gray-600">Loading...</p>
          ) : filteredCurrencies && filteredCurrencies.length > 0 ? (
            filteredCurrencies.map((each, index) => (
              <button
                onClick={() => handleSelect(each)}
                key={index}
                className="flex justify-between hover:bg-slate-100 p-3 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <Image
                    className="w-6 h-6 rounded-full"
                    src={each.logo}
                    alt={each.name}
                    width={24}
                    height={14}
                  />
                  <span className="text-raiz-gray-950 text-sm font-semibold text-left">
                    {each.name}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-raiz-gray-600">
              Currency not found
            </p>
          )}
        </div>
      </div>
    </Overlay>
  );
};

export default GuestSelectCurrency;
