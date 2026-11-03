"use client";

import Overlay from "@/components/ui/Overlay";
import Avatar from "@/components/ui/Avatar";
import { IThirdPartyUsdBeneficiary } from "@/types/services";
import { getThirdPartyPartnerLogoSrc } from "@/utils/thirdPartyUsdBeneficiary";
import Image from "next/image";
import React, { useMemo, useState } from "react";

interface Props {
  close: () => void;
  partners: IThirdPartyUsdBeneficiary[];
  onSelect: (partner: IThirdPartyUsdBeneficiary) => void;
}

const ThirdPartyPartnerModal = ({ close, partners, onSelect }: Props) => {
  const [search, setSearch] = useState("");

  const filteredPartners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return partners;

    return partners.filter((partner) =>
      partner.third_party_name.toLowerCase().includes(query),
    );
  }, [partners, search]);

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col h-full py-8 px-5">
        <div className="flex items-center justify-between mb-[15px]">
          <h5 className="text-raiz-gray-950 text-xl font-bold leading-normal">
            Add Partner
          </h5>
          <button type="button" onClick={close} aria-label="Close">
            <Image src="/icons/close.svg" width={16} height={16} alt="close" />
          </button>
        </div>

        <div className="relative h-12 w-full min-w-0 mb-[30px]">
          <Image
            className="absolute top-3.5 left-3"
            src="/icons/search.svg"
            alt="search"
            width={22}
            height={22}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partner brands..."
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar">
          {filteredPartners.length > 0 ? (
            filteredPartners.map((partner) => (
              <button
                key={partner.third_party_usd_beneficiary_id}
                type="button"
                onClick={() => onSelect(partner)}
                className="flex items-center gap-3 hover:bg-slate-100 p-3 rounded-xl text-left"
              >
                <Avatar
                  src={getThirdPartyPartnerLogoSrc(partner.third_party_name)}
                  name={partner.third_party_name}
                />
                <div className="flex flex-col">
                  <span className="text-raiz-gray-950 text-sm font-semibold">
                    {partner.third_party_name}
                  </span>
                  <span className="text-raiz-gray-400 text-xs font-medium">
                    {partner.account_name}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-raiz-gray-600">
              No partner found
            </p>
          )}
        </div>
      </div>
    </Overlay>
  );
};

export default ThirdPartyPartnerModal;
