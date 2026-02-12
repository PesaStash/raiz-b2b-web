"use client";
import React from "react";
// import Header from "./_components/Header";
import DashboardSummary from "./_components/DashboardSummary";
// import QuickLinks from "./_components/QuickLinks";
// import Transactions from "./_components/Transactions";
// import BillRequests from "./_components/BillRequests";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import CryptoDashboard from "./_components/crypto/dashboard/CryptoDashboard";
import { useUser } from "@/lib/hooks/useUser";
// import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import TransactionTable from "./_components/TransactionTable";
import BillRequests from "./_components/BillRequests";

export default function Home() {
  const { selectedCurrency } = useCurrencyStore();
  const { user } = useUser();
  // const currentWallet = useCurrentWallet(user);
  if (selectedCurrency.name === "SBC") {
    return <CryptoDashboard />;
  }
  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;

  return (
    <>
      <section className="p-8 bg-raiz-gray-50 w-full items-center rounded-[20px] inline-flex flex-col justify-start  gap-8">
        <DashboardSummary />
      </section>
      <section className="p-8 mt-10 bg-raiz-gray-50 w-full items-center rounded-[20px] inline-flex flex-col justify-start  gap-8">
        {verificationStatus === "completed" && (
          <>
            {/* <BillRequests /> */}
            <TransactionTable topRightOpts="link" />
          </>
        )}
      </section>
    </>
  );
}
