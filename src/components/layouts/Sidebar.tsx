"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ISidebarMenuItem, SidebarSection } from "@/types/misc";
import {
  SIDEBAR_SECTION_LABELS,
  SidebarMenus,
} from "@/constants/SidebarMenuData";
import SideModalWrapper from "@/app/(dashboard)/_components/SideModalWrapper";
import { AnimatePresence } from "motion/react";
import CreateNgnAcct from "@/app/(dashboard)/_components/createNgnAcct/CreateNgnAcct";
import AddBvnModal from "@/app/(dashboard)/_components/createNgnAcct/AddBvnModal";
import NgnSuccessModal from "@/app/(dashboard)/_components/createNgnAcct/NgnSuccessModal";
import LogoutModal from "../modals/LogoutModal";
import { useUser } from "@/lib/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { FetchUserRewardsApi } from "@/services/user";
import { FetchBillRequestMetricsApi } from "@/services/transactions";
import SetTransactionPin from "@/app/(dashboard)/_components/transaction-pin/SetTransactionPin";
import {
  findWalletByCurrency,
  normalizeS3ObjectUrl,
} from "@/utils/helpers";
import {
  canSetTransactionPin,
  canRequestUsdAccount,
  isNigerianBusiness,
} from "@/utils/onboardingBranch";
import { useUsdOnboardingStatus } from "@/lib/hooks/useUsdOnboarding";
import { useUsdOnboardingFlow } from "@/lib/hooks/useUsdOnboardingFlow";
import BridgeToSWebview from "@/app/(dashboard)/_components/BridgeToSWebview";
import PaymentLinkModal from "../modals/PaymentLinkModal";
import Spinner from "../ui/Spinner";
import Rewards from "@/app/(dashboard)/_components/rewards/Rewards";
import FeedbacksModal from "../modals/FeedbacksModal";
import BusinessVerificationModal from "@/app/(dashboard)/_components/BusinessVerificationModal";
import { useSidebar } from "@/context/SidebarContext";
import { SidebarNavItem } from "./sidebar/SidebarNavItem";
import { AccountFooter } from "./sidebar/AccountFooter";
import { useCurrencyStore } from "@/store/useCurrencyStore";

type StatusConfig = {
  condition: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  bg: string;
  onAction?: () => void;
};

