"use client";
import { CHAINS } from "@/constants/misc";
import { useUser } from "@/lib/hooks/useUser";
import React, { useState } from "react";
import Image from "next/image";
import SelectChain from "./SelectChain";
import CryptoDepositDetail from "./CryptoDepositDetail";
import { ICryptoWallet } from "@/types/user";

const CryptoDeposit = () => {
  const [showModal, setShowModal] = useState<"chain" | "deposit" | null>(null);
  const [selectedChain, setSelectedChain] = useState<ICryptoWallet | null>(
    null,
  );
  const { user } = useUser();
  const cryptoWallets =
    user?.business_account?.wallets.find(
      (i) => i.wallet_type.currency === "SBC",
    )?.secondary_crypto_details || [];

  const addedChains = Array.isArray(cryptoWallets)
    ? cryptoWallets.map((wallet) => wallet?.chain)
    : [];

  const remainingChains = CHAINS.filter(
    (chain) => !addedChains.includes(chain.value),
  );

  const closeModal = () => setShowModal(null);

  const showDeposit = (c: ICryptoWallet) => {
    setSelectedChain(c);
    setShowModal("deposit");
  };
  return (
    <section className="flex my-4 sm:my-6 flex-col bg-raiz-gray-50 p-4 sm:p-6 rounded-[20px] min-w-0">
      <h3 className="text-zinc-900 font-semibold text-sm sm:text-base">Deposit</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-5 w-full min-w-0">
        {/* Existing chain */}
        {cryptoWallets.map((wallet) => {
          const chainMeta = CHAINS.find((c) => c.value === wallet.chain);
          return (
            <button
              onClick={() => showDeposit(wallet)}
              key={wallet.secondary_crypto_detail_id}
              className="flex flex-col items-center justify-center px-2 sm:px-6 py-3 sm:py-4 w-full min-w-0 border rounded-xl h-[88px] sm:h-[104px] hover:border-zinc-400 transition-colors"
            >
              {chainMeta && (
                <>
                  <Image
                    src={chainMeta.icon}
                    alt={chainMeta.name}
                    width={32}
                    height={32}
                    className="size-7 sm:size-8 shrink-0"
                  />
                  <span className="text-xs sm:text-sm mt-1.5 sm:mt-2 text-center truncate w-full px-1">
                    {chainMeta.name.includes("(")
                      ? chainMeta.name.split(" (")[0]
                      : chainMeta.name}
                  </span>
                </>
              )}
            </button>
          );
        })}
        {/* add new */}
        {remainingChains.map((chain) => (
          <button
            key={chain.value}
            className="flex flex-col items-center justify-center px-2 sm:px-6 py-3 sm:py-4 w-full min-w-0 border rounded-xl text-[#B4A9C6] hover:border-zinc-400 h-[88px] sm:h-[104px] transition-colors"
            onClick={() => setShowModal("chain")}
            aria-label={`Add ${chain.name} wallet`}
          >
            <svg
              className="size-7 sm:size-8 shrink-0"
              viewBox="0 0 33 32"
              fill="none"
              aria-hidden
            >
              <path
                d="M14.6553 1.54358V14.193H2.00586V17.8071H14.6553V30.4565H18.2694V17.8071H30.9188V14.193H18.2694V1.54358H14.6553Z"
                fill="#B5A8C4"
              />
            </svg>
          </button>
        ))}
      </div>
      {showModal === "chain" && (
        <SelectChain close={closeModal} done={closeModal} />
      )}
      {showModal === "deposit" && selectedChain && (
        <CryptoDepositDetail close={closeModal} wallet={selectedChain} />
      )}
    </section>
  );
};

export default CryptoDeposit;
