"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  FlowHeader,
  FlowCard,
  FlowChoice,
} from "@/components/transactions/send-flow/Flow";
import { isWalletOnly } from "@/lib/businessWallets";
import { useCreatedForeignAccounts } from "@/lib/hooks/useCreatedForeignAccounts";
import { useUser } from "@/lib/hooks/useUser";
import type { ForeignCurrency } from "@/types/services";
import ToUsdBanks from "./toBanks/ToUsdBanks";
import GlobalForeignSend from "./GlobalForeignSend";

export default function BankDestinations({ close }: { close: () => void }) {
  const { user } = useUser();
  const accounts = useCreatedForeignAccounts();
  const [blocked, setBlocked] = useState<ForeignCurrency | null>(null);
  const [walletNotice, setWalletNotice] = useState(false);
  const [destination, setDestination] = useState<"us" | "gb" | "eu" | null>(
    null,
  );
  const usdWallets =
    user?.business_account?.wallets?.filter(
      (wallet) => wallet.wallet_type.currency === "USD",
    ) ?? [];
  const usdWalletOnly = usdWallets.length > 0 && usdWallets.every(isWalletOnly);
  const openForeign = (currency: ForeignCurrency) => {
    if (accounts.isChecking) return;
    if (!accounts.has(currency)) {
      if (accounts.isError) {
        setBlocked(currency);
        return;
      }
      toast.info(
        `Create a ${currency} account before you add a ${currency} beneficiary or send ${currency}.`,
      );
      return;
    }
    setBlocked(null);
    setDestination(currency === "GBP" ? "gb" : "eu");
  };
  const foreignSubtitle = (currency: ForeignCurrency, ready: string) => {
    if (accounts.isChecking) return `Checking your ${currency} account…`;
    if (accounts.isError && !accounts.has(currency))
      return `Couldn’t check your ${currency} account`;
    if (!accounts.has(currency))
      return `Create a ${currency} account to send ${currency}`;
    return ready;
  };
  if (destination === "us")
    return <ToUsdBanks close={() => setDestination(null)} bankType="us" />;
  if (destination === "gb")
    return (
      <GlobalForeignSend currency="GBP" close={() => setDestination(null)} />
    );
  if (destination === "eu")
    return (
      <GlobalForeignSend currency="EUR" close={() => setDestination(null)} />
    );
  return (
    <>
      <FlowHeader
        title="Where is their bank?"
        subtitle="They receive the local currency. You pay from your USD balance."
        onBack={close}
      />
      <FlowCard>
        <FlowChoice
          title="United States"
          subtitle={
            usdWalletOnly
              ? "Needs a USD account, not a wallet"
              : "ACH or wire · recipient gets USD"
          }
          icon="/images/send/usd.png"
          onClick={() => {
            if (usdWalletOnly) {
              setWalletNotice(true);
              return;
            }
            setDestination("us");
          }}
        />
        <FlowChoice
          title="United Kingdom"
          subtitle={foreignSubtitle("GBP", "Recipient gets GBP")}
          icon="/images/send/gbp.png"
          onClick={() => openForeign("GBP")}
        />
        <FlowChoice
          title="Europe"
          subtitle={foreignSubtitle("EUR", "Recipient gets EUR")}
          icon="/images/send/eur.png"
          onClick={() => openForeign("EUR")}
        />
        {walletNotice && (
          <p role="status" className="rounded-xl bg-[#f1edff] p-4 text-sm">
            <strong>You need a USD account</strong>
            <span className="mt-1 block text-xs text-[#79708d]">
              A USD wallet can’t send a bank transfer. Bank transfers to a US
              bank are available from a USD account.
            </span>
          </p>
        )}
        {blocked && accounts.isError && !accounts.has(blocked) && (
          <p role="alert" className="text-sm text-[#d92d20]">
            Couldn’t check your {blocked} account.{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => accounts.retry()}
            >
              Retry
            </button>
          </p>
        )}
      </FlowCard>
    </>
  );
}
