import Overlay from "@/components/ui/Overlay";
import React from "react";
import Image from "next/image";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateForeignAccountApi } from "@/services/business";
import { toast } from "sonner";
import {
  getInsufficientUsdForForeignAccountMessage,
  hasSufficientUsdForForeignAccount,
} from "@/utils/foreignAccount";
import {
  findWalletByCurrency,
  getApiErrorMessage,
  truncateString,
} from "@/utils/helpers";
import {
  canRequestUsdAccount,
  hasCompletedUsdWallet,
  hasUsdOnboardingRequest,
  isNigerianBusiness,
  isUsdOnboardingPending,
} from "@/utils/onboardingBranch";
import {
  useRequestUsdOnboarding,
  useUsdOnboardingStatus,
} from "@/lib/hooks/useUsdOnboarding";
import { useUser } from "@/lib/hooks/useUser";
import { useSendStore } from "@/store/Send";
import { ForeignCurrency } from "@/types/services";

interface Props {
  close: () => void;
  openNgnModal: () => void;
  openCryptoModal: () => void;
  isNgnBranch?: boolean;
}

const SelectAccount = ({
  close,
  openNgnModal,
  openCryptoModal,
  isNgnBranch = false,
}: Props) => {
  const { user, refetch } = useUser();
  const { actions } = useSendStore();
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const GBPAcct = findWalletByCurrency(user, "GBP");
  const EURAcct = findWalletByCurrency(user, "EUR");
  const CryptoAcct = findWalletByCurrency(user, "SBC");
  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;

  const { data: usdCase } = useUsdOnboardingStatus(user, verificationStatus);
  const requestUsdMutation = useRequestUsdOnboarding({
    onSuccess: () => refetch(),
  });
  const effectiveUsdCase = usdCase ?? requestUsdMutation.data?.data ?? null;
  const usdRequestPending = isUsdOnboardingPending(effectiveUsdCase);
  const hasCompletedUsd = hasCompletedUsdWallet(user);

  const qc = useQueryClient();

  const foreignAccountMutation = useMutation({
    mutationFn: (currency: ForeignCurrency) => CreateForeignAccountApi(currency),
    onSuccess: async (_, currency) => {
      toast.success(`${currency} account created successfully`);
      await qc.invalidateQueries({ queryKey: ["user"] });
      const refreshedUser = await refetch();
      setSelectedCurrency(currency, refreshedUser.data || user);
      actions.selectCurrency(currency);
      close();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create account"));
    },
  });

  const handleNgn = () => {
    if (NGNAcct) {
      setSelectedCurrency("NGN", user);
      actions.selectCurrency("NGN");
      close();
    } else {
      openNgnModal();
    }
  };

  const handleUsd = () => {
    if (USDAcct) {
      setSelectedCurrency("USD", user);
      actions.selectCurrency("USD");
      close();
    } else if (hasUsdOnboardingRequest(effectiveUsdCase)) {
      toast.info(
        "Your USD account request is pending. Our team will contact you to complete verification."
      );
    } else if (
      !canRequestUsdAccount(user, verificationStatus, effectiveUsdCase)
    ) {
      toast.info("USD account request is not available in your current state.");
    } else {
      requestUsdMutation.mutate();
    }
  };

  const handleCrypto = () => {
    if (CryptoAcct) {
      setSelectedCurrency("SBC", user);
      actions.selectCurrency("SBC");
      close();
    } else if (isNgnBranch && !hasCompletedUsd) {
      toast.info(
        usdRequestPending
          ? "Your USD account request is pending. You'll be able to add a crypto wallet once your USD account is ready."
          : "Request a USD account first to unlock crypto wallet features."
      );
    } else {
      openCryptoModal();
    }
  };

  const handleForeign = (currency: ForeignCurrency) => {
    const account = currency === "GBP" ? GBPAcct : EURAcct;
    if (account) {
      setSelectedCurrency(currency, user);
      actions.selectCurrency(currency);
      close();
      return;
    }

    if (!hasCompletedUsd) {
      toast.info(
        usdRequestPending
          ? `Your USD account request is pending. You'll be able to add ${currency} once your USD account is ready.`
          : `You need a USD account before adding ${currency}. Request a USD account first.`
      );
      return;
    }

    if (!USDAcct) {
      toast.warning("Set up your USD account first.");
      return;
    }

    if (!hasSufficientUsdForForeignAccount(user)) {
      toast.warning(getInsufficientUsdForForeignAccountMessage());
      return;
    }

    foreignAccountMutation.mutate(currency);
  };

  const isNigerian = isNigerianBusiness(user);

  const getUsdLabel = () => {
    if (USDAcct) return USDAcct.account_number;
    if (usdRequestPending) return "USD request pending";
    if (requestUsdMutation.isPending) return "Submitting USD request...";
    return "Request USD Account";
  };

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5  text-raiz-gray-950">
        <h4 className="text-lg md:text-xl font-medium md:font-semibold">Select Account</h4>
        <div className="flex flex-col mt-3 md:mt-4">
          {/* USD */}
          <button
            onClick={handleUsd}
            className={`px-3 py-4  justify-between items-center gap-10 rounded-[20px] w-full  inline-flex ${
              selectedCurrency.name === "USD" && USDAcct
                ? "bg-[#eaecff]/60"
                : "bg-white"
            }`}
          >
            <div className="flex gap-3">
              <Image
                src={"/icons/dollar.svg"}
                alt="USD"
                width={32}
                height={32}
                className="size-8 md:size-10 rounded-full"
              />
              <div className="flex flex-col items-start">
                <p className="text-raiz-gray-900 text-sm md:text-base font-medium font-brSonoma leading-tight">
                  {getUsdLabel()}
                </p>
                <p className="opacity-50 text-raiz-gray-950 text-xs md:text-[13px] font-normal  leading-tight">
                  {USDAcct?.wallet_type.wallet_type_name || "USD Account"}
                </p>
              </div>
            </div>
            {USDAcct && selectedCurrency.name === "USD" && USDAcct && (
              <Image
                src={"/icons/tick-circle.svg"}
                alt=""
                width={24}
                height={24}
              />
            )}
          </button>

          {/* NGN */}
          {isNigerian && (
            <button
              onClick={handleNgn}
              className={`px-3 py-4  justify-between items-center gap-10 w-full rounded-[20px]  inline-flex ${
                selectedCurrency.name === "NGN" && NGNAcct
                  ? "bg-[#eaecff]/60"
                  : "bg-white"
              }`}
            >
              <div className="flex gap-3">
                <Image
                  src={"/icons/ngn.svg"}
                  alt="NGN"
                  width={32}
                  height={32}
                  className="size-8 md:size-10 rounded-full"
                />
                <div className="flex flex-col items-start">
                  <p className="text-raiz-gray-900 text-sm md:text-base font-medium font-brSonoma leading-tight">
                    {NGNAcct ? NGNAcct.account_number : "Get NGN Account"}
                  </p>
                  <p className="opacity-50 text-raiz-gray-950 text-xs md:text-[13px] font-normal  leading-tight">
                    {NGNAcct?.wallet_type.wallet_type_name || "NGN Account"}
                  </p>
                </div>
              </div>
              {selectedCurrency.name === "NGN" && NGNAcct && (
                <Image
                  src={"/icons/tick-circle.svg"}
                  alt="USD"
                  width={24}
                  height={24}
                />
              )}
            </button>
          )}
        {/* GBP */}
          <button
            onClick={() => handleForeign("GBP")}
            className={`px-3 py-4 justify-between items-center gap-10 w-full rounded-[20px] inline-flex ${
              selectedCurrency.name === "GBP" && GBPAcct
                ? "bg-[#eaecff]/60"
                : "bg-white"
            }`}
          >
            <div className="flex gap-3">
              <Image
                src={"/icons/pounds.svg"}
                alt="GBP" 
                width={32}
                height={32}
                className="size-8 md:size-10 rounded-full"
              />
              <div className="flex flex-col items-start">
                <p className="text-raiz-gray-900 text-sm md:text-base font-medium font-brSonoma leading-tight">
                  {GBPAcct
                    ? GBPAcct.account_number || GBPAcct.iban || "GBP Account"
                    : foreignAccountMutation.isPending &&
                        foreignAccountMutation.variables === "GBP"
                      ? "Creating your GBP account..."
                      : "Get GBP Account"}
                </p>
                <p className="opacity-50 text-raiz-gray-950 text-xs md:text-[13px] font-normal leading-tight">
                  {GBPAcct?.wallet_type.wallet_type_name || "GBP Account"}
                </p>
              </div>
            </div>
            {selectedCurrency.name === "GBP" && GBPAcct && (
              <Image
                src={"/icons/tick-circle.svg"}
                alt=""
                width={24}
                height={24}
              />
            )}
          </button>

          {/* EUR */}
          <button
            onClick={() => handleForeign("EUR")}
            className={`px-3 py-4 justify-between items-center gap-10 w-full rounded-[20px] inline-flex ${
              selectedCurrency.name === "EUR" && EURAcct
                ? "bg-[#eaecff]/60"
                : "bg-white"
            }`}
          >
            <div className="flex gap-3">
              <Image
                src={"/icons/euro.svg"}
                alt="EUR"
                width={32}
                height={32}
                className="size-8 md:size-10 rounded-full"
              />
              <div className="flex flex-col items-start">
                <p className="text-raiz-gray-900 text-sm md:text-base font-medium font-brSonoma leading-tight">
                  {EURAcct
                    ? EURAcct.iban || EURAcct.account_number || "EUR Account"
                    : foreignAccountMutation.isPending &&
                        foreignAccountMutation.variables === "EUR"
                      ? "Creating your EUR account..."
                      : "Get EUR Account"}
                </p>
                <p className="opacity-50 text-raiz-gray-950 text-xs md:text-[13px] font-normal leading-tight">
                  {EURAcct?.wallet_type.wallet_type_name || "EUR Account"}
                </p>
              </div>
            </div>
            {selectedCurrency.name === "EUR" && EURAcct && (
              <Image
                src={"/icons/tick-circle.svg"}
                alt=""
                width={24}
                height={24}
              />
            )}
          </button>
  {/* Crypto */}
          <button
            onClick={handleCrypto}
            className={`px-3 py-4  justify-between items-center gap-10 w-full rounded-[20px]  inline-flex ${
              selectedCurrency.name === "SBC" && CryptoAcct
                ? "bg-[#eaecff]/60"
                : "bg-white"
            }`}
          >
            <div className="flex gap-3">
              <Image
                src={"/icons/usd-coin.svg"}
                alt=""
                width={32}
                height={32}
                className="size-8 md:size-10 rounded-full"
              />
              <div className="flex flex-col items-start">
                <p className="text-raiz-gray-900 text-sm md:text-base font-medium font-brSonoma leading-tight">
                  {CryptoAcct
                    ? truncateString(CryptoAcct?.account_number, 20)
                    : "Get USDC & USDT Wallet"}
                </p>
                <p className="opacity-50 text-raiz-gray-950 text-xs md:text-[13px] font-normal  leading-tight">
                  {CryptoAcct?.wallet_type.wallet_type_name || "Crypto Wallet"}
                </p>
              </div>
            </div>
            {selectedCurrency.name === "SBC" && CryptoAcct && (
              <Image
                src={"/icons/tick-circle.svg"}
                alt=""
                width={24}
                height={24}
              />
            )}
          </button>
        </div>
      </div>
    </Overlay>
  );
};

export default SelectAccount;
