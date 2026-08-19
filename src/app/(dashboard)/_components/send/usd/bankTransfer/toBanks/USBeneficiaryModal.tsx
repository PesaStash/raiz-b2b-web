"use client";
import Overlay from "@/components/ui/Overlay";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { EntityBeneficiary } from "@/types/services";
import Avatar from "@/components/ui/Avatar";
import { useSendStore } from "@/store/Send";

interface Props {
  close: () => void;
  users: EntityBeneficiary[];
}
const USBeneficiaryModal = ({ close, users }: Props) => {
  const [search, setSearch] = useState("");
  const { actions } = useSendStore();

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user?.usd_beneficiary?.account_name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, users]);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const handleSelect = (user: EntityBeneficiary) => {
    actions.selectUsdBeneficiary(user);
    close();
  };
  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Choose Beneficiary
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
            placeholder="Search"
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>
        <div className="flex flex-col md:gap-5 gap-3 font-brSonoma md:h-[350px] h-[300px] overflow-y-scroll ">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => (
            <button
              onClick={() => handleSelect(user)}
              key={index}
              className="flex justify-between hover:bg-slate-100 p-3 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <Avatar src={""} name={user?.usd_beneficiary?.account_name} />
                <div className="flex flex-col ">
                  <span className="text-raiz-gray-950 text-sm font-semibold text-left">
                    {user?.usd_beneficiary?.account_name}
                  </span>
                  <span className="text-raiz-gray-400 text-sm font-semibold text-left">
                    {user?.usd_beneficiary?.label}
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

export default USBeneficiaryModal;
