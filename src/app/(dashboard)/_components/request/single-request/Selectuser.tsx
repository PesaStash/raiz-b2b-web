"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import React, { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { ISearchedUser } from "@/types/user";
import FindRecipients from "@/components/transactions/FindRecipients";
import { useP2PBeneficiaries } from "@/lib/hooks/useP2pBeneficiaries";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface Props {
  goBack: () => void;
  setSelectedUser: Dispatch<SetStateAction<ISearchedUser | undefined>>;
}

const Selectuser = ({ goBack, setSelectedUser }: Props) => {
  const { recents, favourites } = useP2PBeneficiaries();

  return (
    <>
      <CenterModalHeader close={goBack} />
      <h2 className="text-xl font-semibold text-raiz-gray-950 leading-10 mb-4">
        Request Money
      </h2>
      <FindRecipients
        recentUsers={recents}
        setSelectedUser={setSelectedUser}
        beneficiaries={favourites}
        emptyStateTitle="You haven't made any request"
      />
    </>
  );
};

export default Selectuser;
