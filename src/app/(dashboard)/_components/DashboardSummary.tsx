"use client";
import React, { useEffect, useState } from "react";
// import SalesReport from "./SalesReport";
import SideModalWrapper from "./SideModalWrapper";
import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import NgnSend from "./send/naira/NgnSend";
import UsdSend from "./send/usd/UsdSend";
import Button from "@/components/ui/Button";
import { determineSwapPair, findWalletByCurrency } from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";
import Request from "./request/Request";
import { useSendStore } from "@/store/Send";
import { useUserStore } from "@/store/useUserStore";
import { toast } from "sonner";
import Swap from "./swap/Swap";
import { useSwapStore } from "@/store/Swap";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import { usePathname } from "next/navigation";
import SelectAccount from "./SelectAccount";
import CreateNgnAcct from "./createNgnAcct/CreateNgnAcct";
import CreateCryptoWallet from "./crypto/dashboard/CreateCryptoWallet";
import TopUp from "./topUp/TopUp";
import Infos from "./Infos";
import NGNAcctInfo from "./acctInfo/NGNAcctInfo";
import USDAcctInfo from "./acctInfo/USDAcctInfo";
import DashboardAnalytics from "./charts/DashboardAnalytics";
import UsdTopUp from "./topUp/UsdTopup/UsdTopUp";
import { useTopupStore } from "@/store/TopUp";
import { CurrencyTypeKey } from "@/store/Swap/swapSlice.types";
import AccountUpgrade from "./AccountUpgrade";
import Loading from "@/app/loading";
import ExchangeRateCard from "./exchangeRate/ExchangeRateCard";
// import NgnSuccessModal from "./createNgnAcct/NgnSuccessModal";

