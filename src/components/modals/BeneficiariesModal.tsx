"use client";
import React, { useMemo, useState } from "react";
import Overlay from "../ui/Overlay";
import Image from "next/image";
import { IExternalAccount } from "@/types/services";
import Avatar from "../ui/Avatar";

interface Props {
  users: IExternalAccount[];
  setUser: (arg: IExternalAccount) => void;
  close: () => void;
}

const BeneficiariesModal = ({ users, setUser, close }: Props) => {
  const [search, setSearch] = useState("");
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredUsers: IExternalAccount[] = useMemo(() => {
    return users.filter((user) =>
      user?.bank_account_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);
  const handleSelect = (user: IExternalAccount) => {
    setUser(user);
    close();
  };
  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Choose Beneficiary
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
            placeholder="Search for beneficiary"
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>

        {/* users */}
        <div className="flex flex-col gap-[20px] font-brSonoma h-[350px] overflow-y-scroll ">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <button
                onClick={() => handleSelect(user)}
                key={index}
                className="flex gap-2 hover:bg-slate-100 p-3 rounded-xl"
              >
                <div className="relative">
                  <Avatar src={""} name={user?.bank_name || ""} />
                </div>
                <div className="flex flex-col items-start gap-1">
                  <p className="text-raiz-gray-950 text-sm font-semibold text-left">
                    {user?.bank_account_name}
                  </p>
                  <p className="text-raiz-gray-950 text-sm font-semibold text-left">
                    {user?.bank_account_number}
                  </p>
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

export default BeneficiariesModal;
