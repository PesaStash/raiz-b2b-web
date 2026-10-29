"use client";
import { usePathname } from "next/navigation";
import { isPublicPath } from "@/lib/permissions";
import { clearLocalSession } from "@/lib/session";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useIdleTimer } from "react-idle-timer";
import { LogoutApi } from "@/services/auth";
import { hasSession } from "@/utils/CookiesFunc";
import { useUserStore } from "@/store/useUserStore";
import {
  clearUsdOnboardingCase,
  clearUsdOnboardingSessionState,
  USD_ONBOARDING_QUERY_KEY,
} from "@/lib/hooks/useUsdOnboarding";
import { clearUserDataSessionFlag, pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserId } from "@/utils/analytics/userProps";

const AUTO_LOGOUT_TIME = 10 * 60 * 1000; //  10 mins

export const useAutoLogout = () => {
  const pathname = usePathname();
  const clearUser = useUserStore.getState().clearUser;
  const router = useRouter();
  const qc = useQueryClient();

  // Define logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => LogoutApi(),
    onSuccess: () => {
      const user = useUserStore.getState().user;
      pushDataLayerEvent("logout", {
        user_id: getAnalyticsUserId(user) || undefined,
      });
      clearUserDataSessionFlag();
      clearUsdOnboardingSessionState();
      const entityId = user?.business_account?.entity_id;
      if (entityId) {
        clearUsdOnboardingCase(entityId);
        qc.removeQueries({ queryKey: [...USD_ONBOARDING_QUERY_KEY, entityId] });
      }
      qc.clear();
      clearUser();
      clearLocalSession();
      router.push("/login");
    },
    onError: () => {
      const user = useUserStore.getState().user;
      clearUserDataSessionFlag();
      clearUsdOnboardingSessionState();
      const entityId = user?.business_account?.entity_id;
      if (entityId) {
        clearUsdOnboardingCase(entityId);
        qc.removeQueries({ queryKey: [...USD_ONBOARDING_QUERY_KEY, entityId] });
      }
      qc.clear();
      clearUser();
      clearLocalSession();
      router.push("/login");
    },
  });

  const onIdle = useCallback(() => {
    // Only execute logout if user is logged in
    if (!hasSession() || isPublicPath(pathname)) {
      return; // Exit early if not authenticated
    }

    logoutMutation.mutate();
  }, [logoutMutation, pathname]);

  // Use react-idle-timer to manage the idle state reliably
  useIdleTimer({
    onIdle,
    timeout: AUTO_LOGOUT_TIME,
    crossTab: true,
    name: "auth-idle-timer",
  });
};
