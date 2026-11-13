import { getPath, mergeDraft, normalizeDraft } from "./model";
import type { KybBundle } from "@/types/usdKyb";

export function signedAgreementId(bundle?: KybBundle): string {
  if (
    !bundle ||
    bundle.validation?.field_errors?.some(
      (error) =>
        error.field === "signed_agreement_id" ||
        error.field.endsWith(".signed_agreement_id"),
    )
  )
    return "";
  const draft = mergeDraft(
    normalizeDraft(bundle.case.draft_payload ?? bundle.draft_payload ?? {}),
    normalizeDraft(bundle.prefilled_draft ?? {}),
  );
  const id = getPath(draft, "business_profile.signed_agreement_id");
  return typeof id === "string" ? id.trim() : "";
}

/** Never report success solely from the hosted page's callback. */
export async function persistAgreement(
  id: string,
  actions: {
    save: (id: string) => Promise<{ success: boolean }>;
    confirm: () => Promise<boolean>;
    refresh: () => Promise<KybBundle | undefined>;
    writeEditableDraft?: (id: string) => Promise<void>;
  },
) {
  if (!id.trim())
    throw new Error("No signed agreement was returned. Please try again.");
  const saved = await actions.save(id);
  if (!saved.success || !(await actions.confirm()))
    throw new Error(
      "Terms acceptance could not be confirmed. Please try again.",
    );
  let bundle = await actions.refresh();
  if (!bundle)
    throw new Error(
      "Terms were saved, but your verification case could not be refreshed. Refresh terms status before continuing.",
    );
  if (
    signedAgreementId(bundle) !== id &&
    actions.writeEditableDraft &&
    ["not_started", "collecting", "requires_correction"].includes(
      bundle.case.status,
    )
  ) {
    await actions.writeEditableDraft(id);
    bundle = await actions.refresh();
  }
  if (signedAgreementId(bundle) !== id)
    throw new Error(
      "Terms acceptance was saved, but the agreement has not appeared on your verification case. Refresh terms status or contact support.",
    );
  return bundle!;
}
