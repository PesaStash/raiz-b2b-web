"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { readApiError } from "@/lib/apiError";
import {
  AccountInstructions,
  describeFee,
  formatMoney,
  instructionsText,
  isAccountReady,
  isGlobalBalance,
  receivingInstructions,
  spendableBalances,
  walletInstructions,
} from "@/lib/globalBalance";
import {
  CreateReceivingAccountApi,
  FetchFeeCatalogApi,
  FetchReceivingAccountsApi,
} from "@/services/globalBalance";
import { InitiateZelleTopApi } from "@/services/transactions";
import { ReceivingAccount, BalanceCurrency } from "@/types/globalBalance";
import { IZelleInfo } from "@/store/TopUp/topupSlice.types";
import {
  CurrencyFlag,
  DesignIcon,
  GlobalDialog,
  primaryButton,
  secondaryButton,
} from "../global/GlobalUI";
import { accountPdf, copyInstructions } from "../global/AccountDetails";
import AddReceivingAccount from "../global/AddReceivingAccount";
import SelectField from "@/components/ui/SelectField";
import NgnCardTopUp from "./NgnTopup/NgnCardTopUp";
import AfricaCollectionTopUp from "./UsdTopup/AfricaCollectionTopUp";

const networks = [
  {
    id: "tron",
    title: "Tron (TRC20)",
    icon: "TrontronTrx",
    color: "bg-rose-100",
  },
  {
    id: "ethereum",
    title: "Ethereum (ERC20)",
    icon: "EthereumEth",
    color: "bg-indigo-50",
  },
  {
    id: "bsc",
    title: "BNB Smart Chain (BEP20)",
    icon: "BinanceCoinBnb",
    color: "bg-amber-50",
  },
  {
    id: "polygon",
    title: "Polygon",
    icon: "PolygonMatic",
    color: "bg-purple-100",
  },
];
const tokenOptions = [
  { value: "USDT", label: "USDT" },
  { value: "USDC", label: "USDC" },
];
const networkOptions = networks.map((n) => ({ value: n.id, label: n.title }));
type Step =
  | "methods"
  | "bank"
  | "networks"
  | "creating"
  | "address"
  | "amount"
  | "zelle"
  | "waiting";

