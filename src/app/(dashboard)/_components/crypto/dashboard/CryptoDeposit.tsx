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
    <section className="flex my-6 flex-col  bg-raiz-gray-50 p-6 rounded-[20px] ">
      <h3 className=" text-zinc-900 font-semibold">Deposit</h3>
      <div className="flex justify-between gap-3 mt-5 w-full">
        {/* Existing chain */}
        {cryptoWallets.map((wallet) => {
          const chainMeta = CHAINS.find((c) => c.value === wallet.chain);
          return (
            <button
              onClick={() => showDeposit(wallet)}
              key={wallet.secondary_crypto_detail_id}
              className="flex flex-col items-center justify-center px-8 py-4 w-full border rounded-xl h-[104px]"
            >
              {chainMeta && (
                <>
                  <Image
                    src={chainMeta.icon}
                    alt={chainMeta.name}
                    width={32}
                    height={32}
                  />
                  <span className="text-sm mt-2">
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
            className="flex flex-col items-center justify-center px-8 py-4 w-full border rounded-xl text-[#B4A9C6] hover:border-zinc-400 h-[104px]"
            onClick={() => setShowModal("chain")}
          >
            <svg width="33" height="32" viewBox="0 0 33 32" fill="none">
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
