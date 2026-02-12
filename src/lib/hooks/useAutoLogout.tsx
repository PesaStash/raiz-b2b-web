"use client";
import { useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogoutApi } from "@/services/auth";
import { GetItemFromCookie, RemoveItemFromCookie } from "@/utils/CookiesFunc";
import { useUserStore } from "@/store/useUserStore";

const AUTO_LOGOUT_TIME = 30 * 60 * 1000; //  30 mins

export const useAutoLogout = () => {
  const clearUser = useUserStore.getState().clearUser;
  const router = useRouter();
  const qc = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get token (stable reference)
  const token = useRef(GetItemFromCookie("access_token") ?? "").current;

  // Define logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => LogoutApi(token),
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

  // Stable logout function
  const logout = useCallback(() => {
    console.log("Logging out due to inactivity...");
    logoutMutation.mutate();
  }, []); // Empty dependency array since logoutMutation is stable

  // Reset timer function
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, AUTO_LOGOUT_TIME);
  }, [logout]);

  useEffect(() => {
    // Only set up timer and listeners if user is logged in
    const accessToken = Cookies.get("access_token");
    if (!accessToken) {
      return; // Exit early if not authenticated
    }

    resetTimer(); // Start the timer

    // Events to reset the timer on user activity
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Cleanup: clear timer and remove event listeners
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]); // Depend on resetTimer, which is stable
};
