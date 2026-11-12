"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  FlowHeader,
  FlowCard,
  FlowChoice,
} from "@/components/transactions/send-flow/Flow";
import { useCreatedForeignAccounts } from "@/lib/hooks/useCreatedForeignAccounts";
import type { ForeignCurrency } from "@/types/services";
import ToUsdBanks from "./toBanks/ToUsdBanks";
import GlobalForeignSend from "./GlobalForeignSend";

export default function BankDestinations({ close }: { close: () => void }) {
  const accounts = useCreatedForeignAccounts();
  const [blocked, setBlocked] = useState<ForeignCurrency | null>(null);
  const [destination, setDestination] = useState<"us" | "gb" | "eu" | null>(
    null,
  );
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
          subtitle="ACH or wire · recipient gets USD"
          icon="/images/send/usd.png"
          onClick={() => setDestination("us")}
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
