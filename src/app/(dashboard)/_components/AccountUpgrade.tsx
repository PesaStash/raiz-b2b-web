import Button from "@/components/ui/Button";
import Overlay from "@/components/ui/Overlay";
import Radio from "@/components/ui/Radio";
import { useNgnOnboarding } from "@/lib/hooks/useNgnOnboarding";
import { useUser } from "@/lib/hooks/useUser";
import {
  useUsdOnboardingStatus,
} from "@/lib/hooks/useUsdOnboarding";
import { useUsdOnboardingFlow } from "@/lib/hooks/useUsdOnboardingFlow";
import {
  canRequestUsdAccount,
  getDefaultOnboardingCurrencyPath,
  getOnboardingBranchState,
  hasUsdOnboardingRequest,
  isNigerianBusiness,
  OnboardingCurrencyPath,
} from "@/utils/onboardingBranch";
import { hasStartedNgnKyb } from "@/utils/ngnKyb";
import React, { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { IUsdOnboardingCase } from "@/types/user";
import BusinessVerificationModal from "./BusinessVerificationModal";
import CreateNgnAcct from "./createNgnAcct/CreateNgnAcct";
import NgnKybProgressCard from "./createNgnAcct/NgnKybProgressCard";
import SetTransactionPin from "./transaction-pin/SetTransactionPin";
import { AnimatePresence } from "motion/react";
import Image from "next/image";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserType } from "@/utils/analytics/userProps";
import UsdOnboardingConfirmation from "./UsdOnboardingConfirmation";
import BridgeToSWebview from "./BridgeToSWebview";

