"use client";
import useBanksStore from "@/store/useBanksStore";
import { IBank } from "@/types/misc";
import React, { useEffect, useMemo, useState } from "react";
import Overlay from "../ui/Overlay";
import Image from "next/image";

interface Props {
  close: () => void;
  setSelectedBank: (arg: IBank) => void;
}

const BankModal = ({ setSelectedBank, close }: Props) => {
  const { ngnBanks, fetchBanks } = useBanksStore();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ngnBanks.length === 0) {
      setLoading(true);
      fetchBanks().finally(() => setLoading(false));
    }
  }, [ngnBanks]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredBanks: IBank[] = useMemo(() => {
    return ngnBanks.filter((bank) =>
      bank?.bankName.toLowerCase().includes(search.toLowerCase())
    );
  }, [ngnBanks, search]);

  const handleSelect = (bank: IBank) => {
    setSelectedBank(bank);
    close();
  };
  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Select your bank
        </h5>
        <div className="relative h-12 w-full min-w-0  mt-[15px] mb-[30px]">
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
            placeholder="Search for bank"
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>

        {/* banks */}
        <div className="flex flex-col gap-[20px] font-brSonoma h-[350px] overflow-y-scroll ">
          {loading ? (
            <p className="text-center text-sm text-raiz-gray-600">
              Loading banks...
            </p>
          ) : filteredBanks.length > 0 ? (
            filteredBanks.map((bank, index) => (
              <button
                onClick={() => handleSelect(bank)}
                key={index}
                className="flex justify-between hover:bg-slate-100 p-3 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <img
                    className="w-6 h-6 rounded-full"
                    src={bank?.bankUrl}
                    alt={bank.bankName}
                    width={24}
                    height={14}
                  />
                  <span className="text-raiz-gray-950 text-sm font-semibold text-left">
                    {bank.bankName}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-raiz-gray-600">
              No banks found
            </p>
          )}
        </div>
      </div>
    </Overlay>
  );
};

export default BankModal;
