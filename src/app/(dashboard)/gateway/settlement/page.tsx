"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Radio from "@/components/ui/Radio";
import SelectField, { Option } from "@/components/ui/SelectField";
import { useUser } from "@/lib/hooks/useUser";
import {
  FetchGatewayRemittanceSettlementApi,
  UpdateGatewayRemittanceSettlementApi,
} from "@/services/gateway";
import {
  GatewayExternalWalletCurrency,
  GatewayExternalWalletRail,
  GatewayRemittanceSettlementType,
} from "@/types/services";
import { GATEWAY_EXTERNAL_RAIL_OPTIONS } from "../_utils/subaccountHelpers";

const ASSET_OPTIONS: Option[] = [
  { value: "USDC", label: "USDC" },
  { value: "USDT", label: "USDT" },
];

const RemittanceSettlementPage = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const isPrimary = user?.is_primary ?? false;

  const { data, isLoading } = useQuery({
    queryKey: ["gateway-remittance-settlement"],
    queryFn: FetchGatewayRemittanceSettlementApi,
  });

  const usdWallets = useMemo(
    () =>
      (user?.business_account?.wallets || []).filter(
        (wallet) => wallet.wallet_type?.currency === "USD",
      ),
    [user],
  );

  const walletOptions: Option[] = useMemo(
    () =>
      usdWallets.map((wallet) => ({
        value: wallet.wallet_id,
        label: `${wallet.wallet_name || "USD Wallet"}${
          wallet.account_number ? ` · ${wallet.account_number}` : ""
        }`,
      })),
    [usdWallets],
  );

  const [settlementType, setSettlementType] =
    useState<GatewayRemittanceSettlementType>("raiz_usd_wallet");
  const [usdWalletId, setUsdWalletId] = useState<string>("");
  const [asset, setAsset] = useState<GatewayExternalWalletCurrency>("USDC");
  const [rail, setRail] = useState<GatewayExternalWalletRail | "">("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!data) return;
    const type =
      data.settlement_type === "external_stablecoin_wallet"
        ? "external_stablecoin_wallet"
        : "raiz_usd_wallet";
    setSettlementType(type);
    setUsdWalletId(data.usd_wallet_id || usdWallets[0]?.wallet_id || "");
    setAsset(
      (data.external_wallet_currency as GatewayExternalWalletCurrency) ||
        "USDC",
    );
    setRail(
      (data.external_wallet_rail as GatewayExternalWalletRail) || "",
    );
    setAddress(data.external_wallet_address || "");
  }, [data, usdWallets]);

  const { mutate, isPending } = useMutation({
    mutationFn: UpdateGatewayRemittanceSettlementApi,
    onSuccess: () => {
      toast.success("Remittance settlement updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["gateway-remittance-settlement"],
      });
    },
  });

  const canSave =
    isPrimary &&
    !isPending &&
    (settlementType === "raiz_usd_wallet"
      ? !!usdWalletId
      : !!asset && !!rail && !!address.trim());

  const handleSave = () => {
    if (!canSave) return;
    if (settlementType === "raiz_usd_wallet") {
      mutate({
        settlement_type: "raiz_usd_wallet",
        usd_wallet_id: usdWalletId,
      });
      return;
    }
    mutate({
      settlement_type: "external_stablecoin_wallet",
      external_wallet_currency: asset,
      external_wallet_rail: rail as GatewayExternalWalletRail,
      external_wallet_address: address.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-5 md:gap-6 min-w-0 pb-24 md:pb-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/gateway"
          className="inline-flex items-center justify-center size-9 rounded-full border border-raiz-gray-200 hover:bg-raiz-gray-50 shrink-0"
          aria-label="Back to Gateway"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="#443852"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-raiz-gray-950">
            Remittance settlement
          </h1>
          <p className="text-sm text-raiz-gray-600 mt-1">
            Choose where incoming international remittance funds settle for
            this business. This does not create a subaccount wallet balance.
          </p>
        </div>
      </div>

      {!isPrimary ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Only the primary business user can update remittance settlement
          settings. You can still view the current configuration.
        </div>
      ) : null}

      <div className="rounded-xl border border-raiz-gray-100 bg-white p-4 md:p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={!isPrimary || isLoading}
            onClick={() => setSettlementType("raiz_usd_wallet")}
            className={`border rounded-[20px] flex flex-col relative p-4 text-left transition-colors ${
              !isPrimary
                ? "border-raiz-gray-200 opacity-70 cursor-not-allowed"
                : settlementType === "raiz_usd_wallet"
                  ? "border-[#7F56D9] cursor-pointer"
                  : "border-[#E4E0EA] cursor-pointer hover:border-indigo-900"
            }`}
          >
            <Radio
              checked={settlementType === "raiz_usd_wallet"}
              onChange={() => setSettlementType("raiz_usd_wallet")}
              readOnly={!isPrimary}
              className="absolute top-4 right-4"
              checkedColor="#7F56D9"
            />
            <p className="text-sm font-bold text-raiz-gray-950 pr-8">
              Raiz USD wallet
            </p>
            <p className="text-sm text-raiz-gray-600 mt-1 pr-8">
              Settle incoming remittance funds into your business USD wallet.
            </p>
          </button>

          <button
            type="button"
            disabled={!isPrimary || isLoading}
            onClick={() => setSettlementType("external_stablecoin_wallet")}
            className={`border rounded-[20px] flex flex-col relative p-4 text-left transition-colors ${
              !isPrimary
                ? "border-raiz-gray-200 opacity-70 cursor-not-allowed"
                : settlementType === "external_stablecoin_wallet"
                  ? "border-[#7F56D9] cursor-pointer"
                  : "border-[#E4E0EA] cursor-pointer hover:border-indigo-900"
            }`}
          >
            <Radio
              checked={settlementType === "external_stablecoin_wallet"}
              onChange={() => setSettlementType("external_stablecoin_wallet")}
              readOnly={!isPrimary}
              className="absolute top-4 right-4"
              checkedColor="#7F56D9"
            />
            <p className="text-sm font-bold text-raiz-gray-950 pr-8">
              External stablecoin wallet
            </p>
            <p className="text-sm text-raiz-gray-600 mt-1 pr-8">
              Settle to an external USDC or USDT address on a supported rail.
            </p>
          </button>
        </div>

        {settlementType === "raiz_usd_wallet" ? (
          <div>
            <SelectField
              label="USD wallet"
              options={walletOptions}
              value={
                walletOptions.find((option) => option.value === usdWalletId) ||
                null
              }
              onChange={(option) =>
                setUsdWalletId(option ? String(option.value) : "")
              }
              placeholder="Select a USD wallet"
              disabled={!isPrimary || isLoading || walletOptions.length === 0}
            />
            {walletOptions.length === 0 ? (
              <p className="text-xs text-raiz-gray-500 mt-2">
                No USD wallet found on this business account.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SelectField
              label="Asset"
              options={ASSET_OPTIONS}
              value={
                ASSET_OPTIONS.find((option) => option.value === asset) || null
              }
              onChange={(option) =>
                setAsset(
                  (option?.value as GatewayExternalWalletCurrency) || "USDC",
                )
              }
              disabled={!isPrimary || isLoading}
            />
            <SelectField
              label="Rail"
              options={GATEWAY_EXTERNAL_RAIL_OPTIONS}
              value={
                GATEWAY_EXTERNAL_RAIL_OPTIONS.find(
                  (option) => option.value === rail,
                ) || null
              }
              onChange={(option) =>
                setRail(
                  (option?.value as GatewayExternalWalletRail) || "",
                )
              }
              placeholder="Select a rail"
              disabled={!isPrimary || isLoading}
            />
            <div>
              <InputField
                label="Wallet address"
                name="external_wallet_address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address"
                disabled={!isPrimary || isLoading}
              />
            </div>
          </div>
        )}

        {data?.validation_result?.status ? (
          <p className="text-xs text-raiz-gray-500">
            Validation status:{" "}
            <span className="font-medium capitalize">
              {data.validation_result.status}
            </span>
            {data.external_wallet_status
              ? ` · Wallet: ${data.external_wallet_status}`
              : ""}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button
            className="!w-auto h-11 px-6 rounded-full"
            disabled={!canSave}
            loading={isPending}
            onClick={handleSave}
          >
            Save settlement
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RemittanceSettlementPage;
