import { UsdKybCaseStatus } from "@/types/user";

export type UsdTimelineStepKey =
  | "requested"
  | "collecting"
  | "under_review"
  | "active";

export interface UsdTimelineStep {
  key: UsdTimelineStepKey;
  label: string;
  state: "complete" | "active" | "upcoming";
}

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  collecting: "Collecting",
  ready_for_review: "Ready for review",
  submitted_to_bridge: "Under review",
  under_review: "Under review",
  requires_additional_info: "Additional info required",
  approved: "Approved",
  completed: "Active",
  rejected: "Rejected",
};

const STATUS_COMPACT_LABELS: Record<string, string> = {
  collecting: "Collecting Documents",
  ready_for_review: "Collecting Documents",
  requires_additional_info: "Collecting Documents",
  submitted_to_bridge: "Under Review",
  under_review: "Under Review",
  approved: "Active",
  completed: "Active",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  collecting: "bg-[#EAECFF99] text-[#0D6494]",
  ready_for_review: "bg-[#EAECFF99] text-[#0D6494]",
  requires_additional_info: "bg-[#FFF3E6] text-[#C76E00]",
  submitted_to_bridge: "bg-[#EAECFF99] text-[#0D6494]",
  under_review: "bg-[#EAECFF99] text-[#0D6494]",
  approved: "bg-[#E8F5E9] text-[#2E7D32]",
  completed: "bg-[#E8F5E9] text-[#2E7D32]",
  rejected: "bg-[#FFEBEE] text-[#C62828]",
  not_started: "bg-raiz-gray-50 text-raiz-gray-700",
};

function normalizeStatus(status: UsdKybCaseStatus) {
  return status?.toLowerCase?.() ?? status;
}

export function getUsdOnboardingStatusLabel(
  status: UsdKybCaseStatus,
  compact = false
) {
  const key = normalizeStatus(status);
  const labels = compact ? STATUS_COMPACT_LABELS : STATUS_LABELS;
  return labels[key] ?? STATUS_LABELS[key] ?? key.replace(/_/g, " ");
}

export function getUsdOnboardingStatusStyle(status: UsdKybCaseStatus) {
  const key = normalizeStatus(status);
  return (
    STATUS_STYLES[key] ??
    "bg-raiz-gray-50 text-raiz-gray-800 border-raiz-gray-200"
  );
}

function getCurrentTimelineStep(status: UsdKybCaseStatus): UsdTimelineStepKey {
  const key = normalizeStatus(status);

  if (key === "approved" || key === "completed") return "active";
  if (key === "submitted_to_bridge" || key === "under_review") {
    return "under_review";
  }
  if (
    key === "collecting" ||
    key === "ready_for_review" ||
    key === "requires_additional_info"
  ) {
    return "collecting";
  }

  return "requested";
}

export function getUsdOnboardingTimelineSteps(
  status: UsdKybCaseStatus
): UsdTimelineStep[] {
  const current = getCurrentTimelineStep(status);
  const order: UsdTimelineStepKey[] = [
    "requested",
    "collecting",
    "under_review",
    "active",
  ];
  const currentIndex = order.indexOf(current);

  const labels: Record<UsdTimelineStepKey, string> = {
    requested: "Requested",
    collecting: "Collecting",
    under_review: "Under Review",
    active: "Active",
  };

  return order.map((key, index) => ({
    key,
    label: labels[key],
    state:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "active"
          : "upcoming",
  }));
}
