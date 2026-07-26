"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Radio from "@/components/ui/Radio";
import { useUser } from "@/lib/hooks/useUser";
import { UpdateGatewayDefaultWalletApi } from "@/services/business";
import { GetExchangeRate } from "@/services/transactions";
import { GatewayCreditCurrency, IWallet } from "@/types/user";
import { findWalletByCurrency } from "@/utils/helpers";

const isWalletCompleted = (wallet: IWallet | undefined) =>
  wallet?.wallet_status === "completed";

const maskAccountNumber = (accountNumber: string) => {
  if (!accountNumber || accountNumber.length <= 4) return accountNumber;
  return `****${accountNumber.slice(-4)}`;
};

const InfoBannerIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <g clipPath="url(#clip0_settlement_info)">
      <rect width="48" height="48" rx="24" fill="#FCFCFD" />
      <path
        d="M4 0.333008H44C46.025 0.333008 47.667 1.97496 47.667 4V44C47.667 46.025 46.025 47.667 44 47.667H4C1.97496 47.667 0.333008 46.025 0.333008 44V4C0.333008 1.97496 1.97496 0.333008 4 0.333008Z"
        stroke="black"
        strokeOpacity="0.08"
        strokeWidth="0.666667"
      />
      <path
        opacity="0.35"
        d="M24.0001 37.3333C31.3639 37.3333 37.3334 31.3638 37.3334 24C37.3334 16.6362 31.3639 10.6667 24.0001 10.6667C16.6363 10.6667 10.6667 16.6362 10.6667 24C10.6667 31.3638 16.6363 37.3333 24.0001 37.3333Z"
        fill="#39A062"
      />
      <path
        d="M22.6667 30.6667V24C22.6667 23.264 23.2641 22.6667 24.0001 22.6667C24.7361 22.6667 25.3334 23.264 25.3334 24V30.6667C25.3334 31.4027 24.7361 32 24.0001 32C23.2641 32 22.6667 31.4027 22.6667 30.6667Z"
        fill="#39A062"
      />
      <path
        d="M24 20C25.1046 20 26 19.1046 26 18C26 16.8954 25.1046 16 24 16C22.8954 16 22 16.8954 22 18C22 19.1046 22.8954 20 24 20Z"
        fill="#39A062"
      />
    </g>
    <defs>
      <clipPath id="clip0_settlement_info">
        <rect width="48" height="48" rx="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

interface SettlementOptionProps {
  currency: GatewayCreditCurrency;
  title: string;
  description: string;
  iconSrc: string;
  selected: boolean;
  disabled: boolean;
  unavailableMessage?: string;
  onSelect: () => void;
}

const SettlementOption = ({
  currency,
  title,
  description,
  iconSrc,
  selected,
  disabled,
  unavailableMessage,
  onSelect,
}: SettlementOptionProps) => (
  <div
    role="button"
    tabIndex={disabled ? -1 : 0}
    onClick={() => {
      if (!disabled) onSelect();
    }}
    onKeyDown={(event) => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect();
      }
    }}
    className={`border rounded-[20px] flex flex-col relative p-4 transition-colors ${
      disabled
        ? "border-raiz-gray-200 opacity-60 cursor-not-allowed"
        : selected
          ? "border-[#7F56D9] cursor-pointer"
          : "border-[#E4E0EA] cursor-pointer hover:border-indigo-900"
    }`}
  >
    <Radio
      checked={selected}
      onChange={onSelect}
      readOnly={disabled}
      className="absolute top-4 right-4"
      checkedColor="#7F56D9"
    />
    <div className="flex items-start gap-3 pr-8">
      <Image
        src={iconSrc}
        alt={currency}
        width={40}
        height={40}
        className="size-10 rounded-full shrink-0"
      />
      <div className="flex flex-col gap-1">
        <p className="text-raiz-gray-950 text-sm font-bold leading-tight">
          {title}
        </p>
        <p className="text-raiz-gray-600 text-xs leading-tight">{description}</p>
        {disabled && unavailableMessage && (
          <p className="text-raiz-gray-500 text-xs leading-tight mt-1">
            {unavailableMessage}
          </p>
        )}
      </div>
    </div>
  </div>
);

interface AccountDetailProps {
  label: string;
  value: string;
}

const AccountDetail = ({ label, value }: AccountDetailProps) => (
  <div className="flex flex-col gap-1 min-w-0">
    <span className="text-raiz-gray-500 text-xs font-normal">{label}</span>
    <span className="text-raiz-gray-950 text-sm font-bold truncate">{value}</span>
  </div>
);