const AccountUpgrade = () => {
  const { user, refetch } = useUser();
  const { setSelectedCurrency } = useCurrencyStore();
  const [showModal, setShowModal] = useState<
    "acctSetup" | "getNgn" | "set-pin" | null
  >(null);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [activeCurrencyPath, setActiveCurrencyPath] =
    useState<OnboardingCurrencyPath | null>(null);
  const [selectedCurrencyPath, setSelectedCurrencyPath] =
    useState<OnboardingCurrencyPath>("USD");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [showRequestedModal, setShowRequestedModal] = useState(false);
  const [confirmedUsdCase, setConfirmedUsdCase] =
    useState<IUsdOnboardingCase | null>(null);

  const handleCloseModal = () => {
    setShowModal(null);
  };

  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;

  const { data: usdCase, isFetching: isUsdStatusFetching } =
    useUsdOnboardingStatus(user);

  const branchState = getOnboardingBranchState(
    user,
    verificationStatus,
    usdCase
  );

  const effectiveUsdCase = usdCase ?? confirmedUsdCase;

  const usdFlow = useUsdOnboardingFlow({
    usdCase: effectiveUsdCase,
    onUsdRequestSuccess: (caseData, message) => {
      setConfirmedUsdCase(caseData);
      setRequestMessage(message);
      setShowRequestedModal(true);
      pushDataLayerEvent(
        "kyc_status_update",
        {
          kyc_step: "usd_onboarding_requested",
          kyc_status: caseData.status,
          user_type: getAnalyticsUserType(),
        },
        { dedupId: `kyc_status_update:usd_onboarding:${caseData.case_id ?? "unknown"}` }
      );
      refetch();
    },
  });

  const hasRequestedUsd =
    usdFlow.hasRequestedUsd || hasUsdOnboardingRequest(effectiveUsdCase);
  const isNigerian = branchState.isNigerianBusiness;
  const isTosConfirmed = usdFlow.isTosConfirmed;

  const shouldFetchNgnRequirements =
    isNigerian && branchState.isStep1Complete && !branchState.hasNgnWallet;

  const { requirements: ngnRequirements, isLoading: isNgnRequirementsLoading } =
    useNgnOnboarding({ enabled: shouldFetchNgnRequirements });

  const ngnKybStarted = hasStartedNgnKyb(ngnRequirements);

  const showUsdSteps =
    activeCurrencyPath === "USD" || hasRequestedUsd || (!isNigerian && branchState.isStep1Complete);
  const showOnlyStep1 =
    !branchState.isStep1Complete ||
    (branchState.needsCurrencyChoice && activeCurrencyPath === null);

  const tosStepStatus: "completed" | "active" | "pending" = isTosConfirmed
    ? "completed"
    : showUsdSteps && branchState.isStep1Complete
      ? "active"
      : "pending";

  const usdStepStatus: "completed" | "active" | "pending" = hasRequestedUsd
    ? "completed"
    : showUsdSteps && isTosConfirmed
      ? "active"
      : "pending";

  useEffect(() => {
    if (hasRequestedUsd && activeCurrencyPath !== "USD") {
      setActiveCurrencyPath("USD");
    }
  }, [hasRequestedUsd, activeCurrencyPath]);

  useEffect(() => {
    if (!user) return;
    setSelectedCurrencyPath(getDefaultOnboardingCurrencyPath(user));
  }, [user?.business_account?.entity_id]);

  useEffect(() => {
    if (
      !isNigerian &&
      branchState.isStep1Complete &&
      activeCurrencyPath === null &&
      !hasRequestedUsd
    ) {
      setActiveCurrencyPath("USD");
    }
  }, [
    isNigerian,
    branchState.isStep1Complete,
    activeCurrencyPath,
    hasRequestedUsd,
  ]);

  useEffect(() => {
    if (
      ngnKybStarted &&
      activeCurrencyPath === null &&
      !showCurrencyModal
    ) {
      setActiveCurrencyPath("NGN");
    }
  }, [ngnKybStarted, activeCurrencyPath, showCurrencyModal]);

  useEffect(() => {
    if (
      branchState.needsCurrencyChoice &&
      activeCurrencyPath === null &&
      !showCurrencyModal &&
      !showModal &&
      isNigerian &&
      !isNgnRequirementsLoading &&
      !ngnKybStarted
    ) {
      setShowCurrencyModal(true);
    }
  }, [
    branchState.needsCurrencyChoice,
    activeCurrencyPath,
    showCurrencyModal,
    showModal,
    isNigerian,
    isNgnRequirementsLoading,
    ngnKybStarted,
  ]);

  const handleChangeCurrency = () => {
    if (hasRequestedUsd || !isNigerian) return;
    setActiveCurrencyPath(null);
    setShowCurrencyModal(true);
  };

  const handleCurrencyContinue = () => {
    setActiveCurrencyPath(selectedCurrencyPath);
    setShowCurrencyModal(false);

    if (selectedCurrencyPath === "NGN") {
      if (!isNigerianBusiness(user)) return;
      setShowModal("getNgn");
    }
  };

  const step1Status =
    verificationStatus === "not_started"
      ? "active"
      : branchState.isStep1Complete
        ? "completed"
        : "pending";

  const handleRequestUsd = async () => {
    if (
      hasRequestedUsd ||
      !canRequestUsdAccount(user, verificationStatus, effectiveUsdCase) ||
      usdFlow.isUsdActionPending ||
      isUsdStatusFetching
    ) {
      return;
    }
    await usdFlow.startUsdRequest();
  };

  const handleAcceptTosOnly = async () => {
    if (usdFlow.isUsdActionPending || isTosConfirmed) return;
    await usdFlow.startAcceptBridgeTos();
  };

  const handleNgnCreated = () => {
    handleCloseModal();
    refetch().then((result) => {
      setSelectedCurrency("NGN", result.data ?? user);
    });
  };

  const handleVerificationSuccess = () => {
    if (isNigerianBusiness(user)) {
      if (hasStartedNgnKyb(ngnRequirements)) {
        setActiveCurrencyPath("NGN");
        return;
      }
      setShowCurrencyModal(true);
      return;
    }
    setActiveCurrencyPath("USD");
  };

  const displayModal = () => {
    switch (showModal) {
      case "acctSetup":
        return (
          <BusinessVerificationModal
            close={handleCloseModal}
            onVerificationSuccess={handleVerificationSuccess}
          />
        );

      case "getNgn":
        return <CreateNgnAcct close={handleNgnCreated} />;

      case "set-pin":
        return <SetTransactionPin close={handleCloseModal} />;
      default:
        break;
    }
  };

  return (
    <>
      <div className="min-w-0 font-sans md:min-h-screen md:bg-white md:mt-8">
        <div className="bg-[#FFF3E666] rounded-2xl md:rounded-lg px-3 py-4 md:px-4 md:py-5">
          {/* Header Section */}
          <div className="flex items-start gap-3 md:gap-4 mb-6 md:mb-10">
            <svg
              className="shrink-0 w-10 h-10 md:w-12 md:h-12"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <g clipPath="url(#clip0_30032_36282)">
                <rect width="48" height="48" rx="24" fill="#FCFCFD" />
                <path
                  d="M4 0.333008H44C46.025 0.333008 47.667 1.97496 47.667 4V44C47.667 46.025 46.025 47.667 44 47.667H4C1.97496 47.667 0.333008 46.025 0.333008 44V4C0.333008 1.97496 1.97496 0.333008 4 0.333008Z"
                  stroke="black"
                  strokeOpacity="0.08"
                  strokeWidth="0.666667"
                />
                <path
                  d="M24.0002 10.667C20.3335 10.667 17.3335 13.667 17.3335 17.3337V20.0003H20.0002V17.3337C20.0002 15.1337 21.8002 13.3337 24.0002 13.3337C26.2002 13.3337 28.0002 15.1337 28.0002 17.3337V20.0003H30.6668V17.3337C30.6668 13.667 27.6668 10.667 24.0002 10.667Z"
                  fill="#424242"
                />
                <path
                  d="M32.0002 37.3333H16.0002C14.5335 37.3333 13.3335 36.1333 13.3335 34.6667V22.6667C13.3335 21.2 14.5335 20 16.0002 20H32.0002C33.4668 20 34.6668 21.2 34.6668 22.6667V34.6667C34.6668 36.1333 33.4668 37.3333 32.0002 37.3333Z"
                  fill="#FB8C00"
                />
                <path
                  d="M24 26.6665C23.4696 26.6665 22.9609 26.8772 22.5858 27.2523C22.2107 27.6274 22 28.1361 22 28.6665C22 29.1969 22.2107 29.7056 22.5858 30.0807C22.9609 30.4558 23.4696 30.6665 24 30.6665C24.5304 30.6665 25.0391 30.4558 25.4142 30.0807C25.7893 29.7056 26 29.1969 26 28.6665C26 28.1361 25.7893 27.6274 25.4142 27.2523C25.0391 26.8772 24.5304 26.6665 24 26.6665Z"
                  fill="#C76E00"
                />
              </g>
              <rect
                x="0.75"
                y="0.75"
                width="46.5"
                height="46.5"
                rx="23.25"
                stroke="#F3F1F6"
                strokeWidth="1.5"
              />
              <defs>
                <clipPath id="clip0_30032_36282">
                  <rect width="48" height="48" rx="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-base font-bold text-gray-900 leading-snug">
                Complete Account Set Up
              </h1>
              <p className="text-[#6F5B86] mt-1 text-xs md:text-sm leading-relaxed">
                {isNigerian
                  ? "Complete your account setup and verify your details to unlock full access to all features."
                  : "Verify your business details, then request a USD account to get started."}
              </p>
            </div>
          </div>

          {/* Steps Container */}
          <div className="relative px-0 md:px-10">
            {/* Step 1: Basic Business Information */}
            <Step
              status={step1Status}
              title="Basic Business Information"
              description="Tell us a bit about your business to get started."
              isLast={showOnlyStep1 && !showUsdSteps}
            >
              <div className="mt-3 md:mt-4">
                <Button
                  onClick={() => setShowModal("acctSetup")}
                  className="w-full sm:w-fit h-10 md:h-[41px]"
                  disabled={verificationStatus !== "not_started"}
                >
                  {verificationStatus === "not_started"
                    ? "Get Started"
                    : "Completed"}
                </Button>
              </div>
              {isNigerian &&
                activeCurrencyPath === "NGN" &&
                !branchState.hasNgnWallet &&
                ngnKybStarted &&
                ngnRequirements && (
                <div className="mt-3 md:mt-4">
                  <NgnKybProgressCard
                    requirements={ngnRequirements}
                    onViewStatus={() => setShowModal("getNgn")}
                  />
                </div>
              )}
              {isNigerian &&
                activeCurrencyPath === "NGN" &&
                !branchState.hasNgnWallet &&
                !ngnKybStarted && (
                <div className="mt-3 md:mt-4">
                  <Button
                    onClick={() => setShowModal("getNgn")}
                    className="w-full sm:w-fit h-10 md:h-[41px]"
                  >
                    Continue NGN Account Setup
                  </Button>
                </div>
              )}
              {isNigerian &&
                branchState.needsCurrencyChoice &&
                activeCurrencyPath && (
                <button
                  type="button"
                  onClick={handleChangeCurrency}
                  className="mt-3 text-sm font-semibold text-[#3C2875] hover:underline"
                >
                  Change starting currency
                </button>
              )}
            </Step>

            {showUsdSteps && (
              <>
                <Step
                  status={tosStepStatus}
                  title="Accept Terms"
                  description="Review and accept our Terms of Service. This is required before your USD account request can proceed."
                  isLast={false}
                >
                  {!isTosConfirmed ? (
                    <div className="mt-3 md:mt-4">
                      <Button
                        onClick={handleAcceptTosOnly}
                        disabled={usdFlow.isUsdActionPending}
                        loading={
                          usdFlow.bridgeTos.isGeneratingUrl ||
                          usdFlow.bridgeTos.isSavingTos
                        }
                        className="w-full sm:w-fit h-10 md:h-[41px]"
                      >
                        {usdFlow.getUsdActionLabel()}
                      </Button>
                    </div>
                  ) : null}
                </Step>

                <Step
                  status={usdStepStatus}
                  title="Request USD Account"
                  description="Submit a request and our operations team will contact your business to complete USD verification."
                  isLast
                >
                  {hasRequestedUsd && effectiveUsdCase ? (
                    <div className="mt-4 md:mt-6">
                      <UsdOnboardingConfirmation
                        usdCase={effectiveUsdCase}
                        message={requestMessage ?? undefined}
                        tosConfirmed={isTosConfirmed}
                        onAcceptTos={handleAcceptTosOnly}
                        isAcceptingTos={usdFlow.isUsdActionPending}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 md:mt-4">
                      <Button
                        onClick={handleRequestUsd}
                        disabled={
                          hasRequestedUsd ||
                          usdFlow.isUsdActionPending ||
                          isUsdStatusFetching ||
                          !isTosConfirmed ||
                          !canRequestUsdAccount(
                            user,
                            verificationStatus,
                            effectiveUsdCase
                          )
                        }
                        loading={usdFlow.isUsdActionPending}
                        className="w-full sm:w-fit h-10 md:h-[41px]"
                      >
                        {usdFlow.isUsdActionPending
                          ? usdFlow.getUsdActionLabel()
                          : "Request USD Account"}
                      </Button>
                    </div>
                  )}
                </Step>
              </>
            )}
          </div>
        </div>
      </div>

      {showCurrencyModal && (
        <Overlay close={() => setShowCurrencyModal(false)} width="375px">
          <div className="flex flex-col h-full py-8 px-5 font-brSonoma">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-zinc-900 text-xl font-bold leading-normal">
                  Welcome to Raiz! 🎉
                </h3>
                <p className="text-zinc-900 text-xs leading-tight mt-1">
                  {isNigerian
                    ? "Choose which currency you would like to start with"
                    : "Request a USD account to get started"}
                </p>
              </div>
              <button onClick={() => setShowCurrencyModal(false)}>
                <Image
                  src="/icons/close.svg"
                  width={16}
                  height={16}
                  alt="close"
                />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCurrencyPath("USD")}
                className={`border cursor-pointer ${
                  selectedCurrencyPath === "USD"
                    ? "border-primary2"
                    : "border-[#E4E0EA]"
                } rounded-[20px] flex flex-col  relative items-center justify-between w-full px-4 py-4 transition-colors hover:border-indigo-900`}
              >
                <div className="flex flex-col items-center gap-3">
                  <Image
                    src="/icons/dollar.svg"
                    alt="USD"
                    width={40}
                    height={40}
                    className="size-10 rounded-full"
                  />
                  <div className="text-center mt-2">
                    <p className="text-zinc-900 text-sm font-bold leading-none">
                      USD Account
                    </p>
                    <p className="text-zinc-900 text-xs font-normal leading-tight mt-2">
                      Requires full Business KYB
                    </p>
                  </div>
                </div>
                <Radio
                  checked={selectedCurrencyPath === "USD"}
                  onChange={() => setSelectedCurrencyPath("USD")}
                  className="absolute top-5 right-5"
                />
              </div>

              {isNigerian && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCurrencyPath("NGN")}
                  className={`border cursor-pointer ${
                    selectedCurrencyPath === "NGN"
                      ? "border-primary2"
                      : "border-[#E4E0EA]"
                  } rounded-[20px] flex flex-col relative items-center justify-between w-full px-4 py-4 transition-colors hover:border-indigo-900`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Image
                      src="/icons/ngn.svg"
                      alt="NGN"
                      width={40}
                      height={40}
                      className="size-10 rounded-full"
                    />
                    <div className="text-center mt-2">
                      <p className="text-zinc-900 text-sm font-bold leading-none">
                        NGN Account
                      </p>
                      <p className="text-zinc-900 text-xs font-normal leading-tight mt-2">
                        Requires Business’ CAC and owners verification
                      </p>
                    </div>
                  </div>
                  <Radio
                    checked={selectedCurrencyPath === "NGN"}
                    onChange={() => setSelectedCurrencyPath("NGN")}
                    className="absolute top-5 right-5"
                  />
                </div>
              )}
            </div>

            <Button onClick={handleCurrencyContinue} className="w-full mt-6">
              Continue
            </Button>
            {isNigerian && (
              <p className="text-center text-xs text-raiz-gray-600 mt-3">
                You can add the other currency later
              </p>
            )}
          </div>
        </Overlay>
      )}

      <AnimatePresence>
        {showModal ? (
          <CenterModalWrapper close={handleCloseModal}>
            {displayModal()}
          </CenterModalWrapper>
        ) : null}
      </AnimatePresence>

      {usdFlow.bridgeUrl ? (
        <BridgeToSWebview
          bridgeUrl={usdFlow.bridgeUrl}
          close={usdFlow.closeBridgeWebview}
          onAccepted={usdFlow.handleBridgeTosAccepted}
        />
      ) : null}

      {showRequestedModal && effectiveUsdCase ? (
        <CenterModalWrapper close={() => setShowRequestedModal(false)}>
          <div className="w-full max-w-md px-1 py-2 font-brSonoma">
            <UsdOnboardingConfirmation
              usdCase={effectiveUsdCase}
              message={requestMessage ?? undefined}
              tosConfirmed={isTosConfirmed}
              onGoToDashboard={() => setShowRequestedModal(false)}
            />
          </div>
        </CenterModalWrapper>
      ) : null}
    </>
  );
};

