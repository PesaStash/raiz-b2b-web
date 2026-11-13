"use client";
/* eslint-disable @next/next/no-img-element -- Figma decoration is rendered at its intrinsic SVG size. */
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
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
import { isNigerianBusiness } from "@/utils/onboardingBranch";
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
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const account = user?.business_account;
  const global = isGlobalBalance(account);
  const isNigerian = isNigerianBusiness(user);
  const balances = spendableBalances(account);
  const currency: BalanceCurrency =
    !isNigerian || selectedCurrency.name !== "NGN" ? "USD" : "NGN";
  const balance = balances.find((b) => b.currency === currency);
  const otherCurrency = currency === "USD" ? "NGN" : "USD";
  const otherBalance = balances.find((b) => b.currency === otherCurrency);
  const [modal, setModal] = useState<
    "share" | "switch" | "EUR" | "GBP" | "SBC" | null
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
  const wallets = account?.wallets ?? [];
  const bankInstructions = wallets
    .filter(
      (w) =>
        w.wallet_type.currency === "USD" ||
        w.wallet_type.currency === "NGN" ||
        (!global &&
          (w.wallet_type.currency === "EUR" ||
            w.wallet_type.currency === "GBP")),
    )
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
  const hasWallet = wallets.some((w) => w.wallet_id === balance?.wallet_id);
  const writable =
    canWriteBusiness &&
    hasWallet &&
    !!balance &&
    (isAccountReady(balance.status) || balance.status.toLowerCase() === "approved");
  useEffect(() => {
    if (!user) return;
    if (!isNigerian && selectedCurrency.name !== "USD") {
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
  }, [global, isNigerian, user, selectedCurrency.name, setSelectedCurrency]);
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
            : "Set up your USD account"
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
          <Link
            href="/onboarding/usd"
            className="text-xs font-semibold text-primary2"
          >
            Set up
          </Link>
        ) : (
          canWriteBusiness &&
          global && (
            <button
              disabled={
                !balances.some(
                  (b) => b.currency === "USD" && isAccountReady(b.status),
                ) ||
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
            {empty
              ? "Your accounts are ready. Add money or share your details to get paid."
              : `${account?.business_name ?? ""} · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`}
          </p>
        </header>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_308px] desktop:grid-cols-[minmax(0,1fr)_360px]">
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
              {isNigerian &&
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
                {currency === "USD" && (
                  <div className="flex -space-x-2">
                    {["USD", "EUR", "GBP", "USDT", "USDC"].map((c) => (
                      <CurrencyFlag key={c} currency={c} small />
                    ))}
                  </div>
                )}
                <p className="text-xs text-white/80">
                  {currency === "USD"
                    ? global
                      ? "USD, EUR, GBP and stablecoins, all in USD"
                      : "Your available US Dollar balance"
                    : "Your available Naira balance"}
                </p>
              </div>
            </div>
            <div className="relative mt-auto grid grid-cols-2 divide-x divide-white/20 rounded-2xl bg-white/10 py-3">
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
            </div>
            <div
              className={`relative mt-[14px] grid gap-2.5 ${isNigerian ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}
            >
              {[
                { name: "Add money", key: "topUp", icon: "Add" },
                { name: "Send", key: "send", icon: "Send2" },
                ...(isNigerian
                  ? [
                      {
                        name: "Convert",
                        key: "convert",
                        icon: "ArrowSwapHorizontal1",
                      },
                    ]
                  : []),
                { name: "Request", key: "request", icon: "ReceiveSquare" },
              ].map((action) => (
                <button
                  key={action.key}
                  disabled={!writable}
                  onClick={() =>
                    action.key === "convert"
                      ? onConvert()
                      : onAction(action.key as "topUp" | "send" | "request")
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${action.key === "topUp" ? (currency === "NGN" ? "bg-white text-primary2" : "bg-white text-raiz-usd-primary") : "bg-white/15"}`}
                >
                  <DesignIcon
                    name={`${currency === "NGN" && action.key === "topUp" ? "32285-13423" : "32310-11118"}-imgVuesaxLinear${action.icon}.svg`}
                  />
                  {action.name}
                </button>
              ))}
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
                    Your account details
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
              <button
                onClick={() => setModal("share")}
                className="flex items-center gap-1.5 rounded-lg border border-kyb-border px-2.5 py-1.5 text-xs font-semibold text-primary2"
              >
                <DesignIcon name="32258-15724-imgVuesaxLinearSend2.svg" />
                Share
              </button>
            </header>
            <div
              id="account-details-panel"
              className={accountsOpen ? undefined : "hidden xl:block"}
            >
            {currency === "USD" ? (
              <div className="space-y-2">
                {row(
                  usdAccounts.find((a) => a.asset === "USD"),
                  "USD",
                )}
                {row(
                  usdAccounts.find((a) => a.asset === "EUR"),
                  "EUR",
                )}
                {row(
                  usdAccounts.find((a) => a.asset === "GBP"),
                  "GBP",
                )}
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
              <button
                disabled={!canWriteBusiness}
                onClick={onCreateNgn}
                className="my-10 text-sm font-semibold text-primary2"
              >
                Set up your Naira account →
              </button>
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
                ? global
                  ? "All of these arrive in your USD balance"
                  : "Share your details to receive a payment"
                : "Receive local transfers into your Naira balance"}
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
        className={`grid grid-cols-1 gap-5 ${isNigerian ? "lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]" : ""}`}
      >
        {isNigerian && (
          <ConvertCard
            balances={Object.fromEntries(
              balances.map((b) => [b.currency, b.available_balance]),
            )}
            visible={showBalance}
            enabled={Object.fromEntries(
              balances.map((b) => [
                b.currency,
                canWriteBusiness &&
                  isAccountReady(b.status) &&
                  balances.length > 1 &&
                  wallets.some((w) => w.wallet_id === b.wallet_id),
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
        onShare={() => setModal("share")}
        onAddMoney={() => onAction("topUp")}
        canWrite={writable}
      />
      {isNigerian && modal === "switch" && (
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
