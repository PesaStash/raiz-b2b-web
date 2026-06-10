"use client";
import React from "react";
import Link from "next/link";
import DashboardSummary from "./_components/DashboardSummary";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useUser } from "@/lib/hooks/useUser";
import TransactionTable from "./_components/TransactionTable";
import CryptoDeposit from "./_components/crypto/dashboard/CryptoDeposit";
import { getOnboardingBranchState } from "@/utils/onboardingBranch";

export default function Home() {
  const { selectedCurrency } = useCurrencyStore();
  const { user } = useUser();
  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;
  const branchState = getOnboardingBranchState(user, verificationStatus);

  return (
    <div className="flex flex-col gap-5 md:gap-0 min-w-0">
      <section className="md:p-6 md:xl:p-8 md:bg-raiz-gray-50 md:w-full md:items-center md:rounded-[20px] md:inline-flex md:flex-col md:justify-start md:gap-8 min-w-0">
        <DashboardSummary />
      </section>
      {selectedCurrency?.name === "SBC" && <CryptoDeposit />}
      {branchState.showDashboard && (
        <section className="min-w-0">
          <div className="flex items-center justify-between mb-3 md:hidden px-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-raiz-gray-500">
              Recent activity
            </p>
            <Link href="/transactions" className="text-xs font-bold text-primary2">
              View all →
            </Link>
          </div>
          <div className="md:p-6 md:xl:p-8 md:mt-10 md:bg-raiz-gray-50 md:w-full md:items-center md:rounded-[20px] md:inline-flex md:flex-col md:justify-start md:gap-8">
            <TransactionTable topRightOpts="link" />
          </div>
        </section>
      )}
    </div>
  );
}
