"use client";
import Avatar from "@/components/ui/Avatar";
import Overlay from "@/components/ui/Overlay";
import { useSendStore } from "@/store/Send";
import { EntityForeignPayoutBeneficiary } from "@/types/services";
import { isBeneficiaryReady } from "@/utils/remittancePayoutErrors";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface Props {
  close: () => void;
  users: EntityForeignPayoutBeneficiary[];
}

const IntBeneficiaryModal = ({ close, users }: Props) => {
  const [search, setSearch] = useState("");
  const { actions } = useSendStore();
  const filteredUsers = useMemo(() => {
    return users
      .slice()
      .sort((a, b) =>
        (a.foreign_payout_beneficiary?.beneficiary_name || "").localeCompare(
          b.foreign_payout_beneficiary?.beneficiary_name || "",
        ),
      )
      .filter((user) =>
        user?.foreign_payout_beneficiary?.beneficiary_name
          ?.toLowerCase()
          .includes(search.toLowerCase()),
      );
  }, [search, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSelect = (user: EntityForeignPayoutBeneficiary) => {
    const status =
      user.foreign_payout_beneficiary?.beneficiary_creation_status;
    if (!isBeneficiaryReady(status)) {
      toast.info(
        status === "failed"
          ? "This beneficiary failed verification and cannot be used."
          : "This beneficiary is still processing.",
      );
      return;
    }
    actions.selectIntBeneficiary(user);
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
        <div className="flex flex-col gap-4 mt-5 w-full  max-h-[300px] overflow-y-scroll ">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => {
              const creationStatus =
                user.foreign_payout_beneficiary?.beneficiary_creation_status;
              const ready = isBeneficiaryReady(creationStatus);

              return (
                <button
                  onClick={() => handleSelect(user)}
                  key={index}
                  disabled={!ready}
                  className={`flex justify-between hover:bg-slate-100 p-3 rounded-xl ${
                    ready ? "" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex relative">
                      <Avatar
                        src={""}
                        name={
                          user?.foreign_payout_beneficiary?.beneficiary_name ||
                          ""
                        }
                      />
                      {user?.foreign_payout_beneficiary?.beneficiary_country && (
                        <Image
                          className="absolute bottom-0 -right-3 w-6 h-4"
                          src={`/icons/flag-${user.foreign_payout_beneficiary.beneficiary_country.toLowerCase()}.png`}
                          width={18}
                          height={14}
                          alt={user.foreign_payout_beneficiary.beneficiary_country.toLowerCase()}
                        />
                      )}
                    </div>
                    <div className="flex flex-col ">
                      <span className="text-raiz-gray-950 text-sm font-semibold text-left">
                        {user?.foreign_payout_beneficiary?.beneficiary_name}
                      </span>
                      <span className="text-raiz-gray-400 text-sm font-semibold text-left">
                        {
                          user?.foreign_payout_beneficiary
                            ?.beneficiary_account_number
                        }
                      </span>
                      {!ready && (
                        <span className="text-amber-700 text-xs capitalize text-left">
                          {creationStatus || "processing"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
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

export default IntBeneficiaryModal;
