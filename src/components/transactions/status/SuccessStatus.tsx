"use client";
import React, { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { ImSpinner2 } from "react-icons/im";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AddExternalBeneficiaryApi,
  AddP2PBeneficiaryApi,
} from "@/services/transactions";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import { toast } from "sonner";
import { IExternalBeneficiaryPayload } from "@/types/services";
import { BeneficiaryType } from "@/components/modals/PaymentStatusModal";

interface Props {
  text: string;
  title: string;
  close: () => void;
  viewReceipt?: () => void;
  beneficiary?: BeneficiaryType;
}

const SuccessStatus = ({
  text,
  title,
  close,
  viewReceipt,
  beneficiary,
}: Props) => {
  const { user } = useUser();
  const currentWallet = useCurrentWallet(user);
  const [isBeneficiarySaved, setIsBeneficiarySaved] = useState(false);
  const qc = useQueryClient();

  const AddP2PBeneficiaryMutation = useMutation({
    mutationFn: ({
      wallet_id,
      beneficiary_entity_id,
    }: {
      wallet_id: string;
      beneficiary_entity_id: string;
    }) => AddP2PBeneficiaryApi(wallet_id, beneficiary_entity_id),
    onSuccess: (response) => {
      toast.success(response?.message);
      setIsBeneficiarySaved(true);
      qc.refetchQueries({
        queryKey: [
          "p2p-beneficiaries-favorites",
          { walletId: currentWallet?.wallet_id },
        ],
      });
    },
  });

  const AddExternalBeneficiaryMutation = useMutation({
    mutationFn: (data: IExternalBeneficiaryPayload) =>
      AddExternalBeneficiaryApi(data),
    onSuccess: (response) => {
      toast.success(response?.message);
      setIsBeneficiarySaved(true);
      qc.refetchQueries({
        queryKey: ["external-beneficiaries-favorites"],
      });
    },
  });
  const handleSwitch = () => {
    if (
      !currentWallet ||
      AddP2PBeneficiaryMutation.isPending ||
      AddExternalBeneficiaryMutation.isPending
    )
      return;

    // Determine if the beneficiary is ISearchedUser or IExternalAccount
    if (beneficiary && "entity_id" in beneficiary) {
      // Handle ISearchedUser (P2P beneficiary)
      const beneficiaryId = beneficiary.entity_id;
      if (!beneficiaryId) {
        toast.error("Beneficiary ID is missing.");
        return;
      }

      AddP2PBeneficiaryMutation.mutate({
        wallet_id: currentWallet.wallet_id,
        beneficiary_entity_id: beneficiaryId,
      });
    } else {
      const payload: IExternalBeneficiaryPayload = {
        bank_short_code: beneficiary?.bank_short_code || null,
        bank_account_number: beneficiary?.bank_account_number || null,
        bank_account_name: beneficiary?.bank_account_name || null,
        bank_name: beneficiary?.bank_name || null,
      };

      AddExternalBeneficiaryMutation.mutate(payload);
    }
  };

  const isPending =
    AddP2PBeneficiaryMutation.isPending ||
    AddExternalBeneficiaryMutation.isPending;
  return (
    <div className="w-full h-full bg-gradient-to-l from-indigo-900 to-violet-600 rounded-[36px]  shadow-[0px_1px_2px_0px_rgba(0,0,0,0.30)] inline-flex flex-col justify-center items-center">
      <div className="flex flex-col justify-between gap-6 h-full pt-[88px] p-[30px] items-center w-full">
        <div className="text-center w-full flex flex-col justify-center items-center">
          <Image
            src={"/icons/success.svg"}
            width={50}
            height={50}
            alt="Success"
          />
          <h4 className="mt-[15px] text-gray-100 text-xl font-bold leading-relaxed">
            {title}
          </h4>
          <p className="text-gray-100 mt-3 text-xs font-normal leading-tight text-wrap">
            {text}
          </p>
        </div>
        <div className="w-full">
          {beneficiary && (
            <div className="flex gap-3 mb-4 items-center justify-center">
              <p className="text-gray-100 text-xs font-normal leading-tight">
                Save beneficiary for future actions?
              </p>
              <button
                disabled={isPending}
                onClick={handleSwitch}
                className={`relative w-9 h-6 rounded-full   border-2  p-2 flex justify-center items-center
        ${isBeneficiarySaved ? "bg-[#0c5735]" : "bg-gray-400"}
                ${isPending ? "opacity-50" : ""}`}
              >
                {isPending ? (
                  <ImSpinner2 className="animate-spin w-4 h-4 text-white mx-auto" />
                ) : (
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform
        ${isBeneficiarySaved ? "translate-x-3" : "translate-x-0"}`}
                  />
                )}
              </button>
            </div>
          )}
          <div className="flex justify-between w-full gap-[15px]">
            {viewReceipt && (
              <Button
                onClick={viewReceipt}
                className="bg-zinc-200 text-zinc-900"
              >
                View receipt
              </Button>
            )}
            <Button onClick={close} className="bg-indigo-900">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessStatus;
