"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Categories from "@/components/transactions/Categories";
import EnterPin from "@/components/transactions/EnterPin";
import {
  FlowActions,
  FlowAmount,
  FlowCard,
  FlowHeader,
  FlowRecipient,
  FlowRow,
  FlowTotal,
} from "@/components/transactions/send-flow/Flow";
import SendProcessing from "@/components/transactions/send-flow/SendProcessing";
import { formatMoney, spendableBalances } from "@/lib/globalBalance";
import { useUser } from "@/lib/hooks/useUser";
import { useQuoteSeconds } from "@/lib/hooks/useQuoteSeconds";
import {
  QuoteCryptoPayoutApi,
  SendCryptoPayoutApi,
} from "@/services/treasuryPayout";
import { useSendStore } from "@/store/Send";
import type { CryptoNetwork } from "@/types/globalBalance";
import type {
  CryptoPayoutAsset,
  TreasuryPayoutQuote,
  TreasuryPayoutResult,
} from "@/types/treasuryPayout";
import { getApiErrorMessage } from "@/utils/helpers";

type Step =
  | "asset"
  | "network"
  | "address"
  | "amount"
  | "category"
  | "review"
  | "pin"
  | "status";
const networks: {
  value: CryptoNetwork;
  title: string;
  fee: string;
  time: string;
  icon: string;
  recommended?: boolean;
}[] = [
  {
    value: "tron",
    title: "Tron (TRC-20)",
    fee: "$1.00",
    time: "~2 mins",
    icon: "tron",
    recommended: true,
  },
  {
    value: "bsc",
    title: "BNB Smart Chain (BEP-20)",
    fee: "$0.50",
    time: "~1 min",
    icon: "bsc",
  },
  {
    value: "polygon",
    title: "Polygon",
    fee: "$0.20",
    time: "~2 mins",
    icon: "polygon",
  },
  {
    value: "ethereum",
    title: "Ethereum (ERC-20)",
    fee: "$5.00",
    time: "~5 mins",
    icon: "ethereum",
  },
];

