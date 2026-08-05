"use client";
import { useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useIdleTimer } from "react-idle-timer";
import { LogoutApi } from "@/services/auth";
import { GetItemFromCookie, RemoveItemFromCookie } from "@/utils/CookiesFunc";
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
  const clearUser = useUserStore.getState().clearUser;
  const router = useRouter();
  const qc = useQueryClient();

  // Define logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => {
      const token = GetItemFromCookie("access_token") ?? "";
      return LogoutApi(token);
    },
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
      RemoveItemFromCookie("access_token");
      qc.clear();
      clearUser();
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
      RemoveItemFromCookie("access_token");
      qc.clear();
      clearUser();
      router.push("/login");
    },
  });

  const onIdle = useCallback(() => {
    // Only execute logout if user is logged in
    const accessToken = Cookies.get("access_token");
    if (!accessToken) {
      return; // Exit early if not authenticated
    }

    console.log("Logging out due to inactivity...");
    logoutMutation.mutate();
  }, [logoutMutation]);

  // Use react-idle-timer to manage the idle state reliably
  useIdleTimer({
    onIdle,
    timeout: AUTO_LOGOUT_TIME,
    crossTab: true,
    name: "auth-idle-timer",
  });
};