const SettlementSettings = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const savedCurrency =
    user?.business_account?.gateway_default_credit_currency ?? "USD";

  const [selectedCurrency, setSelectedCurrency] =
    useState<GatewayCreditCurrency>(savedCurrency);

  useEffect(() => {
    setSelectedCurrency(savedCurrency);
  }, [savedCurrency]);

  const ngnWallet = findWalletByCurrency(user, "NGN");
  const usdWallet = findWalletByCurrency(user, "USD");
  const ngnEligible = isWalletCompleted(ngnWallet);
  const usdEligible = isWalletCompleted(usdWallet);
  const isPrimary = user?.is_primary ?? false;

  const selectedWallet =
    selectedCurrency === "NGN" ? ngnWallet : usdWallet;
  const selectedWalletEligible =
    selectedCurrency === "NGN" ? ngnEligible : usdEligible;

  const achRouting = usdWallet?.routing?.find(
    (route) => route.routing_type_name === "ACH"
  )?.routing;

  const { data: exchangeRateData } = useQuery({
    queryKey: ["exchange-rate", "NGN"],
    queryFn: () => GetExchangeRate("NGN"),
    staleTime: 1000 * 60,
    enabled: selectedCurrency === "USD",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: UpdateGatewayDefaultWalletApi,
    onSuccess: (response) => {
      toast.success(
        response.message || "Gateway default wallet updated successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const hasChanges = selectedCurrency !== savedCurrency;
  const canSave =
    isPrimary &&
    hasChanges &&
    selectedWalletEligible &&
    !isPending;

  const handleSave = () => {
    if (!canSave) return;
    mutate({ currency: selectedCurrency });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FFF3E666]">
        <InfoBannerIcon />
        <div className="flex flex-col gap-0.5 mt-0.5">
          <h4 className="text-raiz-gray-900 text-sm font-bold leading-tight">
            Manage Settlement currency
          </h4>
          <p className="text-raiz-gray-600 text-sm leading-tight">
            Your settlement currency determines how PalmPay payments are
            deposited. You can change this at any time.
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 bg-white rounded-[20px] border border-raiz-gray-100 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-raiz-gray-950 text-base font-bold">
            Settlement Account
          </h3>
          <p className="text-raiz-gray-600 text-sm">
            Choose which bank account receives your PalmPay payments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettlementOption
            currency="NGN"
            title="NGN Account"
            description="Receive payments directly in Naira. No currency conversion."
            iconSrc="/icons/ngn.svg"
            selected={selectedCurrency === "NGN"}
            disabled={!ngnEligible}
            unavailableMessage="Create a completed NGN wallet before selecting this option."
            onSelect={() => setSelectedCurrency("NGN")}
          />
          <SettlementOption
            currency="USD"
            title="USD Account"
            description="Payments in Naira are automatically converted to USD at the current exchange rate."
            iconSrc="/icons/dollar.svg"
            selected={selectedCurrency === "USD"}
            disabled={!usdEligible}
            unavailableMessage="Create a completed USD wallet before selecting this option."
            onSelect={() => setSelectedCurrency("USD")}
          />
        </div>

        {selectedWalletEligible && selectedWallet && (
          <div className="flex flex-col gap-3">
            <h4 className="text-raiz-gray-950 text-sm font-bold">
              Your Raiz {selectedCurrency} Account
            </h4>
            <div className="border border-raiz-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AccountDetail
                label="Bank Name"
                value={selectedWallet.bank_name || "—"}
              />
              <AccountDetail
                label="Account Number"
                value={
                  selectedWallet.account_number || "—"
                }
              />
              <AccountDetail
                label="Account Name"
                value={
                  selectedWallet.account_name ||
                  user?.business_account?.business_name ||
                  "—"
                }
              />
              {selectedCurrency === "USD" && achRouting && (
                <AccountDetail label="Routing Number" value={achRouting} />
              )}
            </div>
          </div>
        )}

        {selectedCurrency === "USD" && exchangeRateData?.sell_rate && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFF3E666]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 mt-0.5"
            >
              <path
                d="M7 17L17 7M17 7H9M17 7V15"
                stroke="#B45309"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[#B45309] text-sm font-bold leading-tight">
                Conversion Exchange Rate Info
              </h4>
              <p className="text-[#B45309] text-sm leading-tight">
                Current Exchange Rate: ₦
                {Number(exchangeRateData.sell_rate).toLocaleString()} = $1.00
                USD
              </p>
            </div>
          </div>
        )}

        {!isPrimary && (
          <p className="text-raiz-gray-600 text-sm">
            Only the primary business user can change this setting.
          </p>
        )}

        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full sm:w-fit px-6 py-2.5 h-10 rounded-full"
        >
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default SettlementSettings;
