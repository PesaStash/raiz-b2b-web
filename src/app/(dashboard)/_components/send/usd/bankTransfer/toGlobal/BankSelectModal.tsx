"use client";
import Overlay from "@/components/ui/Overlay";
import Radio from "@/components/ui/Radio";
import { convertField } from "@/utils/helpers";
import { FormikProps } from "formik";
import React, { useMemo, useState } from "react";
import Image from "next/image";

export interface IBeneficiaryBank {
  id: number;
  code: string;
  name: string;
  currency?: string;
}

interface Props {
  data: IBeneficiaryBank[];
  close: () => void;
  setSelectedBank: (val: IBeneficiaryBank) => void;
  selectedBank: IBeneficiaryBank;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikProps<any>;
}

const BankSelectModal = ({
  data,
  close,
  setSelectedBank,
  selectedBank,
  formik,
}: Props) => {
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredBanks: IBeneficiaryBank[] = useMemo(() => {
    return data.filter((each) =>
      each.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const handleClick = (val: IBeneficiaryBank) => {
    const bankCode = val.code || val.id.toString();
    formik.setFieldValue("bank_code", bankCode);
    formik.setFieldTouched("bank_code", true);
    setSelectedBank(val);
    close();
  };

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Select Bank
        </h5>
        <div className="relative h-12 w-full min-w-0  mt-[15px]">
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
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-col gap-4 mt-5 w-full items-start h-[350px] overflow-y-scroll ">
          {filteredBanks?.map((each, index) => (
            <button
              onClick={() => {
                handleClick(each);
              }}
              className="text-sm font-medium w-full flex gap-2 text-left "
              key={index}
            >
              <Radio
                checked={each.id === selectedBank.id}
                onChange={() => handleClick(each)}
              />
              {convertField(each.name)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end mt-4"></div>
    </Overlay>
  );
};

export default BankSelectModal;
