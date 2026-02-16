"use client";
import Button from "@/components/ui/Button";
import { CRYPTO_SWAP_ACCOUNT_CURRENCIES } from "@/constants/misc";
import { useUser } from "@/lib/hooks/useUser";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useUserStore } from "@/store/useUserStore";
import { findWalletByCurrency } from "@/utils/helpers";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
// import { AnimatePresence } from "motion/react";
// import SideModalWrapper from "../../SideModalWrapper";
import CryptoSend from "../send/CryptoSend";
import CryptoSwap from "../swap/CryptoSwap";
import { useCryptoSwapStore } from "@/store/CryptoSwap";
import SelectAccount from "../../SelectAccount";
import CreateNgnAcct from "../../createNgnAcct/CreateNgnAcct";
import CreateCryptoWallet from "./CreateCryptoWallet";
import { AnimatePresence } from "motion/react";
import SideModalWrapper from "../../SideModalWrapper";

const CryptoDashboardSummary = () => {
  const [openModal, setOpenModal] = useState<
    | "send"
    | "request"
    | "swap"
    | "selectAcct"
    | "createNGN"
    | "createCrypto"
    | null
  >(null);
  const pathName = usePathname();
  const { actions } = useCryptoSwapStore();
  const { user, refetch } = useUser();
  const walletData = user?.business_account?.wallets;
  const USDAcct = findWalletByCurrency(user, "USD");
  const { setShowBalance, showBalance } = useUserStore();
  const { selectedCurrency } = useCurrencyStore();
  const { actions: sendActions } = useSendStore();

  const currentWallet = findWalletByCurrency(user, "SBC");

  const closeModal = () => {
    setOpenModal(null);
    sendActions.reset(selectedCurrency.name);
  };

  const closeSwapModal = () => {
    setOpenModal(null);
    actions.reset();
  };
  const handleActionButton = (action: "send" | "request" | "swap") => {
    if (!currentWallet) {
      toast.warning(
        "You do not have a wallet for this currency. Create one first!"
      );
    } else {
      setOpenModal(action);
    }
  };

  useEffect(() => {
    refetch();
  }, [pathName, refetch]);

  const openNGNModal = () => {
    setOpenModal("createNGN");
  };

  const openCryptoModal = () => {
    setOpenModal("createCrypto");
  };

  const displayScreen = () => {
    switch (openModal) {
      case "createNGN":
        return (
          <CreateNgnAcct
            close={closeModal}
            // openBvnModal={() => setShowBvnModal(true)}
          />
        );
      case "createCrypto":
        return <CreateCryptoWallet close={closeModal} />;
      default:
        break;
    }
  };

  return (
    <div className="pt-5">
      <div className="flex items-center justify-between mb-6">
        <p className="text-text-terttiary-600   font-normal font-inter leading-normal">
          Total Assets
        </p>
        <button
          onClick={() => setOpenModal("selectAcct")}
          className="px-3 py-1 bg-violet-100/60 rounded-3xl inline-flex justify-center items-center gap-2"
        >
          <span className=" text-zinc-700 text-xs font-medium font-brSonoma leading-tight">
            Switch Account
          </span>
          <Image
            src={"/icons/arrow-down.svg"}
            width={18}
            height={18}
            alt="arrow down"
          />
        </button>
      </div>
      <div className="flex justify-between items-center gap-4 mb-6">
        <div className="w-full">
          <div className="flex gap-2 items-center">
            <p className="text-raiz-gray-950 text-[2rem] font-semibold  leading-[38.40px]">
              {showBalance
                ? `${currentWallet ? selectedCurrency.sign : ""} ${
                    currentWallet?.account_balance.toLocaleString() || "0.00"
                  }`
                : `${currentWallet ? selectedCurrency.sign : ""}X.XX`}
            </p>
            <button onClick={() => setShowBalance(!showBalance)}>
              <Image
                src={`${
                  !showBalance
                    ? "/icons/show-balance.svg"
                    : "/icons/hide-balance.svg"
                }`}
                alt={`${!showBalance ? "show balance" : "hide balance"} `}
                width={32}
                height={32}
              />
            </button>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Button
            onClick={() => handleActionButton("send")}
            className="h-10 w-[138px] px-[18px] py-2  rounded-3xl justify-center items-center gap-1.5 inline-flex"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
              <path
                d="M13.7836 2.4667L6.25859 4.9667C1.20026 6.65837 1.20026 9.4167 6.25859 11.1L8.49193 11.8417L9.23359 14.075C10.9169 19.1334 13.6836 19.1334 15.3669 14.075L17.8753 6.55837C18.9919 3.18337 17.1586 1.3417 13.7836 2.4667ZM14.0503 6.95004L10.8836 10.1334C10.7586 10.2584 10.6003 10.3167 10.4419 10.3167C10.2836 10.3167 10.1253 10.2584 10.0003 10.1334C9.75859 9.8917 9.75859 9.4917 10.0003 9.25004L13.1669 6.0667C13.4086 5.82504 13.8086 5.82504 14.0503 6.0667C14.2919 6.30837 14.2919 6.70837 14.0503 6.95004Z"
                fill="#FDFDFD"
              />
            </svg>
            <span className="text-[#fcfcfc] text-base font-medium font-brSonoma leading-tight tracking-tight">
              Send
            </span>
          </Button>
          <Button
            onClick={() => {
              handleActionButton("swap");
              if (!USDAcct) {
                toast.info("You must have a second wallet to use this feature");
              } else {
                if (
                  selectedCurrency.name ===
                  CRYPTO_SWAP_ACCOUNT_CURRENCIES.SBC.name
                ) {
                  actions.switchSwapWallet(
                    CRYPTO_SWAP_ACCOUNT_CURRENCIES.SBC.name,
                    CRYPTO_SWAP_ACCOUNT_CURRENCIES.USD.name,
                    walletData
                  );
                } else {
                  actions.switchSwapWallet(
                    CRYPTO_SWAP_ACCOUNT_CURRENCIES.USD.name,
                    CRYPTO_SWAP_ACCOUNT_CURRENCIES.SBC.name,
                    walletData
                  );
                }
              }
            }}
            className="h-10 w-[138px] px-[18px] py-2  rounded-3xl justify-center items-center gap-1.5 inline-flex"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
              <path
                d="M10.1668 1.6665C5.56683 1.6665 1.8335 5.39984 1.8335 9.99984C1.8335 14.5998 5.56683 18.3332 10.1668 18.3332C14.7668 18.3332 18.5002 14.5998 18.5002 9.99984C18.5002 5.39984 14.7668 1.6665 10.1668 1.6665ZM14.4918 13.2832C14.4585 13.3582 14.4168 13.4248 14.3585 13.4832L12.9502 14.8915C12.8252 15.0165 12.6668 15.0748 12.5085 15.0748C12.3502 15.0748 12.1918 15.0165 12.0668 14.8915C11.8252 14.6498 11.8252 14.2498 12.0668 14.0082L12.4085 13.6665H7.75016C6.66683 13.6665 5.79183 12.7832 5.79183 11.7082V10.2332C5.79183 9.8915 6.07516 9.60817 6.41683 9.60817C6.7585 9.60817 7.04183 9.8915 7.04183 10.2332V11.7082C7.04183 12.0998 7.3585 12.4165 7.75016 12.4165H12.4085L12.0668 12.0748C11.8252 11.8332 11.8252 11.4332 12.0668 11.1915C12.3085 10.9498 12.7085 10.9498 12.9502 11.1915L14.3585 12.5998C14.4168 12.6582 14.4585 12.7248 14.4918 12.7998C14.5585 12.9582 14.5585 13.1332 14.4918 13.2832ZM14.5418 9.7665C14.5418 10.1082 14.2585 10.3915 13.9168 10.3915C13.5752 10.3915 13.2918 10.1082 13.2918 9.7665V8.2915C13.2918 7.89984 12.9752 7.58317 12.5835 7.58317H7.92516L8.26683 7.9165C8.5085 8.15817 8.5085 8.55817 8.26683 8.79984C8.14183 8.92484 7.9835 8.98317 7.82516 8.98317C7.66683 8.98317 7.5085 8.92484 7.3835 8.79984L5.97516 7.3915C5.91683 7.33317 5.87516 7.2665 5.84183 7.1915C5.77516 7.0415 5.77516 6.8665 5.84183 6.7165C5.87516 6.6415 5.91683 6.5665 5.97516 6.50817L7.3835 5.09984C7.62516 4.85817 8.02516 4.85817 8.26683 5.09984C8.5085 5.3415 8.5085 5.7415 8.26683 5.98317L7.92516 6.32484H12.5835C13.6668 6.32484 14.5418 7.20817 14.5418 8.28317V9.7665Z"
                fill="#FCFCFD"
              />
            </svg>

            <span className="text-[#fcfcfc] text-base font-medium font-brSonoma leading-tight tracking-tight">
              Swap
            </span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {openModal === "createNGN" || openModal === "createCrypto" ? (
          <SideModalWrapper
            close={closeModal}
            wrapperStyle={
              openModal === "createNGN"
                ? "!bg-primary2"
                : openModal === "createCrypto"
                ? "!bg-raiz-crypto-primary"
                : ""
            }
          >
            {displayScreen()}
          </SideModalWrapper>
        ) : null}
      </AnimatePresence>
      {openModal === "send" && <CryptoSend close={closeModal} />}
      {openModal === "swap" && <CryptoSwap close={closeSwapModal} />}
      {openModal === "selectAcct" && (
        <SelectAccount
          close={() => setOpenModal(null)}
          openNgnModal={openNGNModal}
          openCryptoModal={openCryptoModal}
        />
      )}
    </div>
  );
};

export default CryptoDashboardSummary;
