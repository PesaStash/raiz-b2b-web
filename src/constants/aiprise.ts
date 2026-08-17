import type { NgnAipriseFlow } from "@/types/services";

export type AipriseMode = "SANDBOX" | "PRODUCTION";

export const AIPRISE_CONFIG_ERROR =
  "Verification is not configured yet. Please contact support to continue NGN account setup.";

function isAipriseMode(value: string | undefined): value is AipriseMode {
  return value === "SANDBOX" || value === "PRODUCTION";
}

export function getAipriseConfig() {
  const mode = process.env.NEXT_PUBLIC_AIPRISE_MODE;
  const businessTemplateId =
    process.env.NEXT_PUBLIC_AIPRISE_BUSINESS_TEMPLATE_ID ?? "";
  const userTemplateId = process.env.NEXT_PUBLIC_AIPRISE_USER_TEMPLATE_ID ?? "";
  const resolvedMode: AipriseMode = isAipriseMode(mode) ? mode : "SANDBOX";

  return {
    mode: resolvedMode,
    businessTemplateId,
    userTemplateId,
    isConfigured:
      isAipriseMode(mode) &&
      businessTemplateId.length > 0 &&
      userTemplateId.length > 0,
  };
}

export function getAipriseTemplateId(flow: NgnAipriseFlow) {
  const config = getAipriseConfig();
  return flow === "cac" ? config.businessTemplateId : config.userTemplateId;
}
