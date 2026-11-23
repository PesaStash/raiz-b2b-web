"use client";
/* eslint-disable @next/next/no-img-element -- Figma decoration is rendered at its intrinsic SVG size. */
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/hooks/useUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import {
  AccountInstructions,
  formatMoney,
  instructionsText,
  isGlobalBalance,
  isAccountReady,
  receivingInstructions,
  spendableBalances,
  walletInstructions,
} from "@/lib/globalBalance";
import { BalanceCurrency, ReceivingAccount } from "@/types/globalBalance";
import { FetchReceivingAccountsApi } from "@/services/globalBalance";
import { canCreateNgnWallet, isNigerianBusiness } from "@/utils/onboardingBranch";
import { NGN_HOLDING_LIMIT, hasBankDetails, isEntityRestricted, isWalletOnly, ngnHeadroom } from "@/lib/businessWallets";
import { useKybNavigation } from "@/lib/hooks/useKybNavigation";
import { useNgnOnboarding } from "@/lib/hooks/useNgnOnboarding";
import { getCombinedNgnKybUiState } from "@/utils/ngnKyb";
import WalletDialog from "@/components/onboarding/WalletDialog";
import {
  AccountDetails,
  ShareAccounts,
  copyInstructions,
} from "./AccountDetails";
import AddReceivingAccount from "./AddReceivingAccount";
import { asset, CurrencyFlag, DesignIcon, GlobalDialog } from "./GlobalUI";
import MoneyMovement, { useMoneyMovement } from "./MoneyMovement";
import ConvertCard from "./ConvertCard";
import RecentTransactions from "./RecentTransactions";

