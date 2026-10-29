"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  basicDetailsComplete,
  readAccountChoice,
  accountChoiceRoute,
} from "@/lib/onboarding";
import Link from "next/link";
import DashboardSummary from "./_components/DashboardSummary";
import DashboardSkeleton from "./_components/DashboardSkeleton";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useUser } from "@/lib/hooks/useUser";
import TransactionTable from "./_components/TransactionTable";
import CryptoDeposit from "./_components/crypto/dashboard/CryptoDeposit";
import {
  getOnboardingBranchState,
  hasCompletedUsdWallet,
} from "@/utils/onboardingBranch";

export default function Home() {
  const { selectedCurrency } = useCurrencyStore();
  const { user, isLoading } = useUser();
  const router = useRouter();
  const needsSetup = !!user && !user.business_account?.wallets?.length;
  useEffect(() => {
    if (!needsSetup || !user) return;
    const choice = readAccountChoice(user.business_account.entity_id);
    router.replace(
      !basicDetailsComplete(user)
        ? "/onboarding"
        : choice
          ? accountChoiceRoute(choice)
          : "/onboarding/accounts",
    );
  }, [needsSetup, user, router]);
  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;
  const branchState = getOnboardingBranchState(user, verificationStatus);

  if (isLoading || needsSetup) return <DashboardSkeleton />;
  return (
    <div className="flex flex-col gap-5 md:gap-0 min-w-0">
      {basicDetailsComplete(user) && !hasCompletedUsdWallet(user) && (
        <Link
          href="/onboarding/usd"
          className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-raiz-gray-200 bg-white p-5 font-monzo text-sm text-primary2"
        >
          <span>
            <span className="block font-semibold">
              Complete your USD business verification
            </span>
            <span className="mt-1 block text-xs text-raiz-gray-600">
              Resume your saved setup or view your review status.
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
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
            <Link
              href="/transactions"
              className="text-xs font-bold text-primary2"
            >
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
