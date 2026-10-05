import { GatewaySubaccountStatus } from "@/types/services";
import { IGatewaySubaccount } from "@/types/services";

export const GATEWAY_STATUS_LABELS: Record<string, string> = {
  created: "Pending",
  under_review: "Pending",
  requires_kyc: "Requires KYC",
  active: "Approved",
  rejected: "Rejected",
  failed: "Failed",
};

export const getGatewayStatusTone = (
  status: string,
): "success" | "warning" | "danger" | "neutral" => {
  switch (status) {
    case "active":
      return "success";
    case "requires_kyc":
    case "created":
    case "under_review":
      return "warning";
    case "rejected":
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
};

export const getGatewayStatusLabel = (status: string) =>
  GATEWAY_STATUS_LABELS[status] ||
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const getSubaccountDisplayName = (
  subaccount: IGatewaySubaccount,
): string => {
  const first = subaccount.customer_snapshot?.first_name?.trim() || "";
  const last = subaccount.customer_snapshot?.last_name?.trim() || "";
  const fullName = `${first} ${last}`.trim();
  if (fullName) return fullName;
  if (subaccount.external_customer_id) return subaccount.external_customer_id;
  return subaccount.gateway_subaccount_id;
};

export const formatGatewayReason = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.reason === "string") return record.reason;
    if (typeof record.description === "string") return record.description;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value ?? "");
};

export const shouldShowRejectionBanner = (status: string) =>
  status === "requires_kyc" || status === "rejected" || status === "failed";

export type GatewaySummaryFilterKey =
  | "all"
  | Exclude<GatewaySubaccountStatus, "created">;

export const GATEWAY_EXTERNAL_RAIL_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "arbitrum", label: "Arbitrum" },
  { value: "avalanche_c_chain", label: "Avalanche C-Chain" },
  { value: "base", label: "Base" },
  { value: "ethereum", label: "Ethereum" },
  { value: "optimism", label: "Optimism" },
  { value: "polygon", label: "Polygon" },
  { value: "solana", label: "Solana" },
  { value: "stellar", label: "Stellar" },
  { value: "tempo", label: "Tempo" },
  { value: "tron", label: "Tron" },
];

export const getRailLabel = (rail: string | null | undefined) => {
  if (!rail) return "—";
  const match = GATEWAY_EXTERNAL_RAIL_OPTIONS.find(
    (option) => option.value === rail,
  );
  if (match) return match.label;
  return rail
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const CURRENCY_FLAG_SRC: Record<string, string> = {
  USD: "/icons/flag-us.webp",
  GBP: "/icons/flag-gb.png",
  EUR: "/icons/flag-fr.png",
  NGN: "/icons/flag-ng.png",
  CAD: "/icons/flag-ca.png",
};

export const getCurrencyFlagSrc = (currency: string) =>
  CURRENCY_FLAG_SRC[currency.toUpperCase()] || "/icons/flag-not.png";
