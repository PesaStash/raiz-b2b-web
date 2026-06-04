"use client";
import Overlay from "@/components/ui/Overlay";
import { CHAINS } from "@/constants/misc";
import { IChain } from "@/types/misc";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { FormikProps } from "formik";

interface Props {
  close: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikProps<any>;
}

const NetworkModal = ({ close, formik }: Props) => {
  const [search, setSearch] = useState("");
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const filteredChains: { name: string; value: IChain; icon: string }[] =
    useMemo(() => {
      return CHAINS.filter((each) =>
        each.name.toLowerCase().includes(search.toLowerCase())
      );
    }, [search]);
  const handleSelect = (chain: {
    name: string;
    value: IChain;
    icon: string;
  }) => {
    formik.setFieldValue("network", chain.value);
    close();
  };
  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <h3 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Network of Recipient
        </h3>
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
        <div className="flex flex-col gap-[20px] font-brSonoma h-[350px] overflow-y-scroll ">
          {filteredChains?.map((chain) => (
            <button
              key={chain.value}
              onClick={() => handleSelect(chain)}
              className="flex gap-2 hover:bg-slate-100 p-3 rounded-xl text-raiz-gray-950 text-sm font-semibold"
            >
              <span className="flex items-center gap-3 text-raiz-gray-900">
                <Image
                  src={chain.icon}
                  alt={`${chain.name} icon`}
                  width={20}
                  height={20}
                  className="object-contain"
                />
                {chain.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
};

export default NetworkModal;
