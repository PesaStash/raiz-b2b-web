import Button from "@/components/ui/Button";
import Overlay from "@/components/ui/Overlay";
import Radio from "@/components/ui/Radio";
import Spinner from "@/components/ui/Spinner";
import { useUser } from "@/lib/hooks/useUser";
import {
  CheckBrigdeVerificationStatusApi,
  CreateUSDWalletApi,
  GetKYBLinksApi,
} from "@/services/business";
import { convertToTitle } from "@/utils/helpers";
import {
  canStartUsdVerification,
  getOnboardingBranchState,
  OnboardingCurrencyPath,
} from "@/utils/onboardingBranch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { toast } from "sonner";
import BusinessVerificationModal from "./BusinessVerificationModal";
import CreateNgnAcct from "./createNgnAcct/CreateNgnAcct";
import SetTransactionPin from "./transaction-pin/SetTransactionPin";
import { AnimatePresence } from "motion/react";
import SideModalWrapper from "./SideModalWrapper";
import Image from "next/image";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";

interface AccountUpgradeProps {
  resumeFromStep2?: boolean;
  onBack?: () => void;
}

const AccountUpgrade = ({
  resumeFromStep2 = false,
  onBack,
}: AccountUpgradeProps) => {
  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";
  const { user, refetch } = useUser();
  const { setSelectedCurrency } = useCurrencyStore();
  const [showModal, setShowModal] = useState<
    "acctSetup" | "getNgn" | "set-pin" | null
  >(null);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [activeCurrencyPath, setActiveCurrencyPath] =
    useState<OnboardingCurrencyPath | null>(null);
  const [selectedCurrencyPath, setSelectedCurrencyPath] =
    useState<OnboardingCurrencyPath>("NGN");
  const [usdVerificationData, setUsdVerificationData] = useState<{
    kyc_status?: string;
    tos_status?: string;
    kyc_link?: string;
    tos_link?: string;
    wallet_status?: string;
  } | null>(null);
  const qc = useQueryClient();

  const handleCloseModal = () => {
    setShowModal(null);
  };

  const CheckBridgeVerification = useMutation({
    mutationFn: CheckBrigdeVerificationStatusApi,
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ["KYB-links"] });
      if (response === "completed") {
        refetch();
      }
      toast.info(`Your KYB verification status is ${convertToTitle(response)}`);
    },
  });

  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;
  const caseStage =
    user?.business_account?.business_verifications?.[0]?.case_stage;

  const branchState = getOnboardingBranchState(user, verificationStatus);

  const { data, refetch: refetchKybLinks, isFetching: isKybLinksFetching } =
    useQuery({
    queryKey: ["KYB-links"],
    queryFn: GetKYBLinksApi,
    refetchOnWindowFocus: true,
    enabled: branchState.isStep1Complete || resumeFromStep2,
  });

  const USDVerificationMutation = useMutation({
    mutationFn: CreateUSDWalletApi,
    onSuccess: (response) => {
      if (response?.data) {
        setUsdVerificationData(response.data);
      }
      qc.invalidateQueries({ queryKey: ["KYB-links"] });
      refetchKybLinks();
      toast.success(response?.message || "USD verification started.");
    },
  });

  const effectiveKybData = usdVerificationData ?? data;

  const handleAcceptTOS = () => {
    if (effectiveKybData?.tos_link) {
      window.open(effectiveKybData.tos_link, "_blank");
    }
    setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["KYB-links"] });
      if (tosApproved) {
        CheckBridgeVerification.mutate();
      }
    }, 5000);
  };

  const tosApproved =
    effectiveKybData?.tos_status === "approved" ||
    effectiveKybData?.tos_status === "accepted";
  const tosPending = !tosApproved && !!effectiveKybData?.tos_link;

  const kycNotStarted = effectiveKybData?.kyc_status === "not_started";
  const kycAwaitingUbo = effectiveKybData?.kyc_status === "awaiting_ubo";
  const kycUnderReview = effectiveKybData?.kyc_status === "under_review";
  const caseStageAwaitingUbo = caseStage === "awaiting_ubo";

  const showUsdSteps =
    resumeFromStep2 || activeCurrencyPath === "USD";
  const isUsdSetupLoading =
    USDVerificationMutation.isPending ||
    (showUsdSteps &&
      !effectiveKybData?.tos_link &&
      (USDVerificationMutation.isPending || isKybLinksFetching));
  const showOnlyStep1 =
    !resumeFromStep2 &&
    (!branchState.isStep1Complete ||
      (branchState.needsCurrencyChoice && activeCurrencyPath === null));

  const step1Status =
    verificationStatus === "not_started"
      ? "active"
      : branchState.isStep1Complete
        ? "completed"
        : "pending";

  const step2Status: "completed" | "active" | "pending" = tosApproved
    ? "completed"
    : tosPending
      ? "active"
      : "pending";

  const step3Status: "completed" | "active" | "pending" =
    verificationStatus === "completed"
      ? "completed"
      : tosApproved
        ? "active"
        : "pending";

  const step4Status: "completed" | "active" | "pending" =
    verificationStatus === "completed" ? "completed" : "pending";

  useEffect(() => {
    if (activeCurrencyPath === null && branchState.hasUsdWallet) {
      setActiveCurrencyPath("USD");
    }
  }, [activeCurrencyPath, branchState.hasUsdWallet]);

  useEffect(() => {
    if (
      branchState.needsCurrencyChoice &&
      activeCurrencyPath === null &&
      !showCurrencyModal &&
      !showModal
    ) {
      setShowCurrencyModal(true);
    }
  }, [
    branchState.needsCurrencyChoice,
    activeCurrencyPath,
    showCurrencyModal,
    showModal,
  ]);

  const handleChangeCurrency = () => {
    setActiveCurrencyPath(null);
    setShowCurrencyModal(true);
  };

  const handleCurrencyContinue = () => {
    setActiveCurrencyPath(selectedCurrencyPath);
    setShowCurrencyModal(false);

    if (selectedCurrencyPath === "NGN") {
      setShowModal("getNgn");
    } else {
      if (canStartUsdVerification(user, verificationStatus, caseStage)) {
        USDVerificationMutation.mutate();
      } else {
        qc.invalidateQueries({ queryKey: ["KYB-links"] });
        refetchKybLinks();
      }
    }
  };

  const handleNgnCreated = () => {
    handleCloseModal();
    refetch().then((result) => {
      setSelectedCurrency("NGN", result.data ?? user);
    });
  };

  const handleVerificationSuccess = () => {
    setShowCurrencyModal(true);
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
          {resumeFromStep2 && onBack && (
            <button
              onClick={onBack}
              className="mb-4 text-sm font-semibold text-[#3C2875] hover:underline"
            >
              Back to dashboard
            </button>
          )}

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
                Complete your account setup and verify your details to unlock
                full access to all features.
              </p>
            </div>
          </div>

          {/* Steps Container */}
          <div className="relative px-0 md:px-10">
            {/* Step 1: Basic Business Information */}
            {!resumeFromStep2 && (
              <Step
                status={step1Status}
                title="Basic Business Information"
                description="Tell us a bit about your business to get started."
                isLast={showOnlyStep1}
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
                {activeCurrencyPath === "NGN" && !branchState.hasNgnWallet && (
                  <div className="mt-3 md:mt-4">
                    <Button
                      onClick={() => setShowModal("getNgn")}
                      className="w-full sm:w-fit h-10 md:h-[41px]"
                    >
                      Continue NGN Account Setup
                    </Button>
                  </div>
                )}
                {branchState.needsCurrencyChoice && activeCurrencyPath && (
                  <button
                    type="button"
                    onClick={handleChangeCurrency}
                    className="mt-3 text-sm font-semibold text-[#3C2875] hover:underline"
                  >
                    Change starting currency
                  </button>
                )}
              </Step>
            )}

            {showUsdSteps && (
              <>
                {isUsdSetupLoading && (
                  <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
                    <Spinner className="!h-6 !w-6 !border-t-2 !border-b-2 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-raiz-gray-950">
                        Setting up your USD account
                      </p>
                      <p className="text-xs text-raiz-gray-600 mt-0.5">
                        Preparing your verification links. This may take a
                        moment.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Accept Terms & Conditions */}
                <Step
                  status={step2Status}
                  title="Accept Terms & Conditions"
                  description="Please review and accept our business terms to proceed with your application"
                >
                  <div className="mt-3 md:mt-4">
                    <Button
                      onClick={handleAcceptTOS}
                      disabled={
                        tosApproved ||
                        !effectiveKybData?.tos_link ||
                        isUsdSetupLoading
                      }
                      loading={isUsdSetupLoading}
                      className="px-6 py-2.5 w-full sm:w-fit h-10 md:h-[41px]"
                    >
                      {isUsdSetupLoading
                        ? "Preparing..."
                        : tosApproved
                          ? "Accepted"
                          : "Review & Accept"}
                    </Button>
                  </div>
                </Step>

                {/* Step 3: Verify Your Business (Pending) */}
                <Step
                  status={step3Status}
                  title="Verify your Business (KYB)"
                  isLast={!isStaging}
                  description="We need to verify your business identity. Here's what you'll need to have ready:"
                >
                  <div className="mt-4 md:mt-6 bg-white border border-gray-100 rounded-xl p-4 md:p-6 shadow-sm">
                    <h4 className="text-sm font-semibold text-[#443852] mb-3 md:mb-4">
                      Required Submissions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 md:gap-y-3 gap-x-8">
                      <RequirementItem text="Certificate of Inc." />
                      <RequirementItem text="Government ID" />
                      <RequirementItem text="Ultimate Beneficial Owners (UBOs) Identity Verification" />
                      <RequirementItem text="Proof of Address" />
                      <RequirementItem text="Source of Funds" />
                      <RequirementItem text="Proof of Business Activity" />
                    </div>
                  </div>
                  <div className="mt-4 md:mt-6">
                    <button
                      onClick={() => {
                        if (effectiveKybData?.kyc_link) {
                          window.open(effectiveKybData.kyc_link);
                        }
                      }}
                      disabled={
                        !tosApproved ||
                        !effectiveKybData?.kyc_link ||
                        (!kycNotStarted && !kycAwaitingUbo && !caseStageAwaitingUbo)
                      }
                      className="w-full sm:w-fit px-6 py-2.5 h-10 md:h-[41px] bg-white border-2 border-[#F8F7FA] text-[#3C2875] font-bold rounded-3xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {verificationStatus === "completed"
                        ? "KYB Completed"
                        : kycAwaitingUbo || caseStageAwaitingUbo
                          ? "Awaiting UBOs"
                          : kycUnderReview
                            ? "KYB Under Review"
                            : "Start KYB Process"}
                    </button>
                    {(kycAwaitingUbo || caseStageAwaitingUbo) && (
                      <p className="text-raiz-gray-500 text-xs md:text-sm mt-2 leading-relaxed">
                        Note: Verification links have been sent to the email
                        addresses of all UBOs provided.
                      </p>
                    )}
                  </div>
                </Step>

                {/* Step 4: Check Status (Staging Only) */}
                {isStaging && (
                  <Step
                    status={step4Status}
                    isLast={true}
                    title="Check your Verification Status (For Staging Only)"
                    description="Monitor your verification status here once submitted."
                  >
                    <div className="mt-3 md:mt-4">
                      <button
                        onClick={() => CheckBridgeVerification.mutate()}
                        disabled={CheckBridgeVerification.isPending}
                        className="w-full sm:w-fit px-6 py-2.5 h-10 md:h-[41px] bg-white border-2 border-[#F8F7FA] text-[#3C2875] font-bold rounded-3xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {CheckBridgeVerification.isPending
                          ? "Checking..."
                          : "Check Status"}
                      </button>
                    </div>
                  </Step>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showCurrencyModal && (
        <Overlay
          close={() => setShowCurrencyModal(false)}
          width="375px"
        >
          <div className="flex flex-col h-full py-8 px-5 font-brSonoma">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-zinc-900 text-xl font-bold leading-normal">
                  Welcome to Raiz! 🎉
                </h3>
                <p className="text-zinc-900 text-xs leading-tight mt-1">
                  Choose which currency you would like to start with
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
                    ? "border-indigo-900"
                    : "border-zinc-200"
                } rounded-[20px] flex items-center justify-between w-full px-4 py-4 transition-colors hover:border-indigo-900`}
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/icons/dollar.svg"
                    alt="USD"
                    width={40}
                    height={40}
                    className="size-10 rounded-full"
                  />
                  <div className="text-left">
                    <p className="text-zinc-900 text-sm font-bold leading-none">
                      USD Account
                    </p>
                    <p className="text-zinc-900 text-xs font-normal leading-tight mt-1">
                      Create an USD account
                    </p>
                  </div>
                </div>
                <Radio
                  checked={selectedCurrencyPath === "USD"}
                  onChange={() => setSelectedCurrencyPath("USD")}
                />
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCurrencyPath("NGN")}
                className={`border cursor-pointer ${
                  selectedCurrencyPath === "NGN"
                    ? "border-indigo-900"
                    : "border-zinc-200"
                } rounded-[20px] flex items-center justify-between w-full px-4 py-4 transition-colors hover:border-indigo-900`}
              >
                <div className="flex items-center gap-3">
                  <Image
                    src="/icons/ngn.svg"
                    alt="NGN"
                    width={40}
                    height={40}
                    className="size-10 rounded-full"
                  />
                  <div className="text-left">
                    <p className="text-zinc-900 text-sm font-bold leading-none">
                      NGN Account
                    </p>
                    <p className="text-zinc-900 text-xs font-normal leading-tight mt-1">
                      Create a NGN account
                    </p>
                  </div>
                </div>
                <Radio
                  checked={selectedCurrencyPath === "NGN"}
                  onChange={() => setSelectedCurrencyPath("NGN")}
                />
              </div>
            </div>

            <Button
              onClick={handleCurrencyContinue}
              disabled={USDVerificationMutation.isPending}
              className="w-full mt-6"
            >
              {USDVerificationMutation.isPending ? "Please wait..." : "Continue"}
            </Button>
            <p className="text-center text-xs text-raiz-gray-500 mt-3">
              You can add the other currency later
            </p>
          </div>
        </Overlay>
      )}

      <AnimatePresence>
        {showModal ? (
          <CenterModalWrapper
            close={handleCloseModal}
          >
            {displayModal()}
          </CenterModalWrapper>
        ) : null}
      </AnimatePresence>
      {/* {showModal === "getNgn" &&
      <CenterModalWrapper close={handleCloseModal}>
        <CreateNgnAcct close={handleNgnCreated} />
      </CenterModalWrapper>
       null} */}

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

const RequirementItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2">
    <div className="size-4 shrink-0 mt-0.5">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8.00016 14.6668C11.6668 14.6668 14.6668 11.6668 14.6668 8.00016C14.6668 4.3335 11.6668 1.3335 8.00016 1.3335C4.3335 1.3335 1.3335 4.3335 1.3335 8.00016C1.3335 11.6668 4.3335 14.6668 8.00016 14.6668Z"
          stroke="#443852"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.1665 7.99995L7.05317 9.88661L10.8332 6.11328"
          stroke="#443852"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <span className="text-xs md:text-sm text-[#443852] leading-snug">{text}</span>
  </div>
);

export default AccountUpgrade;
