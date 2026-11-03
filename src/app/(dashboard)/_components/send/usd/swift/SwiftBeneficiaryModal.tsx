"use client";

import Avatar from "@/components/ui/Avatar";
import Overlay from "@/components/ui/Overlay";
import { ISwiftBeneficiary } from "@/types/services";
import { maskAccountNumber, truncateString } from "@/utils/helpers";
import Image from "next/image";
import React, { useMemo, useState } from "react";

interface Props {
  close: () => void;
  beneficiaries: ISwiftBeneficiary[];
  onSelect: (beneficiary: ISwiftBeneficiary) => void;
}

const SwiftBeneficiaryModal = ({
  close,
  beneficiaries,
  onSelect,
}: Props) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return beneficiaries;
    return beneficiaries.filter((beneficiary) => {
      const haystack = [
        beneficiary.label,
        beneficiary.account_name,
        beneficiary.bank_name,
        beneficiary.account_number_or_iban,
        beneficiary.swift_code,
        beneficiary.country,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [beneficiaries, search]);

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col h-full py-8 px-5">
        <h5 className="text-raiz-gray-950 text-xl font-bold leading-normal">
          Choose Beneficiary
        </h5>
        <div className="relative h-12 w-full min-w-0 mt-[15px] mb-[30px]">
          <Image
            className="absolute top-3.5 left-3"
            src="/icons/search.svg"
            alt="search"
            width={22}
            height={22}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-col md:gap-5 gap-3 font-brSonoma md:h-[350px] h-[300px] overflow-y-scroll">
          {filtered.length > 0 ? (
            filtered.map((beneficiary) => (
              <button
                key={beneficiary.swift_beneficiary_id}
                type="button"
                onClick={() => {
                  onSelect(beneficiary);
                  close();
                }}
                className="flex justify-between hover:bg-slate-100 p-3 rounded-xl text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar src="" name={beneficiary.account_name} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-raiz-gray-950 text-sm font-semibold truncate">
                      {beneficiary.account_name}
                    </span>
                    <span className="text-raiz-gray-400 text-sm font-semibold truncate">
                      {beneficiary.label}
                    </span>
                    <span className="text-raiz-gray-400 text-xs truncate">
                      {maskAccountNumber(beneficiary.account_number_or_iban)} ·{" "}
                      {truncateString(beneficiary.swift_code, 11)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-raiz-gray-600">
              No beneficiary found
            </p>
          )}
        </div>
      </div>
    </Overlay>
  );
};

export default SwiftBeneficiaryModal;
