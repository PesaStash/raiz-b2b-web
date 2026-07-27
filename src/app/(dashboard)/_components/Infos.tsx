"use client";
import Spinner from "@/components/ui/Spinner";
import { useUser } from "@/lib/hooks/useUser";
import { CreateUSDWalletApi } from "@/services/business";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { findWalletByCurrency } from "@/utils/helpers";
import {
  canCreateNgnWallet,
  canStartUsdVerification,
  canSetTransactionPin,
  dismissInfosAddAccounts,
  isInfosAddAccountsDismissed,
  resetInfosAddAccountsDismissed,
  shouldPromptAddUsdAccount,
} from "@/utils/onboardingBranch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import CreateNgnAcct from "./createNgnAcct/CreateNgnAcct";
import SetTransactionPin from "./transaction-pin/SetTransactionPin";
import { AnimatePresence, motion } from "motion/react";
import SideModalWrapper from "./SideModalWrapper";
import BusinessVerificationModal from "@/app/(dashboard)/_components/BusinessVerificationModal";
import { MdArrowRightAlt } from "react-icons/md";
import CreateForeignAcct from "./createForeignAcct/CreateForeignAcct";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";

type ModalKey = "acctSetup" | "getNgn" | "getGbp" | "getEur" | "set-pin";

interface ActionItem {
  key: ModalKey | "getUsd";
  condition: boolean;
  icon: ReactNode;
  label: string;
  sublabel: string;
  onAction: () => void;
  ctaLabel: string;
}

interface InfosProps {
  isNgnBranch?: boolean;
  onRequireKyb?: () => void;
}