// --- Helper Components ---

type StepProps = {
  status: "completed" | "active" | "pending";
  title: string;
  description: string;
  children?: React.ReactNode;
  isLast?: boolean;
};

const Step = ({ status, title, description, children, isLast }: StepProps) => {
  return (
    <div className="flex gap-3 md:gap-4 min-w-0">
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`
          flex items-center justify-center w-6 h-6 rounded-full z-10 shrink-0
          ${status === "completed" ? "bg-[#9BCF53] text-white" : ""}
          ${status === "active" ? "bg-[#3B6D98] ring-2 md:ring-4 ring-blue-100" : ""}
          ${status === "pending" ? "bg-gray-200" : ""}
        `}
        >
          {status === "completed" && <FaCheck size={14} strokeWidth={3} />}
          {status === "active" && (
            <div className="w-2 h-2 bg-white rounded-full" />
          )}
          {status === "pending" && (
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          )}
        </div>

        {!isLast && <div className="w-px flex-1 bg-gray-200 my-2" />}
      </div>

      <div
        className={`pb-8 md:pb-12 min-w-0 flex-1 ${isLast ? "pb-0" : ""} pt-0.5`}
      >
        <h3 className="text-[13px] md:text-sm font-semibold text-raiz-gray-950 leading-snug">
          {title}
        </h3>
        <p className="text-raiz-gray-950 text-xs md:text-sm mt-1 leading-relaxed">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
};

export default AccountUpgrade;
