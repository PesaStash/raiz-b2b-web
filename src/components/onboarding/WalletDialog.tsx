"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DesignIcon, GlobalDialog } from "@/app/(dashboard)/_components/global/GlobalUI";
import { readApiError } from "@/lib/apiError";
import { useUser } from "@/lib/hooks/useUser";
import { spendableBalances } from "@/lib/globalBalance";
import { accountAccess } from "@/lib/permissions";
import { CreateNgnWalletApi } from "@/services/business";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { canCreateNgnWallet, isNigerianBusiness } from "@/utils/onboardingBranch";
import { NGN_REQUIREMENTS_QUERY_KEY } from "@/utils/ngnKyb";

export default function WalletDialog({
  currency,
  close,
  create = false,
  bankInReview = false,
}: {
  currency: "USD" | "NGN";
  close: () => void;
  create?: boolean;
  bankInReview?: boolean;
}) {
  const { user, refetch } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSelectedCurrency = useCurrencyStore((state) => state.setSelectedCurrency);
  const [walletId, setWalletId] = useState<string>();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState(false);
  const openingRef = useRef(false);
  const creatingRef = useRef(false);
  const phase = create && !walletId;
  const ngn = currency === "NGN";
  const name = ngn ? "naira" : "USD";
  const business = user?.business_account;
  const verification = business?.business_verifications?.[0]?.verification_status;
  const canCreate = canCreateNgnWallet(user, verification);
  const createMutation = useMutation({
    mutationFn: CreateNgnWalletApi,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user"] }),
        queryClient.invalidateQueries({ queryKey: ["receiving-accounts", business?.entity_id] }),
        queryClient.invalidateQueries({ queryKey: NGN_REQUIREMENTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["ngn-payout-settings"] }),
      ]);
      setWalletId(result.wallet_id);
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: ["user"] }),
    onSettled: () => { creatingRef.current = false; },
  });
  const error = readApiError(createMutation.error);
  const provisioning = error.status === 409;
  const needsAddress = /address/i.test(error.message ?? "");
  const needsVerification = /basic KYB/i.test(error.message ?? "");
  const existing = business?.wallets.find(
    (wallet) => wallet.wallet_type.currency === currency && wallet.wallet_status === "completed",
  );
  const busy = createMutation.isPending || opening;
  const title = phase ? "Create your naira wallet" : `Your ${name} wallet is ready`;
  const limitLabelId = useId();

  const openWallet = async () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    setOpenError(false);
    try {
      const result = await refetch();
      const updated = result.data;
      const expectedId = walletId ?? existing?.wallet_id;
      if (result.error || !updated?.business_account?.wallets.some(
        (wallet) => wallet.wallet_id === expectedId &&
          wallet.wallet_type.currency === currency && wallet.wallet_status === "completed",
      )) {
        setOpenError(true);
        return;
      }
      setSelectedCurrency(currency, updated, expectedId);
      router.push("/");
      close();
    } finally {
      openingRef.current = false;
      setOpening(false);
    }
  };
  const dismiss = () => { if (!creatingRef.current && !openingRef.current) close(); };
  const continueToWallet = () => {
    if (!phase || existing) {
      void openWallet();
      return;
    }
    if (!canCreate || creatingRef.current) return;
    creatingRef.current = true;
    createMutation.mutate();
  };
  const balances = spendableBalances(business);
  const supportedUsdAssets = balances.find((balance) => balance.currency === "USD")?.supported_receive_assets;
  const supportsStablecoins = supportedUsdAssets?.some((asset) => asset === "USDT" || asset === "USDC");
  const canWrite = accountAccess(user).canWriteBusiness;
  const benefits = ngn
    ? [
      "Hold up to ₦300,000 at a time",
      ...(canWrite ? ["Send money using supported payment methods", "Convert when you also have a USD wallet"] : []),
    ]
    : [
      "Hold a USD balance",
      ...(supportsStablecoins ? ["Receive supported stablecoins into USD"] : []),
      ...(canWrite ? ["Send or convert using available payment methods"] : []),
    ];

  return (
    <GlobalDialog title={title} close={dismiss} hero variant="wallet">
      <div className="space-y-5 overflow-y-auto p-6 sm:p-8">
        <header className="text-center">
          <div className={`mx-auto mb-4 flex items-center justify-center rounded-full ${ngn ? "size-14 [&_img]:scale-[1.55556]" : "size-20 bg-[#fdf5e1]"}`}>
            <DesignIcon name={ngn ? "wallet-ngn-flag.svg" : "wallet-confetti.svg"} />
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1.5 text-sm text-kyb-muted">
            {phase ? "Hold and pay in naira using your saved business details."
              : bankInReview ? `Use it while we review your ${name} bank account.`
              : `You can now access your ${name} balance.`}
          </p>
        </header>
        <div className="space-y-4 rounded-2xl bg-kyb-selected p-5 text-sm">
          <div>
            <h3 className="mb-2 font-semibold">{phase ? "What you can do" : "What you can do now"}</h3>
            <ul className="space-y-2">
              {benefits.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <DesignIcon name="wallet-check.svg" /> {item}
                </li>
              ))}
            </ul>
          </div>
          {!phase && (
            <div>
              <h3 className="mb-2 font-semibold">Dedicated bank details</h3>
              <p className="flex items-center gap-2 text-kyb-muted">
                <DesignIcon name="wallet-clock.svg" />
                {bankInReview ? "Available once bank account setup completes."
                  : ngn ? "Available after eligible businesses complete bank account setup."
                  : "Contact your account manager if you need USD bank details."}
              </p>
            </div>
          )}
        </div>
        {ngn && <p id={limitLabelId} className="text-center text-xs text-kyb-muted">
          {phase ? "We’ll use the business details you’ve already saved." : "The ₦300,000 maximum balance also applies after bank details are added."}
        </p>}
        {phase && createMutation.isError && (
          <div role="alert" className="space-y-2 text-sm text-red-700">
            <p>{provisioning ? "Naira bank account setup is already in progress."
              : error.status === 503 || error.status === 404 ? "Naira wallet creation is temporarily unavailable."
              : error.status === 403 ? "Your account doesn’t have permission to create this wallet."
              : needsAddress || needsVerification ? error.message
              : "We couldn’t confirm wallet creation. Refresh your setup or try again."}</p>
            {provisioning && isNigerianBusiness(user) && <Link href="/onboarding/ngn" onClick={close} className="underline">View existing setup</Link>}
            {provisioning && existing && <button className="underline" type="button" onClick={() => void openWallet()}>Open existing wallet</button>}
            {(needsAddress || needsVerification) && <Link href="/onboarding/business" onClick={close} className="underline">Go to business verification</Link>}
          </div>
        )}
        {openError && <p role="alert" className="text-sm text-red-700">We couldn’t refresh your wallet. Try opening it again.</p>}
        <div className="grid gap-2">
          <button
            type="button"
            aria-describedby={ngn ? limitLabelId : undefined}
            disabled={busy || (phase && (provisioning || error.status === 403 || (!canCreate && !existing)))}
            onClick={continueToWallet}
            className={`min-h-12 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${ngn ? "bg-primary2" : "bg-raiz-usd-primary"}`}
          >
            {createMutation.isPending ? "Creating…" : opening ? "Opening…"
              : phase && !existing ? "Create naira wallet" : `Go to ${name} wallet`}
          </button>
          {phase && <button type="button" className="min-h-12 rounded-xl border border-kyb-border text-sm font-semibold" disabled={busy} onClick={dismiss}>Not now</button>}
        </div>
      </div>
    </GlobalDialog>
  );
}
