"use client";
import Overlay from "@/components/ui/Overlay";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { IIntCountry, IntCountries } from "@/constants/send";

interface Props {
  setCountry: (arg: IIntCountry) => void;
  close: () => void;
}

const IntCountriesModal = ({ close, setCountry }: Props) => {
  const [search, setSearch] = useState("");
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const filteredCountries: IIntCountry[] = useMemo(() => {
    return IntCountries.slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((country) =>
        country?.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [search]);
  const handleSelect = (country: IIntCountry) => {
    setCountry(country);
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
            placeholder="Search for beneficiary"
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-col md:gap-5 gap-3 font-brSonoma md:h-[350px] h-[300px] overflow-y-scroll ">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country, index) => (
              <button
                onClick={() => handleSelect(country)}
                key={index}
                className="flex gap-2 hover:bg-slate-100 p-3 rounded-xl items-start"
              >
                <Image
                  src={country.logo || "/icons/flag-not.png"}
                  alt={country.name}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full"
                />
                <p className="text-raiz-gray-950 text-sm font-semibold text-left">
                  {country.name}
                </p>
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
