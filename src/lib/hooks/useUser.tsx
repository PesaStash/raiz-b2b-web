"use client";
import { endSession, sessionGeneration } from "@/lib/session";
import { isInactiveFlag, isPublicPath } from "@/lib/permissions";
import { FetchUserApi } from "@/services/user";
import { useUserStore } from "@/store/useUserStore";
import { IUser } from "@/types/user";
import { GetItemFromCookie } from "@/utils/CookiesFunc";
import { trackUserDataOnce } from "@/utils/analytics/userProps";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const useUser = (options?: { enabled?: boolean }) => {
  const { user, setUser, clearUser, updateUser, showBalance, setShowBalance } =
    useUserStore();
  const pathname = usePathname();
  const token = GetItemFromCookie("access_token");
  // Never fetch the authenticated profile on public payment-link pages.
  const isPaymentLink = isPublicPath(pathname ?? "");
  const shouldFetch =
    (options?.enabled ?? true) && !!token && !isPaymentLink;

  const {
    data: userData,
    dataUpdatedAt,
    isLoading: isFetching,
    error: fetchError,
    isSuccess,
    isError,
    refetch,
    isRefetching,
  } = useQuery<IUser, AxiosError>({
    queryKey: ["user"],
    queryFn: async () => {
      const generation = sessionGeneration();
      const result = await FetchUserApi();
      if (generation !== sessionGeneration()) throw new Error("Session ended");
      if (isInactiveFlag(result.active)) { endSession(true); throw new Error("Access deactivated"); }
      return result;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
    retry: false,
    enabled: shouldFetch,
  });

  useEffect(() => {
    if (isSuccess && userData && shouldFetch && GetItemFromCookie("access_token")) {
      setUser(userData);
      trackUserDataOnce(userData);
    }
  }, [isSuccess, userData, dataUpdatedAt, setUser, shouldFetch]);

  useEffect(() => {
    if (isError && fetchError) {
      useUserStore.setState({
        error: fetchError instanceof Error ? fetchError.message : "Fetch error",
      });
    }
  }, [isError, fetchError]);

  return {
    user: userData || user || undefined,
    isLoading: isFetching,
    error: fetchError,
    setUser,
    updateUser,
    clearUser,
    // refetch() bypasses `enabled`; block it on payment-link pages.
    refetch: isPaymentLink ? (async () => undefined as never) : refetch,
    isRefetching,
    showBalance,
    setShowBalance,
  };
};

export type UseUserReturn = ReturnType<typeof useUser>;
