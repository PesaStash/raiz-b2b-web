import type { NgnAipriseFlow, NgnKybRequirementStatus } from "@/types/services";
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
