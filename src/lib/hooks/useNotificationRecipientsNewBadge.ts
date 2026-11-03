"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FetchNotificationEmailsApi } from "@/services/business";
import { useUser } from "@/lib/hooks/useUser";
import {
  hasExtraNotificationRecipients,
  isNotificationRecipientsFeatureUsed,
  markNotificationRecipientsFeatureUsed,
  NOTIFICATION_RECIPIENTS_USED_EVENT,
} from "@/utils/notificationRecipientsFeature";

export function useNotificationRecipientsNewBadge() {
  const { user } = useUser();
  const businessAccountId = user?.business_account_id;
  const businessEmail = user?.business_account?.business_email;
  const [hasUsedLocally, setHasUsedLocally] = useState(false);

  const { data } = useQuery({
    queryKey: ["notification-emails"],
    queryFn: FetchNotificationEmailsApi,
    enabled: !!businessAccountId,
    staleTime: 5 * 60 * 1000,
  });

  const hasExtraRecipients = hasExtraNotificationRecipients(
    data?.data,
    businessEmail,
  );

  useEffect(() => {
    if (!businessAccountId) {
      setHasUsedLocally(false);
      return;
    }

    setHasUsedLocally(isNotificationRecipientsFeatureUsed(businessAccountId));

    const syncUsedState = () => {
      setHasUsedLocally(isNotificationRecipientsFeatureUsed(businessAccountId));
    };

    window.addEventListener(NOTIFICATION_RECIPIENTS_USED_EVENT, syncUsedState);
    return () => {
      window.removeEventListener(
        NOTIFICATION_RECIPIENTS_USED_EVENT,
        syncUsedState,
      );
    };
  }, [businessAccountId]);

  useEffect(() => {
    if (businessAccountId && hasExtraRecipients) {
      markNotificationRecipientsFeatureUsed(businessAccountId);
    }
  }, [businessAccountId, hasExtraRecipients]);

  return {
    showNewBadge: !!businessAccountId && !hasUsedLocally && !hasExtraRecipients,
  };
}
