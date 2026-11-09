"use client";

import { useEffect, useState } from "react";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useUser } from "@/lib/hooks/useUser";
import { isGlobalBalance } from "@/lib/globalBalance";
import BalanceTabs from "./_components/BalanceTabs";
import TransactionHistory from "./_components/TransactionHistory";

const TransactionsPage = () => {
  const { user } = useUser();
  const { setSelectedCurrency } = useCurrencyStore();
  const [currencyFilter, setCurrencyFilter] = useState("");

  useEffect(() => {
    if (!user) return;
    const currency = new URLSearchParams(window.location.search)
      .get("currency")
      ?.toUpperCase();
    if (
      !currency ||
      !["NGN", "USD", "EUR", "GBP", "USDT", "USDC"].includes(currency)
    ) {
      return;
    }
    setCurrencyFilter(currency);
    if (isGlobalBalance(user.business_account)) {
      setSelectedCurrency(currency === "NGN" ? "NGN" : "USD", user);
    } else if (
      currency === "NGN" ||
      currency === "USD" ||
      currency === "EUR" ||
      currency === "GBP"
    ) {
      setSelectedCurrency(currency, user);
    } else if (currency === "USDT" || currency === "USDC") {
      setSelectedCurrency("SBC", user);
    }
  }, [setSelectedCurrency, user]);

  return (
    <section className="mt-0 flex min-w-0 flex-col gap-6 font-monzo md:mt-[14px] md:gap-10 xl:-mx-3">
      <BalanceTabs />
      <TransactionHistory initialCurrencyFilter={currencyFilter} />
    </section>
  );
};

export default TransactionsPage;