const DashboardSummary = () => {
  const { user, refetch, isLoading } = useUser();
  const walletData = user?.business_account?.wallets;
  const { currency, actions: sendActions } = useSendStore();
  const { actions } = useSwapStore();
  const { actions: topupActions } = useTopupStore();
  const { setShowBalance, showBalance } = useUserStore();
  const { selectedCurrency } = useCurrencyStore();
  const [openModal, setOpenModal] = useState<
    | "send"
    | "request"
    | "swap"
    | "topUp"
    | "selectAcct"
    | "createNGN"
    | "createCrypto"
    | null
  >(null);
  const [showAcctInfo, setShowAcctInfo] = useState(false);
  const pathName = usePathname();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;

  // const currentWallet = useMemo(() => {
  //   if (!user || !user?.business_account?.wallets || !selectedCurrency?.name)
  //     return null;
  //   return user?.business_account?.wallets.find(
  //     (wallet) => wallet.wallet_type.currency === selectedCurrency.name
  //   );
  // }, [user, selectedCurrency]);

  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    }
  };

  const currentWallet = getCurrentWallet();

  const closeModal = () => {
    setOpenModal(null);
    sendActions.reset(selectedCurrency.name);
    topupActions.reset();
  };

  const closeSwapModal = () => {
    setOpenModal(null);
    actions.reset();
  };

  const canSwap = NGNAcct && USDAcct;

  // console.log("cuteenqwallet", currentWallet);

  const handleActionButton = (action: "send" | "request" | "topUp") => {
    if (!currentWallet) {
      toast.warning(
        "You do not have a wallet for this currency. Create one first!",
      );
    } else {
      setOpenModal(action);
    }
  };

  const handleSwapClick = () => {
    if (!walletData || walletData.length < 2) {
      toast.warning("You need at least two wallets to use swap");
      return;
    }

    // Determine the appropriate swap pair based on current currency
    const swapPair = determineSwapPair(
      selectedCurrency.name as CurrencyTypeKey,
      walletData,
    );

    if (!swapPair.isValid) {
      toast.warning(swapPair.message || "Cannot perform this swap");
      return;
    }

    // Use the combined store's validation
    const success = actions.switchSwapWallet(swapPair.toCurrency, walletData);

    if (success) {
      setOpenModal("swap");
    } else {
      toast.error("This swap pair is not allowed. Please swap through USD.");
    }
  };

  const openNGNModal = () => {
    setOpenModal("createNGN");
  };

  const openCryptoModal = () => {
    setOpenModal("createCrypto");
  };

  const displayScreen = () => {
    switch (openModal) {
      case "send":
        return currency === "NGN" ? (
          <NgnSend />
        ) : (
          <UsdSend close={closeModal} />
        );
      case "request":
        return <Request close={closeModal} />;
      case "swap":
        return <Swap close={closeSwapModal} />;
      case "topUp":
        return currency === "NGN" && <TopUp close={closeModal} />;
      // ) : (
      //   <UsdTopUp close={closeModal} />
      // );
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

  const actionBtnsOpts = [
    {
      name: "Top up",
      key: "topUp",
      icon: () => (
        <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
          <path
            d="M10.4998 1.6665C5.90817 1.6665 2.1665 5.40817 2.1665 9.99984C2.1665 14.5915 5.90817 18.3332 10.4998 18.3332C15.0915 18.3332 18.8332 14.5915 18.8332 9.99984C18.8332 5.40817 15.0915 1.6665 10.4998 1.6665ZM13.8332 10.6248H11.1248V13.3332C11.1248 13.6748 10.8415 13.9582 10.4998 13.9582C10.1582 13.9582 9.87484 13.6748 9.87484 13.3332V10.6248H7.1665C6.82484 10.6248 6.5415 10.3415 6.5415 9.99984C6.5415 9.65817 6.82484 9.37484 7.1665 9.37484H9.87484V6.6665C9.87484 6.32484 10.1582 6.0415 10.4998 6.0415C10.8415 6.0415 11.1248 6.32484 11.1248 6.6665V9.37484H13.8332C14.1748 9.37484 14.4582 9.65817 14.4582 9.99984C14.4582 10.3415 14.1748 10.6248 13.8332 10.6248Z"
            className="fill-[#1e1924] group-hover:fill-white transition-colors duration-200"
          />
        </svg>
      ),
    },
    {
      name: "Send",
      key: "send",
      icon: () => (
        <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
          <path
            d="M13.7836 2.4667L6.25859 4.9667C1.20026 6.65837 1.20026 9.4167 6.25859 11.1L8.49193 11.8417L9.23359 14.075C10.9169 19.1334 13.6836 19.1334 15.3669 14.075L17.8753 6.55837C18.9919 3.18337 17.1586 1.3417 13.7836 2.4667ZM14.0503 6.95004L10.8836 10.1334C10.7586 10.2584 10.6003 10.3167 10.4419 10.3167C10.2836 10.3167 10.1253 10.2584 10.0003 10.1334C9.75859 9.8917 9.75859 9.4917 10.0003 9.25004L13.1669 6.0667C13.4086 5.82504 13.8086 5.82504 14.0503 6.0667C14.2919 6.30837 14.2919 6.70837 14.0503 6.95004Z"
            className="fill-[#1e1924] group-hover:fill-white transition-colors duration-200"
          />
        </svg>
      ),
    },
    {
      name: "Request",
      key: "request",
      icon: () => (
        <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
          <path
            d="M4.66683 11.6665C2.82516 11.6665 1.3335 13.1582 1.3335 14.9998C1.3335 16.8415 2.82516 18.3332 4.66683 18.3332C6.5085 18.3332 8.00016 16.8415 8.00016 14.9998C8.00016 13.1582 6.5085 11.6665 4.66683 11.6665ZM5.50016 14.7332C5.50016 15.2415 5.22516 15.7248 4.79183 15.9832L4.1585 16.3665C4.0585 16.4332 3.94183 16.4582 3.8335 16.4582C3.62516 16.4582 3.41683 16.3498 3.30016 16.1582C3.12516 15.8665 3.21683 15.4748 3.51683 15.2998L4.15016 14.9165C4.2085 14.8832 4.25016 14.8082 4.25016 14.7415V13.9665C4.25016 13.6165 4.5335 13.3332 4.87516 13.3332C5.21683 13.3332 5.50016 13.6165 5.50016 13.9582V14.7332Z"
            className="fill-[#1e1924] group-hover:fill-white transition-colors duration-200"
          />
          <path
            d="M14.6665 3.3335H6.33317C3.83317 3.3335 2.1665 4.5835 2.1665 7.50016V10.4668C2.1665 10.7752 2.48317 10.9668 2.75817 10.8418C3.57484 10.4668 4.5165 10.3252 5.50817 10.5002C7.69984 10.8918 9.30817 12.9252 9.24984 15.1502C9.2415 15.5002 9.1915 15.8418 9.09984 16.1752C9.03317 16.4335 9.2415 16.6752 9.50817 16.6752H14.6665C17.1665 16.6752 18.8332 15.4252 18.8332 12.5085V7.50016C18.8332 4.5835 17.1665 3.3335 14.6665 3.3335ZM10.4998 12.0835C9.34984 12.0835 8.4165 11.1502 8.4165 10.0002C8.4165 8.85016 9.34984 7.91683 10.4998 7.91683C11.6498 7.91683 12.5832 8.85016 12.5832 10.0002C12.5832 11.1502 11.6498 12.0835 10.4998 12.0835ZM16.5415 11.6668C16.5415 12.0085 16.2582 12.2918 15.9165 12.2918C15.5748 12.2918 15.2915 12.0085 15.2915 11.6668V8.3335C15.2915 7.99183 15.5748 7.7085 15.9165 7.7085C16.2582 7.7085 16.5415 7.99183 16.5415 8.3335V11.6668Z"
            className="fill-[#1e1924] group-hover:fill-white transition-colors duration-200"
          />
        </svg>
      ),
    },
    {
      name: "Swap",
      key: "swap",
      icon: () => (
        <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
          <path
            d="M10.1668 1.6665C5.56683 1.6665 1.8335 5.39984 1.8335 9.99984C1.8335 14.5998 5.56683 18.3332 10.1668 18.3332C14.7668 18.3332 18.5002 14.5998 18.5002 9.99984C18.5002 5.39984 14.7668 1.6665 10.1668 1.6665ZM14.4918 13.2832C14.4585 13.3582 14.4168 13.4248 14.3585 13.4832L12.9502 14.8915C12.8252 15.0165 12.6668 15.0748 12.5085 15.0748C12.3502 15.0748 12.1918 15.0165 12.0668 14.8915C11.8252 14.6498 11.8252 14.2498 12.0668 14.0082L12.4085 13.6665H7.75016C6.66683 13.6665 5.79183 12.7832 5.79183 11.7082V10.2332C5.79183 9.8915 6.07516 9.60817 6.41683 9.60817C6.7585 9.60817 7.04183 9.8915 7.04183 10.2332V11.7082C7.04183 12.0998 7.3585 12.4165 7.75016 12.4165H12.4085L12.0668 12.0748C11.8252 11.8332 11.8252 11.4332 12.0668 11.1915C12.3085 10.9498 12.7085 10.9498 12.9502 11.1915L14.3585 12.5998C14.4168 12.6582 14.4585 12.7248 14.4918 12.7998C14.5585 12.9582 14.5585 13.1332 14.4918 13.2832ZM14.5418 9.7665C14.5418 10.1082 14.2585 10.3915 13.9168 10.3915C13.5752 10.3915 13.2918 10.1082 13.2918 9.7665V8.2915C13.2918 7.89984 12.9752 7.58317 12.5835 7.58317H7.92516L8.26683 7.9165C8.5085 8.15817 8.5085 8.55817 8.26683 8.79984C8.14183 8.92484 7.9835 8.98317 7.82516 8.98317C7.66683 8.98317 7.5085 8.92484 7.3835 8.79984L5.97516 7.3915C5.91683 7.33317 5.87516 7.2665 5.84183 7.1915C5.77516 7.0415 5.77516 6.8665 5.84183 6.7165C5.87516 6.6415 5.91683 6.5665 5.97516 6.50817L7.3835 5.09984C7.62516 4.85817 8.02516 4.85817 8.26683 5.09984C8.5085 5.3415 8.5085 5.7415 8.26683 5.98317L7.92516 6.32484H12.5835C13.6668 6.32484 14.5418 7.20817 14.5418 8.28317V9.7665Z"
            className="fill-[#1e1924] group-hover:fill-white transition-colors duration-200"
          />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    refetch();
  }, [pathName, refetch]);

  return (
    <div className="w-full">
      {/* Accts */}
      {/* <div className="flex items-center justify-between mb-6">
        <h2 className="text-raiz-gray-950 text-2xl  font-bold leading-7">
          {currentWallet
            ? `${currentWallet?.wallet_type.currency} Account`
            : "Account"}
        </h2>
        <button
          onClick={() => setOpenModal("selectAcct")}
          className="px-3 py-1 bg-violet-100/60 rounded-3xl inline-flex justify-center items-center gap-2"
        >
          <span className=" text-zinc-700 text-sm font-semibold font-brSonoma leading-tight">
            Switch Account
          </span>
          <Image
            src={"/icons/arrow-down.svg"}
            width={18}
            height={18}
            alt="arrow down"
          />
        </button>
      </div> */}
      {/* Balance & Send etc */}
      <div className="flex justify-between items-center gap-4 ">
        {/* <div className="gap-2 flex flex-col">
          <p className="text-text-terttiary-600   font-normal font-inter leading-normal">
            Total Balance
          </p>
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
          {currentWallet && (
            <div className="flex gap-2 items-center ">
              <span>{currentWallet?.account_number}</span>
              <button
                title="Click to see account info"
                onClick={() => setShowAcctInfo(true)}
              >
                <Image
                  src={"/icons/info-circle.svg"}
                  alt="account info"
                  width={18}
                  height={18}
                />
              </button>
            </div>
          )}
        </div> */}
        <h1 className="text-raiz-gray-950 text-2xl font-semibold leading-7">
          Hi, {user?.first_name} 👋🏾{" "}
        </h1>
        <div className="flex gap-4 items-center">
          {actionBtnsOpts.map(({ name, key, icon }) => {
            const isSwap = key === "swap";
            return (
              <Button
                key={key}
                onClick={() => {
                  if (isSwap) {
                    handleSwapClick();
                  } else {
                    handleActionButton(key as "send" | "request" | "topUp");
                  }
                }}
                className={`h-10  px-[18px] min-w-[105px] ${key === "topUp" ? "!w-[127px]" : ""} py-2 group !bg-[#F8F7FA] hover:!bg-raiz-usd-primary  transition-all !text-raiz-gray-900  !rounded-3xl justify-center  items-center gap-1.5 inline-flex`}
              >
                {icon()}
                <span className="group-hover:!text-[#fcfcfc] text-sm xl:text-base whitespace-nowrap font-medium font-brSonoma leading-tight tracking-tight">
                  {name}
                </span>
              </Button>
            );
          })}
          {/* <Button
            onClick={() => handleActionButton("topUp")}
            className="h-10  px-[18px] py-2 group bg-[#F8F7FA] text-raiz-gray-900  rounded-3xl justify-center items-center gap-1.5 inline-flex"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
              <path
                d="M10.4998 1.6665C5.90817 1.6665 2.1665 5.40817 2.1665 9.99984C2.1665 14.5915 5.90817 18.3332 10.4998 18.3332C15.0915 18.3332 18.8332 14.5915 18.8332 9.99984C18.8332 5.40817 15.0915 1.6665 10.4998 1.6665ZM13.8332 10.6248H11.1248V13.3332C11.1248 13.6748 10.8415 13.9582 10.4998 13.9582C10.1582 13.9582 9.87484 13.6748 9.87484 13.3332V10.6248H7.1665C6.82484 10.6248 6.5415 10.3415 6.5415 9.99984C6.5415 9.65817 6.82484 9.37484 7.1665 9.37484H9.87484V6.6665C9.87484 6.32484 10.1582 6.0415 10.4998 6.0415C10.8415 6.0415 11.1248 6.32484 11.1248 6.6665V9.37484H13.8332C14.1748 9.37484 14.4582 9.65817 14.4582 9.99984C14.4582 10.3415 14.1748 10.6248 13.8332 10.6248Z"
                fill="#FDFDFD"
              />
            </svg>
            <span className="group-hover:text-[#fcfcfc] text-sm xl:text-base font-medium font-brSonoma leading-tight tracking-tight">
              Top Up
            </span>
          </Button>
          <Button
            onClick={() => handleActionButton("send")}
            className="h-10 w-[102px] px-[18px] py-2 bg-[#F8F7FA] text-raiz-gray-900  rounded-3xl justify-center items-center gap-1.5 inline-flex"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
              <path
                d="M13.7836 2.4667L6.25859 4.9667C1.20026 6.65837 1.20026 9.4167 6.25859 11.1L8.49193 11.8417L9.23359 14.075C10.9169 19.1334 13.6836 19.1334 15.3669 14.075L17.8753 6.55837C18.9919 3.18337 17.1586 1.3417 13.7836 2.4667ZM14.0503 6.95004L10.8836 10.1334C10.7586 10.2584 10.6003 10.3167 10.4419 10.3167C10.2836 10.3167 10.1253 10.2584 10.0003 10.1334C9.75859 9.8917 9.75859 9.4917 10.0003 9.25004L13.1669 6.0667C13.4086 5.82504 13.8086 5.82504 14.0503 6.0667C14.2919 6.30837 14.2919 6.70837 14.0503 6.95004Z"
                fill="#1e1924"
              />
            </svg>
            <span className=" lg:text-sm xl:text-base font-medium font-brSonoma leading-tight tracking-tight">
              Send
            </span>
          </Button>
          <Button
            onClick={() => handleActionButton("request")}
            className="h-10 w-[127px]  px-[18px] py-2 bg-[#F8F7FA] text-raiz-gray-900   rounded-3xl justify-center items-center gap-1.5 inline-flex"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
              <path
                d="M4.66683 11.6665C2.82516 11.6665 1.3335 13.1582 1.3335 14.9998C1.3335 16.8415 2.82516 18.3332 4.66683 18.3332C6.5085 18.3332 8.00016 16.8415 8.00016 14.9998C8.00016 13.1582 6.5085 11.6665 4.66683 11.6665ZM5.50016 14.7332C5.50016 15.2415 5.22516 15.7248 4.79183 15.9832L4.1585 16.3665C4.0585 16.4332 3.94183 16.4582 3.8335 16.4582C3.62516 16.4582 3.41683 16.3498 3.30016 16.1582C3.12516 15.8665 3.21683 15.4748 3.51683 15.2998L4.15016 14.9165C4.2085 14.8832 4.25016 14.8082 4.25016 14.7415V13.9665C4.25016 13.6165 4.5335 13.3332 4.87516 13.3332C5.21683 13.3332 5.50016 13.6165 5.50016 13.9582V14.7332Z"
                fill="#1e1924"
              />
              <path
                d="M14.6665 3.3335H6.33317C3.83317 3.3335 2.1665 4.5835 2.1665 7.50016V10.4668C2.1665 10.7752 2.48317 10.9668 2.75817 10.8418C3.57484 10.4668 4.5165 10.3252 5.50817 10.5002C7.69984 10.8918 9.30817 12.9252 9.24984 15.1502C9.2415 15.5002 9.1915 15.8418 9.09984 16.1752C9.03317 16.4335 9.2415 16.6752 9.50817 16.6752H14.6665C17.1665 16.6752 18.8332 15.4252 18.8332 12.5085V7.50016C18.8332 4.5835 17.1665 3.3335 14.6665 3.3335ZM10.4998 12.0835C9.34984 12.0835 8.4165 11.1502 8.4165 10.0002C8.4165 8.85016 9.34984 7.91683 10.4998 7.91683C11.6498 7.91683 12.5832 8.85016 12.5832 10.0002C12.5832 11.1502 11.6498 12.0835 10.4998 12.0835ZM16.5415 11.6668C16.5415 12.0085 16.2582 12.2918 15.9165 12.2918C15.5748 12.2918 15.2915 12.0085 15.2915 11.6668V8.3335C15.2915 7.99183 15.5748 7.7085 15.9165 7.7085C16.2582 7.7085 16.5415 7.99183 16.5415 8.3335V11.6668Z"
                fill="#1e1924"
              />
            </svg>
            <span className=" lg:text-sm xl:text-base font-medium font-brSonoma leading-tight tracking-tight">
              Request
            </span>
          </Button> */}
          {/* <Button
            onClick={handleSwapClick}
            className="h-10 w-[105px] bg-[#F8F7FA] text-raiz-gray-900  px-[18px] py-2  rounded-3xl justify-center items-center gap-1.5 inline-flex"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none">
              <path
                d="M10.1668 1.6665C5.56683 1.6665 1.8335 5.39984 1.8335 9.99984C1.8335 14.5998 5.56683 18.3332 10.1668 18.3332C14.7668 18.3332 18.5002 14.5998 18.5002 9.99984C18.5002 5.39984 14.7668 1.6665 10.1668 1.6665ZM14.4918 13.2832C14.4585 13.3582 14.4168 13.4248 14.3585 13.4832L12.9502 14.8915C12.8252 15.0165 12.6668 15.0748 12.5085 15.0748C12.3502 15.0748 12.1918 15.0165 12.0668 14.8915C11.8252 14.6498 11.8252 14.2498 12.0668 14.0082L12.4085 13.6665H7.75016C6.66683 13.6665 5.79183 12.7832 5.79183 11.7082V10.2332C5.79183 9.8915 6.07516 9.60817 6.41683 9.60817C6.7585 9.60817 7.04183 9.8915 7.04183 10.2332V11.7082C7.04183 12.0998 7.3585 12.4165 7.75016 12.4165H12.4085L12.0668 12.0748C11.8252 11.8332 11.8252 11.4332 12.0668 11.1915C12.3085 10.9498 12.7085 10.9498 12.9502 11.1915L14.3585 12.5998C14.4168 12.6582 14.4585 12.7248 14.4918 12.7998C14.5585 12.9582 14.5585 13.1332 14.4918 13.2832ZM14.5418 9.7665C14.5418 10.1082 14.2585 10.3915 13.9168 10.3915C13.5752 10.3915 13.2918 10.1082 13.2918 9.7665V8.2915C13.2918 7.89984 12.9752 7.58317 12.5835 7.58317H7.92516L8.26683 7.9165C8.5085 8.15817 8.5085 8.55817 8.26683 8.79984C8.14183 8.92484 7.9835 8.98317 7.82516 8.98317C7.66683 8.98317 7.5085 8.92484 7.3835 8.79984L5.97516 7.3915C5.91683 7.33317 5.87516 7.2665 5.84183 7.1915C5.77516 7.0415 5.77516 6.8665 5.84183 6.7165C5.87516 6.6415 5.91683 6.5665 5.97516 6.50817L7.3835 5.09984C7.62516 4.85817 8.02516 4.85817 8.26683 5.09984C8.5085 5.3415 8.5085 5.7415 8.26683 5.98317L7.92516 6.32484H12.5835C13.6668 6.32484 14.5418 7.20817 14.5418 8.28317V9.7665Z"
                fill="#1e1924"
              />
            </svg>
            <span className=" lg:text-sm xl:text-base font-medium font-brSonoma leading-tight tracking-tight">
              Swap
            </span>
          </Button> */}
        </div>
      </div>

      {/* <CustomersInfo /> */}

      {isLoading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <Loading />
        </div>
      ) : verificationStatus !== "completed" ? (
        <AccountUpgrade />
      ) : (
        <>
          <Infos />
          <div className="flex justify-between gap-8 mt-8">
            <DashboardAnalytics />
            <ExchangeRateCard />
          </div>
        </>
      )}

      {/* <SalesReport /> */}

      <AnimatePresence>
        {openModal !== null &&
        openModal !== "selectAcct" &&
        (openModal !== "topUp" || currency === "NGN") ? (
          <SideModalWrapper
            close={closeModal}
            wrapperStyle={
              openModal === "request"
                ? "!p-0"
                : openModal === "createNGN"
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
      {openModal === "selectAcct" && (
        <SelectAccount
          close={() => setOpenModal(null)}
          openNgnModal={openNGNModal}
          openCryptoModal={openCryptoModal}
        />
      )}
      {openModal === "topUp" && currency !== "NGN" && (
        <UsdTopUp close={closeModal} />
      )}
      {showAcctInfo && selectedCurrency ? (
        selectedCurrency.name === "NGN" ? (
          <NGNAcctInfo close={() => setShowAcctInfo(false)} />
        ) : (
          <USDAcctInfo close={() => setShowAcctInfo(false)} />
        )
      ) : null}
      {/* {successful && <NgnSuccessModal close={() => setSuccessful(false)} />} */}
    </div>
  );
};

export default DashboardSummary;
