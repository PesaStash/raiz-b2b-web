"use client";
import { useState } from "react";
import {
  FlowHeader,
  FlowCard,
  FlowChoice,
} from "@/components/transactions/send-flow/Flow";
import ToUsdBanks from "./toBanks/ToUsdBanks";
import GlobalForeignSend from "./GlobalForeignSend";

export default function BankDestinations({ close }: { close: () => void }) {
  const [destination, setDestination] = useState<"us" | "gb" | "eu" | null>(
    null,
  );
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
            subtitle="Recipient gets GBP"
            icon="/images/send/gbp.png"
            onClick={() => setDestination("gb")}
          />
          <FlowChoice
            title="Europe"
            subtitle="Recipient gets EUR"
            icon="/images/send/eur.png"
            onClick={() => setDestination("eu")}
          />
      </FlowCard>
    </>
  );
}