interface ActionSectionProps {
  title: string;
  items: ActionItem[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  onCta: () => void;
  layoutId: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  isUsdPending?: boolean;
}

const PinSetupBanner = ({ onSetUpPin }: { onSetUpPin: () => void }) => (
  <div className="mt-4 rounded-2xl bg-[#FFF3E666] px-3 py-4 sm:mt-5 sm:px-4 md:px-5 md:py-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:items-start md:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white md:h-12 md:w-12">
          <svg
            className="h-[26px] w-[26px] md:h-[30px] md:w-[30px]"
            viewBox="0 0 30 31"
            fill="none"
            aria-hidden
          >
            <path
              opacity="0.55"
              d="M22.5 26.73H7.5C5.43 26.73 3.75 25.05 3.75 22.98V12.98C3.75 10.91 5.43 9.23 7.5 9.23H22.5C24.57 9.23 26.25 10.91 26.25 12.98V22.98C26.25 25.05 24.57 26.73 22.5 26.73Z"
              fill="#F7A900"
            />
            <path
              d="M10 9.23C10 6.47 12.24 4.23 15 4.23C17.76 4.23 20 6.47 20 9.23H22.5C22.5 5.09 19.14 1.73 15 1.73C10.86 1.73 7.5 5.09 7.5 9.23H10Z"
              fill="#292D32"
            />
            <path
              d="M15 19.86C16.04 19.86 16.88 19.02 16.88 17.98C16.88 16.94 16.04 16.11 15 16.11C13.96 16.11 13.13 16.94 13.13 17.98C13.13 19.02 13.96 19.86 15 19.86Z"
              fill="#6C265B"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-bold leading-snug text-raiz-gray-950 sm:text-sm md:text-base">
            Secure your Account
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-[#6F5B86] sm:mt-1 sm:text-sm">
            Set a transaction PIN to approve transfers and other sensitive
            actions.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSetUpPin}
        className="group inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full border-2 border-[#F8F7FA] bg-white px-5 text-sm font-bold text-[#3C2875] transition-all active:scale-[0.98] hover:bg-gray-50 sm:h-10 sm:w-auto"
      >
        Set Up PIN
        <MdArrowRightAlt className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  </div>
);

const ActionSection = ({
  title,
  items,
  selectedKey,
  onSelectKey,
  onCta,
  layoutId,
  dismissible,
  onDismiss,
  isUsdPending,
}: ActionSectionProps) => {
  const visibleItems = items.filter((item) => item.condition);
  if (visibleItems.length === 0) return null;

  const selected =
    visibleItems.find((item) => item.key === selectedKey) ?? visibleItems[0];

  const gridColsClass =
    visibleItems.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className="mt-4 rounded-2xl border px-3 py-4 shadow-[0_4px_16px_rgba(45,25,88,0.06)] sm:mt-5 sm:px-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary2/60">
          {title}
        </p>
        {dismissible && onDismiss ? (
          <button
            onClick={onDismiss}
            className="text-raiz-gray-400 hover:text-raiz-gray-600 text-lg leading-none p-0.5"
            aria-label="Dismiss"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className={`grid gap-2 ${gridColsClass} sm:flex sm:flex-wrap`}>
          {visibleItems.map((item) => {
            const isActive = selected.key === item.key;
            return (
              <motion.button
                key={item.key}
                onClick={() => onSelectKey(item.key)}
                whileTap={{ scale: 0.96 }}
                className={`relative flex w-full items-center gap-2 rounded-[14px] border px-3.5 py-2.5 text-left transition-all duration-150 sm:w-auto sm:gap-2.5 ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-raiz-gray-200 bg-white text-raiz-gray-800 hover:border-primary/40 hover:bg-violet-50/40"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isActive ? "bg-white/20" : "bg-raiz-gray-50"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex min-w-0 flex-1 flex-col sm:flex-none">
                  <span
                    className={`text-[13px] font-bold leading-tight max-sm:truncate ${isActive ? "text-white" : "text-raiz-gray-950"}`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`text-[11px] leading-none max-sm:truncate ${isActive ? "text-white/70" : "text-raiz-gray-500"}`}
                  >
                    {item.sublabel}
                  </span>
                </span>
                {isActive && (
                  <motion.span
                    layoutId={layoutId}
                    className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/25 sm:ml-1"
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path
                        d="M1 3.5L3.5 6L8 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={onCta}
          disabled={isUsdPending && selected.key === "getUsd"}
          className="group inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-white transition-all active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(92,34,176,0.28)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:w-auto"
        >
          {isUsdPending && selected.key === "getUsd" ? (
            <Spinner className="!h-3.5 !w-3.5 !border-t-2 !border-b-2" />
          ) : null}
          {selected.ctaLabel}
          {!(isUsdPending && selected.key === "getUsd") && (
            <MdArrowRightAlt className="size-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};

const Infos = ({ isNgnBranch = false, onRequireKyb }: InfosProps) => {
  const [showModal, setShowModal] = useState<ModalKey | null>(null);
  const [selectedAccountKey, setSelectedAccountKey] = useState<string | null>(
    null
  );
  const [isAccountsDismissed, setIsAccountsDismissed] = useState(false);

  const { user, refetch } = useUser();
  const { setSelectedCurrency } = useCurrencyStore();
  const qc = useQueryClient();

  useEffect(() => {
    setIsAccountsDismissed(isInfosAddAccountsDismissed());
  }, []);

  const handleCloseModal = () => setShowModal(null);

  const handleDismissAccounts = () => {
    dismissInfosAddAccounts();
    setIsAccountsDismissed(true);
  };

  const handleRestoreAccounts = () => {
    resetInfosAddAccountsDismissed();
    setIsAccountsDismissed(false);
  };

  const USDWalletMutation = useMutation({
    mutationFn: CreateUSDWalletApi,
    onSuccess: (response) => {
      toast.success(response?.message);
      qc.invalidateQueries({ queryKey: ["user"] });
      refetch();
      setSelectedCurrency("USD", user);
    },
  });

  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;
  const caseStage =
    user?.business_account?.business_verifications?.[0]?.case_stage;
  const hasTransactionPin = user?.has_transaction_pin;

  const USDAcct = findWalletByCurrency(user, "USD");
  const GBPAcct = findWalletByCurrency(user, "GBP");
  const EURAcct = findWalletByCurrency(user, "EUR");
  const canStartUsd = canStartUsdVerification(user, verificationStatus, caseStage);
  const showAddNgn = canCreateNgnWallet(user, verificationStatus);
  const showAddUsd = shouldPromptAddUsdAccount(
    user,
    verificationStatus,
    isNgnBranch,
    caseStage
  );

  const requiresKybForForeignAccounts =
    isNgnBranch && verificationStatus !== "completed";

  const handleForeignAccountAction = (currency: "GBP" | "EUR") => {
    if (requiresKybForForeignAccounts) {
      toast.info(
        `You need a USD account before adding ${currency}. Complete USD verification first.`
      );
      onRequireKyb?.();
      return;
    }
    if (!USDAcct) {
      toast.warning("Set up your USD account first.");
      return;
    }
    setShowModal(currency === "GBP" ? "getGbp" : "getEur");
  };

  const handleUsdAction = () => {
    if (requiresKybForForeignAccounts) {
      onRequireKyb?.();
      return;
    }
    if (!canStartUsd) {
      toast.info("USD verification is not available in your current state.");
      return;
    }
    USDWalletMutation.mutate();
  };

  const showPinSetup =
    canSetTransactionPin(verificationStatus) && !hasTransactionPin;

  const accountItems: ActionItem[] = [
    {
      key: "getUsd",
      condition: showAddUsd,
      icon: (
        <Image
          src="/icons/flag-us.webp"
          alt="USD"
          width={22}
          height={22}
          className="rounded-full"
        />
      ),
      label: "USD",
      sublabel: "Dollar account",
      onAction: handleUsdAction,
      ctaLabel: requiresKybForForeignAccounts
        ? "Verify to Create USD"
        : USDWalletMutation.isPending
          ? "Creating…"
          : "Create USD Account",
    },
    {
      key: "getNgn",
      condition: showAddNgn,
      icon: (
        <Image
          src="/icons/flag-ng.png"
          alt="NGN"
          width={22}
          height={22}
          className="rounded-full"
        />
      ),
      label: "NGN",
      sublabel: "Naira account",
      onAction: () => setShowModal("getNgn"),
      ctaLabel: "Create NGN Account",
    },
    {
      key: "getGbp",
      condition:
        (verificationStatus === "completed" || isNgnBranch) && !GBPAcct,
      icon: (
        <Image
          src="/icons/flag-gb.png"
          alt="GBP"
          width={22}
          height={22}
          className="rounded-full"
        />
      ),
      label: "GBP",
      sublabel: "British Pound",
      onAction: () => handleForeignAccountAction("GBP"),
      ctaLabel: requiresKybForForeignAccounts
        ? "Get USD First to Unlock GBP"
        : "Create GBP Account",
    },
    {
      key: "getEur",
      condition:
        (verificationStatus === "completed" || isNgnBranch) && !EURAcct,
      icon: (
        <Image
          src="/icons/flag-fr.png"
          alt="EUR"
          width={22}
          height={22}
          className="rounded-full"
        />
      ),
      label: "EUR",
      sublabel: "Euro account",
      onAction: () => handleForeignAccountAction("EUR"),
      ctaLabel: requiresKybForForeignAccounts
        ? "Get USD First to Unlock EUR"
        : "Create EUR Account",
    },
  ];

  const visibleAccountItems = accountItems.filter((item) => item.condition);
  const hasAccountPrompt = visibleAccountItems.length > 0;
  const showAccountSection = hasAccountPrompt && !isAccountsDismissed;
  const showAccountRestore = hasAccountPrompt && isAccountsDismissed;

  if (!verificationStatus) return null;
  if (!showPinSetup && !showAccountSection && !showAccountRestore) {
    return null;
  }

  const selectedAccount =
    visibleAccountItems.find((item) => item.key === selectedAccountKey) ??
    visibleAccountItems[0];

  const displayModal = () => {
    switch (showModal) {
      case "acctSetup":
        return <BusinessVerificationModal close={handleCloseModal} />;
      case "getNgn":
        return <CreateNgnAcct close={handleCloseModal} />;
      case "getGbp":
        return <CreateForeignAcct close={handleCloseModal} currency="GBP" />;
      case "getEur":
        return <CreateForeignAcct close={handleCloseModal} currency="EUR" />;
      case "set-pin":
        return <SetTransactionPin close={handleCloseModal} />;
      default:
        return null;
    }
  };

  return (
    <>
      {showPinSetup && (
        <PinSetupBanner onSetUpPin={() => setShowModal("set-pin")} />
      )}

      {showAccountRestore && (
        <div className={showPinSetup ? "mt-3" : "mt-5"}>
          <button
            type="button"
            onClick={handleRestoreAccounts}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Add more accounts
            <MdArrowRightAlt className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {showAccountSection && selectedAccount && (
        <ActionSection
          title="Add more accounts"
          items={accountItems}
          selectedKey={selectedAccountKey}
          onSelectKey={setSelectedAccountKey}
          onCta={() => selectedAccount.onAction()}
          layoutId="account-pill-check"
          dismissible
          onDismiss={handleDismissAccounts}
          isUsdPending={USDWalletMutation.isPending}
        />
      )}

      <AnimatePresence>
        {showModal ? (
          <CenterModalWrapper close={handleCloseModal}>
            {displayModal()}
          </CenterModalWrapper>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Infos;
