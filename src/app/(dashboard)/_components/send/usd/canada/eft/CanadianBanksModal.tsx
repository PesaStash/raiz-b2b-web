import Overlay from "@/components/ui/Overlay";
import { FormikProps } from "formik";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import Radio from "@/components/ui/Radio";

export type ICanadianBank = {
  bank_name: string;
  institution_number: string;
};

interface Props {
  data: ICanadianBank[];
  close: () => void;
  setSelectedBank: (val: ICanadianBank) => void;
  selectedBank: ICanadianBank;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikProps<any>;
}

const CanadianBanksModal = ({
  data,
  close,
  selectedBank,
  setSelectedBank,
  formik,
}: Props) => {
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const filteredBanks: ICanadianBank[] = useMemo(() => {
    return data.filter((each) =>
      each.bank_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);
  const handleClick = (val: ICanadianBank) => {
    formik.setFieldValue("bankName", val.bank_name);
    formik.setFieldTouched("bankName", true);
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
                checked={
                  each.institution_number === selectedBank.institution_number
                }
                onChange={() => handleClick(each)}
              />
              {each.bank_name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end mt-4"></div>
    </Overlay>
  );
};

export default CanadianBanksModal;
