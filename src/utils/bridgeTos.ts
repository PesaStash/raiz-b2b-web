import { IBridgeTosAcceptMessage } from "@/types/user";

const BRIDGE_ORIGIN_SUFFIXES = [
  "bridge.xyz",
  "compliance.bridge.xyz",
  "dashboard.bridge.xyz",
];

export function getUrlOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function isTrustedBridgeOrigin(origin: string, bridgeUrl: string): boolean {
  const expectedOrigin = getUrlOrigin(bridgeUrl);
  if (expectedOrigin && origin === expectedOrigin) return true;

  try {
    const hostname = new URL(origin).hostname;
    return BRIDGE_ORIGIN_SUFFIXES.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

export function parseBridgeTosMessage(
  event: MessageEvent,
  bridgeUrl: string
): string | null {
  if (!isTrustedBridgeOrigin(event.origin, bridgeUrl)) return null;

  const data = event.data;
  if (!data || typeof data !== "object") return null;

  const payload = data as Partial<IBridgeTosAcceptMessage> & {
    signedAgreementId?: string;
  };

  const signedAgreementId =
    payload.signed_agreement_id ?? payload.signedAgreementId;

  if (!signedAgreementId || typeof signedAgreementId !== "string") return null;
  if (!signedAgreementId.trim()) return null;

  return signedAgreementId.trim();
}
