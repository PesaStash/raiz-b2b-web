import Button from "@/components/ui/Button";
import { useUser } from "@/lib/hooks/useUser";
import {
  CheckBrigdeVerificationStatusApi,
  GetKYBLinksApi,
} from "@/services/business";
import { convertToTitle } from "@/utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { FaCheck, FaCircle } from "react-icons/fa";
import { toast } from "sonner";
import BusinessVerificationModal from "./BusinessVerificationModal";
import CreateNgnAcct from "./createNgnAcct/CreateNgnAcct";
import SetTransactionPin from "./transaction-pin/SetTransactionPin";
import { AnimatePresence } from "motion/react";
import SideModalWrapper from "./SideModalWrapper";

const AccountUpgrade = () => {
  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";
  const { user, refetch } = useUser();
  const [showModal, setShowModal] = useState<
    "acctSetup" | "getNgn" | "set-pin" | null
  >(null);
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

  const { data } = useQuery({
    queryKey: ["KYB-links"],
    queryFn: GetKYBLinksApi,
    refetchOnWindowFocus: true,
  });

  const handleAcceptTOS = () => {
    window.open(data?.tos_link, "_blank");
    // optional immediate refetch
    setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["KYB-links"] });
      if (tosApproved) {
        CheckBridgeVerification.mutate();
      }
    }, 5000);
  };

  const verificationStatus =
    user?.business_account?.business_verifications?.[0]?.verification_status;

  const tosPending = data?.tos_status === "pending";
  const tosApproved = data?.tos_status === "approved";

  const kycNotStarted = data?.kyc_status === "not_started";
  const kycAwaitingUbo = data?.kyc_status === "awaiting_ubo";
  const kycUnderReview = data?.kyc_status === "under_review";

  const step1Status =
    verificationStatus === "not_started"
      ? "active"
      : verificationStatus === "pending"
        ? "completed"
        : "pending";

  // STEP 2 — Terms & Conditions
  const step2Status: "completed" | "active" | "pending" = tosApproved
    ? "completed"
    : tosPending
      ? "active"
      : "pending";

  // STEP 3 — KYB
  const step3Status: "completed" | "active" | "pending" =
    verificationStatus === "completed"
      ? "completed"
      : tosApproved
        ? "active"
        : "pending";

  // STEP 4 — Check status
  const step4Status: "completed" | "active" | "pending" =
    verificationStatus === "completed" ? "completed" : "pending";

  const displayModal = () => {
    switch (showModal) {
      case "acctSetup":
        return <BusinessVerificationModal close={handleCloseModal} />;

      case "getNgn":
        return (
          <CreateNgnAcct
            close={handleCloseModal}
            // openBvnModal={() => setShowBvnModal(true)}
          />
        );
      case "set-pin":
        return <SetTransactionPin close={handleCloseModal} />;
      default:
        break;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white mt-8  font-sans">
        <div className=" bg-[#FFF3E666] rounded-lg px-4 py-5">
          {/* Header Section */}
          <div className="flex items-start gap-4 mb-10">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
            <div>
              <h1 className="text-base font-bold text-gray-900">
                Complete Account Set Up
              </h1>
              <p className="text-[#6F5B86] mt-1 text-sm">
                Complete your account setup and verify your details to unlock
                full access to all features.
              </p>
            </div>
          </div>

          {/* Steps Container */}
          <div className="relative px-10">
            {/* Step 1: Basic Business Information (Completed) */}
            <Step
              status={step1Status}
              title="Basic Business Information"
              description="Tell us a bit about your business to get started."
            >
              <div className="mt-4">
                <Button
                  onClick={() => setShowModal("acctSetup")}
                  className="w-fit h-[41px]"
                  disabled={verificationStatus !== "not_started"}
                >
                  {verificationStatus === "not_started"
                    ? "Get Started"
                    : "Completed"}
                </Button>
              </div>
            </Step>

            {/* Step 2: Accept Terms & Conditions (Active) */}
            <Step
              status={step2Status}
              title="Accept Terms & Conditions"
              description="Please review and accept our business terms to proceed with your application"
            >
              <div className="mt-4">
                <Button
                  onClick={handleAcceptTOS}
                  disabled={tosApproved || !data?.tos_status}
                  className="px-6 py-2.5 w-fit h-[41px]"
                >
                  {tosApproved ? "Accepted" : "Review & Accept"}
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
              {/* Inner Card */}
              <div className="mt-6 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <h4 className="text-sm font-semibold text-[#443852] mb-4">
                  Required Submissions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                  <RequirementItem text="Certificate of Inc." />
                  <RequirementItem text="Government ID" />
                  <RequirementItem text="Ultimate Beneficial Owners (UBOs) Identity Verification" />
                  <RequirementItem text="Proof of Address" />
                  <RequirementItem text="Source of Funds" />
                  <RequirementItem text="Proof of Business Activity" />
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => window.open(data?.kyc_link)}
                  disabled={!tosApproved || !kycNotStarted}
                  className="px-6 py-2.5 h-[41px] bg-white border-2 border-[#F8F7FA] text-[#3C2875] font-bold rounded-3xl text-sm hover:bg-gray-50 transition-colors  disabled:opacity-50"
                >
                  {verificationStatus === "completed"
                    ? "KYB Completed"
                    : kycAwaitingUbo
                      ? "Awaiting UBOs"
                      : kycUnderReview
                        ? "KYB Under Review"
                        : "Start KYB Process"}
                </button>
                {kycAwaitingUbo && (
                  <p className="text-raiz-gray-500 text-sm mt-1 leading-relaxed">
                    {" "}
                    Note: Verification links have been sent to the email
                    addresses of all UBOs provided.
                  </p>
                )}
              </div>
            </Step>

            {/* Step 4: Check Status (Pending/Last) */}
            {isStaging && (
              <Step
                status={step4Status}
                isLast={true}
                title="Check your Verification Status (For Staging Only)"
                description="Monitor your verification status here once submitted."
              >
                <div className="mt-4">
                  <button
                    onClick={() => CheckBridgeVerification.mutate()}
                    disabled={CheckBridgeVerification.isPending}
                    className="px-6 py-2.5 h-[41px] bg-white border-2 border-[#F8F7FA] text-[#3C2875] font-bold rounded-3xl text-sm hover:bg-gray-50 transition-colors  disabled:opacity-50"
                  >
                    {CheckBridgeVerification.isPending
                      ? "Checking..."
                      : "Check Status"}
                  </button>
                </div>
              </Step>
            )}
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
    <div className="flex gap-4">
      {/* Icon Column */}
      <div className="flex flex-col items-center">
        <div
          className={`
          flex items-center justify-center w-6 h-6 rounded-full z-10 shrink-0
          ${status === "completed" ? "bg-[#9BCF53] text-white" : ""}
          ${status === "active" ? "bg-[#3B6D98] ring-4 ring-blue-100" : ""}
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

        {/* Connecting Line */}
        {!isLast && <div className="w-px flex-1 bg-gray-200 my-2" />}
      </div>

      {/* Content Column */}
      <div className={`pb-12 ${isLast ? "pb-0" : ""} pt-0.5 w-full`}>
        <h3 className="text-sm font-semibold text-raiz-gray-950">{title}</h3>
        <p className="text-raiz-gray-950 text-sm mt-1 leading-relaxed">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
};

const RequirementItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 ">
    <div className="size-4">
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
    <span className="text-sm  text-[#443852]">{text}</span>
  </div>
);

export default AccountUpgrade;
