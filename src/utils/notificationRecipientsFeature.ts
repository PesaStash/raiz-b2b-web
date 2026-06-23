const STORAGE_PREFIX = "raiz:notification-recipients-used:";
export const NOTIFICATION_RECIPIENTS_USED_EVENT =
  "notification-recipients-feature-used";

export function getNotificationRecipientsUsedStorageKey(
  businessAccountId: string,
) {
  return `${STORAGE_PREFIX}${businessAccountId}`;
}

export function isNotificationRecipientsFeatureUsed(
  businessAccountId: string | undefined,
): boolean {
  if (!businessAccountId || typeof window === "undefined") return false;
  return (
    localStorage.getItem(
      getNotificationRecipientsUsedStorageKey(businessAccountId),
    ) === "true"
  );
}

export function markNotificationRecipientsFeatureUsed(
  businessAccountId: string | undefined,
) {
  if (!businessAccountId || typeof window === "undefined") return;
  if (isNotificationRecipientsFeatureUsed(businessAccountId)) return;

  localStorage.setItem(
    getNotificationRecipientsUsedStorageKey(businessAccountId),
    "true",
  );
  window.dispatchEvent(new CustomEvent(NOTIFICATION_RECIPIENTS_USED_EVENT));
}

export function hasExtraNotificationRecipients(
  emails: { email: string }[] | undefined,
  businessEmail: string | undefined,
) {
  if (!emails?.length) return false;

  const normalizedBusinessEmail = businessEmail?.trim().toLowerCase();
  return emails.some(
    (item) =>
      !normalizedBusinessEmail ||
      item.email.trim().toLowerCase() !== normalizedBusinessEmail,
  );
}
