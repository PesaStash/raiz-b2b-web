"use client";
import Spinner from "@/components/ui/Spinner";
import { useUser } from "@/lib/hooks/useUser";
import { CreateUSDWalletApi } from "@/services/business";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { findWalletByCurrency } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import CreateNgnAcct from "./createNgnAcct/CreateNgnAcct";
import SetTransactionPin from "./transaction-pin/SetTransactionPin";
import { AnimatePresence, motion } from "motion/react";
import SideModalWrapper from "./SideModalWrapper";
import BusinessVerificationModal from "@/app/(dashboard)/_components/BusinessVerificationModal";
import { MdArrowRightAlt } from "react-icons/md";
import CreateForeignAcct from "./createForeignAcct/CreateForeignAcct";

type ModalKey = "acctSetup" | "getNgn" | "getGbp" | "getEur" | "set-pin";

interface StatusItem {
  key: ModalKey | "getUsd";
  condition: boolean;
  icon: ReactNode;
  label: string;
  sublabel: string;
  onAction: () => void;
  ctaLabel: string;
}

const Infos = () => {
  const [showModal, setShowModal] = useState<ModalKey | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { user, refetch } = useUser();
  const { setSelectedCurrency } = useCurrencyStore();
  const qc = useQueryClient();

  const handleCloseModal = () => setShowModal(null);

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
  const hasTransactionPin = user?.has_transaction_pin;

  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const GBPAcct = findWalletByCurrency(user, "GBP");
  const EURAcct = findWalletByCurrency(user, "EUR");
  const isNigerian =
    user?.business_account?.entity?.country?.country_name?.toLowerCase() ===
    "nigeria";

  const allItems: StatusItem[] = [
    {
      key: "set-pin",
      condition: verificationStatus === "completed" && !hasTransactionPin,
      icon: (
        <svg width="22" height="22" viewBox="0 0 30 31" fill="none">
          <path opacity="0.55" d="M22.5 26.73H7.5C5.43 26.73 3.75 25.05 3.75 22.98V12.98C3.75 10.91 5.43 9.23 7.5 9.23H22.5C24.57 9.23 26.25 10.91 26.25 12.98V22.98C26.25 25.05 24.57 26.73 22.5 26.73Z" fill="#F7A900" />
          <path d="M10 9.23C10 6.47 12.24 4.23 15 4.23C17.76 4.23 20 6.47 20 9.23H22.5C22.5 5.09 19.14 1.73 15 1.73C10.86 1.73 7.5 5.09 7.5 9.23H10Z" fill="#292D32" />
          <path d="M15 19.86C16.04 19.86 16.88 19.02 16.88 17.98C16.88 16.94 16.04 16.11 15 16.11C13.96 16.11 13.13 16.94 13.13 17.98C13.13 19.02 13.96 19.86 15 19.86Z" fill="#6C265B" />
        </svg>
      ),
      label: "Set PIN",
      sublabel: "Secure account",
      onAction: () => setShowModal("set-pin"),
      ctaLabel: "Set Up PIN",
    },
    {
      key: "getUsd",
      condition:
        verificationStatus === "completed" && !USDAcct && !!hasTransactionPin,
      icon: (
        <Image src="/icons/flag-us.webp" alt="USD" width={22} height={22} className="rounded-full" />
      ),
      label: "USD",
      sublabel: "Dollar account",
      onAction: () => USDWalletMutation.mutate(),
      ctaLabel: USDWalletMutation.isPending ? "Creating…" : "Create USD Account",
    },
    {
      key: "getNgn",
      condition:
        verificationStatus === "completed" &&
        !!USDAcct &&
        isNigerian &&
        !NGNAcct &&
        !!hasTransactionPin,
      icon: (
        <Image src="/icons/flag-ng.png" alt="NGN" width={22} height={22} className="rounded-full" />
      ),
      label: "NGN",
      sublabel: "Naira account",
      onAction: () => setShowModal("getNgn"),
      ctaLabel: "Create NGN Account",
    },
    // {
    //   key: "getGbp",
    //   condition:
    //     verificationStatus === "completed" &&
    //     !!USDAcct &&
    //     !GBPAcct &&
    //     !!hasTransactionPin,
    //   icon: (
    //     <Image src="/icons/flag-gb.png" alt="GBP" width={22} height={22} className="rounded-full" />
    //   ),
    //   label: "GBP",
    //   sublabel: "British Pound",
    //   onAction: () => setShowModal("getGbp"),
    //   ctaLabel: "Create GBP Account",
    // },
    // {
    //   key: "getEur",
    //   condition:
    //     verificationStatus === "completed" &&
    //     !!USDAcct &&
    //     !EURAcct &&
    //     !!hasTransactionPin,
    //   icon: (
    //     <Image src="/icons/flag-fr.png" alt="EUR" width={22} height={22} className="rounded-full" />
    //   ),
    //   label: "EUR",
    //   sublabel: "Euro account",
    //   onAction: () => setShowModal("getEur"),
    //   ctaLabel: "Create EUR Account",
    // },
  ];

  const visibleItems = allItems.filter((item) => item.condition);

  if (!verificationStatus || visibleItems.length === 0) return null;

  const selected =
    visibleItems.find((item) => item.key === selectedKey) ?? visibleItems[0];

  const handleCta = () => {
    selected.onAction();
  };

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
      <div className="mt-5 rounded-2xl border px-4 py-4 shadow-[0_4px_16px_rgba(45,25,88,0.06)]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-primary2/60">
          Add more accounts
        </p>

<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        {/* Pill selector */}
        <div className="flex flex-wrap gap-2">
          {visibleItems.map((item) => {
            const isActive = selected.key === item.key;
            return (
              <motion.button
                key={item.key}
                onClick={() => setSelectedKey(item.key)}
                whileTap={{ scale: 0.96 }}
                className={`relative flex items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5 text-left transition-all duration-150 ${
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
                <span className="flex flex-col">
                  <span
                    className={`text-[13px] font-bold leading-tight ${isActive ? "text-white" : "text-raiz-gray-950"}`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`text-[11px] leading-none ${isActive ? "text-white/70" : "text-raiz-gray-500"}`}
                  >
                    {item.sublabel}
                  </span>
                </span>
                {isActive && (
                  <motion.span
                    layoutId="pill-check"
                    className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/25"
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Single CTA */}
        <div className=" flex items-center gap-3">
          <button
            onClick={handleCta}
            disabled={USDWalletMutation.isPending && selected.key === "getUsd"}
            className="group inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-white  transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(92,34,176,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {USDWalletMutation.isPending && selected.key === "getUsd" ? (
              <Spinner className="!h-3.5 !w-3.5 !border-t-2 !border-b-2" />
            ) : null}
            {selected.ctaLabel}
            {!(USDWalletMutation.isPending && selected.key === "getUsd") && (
              <MdArrowRightAlt className="size-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
          {/* {visibleItems.length > 1 && (
            <p className="text-xs text-raiz-gray-500">
              {visibleItems.length} accounts to set up
            </p>
          )} */}
        </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal ? (
          <SideModalWrapper
            close={handleCloseModal}
            wrapperStyle={showModal === "getNgn" ? "!bg-primary2" : ""}
          >
            {displayModal()}
          </SideModalWrapper>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Infos;
