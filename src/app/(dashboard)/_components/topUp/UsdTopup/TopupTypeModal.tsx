"use client";
import Overlay from "@/components/ui/Overlay";
import React, { useMemo } from "react";
import Image from "next/image";
import Radio from "@/components/ui/Radio";
import { useTopupStore } from "@/store/TopUp";
import { TopupPaymentOptions } from "@/store/TopUp/topupSlice.types";
import { useMutation } from "@tanstack/react-query";
import {
  createStripeTopPaymentIntent,
  InitiateZelleTopApi,
} from "@/services/transactions";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useUser } from "@/lib/hooks/useUser";

interface Props {
  goBack: () => void;
  goNext: () => void;
}

const TopupTypeModal = ({ goBack, goNext }: Props) => {
  const { paymentOption, actions, amount } = useTopupStore();
  const { selectedCurrency } = useCurrencyStore();
  const { user } = useUser();

  const currentWallet = useMemo(() => {
    if (!user || !user?.business_account?.wallets || !selectedCurrency?.name)
      return null;
    return user?.business_account?.wallets.find(
      (wallet) => wallet.wallet_type.currency === selectedCurrency.name,
    );
  }, [user, selectedCurrency]);

  const zelleMutation = useMutation({
    mutationFn: (payload: { expected_amount: number }) =>
      InitiateZelleTopApi(currentWallet?.wallet_id || null, payload),
    onSuccess: (res) => {
      actions.setZelleInfo(res);
      goNext();
    },
  });

  const DebitCardMutation = useMutation({
    mutationFn: () => createStripeTopPaymentIntent(Number(amount) * 100 || 0),
    onSuccess: (res) => {
      actions.setStripeDetail(res);
      goNext();
    },
  });

  const handleNext = (type: TopupPaymentOptions) => {
    actions.setPaymentOption(type);
    goNext();
  };

  const isLoading = zelleMutation.isPending;
  const isCardLoading = DebitCardMutation.isPending;

  return (
    <Overlay close={goBack} width="375px">
      <div className="flex flex-col h-full py-8 px-5">
        <div className="flex justify-between items-start mb-11">
          <div className="">
            <h3 className="text-zinc-900 text-xl font-bold leading-normal">
              Add Payment type
            </h3>
            <p className="text-zinc-900 text-xs leading-tight">
              Select how you want to top up
            </p>
          </div>
          <button
            onClick={goBack}
            disabled={isLoading || isCardLoading}
            className="hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image
              src={"/icons/close.svg"}
              width={16}
              height={16}
              alt="close"
            />
          </button>
        </div>
        <div className="flex flex-col gap-5">
          <div
            role="button"
            onClick={() => !isLoading && !isCardLoading && handleNext("zelle")}
            className={`border ${
              paymentOption === "zelle"
                ? "border-indigo-900"
                : "border-zinc-200"
            } rounded-[20px] cursor-pointer flex flex-col justify-center items-center w-full pt-[19px] pb-[21px] transition-all ${
              isLoading && isCardLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-indigo-900 hover:bg-indigo-50"
            }`}
          >
            <div className="flex justify-between w-full px-[30px] mb-5">
              <span />
              {isLoading && paymentOption === "zelle" ? (
                <div className="w-[30px] h-[30px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-900"></div>
                </div>
              ) : (
                <Image
                  width={30}
                  height={30}
                  src={"/icons/zelle.png"}
                  alt="Zelle"
                />
              )}
              <Radio
                checked={paymentOption === "zelle"}
                onChange={() => !isLoading && handleNext("zelle")}
                readOnly={isLoading || isCardLoading}
              />
            </div>
            <p className="text-zinc-900 text-sm font-bold leading-none">
              Zelle
            </p>
            <p className="text-center text-zinc-900 text-xs font-normal leading-tight">
              {isLoading && paymentOption === "zelle"
                ? "Processing..."
                : "Top up from Zelle"}
            </p>
          </div>
          <div
            role="button"
            onClick={() =>
              !isLoading && !isCardLoading && handleNext("africa-collection")
            }
            className={`border ${
              paymentOption === "africa-collection"
                ? "border-indigo-900"
                : "border-zinc-200"
            } rounded-[20px] cursor-pointer flex flex-col justify-center items-center w-full pt-[19px] pb-[21px] transition-all hover:border-indigo-900 hover:bg-indigo-50`}
          >
            <div className="flex justify-between w-full px-[30px] mb-5">
              <span />
              <Image
                width={30}
                height={30}
                src={"/icons/africa.png"}
                alt="Africa Collection"
              />
              <Radio
                checked={paymentOption === "africa-collection"}
                onChange={() => handleNext("africa-collection")}
              />
            </div>
            <p className="text-zinc-900 text-sm font-bold leading-none">
              African countries
            </p>
            <p className="text-center text-zinc-900 text-xs font-normal leading-tight">
              Bank transfer or mobile money
            </p>
          </div>
          <div
            role="button"
            onClick={() =>
              !isLoading && !isCardLoading && handleNext("bank-transfer")
            }
            className={`border ${
              paymentOption === "bank-transfer"
                ? "border-indigo-900"
                : "border-zinc-200"
            } rounded-[20px] cursor-pointer flex flex-col justify-center items-center w-full pt-[19px] pb-[21px] transition-all hover:border-indigo-900 hover:bg-indigo-50`}
          >
            <div className="flex justify-between w-full px-[30px] mb-5">
              <span />
              <Image
                width={30}
                height={30}
                src={"/icons/us-bank.svg"}
                alt="bank"
              />
              <Radio
                checked={paymentOption === "bank-transfer"}
                onChange={() => handleNext("bank-transfer")}
              />
            </div>
            <p className="text-zinc-900 text-sm font-bold leading-none">
              Bank Transfer
            </p>
            <p className="text-center text-zinc-900 text-xs font-normal leading-tight">
              Top up from bank transfer
            </p>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default TopupTypeModal;