const Sidebar = () => {
  const { user, refetch } = useUser();
  const pathName = usePathname();
  const { selectedCurrency } = useCurrencyStore();
  const { effectiveCollapsed, isLargeDesktop, toggleCollapsed } = useSidebar();

  const [showModal, setShowModal] = useState<
    "acctSetup" | "getNgn" | "set-pin" | "rewards" | null
  >(null);
  const [showBvnModal, setShowBvnModal] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const [userPfp, setUserPfp] = useState(
    normalizeS3ObjectUrl(user?.business_account?.business_image) ||
      "/images/default-pfp.svg",
  );

  useEffect(() => {
    const image = normalizeS3ObjectUrl(user?.business_account?.business_image);
    if (image) setUserPfp(image);
  }, [user]);

  const handleCloseModal = () => setShowModal(null);

  const { data: pointsData } = useQuery({
    queryKey: ["reward-points"],
    queryFn: FetchUserRewardsApi,
  });

  const { data: billMetrics } = useQuery({
    queryKey: ["bill-requests-metrics", { currency: selectedCurrency.name }],
    queryFn: () => FetchBillRequestMetricsApi({}),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const pendingBillCount = billMetrics?.pending_approval?.total ?? 0;

  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;

  const { data: usdCase } = useUsdOnboardingStatus(user);
  const effectiveUsdCase = usdCase ?? null;
  const usdFlow = useUsdOnboardingFlow({
    usdCase: effectiveUsdCase,
    onUsdRequestSuccess: () => refetch(),
  });

  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const isNigerian = isNigerianBusiness(user);
  const hasTransactionPin = user?.has_transaction_pin;
  const canRequestUsd = canRequestUsdAccount(
    user,
    verificationStatus,
    effectiveUsdCase,
  );

  const displayModal = () => {
    switch (showModal) {
      case "acctSetup":
        return <BusinessVerificationModal close={handleCloseModal} />;
      case "getNgn":
        return <CreateNgnAcct close={handleCloseModal} />;
      case "set-pin":
        return <SetTransactionPin close={handleCloseModal} />;
      case "rewards":
        return <Rewards close={handleCloseModal} data={pointsData} />;
      default:
        return null;
    }
  };

  const isItemActive = (item: ISidebarMenuItem) => {
    if (item.action === "feedback") return showFeedbacks;
    return item.link === "/"
      ? pathName === item.link
      : pathName.includes(item.link);
  };

  const statuses: StatusConfig[] = [
    {
      condition: verificationStatus === "not_started",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M15.9997 2.66699C12.333 2.66699 9.33301 5.66699 9.33301 9.33366V12.0003H11.9997V9.33366C11.9997 7.13366 13.7997 5.33366 15.9997 5.33366C18.1997 5.33366 19.9997 7.13366 19.9997 9.33366V12.0003H22.6663V9.33366C22.6663 5.66699 19.6663 2.66699 15.9997 2.66699Z"
            fill="#424242"
          />
          <path
            d="M23.9997 29.3333H7.99967C6.53301 29.3333 5.33301 28.1333 5.33301 26.6667V14.6667C5.33301 13.2 6.53301 12 7.99967 12H23.9997C25.4663 12 26.6663 13.2 26.6663 14.6667V26.6667C26.6663 28.1333 25.4663 29.3333 23.9997 29.3333Z"
            fill="#FB8C00"
          />
          <path
            d="M16 18.6665C15.4696 18.6665 14.9609 18.8772 14.5858 19.2523C14.2107 19.6274 14 20.1361 14 20.6665C14 21.1969 14.2107 21.7056 14.5858 22.0807C14.9609 22.4558 15.4696 22.6665 16 22.6665C16.5304 22.6665 17.0391 22.4558 17.4142 22.0807C17.7893 21.7056 18 21.1969 18 20.6665C18 20.1361 17.7893 19.6274 17.4142 19.2523C17.0391 18.8772 16.5304 18.6665 16 18.6665Z"
            fill="#C76E00"
          />
        </svg>
      ),
      title: "Complete account set up",
      description: "Complete Account Set Up and Get unlimited access",
      action: (
        <div className=" w-full">
          <button
            onClick={() => setShowModal("acctSetup")}
            className="group px-6 py-2.5 w-full flex items-center gap-3 justify-center  bg-white border-2 border-[#F8F7FA] text-[#3C2875] font-bold rounded-3xl text-sm hover:bg-gray-50 transition-colors  disabled:opacity-50"
          >
            <span>Get Started</span>
            <Image
              src={"/icons/long-arrow-right.svg"}
              alt="right"
              width={20}
              height={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      ),
      bg: "bg-[#FFF3E666]",
      onAction: () => setShowModal("acctSetup"),
    },
    {
      condition: canSetTransactionPin(verificationStatus) && !hasTransactionPin,
      icon: (
        <svg
          width="30"
          height="31"
          viewBox="0 0 30 31"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity="0.55"
            d="M22.5 26.7305H7.5C5.42875 26.7305 3.75 25.0517 3.75 22.9805V12.9805C3.75 10.9092 5.42875 9.23047 7.5 9.23047H22.5C24.5712 9.23047 26.25 10.9092 26.25 12.9805V22.9805C26.25 25.0517 24.5712 26.7305 22.5 26.7305Z"
            fill="#F7A900"
          />
          <path
            d="M10 9.23047C10 6.46922 12.2387 4.23047 15 4.23047C17.7613 4.23047 20 6.46922 20 9.23047H22.5C22.5 5.08797 19.1425 1.73047 15 1.73047C10.8575 1.73047 7.5 5.08797 7.5 9.23047H10Z"
            fill="#292D32"
          />
          <path
            d="M15 19.8555C16.0355 19.8555 16.875 19.016 16.875 17.9805C16.875 16.9449 16.0355 16.1055 15 16.1055C13.9645 16.1055 13.125 16.9449 13.125 17.9805C13.125 19.016 13.9645 19.8555 15 19.8555Z"
            fill="#6C265B"
          />
          <path
            d="M21.25 19.8555C22.2855 19.8555 23.125 19.016 23.125 17.9805C23.125 16.9449 22.2855 16.1055 21.25 16.1055C20.2145 16.1055 19.375 16.9449 19.375 17.9805C19.375 19.016 20.2145 19.8555 21.25 19.8555Z"
            fill="#6C265B"
          />
          <path
            d="M8.75 19.8555C9.78553 19.8555 10.625 19.016 10.625 17.9805C10.625 16.9449 9.78553 16.1055 8.75 16.1055C7.71447 16.1055 6.875 16.9449 6.875 17.9805C6.875 19.016 7.71447 19.8555 8.75 19.8555Z"
            fill="#6C265B"
          />
        </svg>
      ),
      title: "Secure your Account",
      description:
        "Set a transaction PIN to approve transfers and other sensitive actions.",
      action: (
        <button
          onClick={() => setShowModal("set-pin")}
          className="group text-primary2 bg-white flex py-4 px-8 rounded-3xl gap-3 h-[52px] hover:underline border-2 border-[#F8F7FA] text-xs xl:text-sm font-bold"
        >
          Set Up
          <Image
            src={"/icons/long-arrow-right.svg"}
            alt=""
            width={20}
            height={20}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      ),
      bg: "bg-[#eaecff]/40",
      onAction: () => setShowModal("set-pin"),
    },
    {
      condition: canRequestUsd && !!hasTransactionPin,
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <g clipPath="url(#clip0_23665_5245)">
            <rect width="48" height="48" rx="24" fill="#FCFCFD" />
            <path
              d="M4 0.333008H44C46.025 0.333008 47.667 1.97496 47.667 4V44C47.667 46.025 46.025 47.667 44 47.667H4C1.97496 47.667 0.333008 46.025 0.333008 44V4C0.333008 1.97496 1.97496 0.333008 4 0.333008Z"
              stroke="black"
              strokeOpacity="0.08"
              strokeWidth="0.666667"
            />
            <path
              opacity="0.35"
              d="M32 36H16C13.7907 36 12 34.2093 12 32V19.6867C12 18.2333 12.788 16.896 14.0573 16.1907L22.0573 11.7467C23.2653 11.076 24.7347 11.076 25.9427 11.7467L33.9427 16.1907C35.212 16.896 36 18.2347 36 19.6867V32C36 34.2093 34.2093 36 32 36Z"
              fill="#53940D"
            />
            <path
              d="M27.7867 27.3319C27.7867 23.2079 23.2347 23.7719 23.2347 21.6226C23.2347 20.3573 24.2307 20.2239 24.5733 20.2239C24.9133 20.2239 25.2133 20.3039 25.468 20.4199C26.0667 20.6906 26.776 20.4399 27.1547 19.9026C27.64 19.2159 27.3893 18.2493 26.6227 17.9026C26.2013 17.7133 25.6773 17.5599 25.0413 17.4999V16.9026C25.0413 16.3519 24.5947 15.9053 24.044 15.9053C23.4933 15.9053 23.0467 16.3519 23.0467 16.9026V17.7119C21.376 18.2693 20.2907 19.7973 20.2907 21.7533C20.2907 26.0813 24.7867 25.2986 24.7867 27.5479C24.7867 27.9813 24.5813 28.9239 23.4667 28.9239C22.9707 28.9239 22.5427 28.7839 22.1947 28.6026C21.604 28.2933 20.8693 28.5213 20.4933 29.0719L20.4533 29.1306C20.0173 29.7679 20.1933 30.6586 20.8653 31.0399C21.4293 31.3599 22.1187 31.6079 22.9507 31.6959V32.3973C22.9507 32.9479 23.3973 33.3946 23.948 33.3946C24.4987 33.3946 24.9453 32.9479 24.9453 32.3973V31.5173C26.7907 30.9519 27.7867 29.2666 27.7867 27.3319Z"
              fill="#1D546F"
            />
          </g>
          <defs>
            <clipPath id="clip0_23665_5245">
              <rect width="48" height="48" rx="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
      title: "Request a USD Account",
      description:
        "Submit a request and our team will contact you to complete USD verification.",
      action: (
        <button
          onClick={() => usdFlow.startUsdRequest()}
          className="text-white bg-primary py-3 px-5 rounded-full text-sm font-semibold flex items-center gap-2"
          disabled={usdFlow.isUsdActionPending || usdFlow.hasRequestedUsd}
        >
          {usdFlow.isUsdActionPending ? (
            <Spinner className="!w-4 !h-4 !border-t-2 !border-b-2" />
          ) : null}
          {usdFlow.getUsdActionLabel()}
        </button>
      ),
      bg: "bg-[#EAECFF66]",
      onAction: () => usdFlow.startUsdRequest(),
    },
    {
      condition:
        verificationStatus === "completed" &&
        !!USDAcct &&
        isNigerian &&
        !NGNAcct &&
        !!hasTransactionPin,
      icon: <Image src={"/icons/ngn.svg"} width={32} height={32} alt="NGN" />,
      title: "Get a Naira (NGN) Account",
      description:
        "Manage funds and make transactions in Naira, simplifying local payments and daily finances.",
      action: (
        <button
          onClick={() => setShowModal("getNgn")}
          className="text-white bg-primary py-3 px-5 rounded-full text-sm font-semibold flex items-center gap-2"
        >
          Get Naira Account
        </button>
      ),
      bg: "bg-[#eaecff]/40",
      onAction: () => setShowModal("getNgn"),
    },
    {
      condition:
        verificationStatus === "completed" &&
        (isNigerian ? !!NGNAcct : true) &&
        !!hasTransactionPin &&
        !!USDAcct,
      icon: <Image src={"/icons/paylink.svg"} width={32} height={32} alt="" />,
      title: "Payment Link",
      description: "Allows Guest Users to Securely Send you Money Seamlessly.",
      action: (
        <button
          onClick={() => setShowPaymentLinkModal(true)}
          className="text-primary2 text-sm font-bold"
        >
          Share Link
        </button>
      ),
      bg: "bg-[#eaecff]/40",
      onAction: () => setShowPaymentLinkModal(true),
    },
  ];

  const activeStatus = statuses.find((s) => s.condition) ?? null;

  const triggerActiveStatus = () => {
    if (!activeStatus) return;
    if (activeStatus.onAction) activeStatus.onAction();
  };

  const overviewItems = useMemo(
    () => SidebarMenus.filter((m) => m.section === "overview"),
    [],
  );
  const manageItems = useMemo(
    () => SidebarMenus.filter((m) => m.section === "manage"),
    [],
  );

  const renderSection = (
    section: SidebarSection,
    items: ISidebarMenuItem[],
    showDividerBefore = false,
  ) => (
    <div
      key={section}
      className={`flex flex-col gap-2`}
    >
      {showDividerBefore && effectiveCollapsed && (
        <div className="mx-auto h-px w-8 bg-[#EBE8F0]" />
      )}
      {!effectiveCollapsed && (
        <p className="flex h-8 items-center font-monzo text-[11px] font-bold uppercase tracking-normal text-raiz-gray-500">
          {SIDEBAR_SECTION_LABELS[section]}
        </p>
      )}
      <div
        className={`flex flex-col ${effectiveCollapsed ? "items-center gap-2" : "gap-2"}`}
      >
        {items.map((item, index) => (
          <SidebarNavItem
            key={`${section}-${index}`}
            item={item}
            isActive={isItemActive(item)}
            collapsed={effectiveCollapsed}
            badgeCount={pendingBillCount}
            onFeedbackClick={() => setShowFeedbacks(true)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <aside
      className={`hidden md:flex fixed top-0 bottom-0 left-0 z-20 h-screen flex-col overflow-x-hidden border-r transition-[width] duration-200 ease-in-out ${
        effectiveCollapsed
          ? "w-[88px] items-center border-raiz-gray-200 bg-white pb-6 pt-8"
          : "w-[88px] lg:w-[256px] border-raiz-gray-100 bg-raiz-gray-50 px-4 pb-4 pt-5"
      }`}
    >
      {/* Brand header */}
      <div
        className={`shrink-0 ${
          effectiveCollapsed
            ? "mb-8 flex gap-3 items-center"
            : "mb-5 flex h-11 w-full items-center justify-between"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center ${effectiveCollapsed ? "" : "gap-2"}`}
          title="Raiz"
        >
          <Image
            src="/icons/Logo-2.svg"
            width={effectiveCollapsed ? 40 : 36}
            height={effectiveCollapsed ? 40 : 36}
            alt="Raiz"
            className={
              effectiveCollapsed ? "size-7" : "size-9 shrink-0 rounded-[22px]"
            }
          />
          {!effectiveCollapsed && (
            <Image
              src="/icons/sidebar/raiz-wordmark.svg"
              alt="Raiz"
              width={48}
              height={20}
              className="h-5 w-auto"
            />
          )}
        </Link>
        {!effectiveCollapsed && isLargeDesktop && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="flex size-[18px] items-center justify-center outline-none hover:opacity-70"
          >
            <Image
              src="/icons/sidebar/sidebar-left.svg"
              alt=""
              width={18}
              height={18}
              className="size-[18px]"
            />
          </button>
        )}
        {effectiveCollapsed && isLargeDesktop && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className=" flex size-[18px] items-center justify-center outline-none hover:opacity-70"
          >
            <Image
              src="/icons/sidebar/sidebar-left.svg"
              alt=""
              width={18}
              height={18}
              className="size-[18px] scale-x-[-1]"
            />
          </button>
        )}
      </div>

      <section
        className={`flex min-h-0 flex-1 flex-col ${
          effectiveCollapsed ? "w-full items-center gap-4" : "gap-4"
        }`}
      >
        <nav
          className={`flex w-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden ${
            effectiveCollapsed ? "items-center gap-8" : "gap-5"
          }`}
        >
          {renderSection("overview", overviewItems)}
          {renderSection("manage", manageItems, true)}

          {!effectiveCollapsed && verificationStatus && (
            <div className="mt-auto flex w-full flex-col gap-3 pt-4">
              {statuses.map((status, index) =>
                status.condition ? (
                  <StatusCard key={index} {...status} />
                ) : null,
              )}
            </div>
          )}
        </nav>

        <div
          className={`relative w-full shrink-0 ${
            effectiveCollapsed
              ? "flex flex-col items-center gap-2"
              : "flex flex-col"
          }`}
        >
          {activeStatus && effectiveCollapsed && (
            // <SetupLockShortcut onClick={triggerActiveStatus} />
            <button
              type="button"
              onClick={triggerActiveStatus}
              className="flex size-12 items-center justify-center rounded-xl hover:bg-raiz-gray-50 outline-none"
            >
             <Image src={"/icons/paylink.svg"} width={24} height={24} alt="" />
            </button>
          )}

          <AccountFooter
            collapsed={effectiveCollapsed}
            userPfp={userPfp}
            businessName={user?.business_account?.business_name}
            email={user?.email}
            onLogout={() => setShowLogoutModal(true)}
          />
        </div>
      </section>

      <AnimatePresence>
        {showModal ? (
          <SideModalWrapper close={handleCloseModal}>
            {displayModal()}
          </SideModalWrapper>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showBvnModal && (
          <AddBvnModal
            close={() => setShowBvnModal(false)}
            openSuccessModal={() => setSuccessful(true)}
          />
        )}
      </AnimatePresence>
      {successful && <NgnSuccessModal close={() => setSuccessful(false)} />}
      {showLogoutModal && (
        <LogoutModal close={() => setShowLogoutModal(false)} />
      )}
      {showPaymentLinkModal && (
        <PaymentLinkModal close={() => setShowPaymentLinkModal(false)} />
      )}
      {showFeedbacks && (
        <FeedbacksModal close={() => setShowFeedbacks(false)} />
      )}
      {usdFlow.bridgeUrl ? (
        <BridgeToSWebview
          bridgeUrl={usdFlow.bridgeUrl}
          close={usdFlow.closeBridgeWebview}
          onAccepted={usdFlow.handleBridgeTosAccepted}
        />
      ) : null}
    </aside>
  );
};

function collapsedSectionGap(showDividerBefore: boolean) {
  return showDividerBefore ? "gap-8" : "gap-2";
}

export default Sidebar;

const StatusCard = ({
  icon,
  title,
  description,
  action,
  bg,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  bg: string;
}) => (
  <div
    className={`px-3 xl:px-4 py-5 ${bg}  rounded-lg flex-col justify-start items-start gap-3 inline-flex`}
  >
    <div className="w-12 h-12 relative bg-[#fcfcfd] rounded-[66.67px] flex items-center justify-center">
      {icon}
    </div>
    <h5 className="text-raiz-gray-900 text-sm font-bold leading-[16.80px]">
      {title}
    </h5>
    <p className="text-gray-600 lg:text-xs xl:text-sm font-normal leading-tight">
      {description}
    </p>
    {action}
  </div>
);
