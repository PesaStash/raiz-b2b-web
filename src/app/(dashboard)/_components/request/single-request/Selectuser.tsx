"use client";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import React, { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { ISearchedUser } from "@/types/user";
import FindRecipients from "@/components/transactions/FindRecipients";
import { useP2PBeneficiaries } from "@/lib/hooks/useP2pBeneficiaries";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import { useQuery } from "@tanstack/react-query";
import { IBillRequestParams } from "@/types/services";
import { FetchSentRequestApi } from "@/services/transactions";
import { useCurrencyStore } from "@/store/useCurrencyStore";

interface Props {
  goBack: () => void;
  setSelectedUser: Dispatch<SetStateAction<ISearchedUser | undefined>>;
  currentWalletId: string;
}

const Selectuser = ({ goBack, setSelectedUser, currentWalletId }: Props) => {
  const { selectedCurrency } = useCurrencyStore();
  const { data: response, isLoading } = useQuery({
    queryKey: ["bill-requests-sent", { currency: selectedCurrency.name }],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IBillRequestParams];
      return FetchSentRequestApi(params);
    },
  });

  const recents = response?.data?.map((item) => item.third_party_account) || [];
  return (
    <>
      <CenterModalHeader close={goBack} />
      <h2 className="text-xl font-semibold text-raiz-gray-950 leading-10 mb-4">
        Request Money
      </h2>
      <FindRecipients
        recentUsers={recents}
        setSelectedUser={setSelectedUser}
        beneficiaries={[]}
        emptyStateTitle="You haven't made any request"
      />
    </>
  );
};

export default Selectuser;
