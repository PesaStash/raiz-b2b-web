"use client";
import Overlay from "@/components/ui/Overlay";
import { useUser } from "@/lib/hooks/useUser";
import { useCryptoSwapStore } from "@/store/CryptoSwap";
import { CurrencyTypeKey } from "@/store/CryptoSwap/CryptoSwapSlice.types";
import { IWallet } from "@/types/user";
import React, { useMemo } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface Props {
  close: () => void;
}

const SelectSwapCurrencyModal = ({ close }: Props) => {
  const { actions } = useCryptoSwapStore();
  const { user } = useUser();
  const wallets = useMemo(
    () => user?.business_account?.wallets || [],
    [user?.business_account?.wallets]
  );

  const filteredWallets = useMemo(() => {
    return wallets.filter(
      (wallet) =>
        ["USD", "SBC"].includes(wallet.wallet_type.currency) &&
        wallet.wallet_type.currency.toLowerCase()
    );
  }, [wallets]);

  const handleSelect = (selectedWallet: IWallet) => {
    const selectedCurrency = selectedWallet.wallet_type.currency;

    const oppositeCurrency = wallets.find(
      (wallet) =>
        (selectedCurrency === "USD" && wallet.wallet_type.currency === "SBC") ||
        (selectedCurrency === "SBC" && wallet.wallet_type.currency === "USD")
    )?.wallet_type.currency;

    if (!oppositeCurrency) {
      toast.warning("Only USD to SBC and SBC to USD swaps are allowed.");
      return;
    }

    actions.switchSwapWallet(
      oppositeCurrency as CurrencyTypeKey,
      selectedCurrency as CurrencyTypeKey,
      wallets
    );

    actions.setAmount("");
    close();
  };

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <h5 className="text-raiz-gray-950 text-xl font-bold  leading-normal">
          Currency
        </h5>
        {filteredWallets.length > 0 ? (
          filteredWallets.map((wallet, index) => (
            <button
              onClick={() => handleSelect(wallet)}
              key={index}
              className="flex justify-between hover:bg-slate-100 p-3 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <Image
                  className="w-6 h-6 rounded-full"
                  src={
                    wallet.wallet_type.currency === "USD"
                      ? "/icons/dollar.svg"
                      : wallet.wallet_type.currency === "NGN"
                      ? "/icons/ngn.svg"
                      : "/icons/bsc.svg"
                  }
                  alt={wallet?.wallet_name}
                  width={24}
                  height={14}
                />
                <span className="text-raiz-gray-950 text-sm font-semibold text-left">
                  {wallet?.wallet_type.wallet_type_name}
                </span>
              </div>
            </button>
          ))
        ) : (
          <p className="text-center text-sm text-raiz-gray-600">
            No wallet found
          </p>
        )}
      </div>
    </Overlay>
  );
};

export default SelectSwapCurrencyModal;