export default function CryptoSend({ close }: { close: () => void }) {
  const { user } = useUser();
  const qc = useQueryClient();
  const { amount, purpose, category, actions } = useSendStore();
  const [step, setStep] = useState<Step>("asset");
  const [asset, setAsset] = useState<CryptoPayoutAsset>("USDT");
  const [network, setNetwork] = useState<CryptoNetwork>("tron");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [quote, setQuote] = useState<TreasuryPayoutQuote | null>(null);
  const [result, setResult] = useState<TreasuryPayoutResult | null>(null);
  const [error, setError] = useState("");
  const quoteKey = useRef(crypto.randomUUID());
  const sendKey = useRef(crypto.randomUUID());
  const usdBalance = Number(
    spendableBalances(user?.business_account).find(
      (item) => item.currency === "USD",
    )?.available_balance ?? 0,
  );
  const seconds = useQuoteSeconds(quote?.expires_at);
  const selectedNetwork = networks.find((item) => item.value === network)!;
  const fee = useMemo(
    () =>
      quote?.fees.reduce((sum, item) => sum + Number(item.amount.amount), 0) ??
      0,
    [quote],
  );
  const amountValid = /^\d+(\.\d{0,6})?$/.test(amount) && Number(amount) > 0;
  const quoteMutation = useMutation({
    mutationFn: () =>
      QuoteCryptoPayoutApi(
        {
          asset,
          network,
          destination_address: address.trim(),
          asset_amount: amount,
        },
        quoteKey.current,
      ),
    onSuccess: (data) => {
      setQuote(data);
      setError("");
      setStep("category");
    },
    onError: (err) =>
      setError(
        getApiErrorMessage(
          err,
          "We couldn’t get a live crypto quote. Please try again.",
        ),
      ),
  });
  const sendMutation = useMutation({
    mutationFn: (pin: string) =>
      SendCryptoPayoutApi(
        {
          quote_id: quote!.quote_id,
          transaction_pin: pin,
          transaction_reason: purpose,
          transaction_category_id: category?.transaction_category_id,
        },
        sendKey.current,
      ),
    onMutate: () => {
      setError("");
      setStep("status");
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
    },
    onError: (err) =>
      setError(
        getApiErrorMessage(err, "The crypto transfer could not be submitted."),
      ),
  });
  const resetQuote = () => {
    quoteKey.current = crypto.randomUUID();
    sendKey.current = crypto.randomUUID();
    setQuote(null);
    setStep("amount");
  };

  if (step === "asset")
    return (
      <>
        <FlowHeader
          title="What are you sending?"
          subtitle="Paid 1:1 from your USD balance"
          onBack={close}
        />
        <FlowCard className="!gap-0">
          {(
            [
              { value: "USDT", name: "Tether", icon: "/images/send/usdt.svg" },
              { value: "USDC", name: "USD Coin", icon: "/icons/usdc.svg" },
            ] as const
          ).map((coin) => (
            <button
              key={coin.value}
              type="button"
              onClick={() => {
                setAsset(coin.value);
                setStep("network");
              }}
              className="flex min-h-[60px] items-center gap-3 rounded-xl px-3 text-left hover:bg-[#f8f7fa]"
            >
              <Image src={coin.icon} width={40} height={40} alt="" />
              <span className="flex-1">
                <strong className="block text-sm">{coin.value}</strong>
                <small className="text-[#79708d]">
                  {coin.name} · 1 {coin.value} = 1 USD
                </small>
              </span>
              <span className="text-xl text-[#8c86a0]">→</span>
            </button>
          ))}
        </FlowCard>
      </>
    );
  if (step === "network")
    return (
      <>
        <FlowHeader
          title={`Choose a network for ${asset}`}
          subtitle="Use the same network as the receiving wallet"
          onBack={() => setStep("asset")}
        />
        <FlowCard>
          {networks.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setNetwork(item.value);
                setStep("address");
              }}
              className="flex min-h-[68px] items-center gap-3 rounded-xl px-3 text-left hover:bg-[#f8f7fa]"
            >
              <Image
                src={`/images/send/${item.icon}.svg`}
                width={40}
                height={40}
                alt=""
              />
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <strong className="text-sm">{item.title}</strong>
                  {item.recommended && (
                    <small className="rounded-full bg-[#e8f6ee] px-2 py-0.5 text-[10px] text-[#1f9d55]">
                      Lowest fee
                    </small>
                  )}
                </span>
                <small className="mt-1 block text-[#79708d]">
                  Fee {item.fee} · about {item.time.replace("~", "")}
                </small>
              </span>
              <span className="text-xl text-[#8c86a0]">→</span>
            </button>
          ))}
          <div className="rounded-xl bg-[#f1edff] p-4">
            <strong className="text-sm">Check the receiving network</strong>
            <p className="mt-1 text-xs text-[#79708d]">
              Using a different network can lead to a permanent loss of funds.
            </p>
          </div>
        </FlowCard>
      </>
    );
  if (step === "address")
    return (
      <>
        <FlowHeader
          title={`Send ${asset}`}
          subtitle={`${selectedNetwork.title.replace("-", "")} network`}
          onBack={() => setStep("network")}
        />
        <FlowCard>
          <label className="text-xs">
            Wallet address
            <input
              autoFocus
              className="mt-2 h-12 w-full rounded-xl border-0 bg-[#f4f4f8] px-4 text-sm outline-none ring-1 ring-transparent focus:bg-white focus:ring-primary2"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Paste wallet address"
            />
          </label>
          {address.trim().length >= 8 && (
            <p className="-mt-1 text-xs text-[#79708d]">
              Valid {network === "tron" ? "Tron" : selectedNetwork.title}{" "}
              address
            </p>
          )}
          <label className="text-xs">
            Label · optional
            <input
              className="mt-2 h-12 w-full rounded-xl border-0 bg-[#f4f4f8] px-4 text-sm outline-none ring-1 ring-transparent focus:bg-white focus:ring-primary2"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. My Binance"
            />
          </label>
          <div className="flex items-center justify-between text-sm">
            <span>Save this wallet address</span>
            <span className="relative h-6 w-11 rounded-full bg-primary2">
              <span className="absolute right-0.5 top-0.5 size-5 rounded-full bg-white" />
            </span>
          </div>
          <div className="rounded-xl bg-[#f1edff] p-4">
            <strong className="text-sm">Before you continue</strong>
            <p className="mt-1 text-xs text-[#79708d]">
              Only send {asset} on {selectedNetwork.title}. Crypto sends can’t
              be reversed.
            </p>
          </div>
          <FlowActions
            onNext={() => setStep("amount")}
            disabled={address.trim().length < 8}
          />
        </FlowCard>
      </>
    );
  if (step === "category")
    return (
      <Categories
        goBack={() => setStep("amount")}
        goNext={() => setStep("review")}
        loading={false}
      />
    );
  if (step === "pin")
    return (
      <EnterPin
        pin=""
        setPin={(pin) => sendMutation.mutate(pin)}
        close={() => setStep("review")}
        disabled={!quote || seconds <= 0}
        error={error}
        onNewQuote={seconds <= 0 ? resetQuote : undefined}
        transfer={{
          recipient: label || `${address.slice(0, 6)}…${address.slice(-4)}`,
          amount,
          currency: asset,
          debit: quote?.total_debit.amount,
          sourceCurrency: "USD",
        }}
      />
    );
  if (step === "status") {
    const pending = sendMutation.isPending;
    const failed = !!error;
    if (pending) {
      return (
        <SendProcessing
          title={`Sending ${amount} ${asset} to ${label || "receiving wallet"}`}
        />
      );
    }
    if (failed) {
      return (
        <>
          <FlowHeader
            title="Transfer didn’t go through"
            onBack={() => setStep("review")}
          />
          <FlowCard className="items-center text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-[#fff0ee] text-4xl">
              !
            </div>
            <h2 className="text-2xl font-semibold">{error}</h2>
            <FlowActions
              onNext={() => setStep("review")}
              nextLabel="Check details and try again"
            />
          </FlowCard>
        </>
      );
    }
    return (
      <FlowCard className="!gap-5 !pt-9">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex size-24 items-center justify-center rounded-full bg-[#f1edff]">
            <Image
              src="/images/send/pending.svg"
              width={52}
              height={52}
              alt=""
            />
          </div>
          <h2 className="text-[28px] font-semibold">
            {Number(amount)} {asset} transfer submitted
          </h2>
          <p className="text-sm text-[#79708d]">
            {selectedNetwork.title} · Awaiting network confirmation
          </p>
          <span className="rounded-full bg-[#f4f4f8] px-3 py-1 text-xs font-semibold">
            {formatMoney(quote?.total_debit.amount ?? amount, "USD")} from your
            USD balance
          </span>
        </div>
        <div className="rounded-2xl border border-[#eaecf0] p-5 text-sm">
          <p className="font-semibold text-primary2">
            ✓{" "}
            <span className="ml-2 text-[#14141e]">
              Paid from your USD balance
            </span>
          </p>
          <p className="ml-7 text-xs text-[#79708d]">
            {formatMoney(quote?.total_debit.amount ?? amount, "USD")}, including{" "}
            {formatMoney(fee, "USD")} network fee
          </p>
          <p className="mt-4 font-semibold text-[#d99b16]">
            ◷ <span className="ml-2 text-[#14141e]">Sent to the network</span>
          </p>
          <p className="ml-7 text-xs text-[#79708d]">{selectedNetwork.title}</p>
          <p className="mt-4 font-semibold text-[#c4bfd2]">
            ○ <span className="ml-2 text-[#79708d]">Receiving wallet</span>
          </p>
          <p className="ml-7 text-xs text-[#79708d]">
            {address.slice(0, 6)}…{address.slice(-6)} · {label}
          </p>
        </div>
        <div className="rounded-xl bg-[#f1edff] p-4">
          <strong className="text-sm">About this transfer</strong>
          <p className="mt-1 text-xs text-[#79708d]">
            Network confirmation times may vary. Crypto sends can’t be reversed.
          </p>
        </div>
        {result?.transaction_report?.transaction_reference && (
          <p className="text-xs text-[#79708d]">
            Reference {result.transaction_report.transaction_reference}
          </p>
        )}
        <FlowActions
          onBack={close}
          backLabel="Done"
          onNext={close}
          nextLabel="View transfer details"
        />
      </FlowCard>
    );
  }
  if (step === "review" && quote)
    return (
      <>
        <FlowHeader
          title="Review your transfer"
          onBack={() => setStep("category")}
        />
        <FlowCard>
          <div className="flex items-center gap-3">
            <Image
              src={
                asset === "USDT" ? "/images/send/usdt.svg" : "/icons/usdc.svg"
              }
              width={44}
              height={44}
              alt=""
            />
            <strong>
              {asset} on {selectedNetwork.title}
            </strong>
          </div>
          <p className="text-4xl font-semibold">
            {formatMoney(quote.total_debit.amount, "USD")}
          </p>
          <p className="text-sm text-[#79708d]">
            Total USD deducted from your balance
          </p>
          <FlowRow label="To">
            {label || `${address.slice(0, 8)}…${address.slice(-6)}`}
          </FlowRow>
          <FlowRow label="Network">{selectedNetwork.title}</FlowRow>
          <FlowRow label="Send amount">
            {quote.destination_money.amount} {asset}
          </FlowRow>
          <FlowRow label="Fee">{formatMoney(fee, "USD")}</FlowRow>
          <FlowRow label="Total USD deducted">
            {formatMoney(quote.total_debit.amount, "USD")}
          </FlowRow>
          <FlowRow label="Rate">1 {asset} = 1 USD</FlowRow>
          <FlowRow label="Recipient gets">
            {quote.destination_money.amount} {asset}
          </FlowRow>
          <p className="rounded-xl bg-[#fff8e8] p-3 text-xs text-[#6f5613]">
            Crypto transfers are irreversible. Check the address and network
            before continuing.
          </p>
          <p
            className={`text-xs ${seconds <= 0 ? "text-[#d92d20]" : "text-[#79708d]"}`}
          >
            {seconds > 0
              ? `Quote valid for ${seconds}s`
              : "This quote has expired."}
          </p>
          <FlowActions
            onBack={() => setStep("category")}
            onNext={() => setStep("pin")}
            disabled={
              seconds <= 0 || Number(quote.total_debit.amount) > usdBalance
            }
            nextLabel={`Send ${amount} ${asset}`}
          />
          {seconds <= 0 && (
            <FlowActions onNext={resetQuote} nextLabel="Get new quote" />
          )}
        </FlowCard>
      </>
    );
  return (
    <>
      <FlowHeader title="Send money" onBack={() => setStep("address")} />
      <FlowCard>
        <FlowRecipient
          name={label || "Wallet"}
          detail={`${address.slice(0, 6)}…${address.slice(-6)} · ${selectedNetwork.title}`}
          onChange={() => setStep("address")}
        />
        <FlowAmount
          currency={asset}
          amount={amount}
          recipient={label || "wallet"}
          decimals={6}
          onChange={(value) =>
            actions.setAmountAndRemark({ amount: value, purpose })
          }
        />
        <FlowRow label="Rate">1 {asset} = 1 USD</FlowRow>
        <FlowRow label="Arrives">
          {selectedNetwork.time.replace("~", "About ")}
        </FlowRow>
        <FlowRow label="You send">
          $
          {Number(amount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </FlowRow>
        <FlowRow label="Network fee">Calculated in your live quote</FlowRow>
        <FlowTotal currency="USD" balance={usdBalance} />
        <div className="rounded-xl bg-[#f1edff] p-4">
          <strong className="text-sm">Check before sending</strong>
          <p className="mt-1 text-xs text-[#79708d]">
            Crypto sends can’t be reversed. Check the wallet address and
            network.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-[#d92d20]">
            {error}
          </p>
        )}
        <FlowActions
          onNext={() => quoteMutation.mutate()}
          disabled={!amountValid}
          loading={quoteMutation.isPending}
        />
      </FlowCard>
    </>
  );
}