function DetailRows({
  fields,
  copyable = true,
}: {
  fields: { label: string; value: string }[];
  copyable?: boolean;
}) {
  return (
    <dl className="divide-y divide-[#eaecf0] rounded-[18px] border border-[#eaecf0] bg-white px-4">
      {fields.map((field) => (
        <div key={field.label} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-[#8a78ad]">{field.label}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold">
              {field.value}
            </dd>
          </div>
          {copyable && (
            <button
              aria-label={`Copy ${field.label}`}
              onClick={() => copyInstructions(field.value)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eeebfc]"
            >
              <DesignIcon name="32273-13049-imgVuesaxBoldCopy.svg" />
            </button>
          )}
        </div>
      ))}
    </dl>
  );
}
function Note({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[#f3f0ff] p-4">
      {icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
          <DesignIcon name={icon} />
        </span>
      )}
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1 text-xs leading-relaxed text-[#8a78ad]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function GlobalTopUp({
  currency,
  close,
}: {
  currency: BalanceCurrency;
  close: () => void;
}) {
  const { user, showBalance, refetch: refreshUser } = useUser();
  const { canWriteBusiness } = usePermissions();
  const qc = useQueryClient();
  const business = user?.business_account;
  const entityId = business?.entity_id;
  const global = isGlobalBalance(business);
  const balance = spendableBalances(business).find(
    (b) => b.currency === currency,
  );
  const [step, setStep] = useState<Step>("methods");
  const [bankAsset, setBankAsset] = useState<string>(currency);
  const [token, setToken] = useState<"USDT" | "USDC">("USDT");
  const [network, setNetwork] = useState("tron");
  const [amount, setAmount] = useState("");
  const [zelle, setZelle] = useState<IZelleInfo | null>(null);
  const [setupAsset, setSetupAsset] = useState<"EUR" | "GBP" | null>(null);
  const [cardTopUpOpen, setCardTopUpOpen] = useState(false);
  const [africaCollectionOpen, setAfricaCollectionOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const canFund =
    canWriteBusiness && !!balance?.wallet_id && isAccountReady(balance.status);
  const attempts = useRef(new Map<string, string>());
  const receiving = useQuery({
    queryKey: ["receiving-accounts", entityId],
    queryFn: FetchReceivingAccountsApi,
    enabled: global && !!entityId,
    refetchInterval: step === "creating" ? 3000 : false,
  });
  const fees = useQuery({
    queryKey: ["fee-catalog", entityId],
    queryFn: FetchFeeCatalogApi,
    enabled: !!entityId,
    staleTime: 0,
  });
  const accounts = global
    ? (receiving.data?.accounts ?? business?.receiving_accounts ?? [])
    : [];
  const instructions = [
    ...(business?.wallets ?? [])
      .filter((w) =>
        ["USD", "NGN", ...(!global ? ["GBP", "EUR"] : [])].includes(
          w.wallet_type.currency,
        ),
      )
      .map((w) => walletInstructions(w, business?.business_name ?? "")),
    ...accounts.map(receivingInstructions),
  ];
  const bank = instructions.find((a) => a.asset === bankAsset);
  const addressAccount = accounts.find(
    (a) => a.asset === token && a.crypto?.network === network,
  );
  const address = addressAccount
    ? receivingInstructions(addressAccount)
    : undefined;
  const creation = useMutation({
    mutationFn: async (pair: { asset: "USDT" | "USDC"; network: string }) => {
      if (!canFund || currency !== "USD")
        throw new Error("Account creation is unavailable.");
      const signature = `${pair.asset}:${pair.network}`;
      let key = attempts.current.get(signature);
      if (!key) {
        key = crypto.randomUUID();
        attempts.current.set(signature, key);
      }
      return CreateReceivingAccountApi(pair, key);
    },
    onSuccess: (result) => {
      qc.setQueryData<{ accounts: ReceivingAccount[] }>(
        ["receiving-accounts", entityId],
        (old) => ({
          accounts: [
            ...(old?.accounts ?? accounts).filter(
              (a) => a.receiving_account_id !== result.receiving_account_id,
            ),
            result,
          ],
        }),
      );
      setStep(isAccountReady(result.status) ? "address" : "creating");
      refreshUser();
    },
  });
  const initiation = useMutation({
    mutationFn: async () => {
      if (!canFund || currency !== "USD" || !balance?.wallet_id)
        throw new Error("USD funding is unavailable.");
      if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) < 1)
        throw new Error("Enter an amount of at least $1.");
      const result: IZelleInfo = await InitiateZelleTopApi(balance.wallet_id, {
        expected_amount: Number(amount),
      });
      setZelle(result);
      setStep("zelle");
    },
  });
  const busy = creation.isPending || initiation.isPending;
  const closeFlow = useCallback(() => {
    if (!busy) close();
  }, [busy, close]);
  const goBack = () => {
    if (busy) return;
    if (["address", "creating"].includes(step)) setStep("networks");
    else if (step === "zelle") setStep("amount");
    else if (step === "methods" || step === "waiting") closeFlow();
    else setStep("methods");
  };
  const finish = () => {
    qc.invalidateQueries({ queryKey: ["user"] });
    qc.invalidateQueries({ queryKey: ["transactions-report"] });
    closeFlow();
  };
  const selectNetwork = (id: string) => {
    creation.reset();
    setNetwork(id);
    const existing = accounts.find(
      (a) => a.asset === token && a.crypto?.network === id,
    );
    setStep(
      existing && isAccountReady(existing.status) ? "address" : "creating",
    );
    if (!existing) creation.mutate({ asset: token, network: id });
  };
  const startZelle = () => {
    setAmount("");
    initiation.reset();
    setStep("amount");
  };
  const feeDetails = (asset: string) => {
    const entries =
      fees.data?.fees?.filter(
        (f) =>
          f.direction === "inbound" &&
          (f.asset === asset || f.transaction_currency === asset),
      ) ?? [];
    return (
      <div className="space-y-3 text-xs">
        {fees.isLoading ? (
          <p>Loading receiving fees…</p>
        ) : fees.isError ? (
          <button
            onClick={() => fees.refetch()}
            className="text-primary2 underline"
          >
            Unable to load fees. Retry
          </button>
        ) : entries.length ? (
          entries.map((f) => (
            <div key={`${f.service}-${f.payment_rail}-${f.asset}`}>
              <p className="font-semibold">
                {f.display_name}
                {f.payment_rail ? ` · ${f.payment_rail}` : ""}
              </p>
              {f.components.map((c) => (
                <p key={c.code} className="mt-1 text-[#8a78ad]">
                  {c.label}: {describeFee(c)}
                </p>
              ))}
              {f.notes.map((n) => (
                <p key={n} className="mt-1 text-[#8a78ad]">
                  {n}
                </p>
              ))}
            </div>
          ))
        ) : (
          <p className="text-[#8a78ad]">
            Receiving fees and arrival times were not supplied by the service.
          </p>
        )}
      </div>
    );
  };
  const exportDetails = async (account: AccountInstructions) => {
    setExporting(true);
    await accountPdf([account], business?.business_name ?? "");
    setExporting(false);
  };
  const errorText = (error: unknown) => {
    const value = error as { data?: { error?: { message?: string } } };
    return (
      value?.data?.error?.message ??
      readApiError(error).message ??
      "Could not complete this request. Please retry."
    );
  };
  const viewStep =
    step === "creating" && address && isAccountReady(address.status)
      ? "address"
      : step;
  const title =
    viewStep === "methods"
      ? "Add money"
      : viewStep === "bank"
        ? `${bankAsset === "NGN" ? "Naira bank transfer" : `${bankAsset} account details`}`
        : viewStep === "networks"
          ? "Choose a network"
          : viewStep === "creating"
            ? "Setting up your address"
            : viewStep === "address"
              ? `Receive ${token}`
              : viewStep === "amount"
                ? "Add with Zelle"
                : viewStep === "zelle"
                  ? "Zelle transfer"
                  : viewStep === "waiting"
                    ? "Transfer submitted"
                    : "Add money";
  const row = (
    label: string,
    subtitle: string,
    icon: ReactNode,
    onClick: () => void,
    disabled = false,
  ) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[14px] border border-[#eaecf0] bg-white px-4 py-3 text-left transition hover:border-primary2 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="mt-1 block text-xs text-[#8a78ad]">{subtitle}</span>
      </span>
      <DesignIcon name="topup-imgVuesaxLinearArrowRight.svg" />
    </button>
  );
  if (cardTopUpOpen)
    return (
      <NgnCardTopUp
        close={close}
        goBack={() => setCardTopUpOpen(false)}
      />
    );
  if (africaCollectionOpen)
    return (
      <AfricaCollectionTopUp
        close={close}
        onDone={finish}
        goBack={() => setAfricaCollectionOpen(false)}
      />
    );
  if (setupAsset)
    return (
      <AddReceivingAccount
        asset={setupAsset}
        existingAccounts={accounts}
        close={() => setSetupAsset(null)}
        onCreated={() => receiving.refetch()}
      />
    );
  return (
    <GlobalDialog title={title} drawer close={closeFlow} onBack={goBack}>
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        {viewStep === "methods" && (
          <>
            <div
              className={`flex items-center justify-between gap-3 rounded-[18px] px-4 py-3.5 text-white ${currency === "NGN" ? "bg-primary2" : "bg-[#3c2875]"}`}
            >
              <div>
                <p className="text-xs text-white/80">
                  {currency === "NGN" ? "Naira balance" : "Total balance"}
                </p>
                <p className="mt-0.5 text-2xl font-bold leading-[29px]">
                  {showBalance
                    ? formatMoney(balance?.available_balance, currency)
                    : "••••••"}
                </p>
              </div>
              <div className="text-right">
                <div className="flex -space-x-1">
                  {(currency === "NGN"
                    ? ["NGN"]
                    : ["USD", "GBP", "EUR", "USDT", "USDC"]
                  ).map((c) => (
                    <CurrencyFlag key={c} currency={c} compact />
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-white/70">
                  {currency === "USD" ? "All land here" : "Local transfers"}
                </p>
              </div>
            </div>
            <section>
              <h3 className="mb-2 text-base font-semibold">Bank transfer</h3>
              <div
                className={`grid gap-3 ${currency === "USD" ? "grid-cols-3" : "grid-cols-1"}`}
              >
                {(currency === "USD" ? ["USD", "GBP", "EUR"] : ["NGN"]).map(
                  (asset) => (
                    <button
                      key={asset}
                      onClick={() => {
                        setBankAsset(asset);
                        setStep("bank");
                      }}
                      className="flex h-[105px] flex-col items-start rounded-[14px] border border-[#eaecf0] bg-white px-3.5 py-3 text-left hover:border-primary2"
                    >
                      <CurrencyFlag currency={asset} />
                      <span className="mt-2 block text-sm font-semibold">
                        {asset}
                      </span>
                      <span className="mt-1 block text-[11px] text-[#8a78ad]">
                        {asset === "USD"
                          ? "ACH · Wire"
                          : asset === "GBP"
                            ? "FPS · BACS"
                            : asset === "EUR"
                              ? "SEPA"
                              : "Nigerian banks"}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </section>
            {currency === "USD" && global && (
              <section>
                <h3 className="mb-2 text-base font-semibold">Stablecoins</h3>
                <div className="space-y-2">
                  {(["USDT", "USDC"] as const).map((value) => (
                    <div key={value}>
                      {row(
                        value,
                        "Choose a supported network",
                        <CurrencyFlag currency={value} />,
                        () => {
                          setToken(value);
                          setStep("networks");
                        },
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section>
              <h3 className="mb-2 text-base font-semibold">
                Other ways to add money
              </h3>
              <div className="space-y-2">
                {currency === "NGN" &&
                  row(
                    "Debit card",
                    "Nigeria-issued card · fee applies",
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f0ff]">
                      <DesignIcon name="topup-imgIcons8BankCards1.svg" />
                    </span>,
                    () => setCardTopUpOpen(true),
                    !canFund,
                  )}
                {currency === "USD" &&
                  row(
                    "Zelle",
                    "Transfer from a US bank account",
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f0ff]">
                      <span className="[&_img]:w-[25px]">
                        <DesignIcon name="topup-imgImage4.png" />
                      </span>
                    </span>,
                    startZelle,
                    !canFund,
                  )}
                {currency === "USD" &&
                  row(
                    "African countries",
                    "Bank transfer or mobile money",
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f0ff]">
                      <Image
                        src="/icons/africa.png"
                        alt=""
                        width={25}
                        height={25}
                        className="object-contain"
                      />
                    </span>,
                    () => setAfricaCollectionOpen(true),
                    !canFund,
                  )}
              </div>
            </section>
          </>
        )}
        {viewStep === "bank" && (
          <>
            {bank ? (
              <>
                <div className="flex flex-col items-center gap-3 text-center">
                  <CurrencyFlag currency={bankAsset} large />
                  <h3 className="text-2xl font-semibold">
                    {bankAsset === "USD"
                      ? "US Dollar"
                      : bankAsset === "NGN"
                        ? "Naira"
                        : bankAsset === "GBP"
                          ? "British Pound"
                          : "Euro"}{" "}
                    account
                  </h3>
                  <p className="text-sm text-[#8a78ad]">
                    {bankAsset === "USD"
                      ? `${business?.business_name} · ACH and wire transfers`
                      : bankAsset === "NGN"
                        ? "For transfers from any Nigerian bank"
                        : bankAsset === "EUR"
                          ? "For SEPA transfers from European banks"
                          : "For UK bank transfers via Faster Payments"}
                  </p>
                </div>
                {!isAccountReady(bank.status) && (
                  <Note title={`Account ${bank.status}`}>
                    Receiving instructions can be shared when the account is
                    ready.
                  </Note>
                )}
                <DetailRows
                  fields={bank.fields}
                  copyable={isAccountReady(bank.status)}
                />
                {feeDetails(bankAsset)}
                <Note
                  icon={
                    bank.receiving
                      ? "topup-imgVuesaxLinearArrowSwapHorizontal.svg"
                      : "topup-imgVuesaxLinearTickCircle.svg"
                  }
                  title={
                    bank.receiving
                      ? "Settles to your USD balance"
                      : `Lands straight in your ${bankAsset} balance`
                  }
                >
                  {bank.receiving
                    ? `${bankAsset} you receive is converted at the execution rate and added to your USD balance. Fees are charged in USD.`
                    : "Share these details with the sender to receive a bank transfer."}
                  {bank.disclosures.map((d) => (
                    <p key={d} className="mt-2">
                      {d}
                    </p>
                  ))}
                </Note>
                <footer className="mt-auto grid grid-cols-2 gap-3 pt-8">
                  <button
                    disabled={
                      !isAccountReady(bank.status) || !bank.fields.length
                    }
                    className={secondaryButton}
                    onClick={() =>
                      copyInstructions(
                        instructionsText([bank], business?.business_name ?? ""),
                      )
                    }
                  >
                    Copy all
                  </button>
                  <button
                    disabled={
                      !isAccountReady(bank.status) ||
                      !bank.fields.length ||
                      exporting
                    }
                    className={primaryButton}
                    onClick={() => exportDetails(bank)}
                  >
                    {exporting ? "Preparing…" : "Download PDF"}
                  </button>
                </footer>
              </>
            ) : (
              <>
                <Note
                  title={
                    receiving.isLoading
                      ? "Loading account…"
                      : `${bankAsset} account not set up`
                  }
                >
                  Create your receiving account to get bank transfer
                  instructions.
                </Note>
                {receiving.isError ? (
                  <button
                    className={primaryButton}
                    onClick={() => receiving.refetch()}
                  >
                    Retry loading accounts
                  </button>
                ) : (
                  global &&
                  (bankAsset === "EUR" || bankAsset === "GBP") && (
                    <button
                      disabled={!canWriteBusiness || receiving.isLoading}
                      className={primaryButton}
                      onClick={() => setSetupAsset(bankAsset as "EUR" | "GBP")}
                    >
                      Set up {bankAsset} account
                    </button>
                  )
                )}
                {["USD", "NGN"].includes(bankAsset) && (
                  <Link
                    className={primaryButton}
                    href={
                      bankAsset === "USD"
                        ? "/onboarding/usd"
                        : "/onboarding/ngn"
                    }
                  >
                    Set up {bankAsset} account
                  </Link>
                )}
              </>
            )}
          </>
        )}
        {viewStep === "networks" && (
          <>
            <CurrencyFlag currency={token} large />
            <h3 className="text-2xl font-semibold">Add money with {token}</h3>
            <p className="text-sm text-[#8a78ad]">
              Pick the same network the sender uses.
            </p>
            {receiving.isError && (
              <button
                className="text-primary2 underline"
                onClick={() => receiving.refetch()}
              >
                Could not load addresses. Retry
              </button>
            )}
            {networks.map((n) => (
              <div key={n.id}>
                {row(
                  n.title,
                  accounts.some(
                    (a) => a.asset === token && a.crypto?.network === n.id,
                  )
                    ? "View your deposit address"
                    : "Set up a deposit address",
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.color}`}
                  >
                    <DesignIcon name={`topup-imgVuesaxBold${n.icon}.svg`} />
                  </span>,
                  () => selectNetwork(n.id),
                  receiving.isLoading || receiving.isError,
                )}
              </div>
            ))}
            <Note title={`Only send ${token} on the selected network`}>
              Deposits settle to your USD balance. Other tokens or networks sent
              here may be lost.
            </Note>
          </>
        )}
        {viewStep === "creating" && (
          <>
            <div className="flex flex-col items-center gap-4 text-center">
              <CurrencyFlag currency={token} large />
              <h3 className="text-2xl font-semibold">
                {addressAccount
                  ? "Your address is being set up"
                  : `Create your ${networks.find((n) => n.id === network)?.title} address`}
              </h3>
              <p className="text-sm text-[#8a78ad]">
                This only happens the first time you use a network.
              </p>
            </div>
            <Note
              title={`${token} · ${networks.find((n) => n.id === network)?.title}`}
            >
              {addressAccount
                ? `Account status: ${addressAccount.status}`
                : "Create this token and network pair to receive deposits into your USD balance."}
            </Note>
            {creation.isError && (
              <p role="alert" className="text-sm text-red-700">
                {errorText(creation.error)}
              </p>
            )}
            {addressAccount && isAccountReady(addressAccount.status) ? (
              <button
                className={primaryButton}
                onClick={() => setStep("address")}
              >
                View deposit address
              </button>
            ) : addressAccount ? (
              <button
                className={secondaryButton}
                onClick={() => receiving.refetch()}
              >
                Refresh status
              </button>
            ) : (
              <button
                disabled={creation.isPending || !canFund}
                className={primaryButton}
                onClick={() => creation.mutate({ asset: token, network })}
              >
                {creation.isPending
                  ? "Creating address…"
                  : creation.isError
                    ? "Retry address setup"
                    : "Create address"}
              </button>
            )}
          </>
        )}
        {viewStep === "address" && (
          <>
            {address ? (
              <>
                <div className="flex flex-col items-center gap-3 text-center">
                  <CurrencyFlag currency={token} large />
                  <h3 className="text-2xl font-semibold">Receive {token}</h3>
                  <p className="text-sm text-[#8a78ad]">
                    Send {token} using the selected network
                  </p>
                </div>
                {isAccountReady(address.status) && address.address ? (
                  <div className="relative mx-auto bg-white p-2">
                    <QRCode value={address.address} size={184} />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-white">
                      <CurrencyFlag currency={token} />
                    </span>
                  </div>
                ) : (
                  <Note title={`Account ${address.status}`}>
                    Your address will appear when setup is complete.
                  </Note>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    instanceId="topup-token"
                    label="Token"
                    labelClass="!text-xs !font-normal !text-[#8a78ad]"
                    name="token"
                    isSearchable={false}
                    bgColor="#ffffff"
                    className="!shadow-none"
                    options={tokenOptions}
                    value={
                      tokenOptions.find((option) => option.value === token) ??
                      null
                    }
                    onChange={(option) => {
                      if (!option || option.value === token) return;
                      setToken(option.value as "USDT" | "USDC");
                      setStep("networks");
                    }}
                  />
                  <SelectField
                    instanceId="topup-network"
                    label="Network"
                    labelClass="!text-xs !font-normal !text-[#8a78ad]"
                    name="network"
                    isSearchable={false}
                    bgColor="#ffffff"
                    className="!shadow-none"
                    options={networkOptions}
                    value={
                      networkOptions.find((option) => option.value === network) ??
                      null
                    }
                    onChange={(option) => {
                      if (option && option.value !== network) {
                        selectNetwork(String(option.value));
                      }
                    }}
                  />
                </div>
                <DetailRows
                  fields={address.fields.filter((f) => f.label !== "Network")}
                  copyable={isAccountReady(address.status)}
                />
                {feeDetails(token)}
                <div className="rounded-2xl bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                  <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white">
                    <DesignIcon name="topup-imgVuesaxLinearShieldTick.svg" />
                  </span>
                  <div>
                  <p className="text-sm font-semibold">
                    Only send {token} on{" "}
                    {networks.find((n) => n.id === network)?.title}
                  </p>
                  <p className="mt-1 text-xs text-[#8a78ad]">
                    Deposits land in your USD balance. Other tokens or networks
                    may be lost.
                  </p>
                  {/* {address.disclosures.map((d) => (
                    <p key={d} className="mt-2 text-xs text-[#8a78ad]">
                      {d}
                    </p>
                  ))} */}
                  </div>
                  </div>
                </div>
                <footer className="mt-auto grid grid-cols-2 gap-3 pt-8">
                  <button
                    disabled={
                      !isAccountReady(address.status) || !address.address
                    }
                    className={secondaryButton}
                    onClick={() => copyInstructions(address.address ?? "")}
                  >
                    Copy address
                  </button>
                  <button
                    disabled={
                      !isAccountReady(address.status) ||
                      !address.address ||
                      exporting
                    }
                    className={primaryButton}
                    onClick={() => exportDetails(address)}
                  >
                    {exporting ? "Preparing…" : "Share address"}
                  </button>
                </footer>
              </>
            ) : (
              <button
                className={primaryButton}
                onClick={() => setStep("networks")}
              >
                Choose a network
              </button>
            )}
          </>
        )}
        {viewStep === "amount" && (
          <>
            <div className="rounded-[14px] border border-[#eaecf0] bg-white p-4">
              <p className="text-sm font-semibold">Send from your US bank</p>
              <p className="mt-1 text-xs text-[#8a78ad]">
                Use the recipient and memo shown in the next step
              </p>
            </div>
            <label className="rounded-2xl bg-[#f4f4f8] p-5">
              <span className="flex justify-between text-xs text-[#8a78ad]">
                You add <strong className="text-[#19151e]">USD</strong>
              </span>
              <input
                aria-label="Top-up amount in USD"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  if (/^\d{0,8}(\.\d{0,2})?$/.test(e.target.value)) {
                    setAmount(e.target.value);
                    initiation.reset();
                  }
                }}
                placeholder="0.00"
                className="mt-3 w-full bg-transparent text-[32px] font-semibold outline-none"
              />
              <span className="mt-2 block text-xs text-[#8a78ad]">
                Amount in US dollars · Minimum $1
              </span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[25, 50, 100, 200].map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setAmount(String(value));
                    initiation.reset();
                  }}
                  className={`rounded-xl py-3 text-sm font-semibold ${amount === String(value) ? "bg-[#f3f0ff] text-primary2" : "bg-white"}`}
                >
                  ${value}
                </button>
              ))}
            </div>
            <Note title="Send the exact total">
              Next you’ll get the Zelle recipient, exact amount, and memo code.
              Include the memo exactly as shown.
            </Note>
            {initiation.isError && (
              <p role="alert" className="text-sm text-red-700">
                {errorText(initiation.error)}
              </p>
            )}
            <button
              disabled={
                !amount ||
                Number(amount) < 1 ||
                initiation.isPending ||
                !canFund
              }
              className={`${primaryButton} mt-auto`}
              onClick={() => initiation.mutate()}
            >
              {initiation.isPending ? "Preparing…" : "Continue"}
            </button>
          </>
        )}
        {(viewStep === "zelle" || viewStep === "waiting") && zelle && (
          <>
            {viewStep === "zelle" ? (
              <>
                <div className="rounded-2xl bg-[#f3f0ff] p-5">
                  <p className="text-xs text-[#8a78ad]">Send exactly</p>
                  <p className="mt-2 text-[32px] font-semibold">
                    {formatMoney(String(zelle.expected_amount), "USD")}
                  </p>
                  <p className="mt-2 text-xs text-primary2">
                    Expires {new Date(zelle.expires_at).toLocaleString()}
                  </p>
                </div>
                <DetailRows
                  fields={[
                    { label: "Send to (Zelle)", value: zelle.send_to },
                    {
                      label: "Amount",
                      value: formatMoney(String(zelle.expected_amount), "USD"),
                    },
                    {
                      label: "Memo code · must match exactly",
                      value: zelle.memo_code,
                    },
                  ]}
                />
                <h3 className="font-semibold">How to send with Zelle</h3>
                <ol className="list-inside list-decimal space-y-3 text-sm">
                  <li>Open your bank app and choose Zelle.</li>
                  <li>
                    Send {formatMoney(String(zelle.expected_amount), "USD")} to{" "}
                    {zelle.send_to}.
                  </li>
                  <li>Add memo {zelle.memo_code} exactly as shown.</li>
                </ol>
                <Note title="Keep the memo code exactly as shown">
                  It helps match the transfer to {business?.business_name}. Use
                  a Zelle account in your name. Third-party payments may require
                  verification.
                </Note>
                <footer className="mt-auto grid grid-cols-2 gap-3 pt-8">
                  <button className={secondaryButton} onClick={closeFlow}>
                    Close
                  </button>
                  <button
                    className={primaryButton}
                    onClick={() => setStep("waiting")}
                  >
                    I’ve sent the money
                  </button>
                </footer>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-semibold">
                  Waiting for your transfer
                </h3>
                <p className="text-sm text-[#8a78ad]">
                  We’ll add the money to your USD balance once your Zelle
                  transfer is received and matched.
                </p>
                <DetailRows
                  fields={[
                    {
                      label: "Amount to send",
                      value: formatMoney(String(zelle.expected_amount), "USD"),
                    },
                    { label: "Memo code", value: zelle.memo_code },
                    {
                      label: "Status",
                      value: zelle.status || "Awaiting receipt",
                    },
                  ]}
                />
                <Note title="You can leave this screen">
                  Check Transactions for updates. Don’t send the payment again.
                </Note>
                <button className={`${primaryButton} mt-auto`} onClick={finish}>
                  Back to dashboard
                </button>
              </>
            )}
          </>
        )}
      </div>
    </GlobalDialog>
  );
}