interface Props {
  onAction: (action: "topUp" | "send" | "request") => void;
  onConvert: (amount?: string, currency?: BalanceCurrency) => void;
  onCreateNgn: () => void;
}
export default function GlobalDashboard({
  onAction,
  onConvert,
  onCreateNgn,
}: Props) {
  const reduceMotion = useReducedMotion();
  const { user, showBalance, setShowBalance } = useUser();
  const { canWriteBusiness } = usePermissions();
  const { selectedCurrency, selectedWallet, setSelectedCurrency } = useCurrencyStore();
  const account = user?.business_account;
  const global = isGlobalBalance(account);
  const isNigerian = isNigerianBusiness(user);
  const wallets = account?.wallets ?? [];
  const ngnWallet = wallets.find((wallet) => wallet.wallet_type.currency === "NGN");
  const usdWallet = wallets.find((wallet) => wallet.wallet_type.currency === "USD");
  const canUseNgn = isNigerian || !!ngnWallet;
  const canCreateNgn = canCreateNgnWallet(user, account?.business_verifications?.[0]?.verification_status);
  const canOfferNgn = canWriteBusiness && !isEntityRestricted(account?.entity) && !ngnWallet;
  const balances = spendableBalances(account);
  const currency: BalanceCurrency =
    canUseNgn && selectedCurrency.name === "NGN" ? "NGN" : "USD";
  const balance = balances.find((b) => b.currency === currency && b.wallet_id === selectedWallet?.wallet_id)
    ?? balances.find((b) => b.currency === currency);
  const wallet = wallets.find((item) => item.wallet_id === balance?.wallet_id);
  const walletOnly = isWalletOnly(wallet);
  const showNgnLimit = currency === "NGN";
  const headroom = showNgnLimit ? ngnHeadroom(wallet?.account_balance) : undefined;
  const atLimit = headroom === "0";
  const kyb = useKybNavigation(user);
  const usdStatus = kyb.data?.case.status;
  const usdBankReview = usdWallet?.wallet_status === "completed" && isWalletOnly(usdWallet) &&
    (usdStatus === "submitted_to_bridge" || usdStatus === "under_review");
  const usdBankRejected = usdWallet?.wallet_status === "completed" && isWalletOnly(usdWallet) &&
    usdStatus === "rejected" && !!(kyb.data?.case.bridge_customer_id || kyb.data?.case.bridge_application_id ||
      account?.business_verifications?.[0]?.case_stage === "bridge_rejected");
  const ngnSetup = useNgnOnboarding({ enabled: isNigerian && !!ngnWallet && !hasBankDetails(ngnWallet) });
  const ngnProgress = getCombinedNgnKybUiState(ngnSetup.requirements);
  const ngnBankReview = !!ngnWallet && !hasBankDetails(ngnWallet) &&
    (ngnProgress === "review" || ngnProgress === "processing" ||
      (!isWalletOnly(ngnWallet) && ngnWallet.wallet_status === "pending"));
  const otherCurrency = currency === "USD" ? "NGN" : "USD";
  const otherBalance = balances.find((b) => b.currency === otherCurrency);
  const [modal, setModal] = useState<
    "share" | "switch" | "EUR" | "GBP" | "SBC" | "create-ngn" | null
  >(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [wideLayout, setWideLayout] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const update = () => setWideLayout(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const close = useCallback(() => {
    setModal(null);
    setDetailId(null);
  }, [setModal, setDetailId]);
  const qc = useQueryClient();
  const receivingQuery = useQuery({
    queryKey: ["receiving-accounts", account?.entity_id],
    queryFn: FetchReceivingAccountsApi,
    enabled: global && !!account?.entity_id,
    refetchInterval: 60_000,
  });
  const receiving = global
    ? (receivingQuery.data?.accounts ?? account?.receiving_accounts ?? [])
    : [];
  const bankInstructions = wallets
    .filter((w) => hasBankDetails(w) &&
      (w.wallet_type.currency === "USD" || w.wallet_type.currency === "NGN" ||
        (!global && (w.wallet_type.currency === "EUR" || w.wallet_type.currency === "GBP"))))
    .map((w) => walletInstructions(w, account?.business_name ?? ""));
  const instructions = [
    ...bankInstructions,
    ...receiving.map(receivingInstructions),
  ];
  const usdAccounts = instructions.filter((a) => a.asset !== "NGN");
  const currentAccounts =
    currency === "NGN"
      ? instructions.filter((a) => a.asset === "NGN")
      : usdAccounts;
  const {
    data: movement,
    isLoading: loadingMovement,
    isError: movementError,
  } = useMoneyMovement(account?.entity_id, balance?.wallet_id, 30);
  const empty = balance && /^0+(\.0+)?$/.test(balance.available_balance);
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";
  const restricted = !!wallet?.is_pnd || isEntityRestricted(account?.entity);
  const writable =
    canWriteBusiness && !restricted && !!wallet && !!balance &&
    (isAccountReady(wallet.wallet_status ?? undefined) || (!walletOnly && !wallet.wallet_status)) &&
    (isAccountReady(balance.status) || balance.status?.toLowerCase() === "approved");
  const canReceive = writable && !atLimit;
  const reviewBanner = currency === "USD" && (usdBankReview || usdBankRejected);
  const detailsAvailable = currentAccounts.some((item) => isAccountReady(item.status) && item.fields.length > 0);
  const usdReceiveAssets = balances.find((item) => item.currency === "USD")?.supported_receive_assets;
  useEffect(() => {
    if (!user) return;
    if (!canUseNgn && selectedCurrency.name === "NGN") {
      setSelectedCurrency("USD", user);
      return;
    }
    if (
      !global ||
      selectedCurrency.name === "USD" ||
      selectedCurrency.name === "NGN"
    )
      return;
    const first = spendableBalances(user.business_account)[0];
    if (first) setSelectedCurrency(first.currency, user);
  }, [global, canUseNgn, user, selectedCurrency.name, setSelectedCurrency]);
  const onCreated = (created: ReceivingAccount[]) => {
    qc.setQueryData<{ accounts: ReceivingAccount[] }>(
      ["receiving-accounts", account?.entity_id],
      (old) => ({
        accounts: [
          ...(old?.accounts ?? receiving).filter(
            (a) =>
              !created.some(
                (c) => c.receiving_account_id === a.receiving_account_id,
              ),
          ),
          ...created,
        ],
      }),
    );
  };
  const row = (
    item: AccountInstructions | undefined,
    type: "USD" | "EUR" | "GBP" | "SBC",
  ) => {
    const ready = isAccountReady(item?.status) && !!item?.fields.length;
    const identifier =
      item?.address ??
      item?.fields.find(
        (f) => f.label === "IBAN" || f.label === "Account number",
      )?.value;
    const subtitle = !item
      ? type === "EUR"
        ? "Get paid from Europe"
        : type === "GBP"
          ? "Get paid from the UK"
          : type === "SBC"
            ? "Receive USDT and USDC"
            : usdBankReview ? "Account in review" : usdWallet ? "Dedicated bank details" : "Set up your USD wallet"
      : !ready
        ? `Account ${item.status}`
        : `${item.network ?? (type === "EUR" ? "SEPA, Europe" : type === "GBP" ? "Faster Payments, UK" : "ACH and wire, US")}${identifier ? ` · •• ${identifier.slice(-4)}` : ""}`;
    return (
      <div
        key={type}
        className="flex min-h-[58px] items-center gap-3 rounded-xl px-2 py-3 hover:bg-kyb-soft"
      >
        <CurrencyFlag currency={type} />
        <button
          disabled={!item}
          onClick={() => item && setDetailId(item.id)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-sm font-semibold leading-[17px]">
            {type === "SBC" ? "Stablecoins" : `${type} account`}
          </span>
          <span className="mt-[3px] block truncate text-xs leading-[14px] text-kyb-muted">
            {subtitle}
          </span>
        </button>
        {item ? (
          <>
            <button
              disabled={!ready}
              onClick={() =>
                copyInstructions(
                  instructionsText([item], account?.business_name ?? ""),
                )
              }
              aria-label={`Copy ${type} account details`}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#f3f1fd] disabled:opacity-40"
            >
              <DesignIcon name="32258-15724-imgVuesaxLinearCopy.svg" />
            </button>
            <button
              aria-label={`View ${type} account details`}
              onClick={() => setDetailId(item.id)}
            >
              <DesignIcon name="32258-15724-imgVuesaxLinearArrowRight.svg" />
            </button>
          </>
        ) : type === "USD" ? (
          usdBankReview ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900">In review</span> :
            !usdWallet && canWriteBusiness ? <Link href="/onboarding/usd" className="text-xs font-semibold text-primary2">Set up</Link> : null
        ) : (
          canWriteBusiness &&
          global && (
            <button
              disabled={
                !balances.some(
                  (b) => b.currency === "USD" && isAccountReady(b.status),
                ) ||
                restricted ||
                receivingQuery.isLoading ||
                receivingQuery.isError
              }
              onClick={() => setModal(type)}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-raiz-usd-primary py-1.5 pl-2.5 pr-3 text-xs font-semibold leading-normal text-[#fcfcfd] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <DesignIcon name="32266-20311-imgVuesaxLinearAdd.svg" />
              Add
            </button>
          )
        )}
      </div>
    );
  };
  return (
    <div className="space-y-6 font-monzo text-raiz-gray-950">
      <section className="rounded-[20px] bg-white p-4 sm:p-6 xl:p-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold sm:text-2xl">
            {empty ? "Welcome to Raiz" : greeting}, {user?.first_name}{" "}
            {empty ? "🎉" : "👋🏾"}
          </h1>
          <p className="mt-2 text-sm text-kyb-muted">
            {restricted ? "View your wallet balance and restrictions."
              : atLimit ? "You’ve reached your NGN balance limit."
              : walletOnly && wallet?.wallet_status === "completed" ? `Your ${currency === "NGN" ? "naira" : "USD"} wallet is ready.`
              : empty ? "Add money or share your available details to get paid."
              : `${account?.business_name ?? ""} · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`}
          </p>
        </header>
        {restricted ? (
          <p role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Wallet activity is restricted. Contact support for help.
          </p>
        ) : atLimit ? (
          <p role="status" className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <DesignIcon name="wallet-cap-banner.svg" />
            You’ve reached your ₦300,000 NGN balance limit. Spend or transfer funds before receiving more.
          </p>
        ) : currency === "USD" && (usdBankReview || usdBankRejected) ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fdf5e1]">
              <Image src="/images/kyb/review-status.svg" alt="" width={28} height={28} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{usdBankReview ? "We’re reviewing your USD bank account" : "Your USD bank account application was declined"}</p>
              <p className="text-kyb-muted">Your USD wallet remains available. {usdBankReview ? "Bank details appear after provisioning." : "Contact support about the application."}</p>
            </div>
            <Link href="/onboarding/usd" className="shrink-0 font-semibold text-primary2">View progress →</Link>
          </div>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_308px] desktop:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative isolate min-w-0 pb-[14px]">
            <motion.div
              key={currency}
              aria-hidden="true"
              initial={reduceMotion ? false : { y: -14, scaleX: 0.96, opacity: 0 }}
              animate={{ y: 0, scaleX: 1, opacity: 0.7 }}
              transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.4, 0, 0.2, 1] }}
              className={`pointer-events-none absolute inset-x-[22px] bottom-0 h-7 rounded-[18px] ${currency === "NGN" ? "bg-[#b7a9da]" : "bg-[#8db9d3]"}`}
            />
          <section
            className={`relative z-10 flex min-h-[396px] min-w-0 flex-col overflow-hidden rounded-3xl px-5 pb-[22px] pt-6 text-white sm:px-7 ${currency === "NGN" ? "bg-primary2" : "bg-raiz-usd-primary"}`}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 opacity-[0.02] ${currency === "NGN" ? "bg-[url('/images/dashboard/32285-13423-imgBalanceCard.png')] bg-[length:100px_100px]" : "bg-[url('/images/dashboard/32310-11118-imgBalanceCard.png')] bg-[length:200px_36px]"}`}
            />
            <img
              src={asset(currency === "NGN" ? "32285-13423-imgEllipse.svg" : "32310-11118-imgEllipse.svg")}
              alt=""
              className="pointer-events-none absolute -top-[330px] left-[360px] max-w-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/85">
                  {currency === "USD" ? "Total balance" : "Naira balance"}
                </span>
                <button
                  aria-label={showBalance ? "Hide balances" : "Show balances"}
                  aria-pressed={showBalance}
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1"
                >
                  <DesignIcon name="32310-11118-imgVuesaxLinearEye.svg" />
                </button>
              </div>
              {currency === "USD" && canOfferNgn ? (
                canCreateNgn ? (
                  <button type="button" onClick={() => setModal("create-ngn")} className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 text-left">
                    <CurrencyFlag currency="NGN" />
                    <span><span className="block text-[11px] text-white/75">Naira wallet</span> <span className="block text-xs font-semibold">Not created yet</span></span>
                    <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-raiz-usd-primary">+ Create</span>
                  </button>
                ) : (
                  <Link href="/onboarding/business" className="text-xs font-semibold underline">
                    {account?.entity?.entity_address?.length ? "View business verification" : "Add business address"}
                  </Link>
                )
              ) : (canUseNgn && !!otherBalance) &&
                (currency === "NGN" ? (
                  <button
                    onClick={() => setModal("switch")}
                    className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-primary2"
                  >
                    <CurrencyFlag currency="USD" compact />
                    Switch to USD
                    <DesignIcon name="32285-13423-imgVuesaxLinearArrowSwapHorizontal.svg" />
                  </button>
                ) : (
                  <button
                    onClick={() => setModal("switch")}
                    className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-2"
                  >
                    <CurrencyFlag currency={otherCurrency} />
                    <span className="text-left">
                      <span className="block text-[11px] text-white/75">
                        {otherCurrency === "NGN" ? "Naira" : "USD"} balance
                      </span>
                      <span className="block text-sm font-semibold">
                        {showBalance
                          ? formatMoney(
                              otherBalance?.available_balance,
                              otherCurrency,
                            )
                          : "••••••"}
                      </span>
                    </span>
                    <span
                      className={`ml-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold ${currency === "USD" ? "text-raiz-usd-primary" : "text-primary2"}`}
                    >
                      Switch ⇆
                    </span>
                  </button>
                ))}
            </div>
            <div className="relative mb-12 mt-4">
              <p className="break-words text-3xl font-bold tracking-tight sm:text-[44px] sm:leading-[54px]">
                {showBalance ? (
                  <>
                    {
                      formatMoney(balance?.available_balance, currency).split(
                        ".",
                      )[0]
                    }
                    {balance && (
                      <span className="text-2xl text-white/65">
                        .
                        {
                          formatMoney(
                            balance.available_balance,
                            currency,
                          ).split(".")[1]
                        }
                      </span>
                    )}
                  </>
                ) : (
                  "••••••"
                )}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {walletOnly ? (
                  <CurrencyFlag currency={currency} compact />
                ) : currency === "USD" && (
                  <div className="flex -space-x-2">
                    {["USD", "EUR", "GBP", "USDT", "USDC"].map((c) => (
                      <CurrencyFlag key={c} currency={c} small />
                    ))}
                  </div>
                )}
                <p className="text-xs text-white/80">
                  {showNgnLimit ? "NGN wallet · maximum balance ₦300,000"
                    : walletOnly && currency === "USD" ? "USD wallet · receive USDT and USDC"
                    : currency === "USD"
                    ? global
                      ? "USD, EUR, GBP and stablecoins, all in USD"
                      : "Your available US Dollar balance"
                    : "Your available Naira balance"}
                </p>
              </div>
            </div>
            <div className="relative mt-auto grid grid-cols-2 divide-x divide-white/20 rounded-2xl bg-white/10 py-3 sm:grid-cols-3">
              {[
                {
                  label: "Money in (30 days)",
                  amount: movement?.total_income,
                  icon: "imgEllipse1",
                },
                {
                  label: "Money out (30 days)",
                  amount: movement?.total_expense,
                  icon: "imgEllipse2",
                },
              ].map((stat) => (
                <div key={stat.label} className="px-3 sm:px-[18px]">
                  <p className="flex items-center gap-1.5 text-xs text-white/80">
                    <DesignIcon name={`32310-11118-${stat.icon}.svg`} />
                    {stat.label}
                  </p>
                  <p className="mt-1 break-words text-base font-semibold">
                    {!showBalance
                      ? "••••••"
                      : loadingMovement
                        ? "…"
                        : movementError
                          ? "Unavailable"
                          : formatMoney(stat.amount, currency)}
                  </p>
                </div>
              ))}
              <div className="hidden px-3 sm:block sm:px-[18px]">
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <CurrencyFlag currency={otherCurrency} mini />
                  {otherCurrency === "NGN" ? "Naira" : "USD"} balance
                </p>
                <p className="mt-1 break-words text-base font-semibold">
                  {showBalance ? formatMoney(otherBalance?.available_balance, otherCurrency) : "••••••"}
                </p>
              </div>
            </div>
            <div
              className={`relative mt-[14px] grid gap-2.5 ${canUseNgn ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}
            >
              {[
                { name: "Add money", key: "topUp", icon: "Add" },
                { name: "Send", key: "send", icon: "Send2" },
                ...(canUseNgn
                  ? [
                      {
                        name: "Convert",
                        key: "convert",
                        icon: "ArrowSwapHorizontal1",
                      },
                    ]
                  : []),
                { name: "Request", key: "request", icon: "ReceiveSquare" },
              ].map((action) => {
                const capIcon = atLimit && (action.key === "send" || action.key === "convert")
                  ? `wallet-cap-${action.key}.svg`
                  : undefined;
                const tone = capIcon ? "bg-white text-primary2"
                  : action.key === "topUp" && !atLimit ? (currency === "NGN" ? "bg-white text-primary2" : "bg-white text-raiz-usd-primary")
                  : "bg-white/15";
                return (
                  <button
                    key={action.key}
                    disabled={action.key === "topUp" || action.key === "request" ? !canReceive :
                      action.key === "convert" ? !writable || !otherBalance : !writable}
                    onClick={() =>
                      action.key === "convert"
                        ? onConvert()
                        : onAction(action.key as "topUp" | "send" | "request")
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
                  >
                    <DesignIcon
                      name={capIcon ?? `${currency === "NGN" && action.key === "topUp" && !atLimit ? "32285-13423" : "32310-11118"}-imgVuesaxLinear${action.icon}.svg`}
                    />
                    {action.name}
                  </button>
                );
              })}
            </div>
          </section>
          </div>
          <section className="min-w-0 rounded-2xl border border-kyb-border bg-white p-6">
            <header
              className={`flex items-start justify-between gap-2 ${accountsOpen ? "mb-4" : "xl:mb-4"}`}
            >
              <button
                type="button"
                aria-expanded={wideLayout || accountsOpen}
                aria-controls="account-details-panel"
                onClick={() => setAccountsOpen((open) => !open)}
                className="min-w-0 flex-1 text-left xl:pointer-events-none"
              >
                <span className="flex items-center gap-2">
                  <h2 className="font-semibold leading-[19px]">
                    {currency === "NGN" && wallet ? "Your naira wallet" : "Your account details"}
                  </h2>
                  <span
                    className={`xl:hidden ${accountsOpen ? "-rotate-90" : "rotate-90"}`}
                  >
                    <DesignIcon name="32258-15724-imgVuesaxLinearArrowRight.svg" />
                  </span>
                </span>
                <p className="mt-[3px] text-xs leading-[14px] text-kyb-muted">
                  In the name {account?.business_name}
                </p>
              </button>
              {detailsAvailable && <button
                onClick={() => setModal("share")}
                className="flex items-center gap-1.5 rounded-lg border border-kyb-border px-2.5 py-1.5 text-xs font-semibold text-primary2"
              >
                <DesignIcon name="32258-15724-imgVuesaxLinearSend2.svg" />
                Share
              </button>}
            </header>
            <div
              id="account-details-panel"
              className={accountsOpen ? undefined : "hidden xl:block"}
            >
            {showNgnLimit && wallet && (
              <div className="mb-4 rounded-2xl border border-kyb-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                  <span className="flex items-center gap-1">Balance limit <DesignIcon name="wallet-limit-info.svg" /></span>
                  <span className="rounded-full bg-kyb-selected px-2 py-1 text-primary2">Max ₦300,000</span>
                </div>
                {headroom !== undefined && showBalance && (
                  <>
                    <progress aria-label="NGN holding limit used" max={NGN_HOLDING_LIMIT} value={Math.max(0, NGN_HOLDING_LIMIT - Number(headroom))} className={`my-3 block h-2 w-full overflow-hidden rounded-full bg-kyb-selected [&::-webkit-progress-bar]:bg-kyb-selected [&::-webkit-progress-value]:rounded-full ${atLimit ? "[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500" : "[&::-webkit-progress-value]:bg-primary2 [&::-moz-progress-bar]:bg-primary2"}`} />
                    <div className="flex flex-wrap justify-between gap-2 text-xs">
                      <span className="font-semibold">{formatMoney(wallet.account_balance, "NGN")} held</span>
                      <span className="text-kyb-muted">{atLimit ? "No room left" : `${formatMoney(headroom, "NGN")} room left`}</span>
                    </div>
                  </>
                )}
              </div>
            )}
            {currency === "USD" ? (
              <div className="space-y-2">
                {row(
                  usdAccounts.find((a) => a.asset === "USD"),
                  "USD",
                )}
                {(!walletOnly || usdAccounts.some((a) => a.asset === "EUR")) && row(usdAccounts.find((a) => a.asset === "EUR"), "EUR")}
                {(!walletOnly || usdAccounts.some((a) => a.asset === "GBP")) && row(usdAccounts.find((a) => a.asset === "GBP"), "GBP")}
                {row(
                  usdAccounts.find(
                    (a) => a.asset === "USDT" || a.asset === "USDC",
                  ),
                  "SBC",
                )}
              </div>
            ) : currentAccounts[0] ? (
              <div>
                <div className="mb-5 flex gap-3">
                  <CurrencyFlag currency="NGN" />
                  <div>
                    <p className="text-sm font-semibold">Naira account</p>
                    <p className="text-xs text-kyb-muted">
                      Local transfers from Nigerian banks
                    </p>
                  </div>
                </div>
                <dl className="divide-y divide-kyb-border">
                  {currentAccounts[0].fields
                    .filter((f) =>
                      ["Account name", "Account number", "Bank"].includes(
                        f.label,
                      ),
                    )
                    .map((f) => (
                      <div
                        key={f.label}
                        className="flex justify-between gap-3 py-4"
                      >
                        <div className="min-w-0">
                          <dt className="text-xs text-kyb-muted">{f.label}</dt>
                          <dd className="mt-1 break-words text-sm font-semibold">
                            {f.value}
                          </dd>
                        </div>
                        <button
                          onClick={() => copyInstructions(f.value)}
                          aria-label={`Copy ${f.label}`}
                        >
                          <DesignIcon name="32258-15724-imgVuesaxLinearCopy.svg" />
                        </button>
                      </div>
                    ))}
                </dl>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-kyb-border p-3">
                <CurrencyFlag currency="NGN" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">NGN bank details</p>
                  <p className="text-xs text-kyb-muted">{ngnBankReview ? "Shows here once approved" : "Available after additional verification"}</p>
                </div>
                {ngnBankReview ? <Link href="/onboarding/ngn" className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900">In review</Link> :
                  isNigerian && canWriteBusiness && !restricted && (wallet
                    ? <Link href="/onboarding/ngn" className="text-xs font-semibold text-primary2">Set up</Link>
                    : <button type="button" onClick={onCreateNgn} className="text-xs font-semibold text-primary2">Set up</button>)}
              </div>
            )}
            {receivingQuery.isError && global && (
              <button
                onClick={() => receivingQuery.refetch()}
                className="mt-3 text-xs text-red-700 underline"
              >
                Couldn’t refresh receiving accounts. Retry
              </button>
            )}
            <p className="mt-4 rounded-xl bg-[#f3f1fd] px-3 py-2.5 text-xs font-semibold leading-4">
              {currency === "USD"
                ? walletOnly
                  ? (reviewBanner ? "Dedicated bank details appear after provisioning." : "Contact your account manager for dedicated USD bank details.")
                  : global
                  ? "All of these arrive in your USD balance"
                  : "Share your details to receive a payment"
                : atLimit ? "Spend or send to make room for more money."
                : showNgnLimit ? "Maximum balance applies even after bank details are added."
                : "Receive local transfers into your naira balance"}
            </p>
            </div>
          </section>
        </div>
      </section>
      {global && !!account?.legacy_balances?.length && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold">Legacy balances · Action required</h2>
          <p className="mt-1 text-sm text-amber-900">
            These balances are separate from your available NGN and USD
            balances.
          </p>
          <div className="mt-4 space-y-3">
            {account.legacy_balances.map((b) => (
              <div key={b.legacy_wallet_id} className="text-sm">
                <p className="font-semibold">
                  {b.currency}:{" "}
                  {showBalance ? formatMoney(b.balance, b.currency) : "••••••"}{" "}
                  · {b.state.replaceAll("_", " ")}
                </p>
                {b.blockers.map((blocker) => (
                  <p key={blocker} className="mt-1">
                    {blocker.replaceAll("_", " ")}
                  </p>
                ))}
                {b.conversion_deadline && (
                  <p>
                    Conversion deadline:{" "}
                    {new Date(b.conversion_deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <div
        className={`grid grid-cols-1 gap-5 ${canUseNgn ? "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]" : ""}`}
      >
        {canUseNgn && (
          <ConvertCard
            key={currency}
            initialCurrency={currency}
            balances={Object.fromEntries(
              balances.map((b) => [b.currency, b.available_balance]),
            )}
            visible={showBalance}
            enabled={Object.fromEntries(
              balances.map((b) => [
                b.currency,
                canWriteBusiness && !isEntityRestricted(account?.entity) &&
                  isAccountReady(b.status) &&
                  balances.length > 1 &&
                  wallets.some((w) => w.wallet_id === b.wallet_id && !w.is_pnd &&
                    (isAccountReady(w.wallet_status ?? undefined) || (!isWalletOnly(w) && !w.wallet_status))),
              ]),
            )}
            entityId={account?.entity_id}
            onConvert={onConvert}
            onAddMoney={(source) => {
              if (user) setSelectedCurrency(source, user);
              onAction("topUp");
            }}
          />
        )}
        <MoneyMovement
          entityId={account?.entity_id}
          walletId={balance?.wallet_id}
          currency={currency}
          visible={showBalance}
        />
      </div>
      <RecentTransactions
        key={currency}
        entityId={account?.entity_id}
        walletId={balance?.wallet_id}
        currency={currency}
        global={global}
        onShare={detailsAvailable ? () => setModal("share") : undefined}
        onAddMoney={() => onAction("topUp")}
        canWrite={canReceive}
        atLimit={atLimit}
        onSend={writable ? () => onAction("send") : undefined}
      />
      {modal === "create-ngn" && <WalletDialog currency="NGN" create bankInReview={ngnBankReview} close={close} />}
      {canUseNgn && modal === "switch" && (
        <GlobalDialog title="Switch account" close={close} compact>
          <div className="space-y-4">
            {(["NGN", "USD"] as const).map((c) => {
              const b = balances.find((b) => b.currency === c);
              const selected = c === currency;
              return (
                <button
                  key={c}
                  disabled={!b}
                  aria-pressed={selected}
                  onClick={() => {
                    setSelectedCurrency(c, user);
                    close();
                  }}
                  className={`flex w-full items-center gap-[14px] overflow-hidden rounded-2xl border-solid p-4 text-left disabled:opacity-50 ${selected ? "border-[1.5px] border-[#b9b0f3] bg-[#f3f1fd]" : "border border-[#eaecf0]"}`}
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-[0.667px] border-[#e4e0ea] bg-[#fcfcfd]">
                    <img
                      src={asset(
                        c === "NGN"
                          ? "32310-11118-imgImage10.png"
                          : "32310-11118-imgImage11.png",
                      )}
                      alt=""
                      className="absolute left-1/2 top-1/2 h-[53.333px] w-[53.333px] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1 break-words leading-normal">
                    <span className="text-lg font-semibold leading-normal text-[#19151e]">
                      {showBalance
                        ? formatMoney(b?.available_balance, c)
                        : "••••••"}
                    </span>
                    <span
                      className={`text-[13px] text-[rgba(60,40,117,0.75)] ${c === "USD" ? "max-w-[236px]" : ""}`}
                    >
                      {c === "NGN"
                        ? "NGN · Naira balance"
                        : "USD · Global balance for USD, GBP, EUR, Stablecoins"}
                    </span>
                  </span>
                  {selected ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-primary2">
                      <DesignIcon name="32284-13677-imgVuesaxBoldTickCircle.svg" />
                    </span>
                  ) : (
                    <DesignIcon name="32284-13677-imgEllipse.svg" />
                  )}
                </button>
              );
            })}
          </div>
        </GlobalDialog>
      )}
      {modal === "share" && (
        <ShareAccounts
          accounts={currentAccounts}
          businessName={account?.business_name ?? ""}
          close={close}
        />
      )}
      {(modal === "EUR" || modal === "GBP" || modal === "SBC") && (
        <AddReceivingAccount
          asset={modal}
          close={close}
          existingAccounts={receiving}
          supportedAssets={usdReceiveAssets}
          onCreated={onCreated}
        />
      )}
      {detailId && (
        <AccountDetails
          accounts={instructions}
          initialId={detailId}
          businessName={account?.business_name ?? ""}
          entityId={account?.entity_id ?? ""}
          global={global}
          onAddCrypto={global && canWriteBusiness ? () => { setDetailId(null); setModal("SBC"); } : undefined}
          close={close}
        />
      )}
    </div>
  );
}
