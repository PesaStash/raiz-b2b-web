import type {
  INgnVerificationRequirements,
  NgnAipriseFlow,
  NgnKybRequirementStatus,
} from "@/types/services";
import {
  GetItemFromLocalStorage,
  RemoveItemFromLocalStorage,
  SetItemToLocalStorage,
} from "@/utils/localStorageFunc";

const SESSION_KEY_PREFIX = "ngn-aiprise-session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredAipriseSession {
  sessionId: string;
  savedAt: number;
}

export type NgnKybStepUiState =
  | "start"
  | "retry"
  | "processing"
  | "review"
  | "completed"
  | "locked";

export const NGN_REQUIREMENTS_QUERY_KEY = ["ngn-requirements"] as const;

function getSessionKey(entityId: string, flow: NgnAipriseFlow) {
  return `${SESSION_KEY_PREFIX}:${entityId}:${flow}`;
}

export function isNgnRequirementPending(status?: NgnKybRequirementStatus | null) {
  return status === "pending" || status === "review";
}

export function isNgnRequirementApproved(status?: NgnKybRequirementStatus | null) {
  return status === "approved";
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

export function getNgnKybRequirementLabel(
  status?: NgnKybRequirementStatus | null,
) {
  switch (status) {
    case "pending":
      return "Processing";
    case "review":
      return "Under review";
    case "approved":
      return "Approved";
    case "declined":
      return "Declined";
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
      return "bg-[#E8F5E9] text-[#2E7D32]";
    case "declined":
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

  const hasDeclined =
    requirements.cac_document_status === "declined" ||
    requirements.ubo_status === "declined";

  if (hasDeclined) {
    return {
      title: "NGN Account Verification Needs Attention",
      message:
        "One or more verification steps were declined. Review the details and retry where needed.",
      ctaLabel: "Continue setup",
    };
  }

  const isWaiting =
    isNgnRequirementPending(requirements.cac_document_status) ||
    isNgnRequirementPending(requirements.ubo_status);

  return {
    title: "NGN Account Verification in Progress",
    message: isWaiting
      ? "We are reviewing your submitted documents. This page will update automatically."
      : "Complete the remaining verification steps to activate your NGN account.",
    ctaLabel: "View verification status",
  };
}

export function getNgnKybStepUiState(
  status: NgnKybRequirementStatus | undefined,
  locked = false,
): NgnKybStepUiState {
  if (locked) return "locked";
  switch (status) {
    case "approved":
      return "completed";
    case "pending":
      return "processing";
    case "review":
      return "review";
    case "declined":
      return "retry";
    default:
      return "start";
  }
}

export function saveAipriseResumeSessionId(
  entityId: string,
  flow: NgnAipriseFlow,
  sessionId: string,
) {
  SetItemToLocalStorage(getSessionKey(entityId, flow), {
    sessionId,
    savedAt: Date.now(),
  } satisfies StoredAipriseSession);
}

export function getAipriseResumeSessionId(
  entityId: string | undefined,
  flow: NgnAipriseFlow,
): string | undefined {
  if (!entityId) return undefined;

  const stored = GetItemFromLocalStorage(
    getSessionKey(entityId, flow),
  ) as StoredAipriseSession | null;

  if (!stored?.sessionId) return undefined;

  if (
    typeof stored.savedAt !== "number" ||
    Date.now() - stored.savedAt > SESSION_MAX_AGE_MS
  ) {
    clearAipriseResumeSessionId(entityId, flow);
    return undefined;
  }

  return stored.sessionId;
}

export function clearAipriseResumeSessionId(
  entityId: string | undefined,
  flow: NgnAipriseFlow,
) {
  if (!entityId) return;
  RemoveItemFromLocalStorage(getSessionKey(entityId, flow));
}
