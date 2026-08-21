import type {
  INgnVerificationRequirements,
  NgnKybRequirementStatus,
} from "@/types/services";

export type NgnKybStepUiState =
  | "start"
  | "continue"
  | "retry"
  | "processing"
  | "review"
  | "completed"
  | "locked";

export const NGN_REQUIREMENTS_QUERY_KEY = ["ngn-requirements"] as const;

export function isNgnRequirementPending(
  status?: NgnKybRequirementStatus | null,
) {
  return status === "pending" || status === "review";
}

export function isNgnRequirementApproved(
  status?: NgnKybRequirementStatus | null,
) {
  return status === "approved" || status === "completed";
}

export function isNgnRequirementRetryable(
  status?: NgnKybRequirementStatus | null,
) {
  return (
    status === "declined" || status === "expired" || status === "abandoned"
  );
}

export function hasStartedNgnKyb(
  requirements?: INgnVerificationRequirements | null,
) {
  if (!requirements) return false;
  return (
    requirements.cac_document_status !== "not_started" ||
    requirements.ubo_status !== "not_started"
  );
}

export function isNgnKybInProgress(
  requirements?: INgnVerificationRequirements | null,
) {
  if (!requirements) return false;
  return (
    hasStartedNgnKyb(requirements) && !requirements.can_create_ngn_account
  );
}

/** Poll while verification is active and the NGN account cannot yet be created. */
export function shouldPollNgnRequirements(
  requirements?: INgnVerificationRequirements | null,
) {
  if (!requirements || requirements.can_create_ngn_account) return false;
  return (
    isNgnRequirementPending(requirements.cac_document_status) ||
    isNgnRequirementPending(requirements.ubo_status) ||
    (isNgnRequirementApproved(requirements.cac_document_status) &&
      isNgnRequirementApproved(requirements.ubo_status))
  );
}

export function getNgnKybRequirementLabel(
  status?: NgnKybRequirementStatus | null,
) {
  switch (status) {
    case "pending":
      return "In progress";
    case "review":
      return "Under review";
    case "approved":
    case "completed":
      return "Approved";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
    case "abandoned":
      return "Abandoned";
    case "not_started":
      return "Not started";
    default:
      return "Not started";
  }
}

export function getNgnKybRequirementStyle(
  status?: NgnKybRequirementStatus | null,
) {
  switch (status) {
    case "pending":
      return "bg-[#EAECFF99] text-[#0D6494]";
    case "review":
      return "bg-[#FFF3E6] text-[#C76E00]";
    case "approved":
    case "completed":
      return "bg-[#E8F5E9] text-[#2E7D32]";
    case "declined":
    case "expired":
    case "abandoned":
      return "bg-[#FFEBEE] text-[#C62828]";
    default:
      return "bg-raiz-gray-50 text-raiz-gray-700";
  }
}

export function getNgnKybProgressCardCopy(
  requirements: INgnVerificationRequirements,
) {
  if (requirements.can_create_ngn_account) {
    return {
      title: "NGN Account Ready to Create",
      message:
        "Your business verification is complete. Create your NGN account to start transacting.",
      ctaLabel: "Create NGN Account",
    };
  }

  const hasRetryable =
    isNgnRequirementRetryable(requirements.cac_document_status) ||
    isNgnRequirementRetryable(requirements.ubo_status);

  if (hasRetryable) {
    return {
      title: "NGN Account Verification Needs Attention",
      message:
        "Verification was not completed successfully. Review the details and try again.",
      ctaLabel: "Continue setup",
    };
  }

  const bothApproved =
    isNgnRequirementApproved(requirements.cac_document_status) &&
    isNgnRequirementApproved(requirements.ubo_status);

  if (bothApproved) {
    return {
      title: "Saving Verification Evidence",
      message:
        "Your verification was approved. We’re finishing up—this page will update automatically.",
      ctaLabel: "View verification status",
    };
  }

  const isInReview =
    requirements.cac_document_status === "review" ||
    requirements.ubo_status === "review";
  const isPendingOnly =
    requirements.cac_document_status === "pending" ||
    requirements.ubo_status === "pending";

  if (isInReview) {
    return {
      title: "NGN Account Verification in Progress",
      message:
        "We are reviewing your submitted documents. This page will update automatically.",
      ctaLabel: "View verification status",
    };
  }

  return {
    title: "NGN Account Verification in Progress",
    message: isPendingOnly
      ? "Your verification session is open. Continue where you left off, or start again if needed."
      : "Complete UBO identity and CAC document verification to activate your NGN account.",
    ctaLabel: isPendingOnly ? "Continue verification" : "View verification status",
  };
}

export function getNgnKybStepUiState(
  status: NgnKybRequirementStatus | undefined,
  locked = false,
): NgnKybStepUiState {
  if (locked) return "locked";
  switch (status) {
    case "approved":
    case "completed":
      return "completed";
    case "pending":
      // Session may exist but the hosted flow was not finished yet.
      return "continue";
    case "review":
      return "review";
    case "declined":
    case "expired":
    case "abandoned":
      return "retry";
    default:
      return "start";
  }
}

/** Combined CAC + UBO action state for the single Didit session CTA. */
export function getCombinedNgnKybUiState(
  requirements?: INgnVerificationRequirements | null,
): NgnKybStepUiState {
  if (!requirements) return "start";
  if (requirements.can_create_ngn_account) return "completed";

  const cac = getNgnKybStepUiState(requirements.cac_document_status);
  const ubo = getNgnKybStepUiState(requirements.ubo_status);

  if (cac === "retry" || ubo === "retry") return "retry";
  if (cac === "review" || ubo === "review") return "review";

  const bothApproved =
    isNgnRequirementApproved(requirements.cac_document_status) &&
    isNgnRequirementApproved(requirements.ubo_status);
  // Evidence still saving — wait; do not reopen the hosted flow.
  if (bothApproved) return "processing";

  if (cac === "continue" || ubo === "continue") return "continue";

  return "start";
}

export function canResumeNgnKybSession(state: NgnKybStepUiState) {
  return state === "start" || state === "continue" || state === "retry";
}

export function getCombinedNgnKybActionLabel(state: NgnKybStepUiState) {
  switch (state) {
    case "continue":
      return "Continue verification";
    case "retry":
      return "Retry verification";
    case "processing":
      return "Processing...";
    case "review":
      return "Under review";
    case "completed":
      return "Completed";
    default:
      return "Verify UBO identity and CAC document";
  }
}
