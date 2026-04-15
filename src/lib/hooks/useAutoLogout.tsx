"use client";
import { useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useIdleTimer } from "react-idle-timer";
import { LogoutApi } from "@/services/auth";
import { GetItemFromCookie, RemoveItemFromCookie } from "@/utils/CookiesFunc";
import { useUserStore } from "@/store/useUserStore";

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
      RemoveItemFromCookie("access_token");
      qc.clear();
      clearUser();
      router.push("/login");
    },
    onError: () => {
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
