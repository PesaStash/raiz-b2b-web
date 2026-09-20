"use client";
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
  const isPaymentLink = pathname?.startsWith("/pay") ?? false;
  const shouldFetch =
    (options?.enabled ?? true) && !!token && !isPaymentLink;

  const {
    data: userData,
    isLoading: isFetching,
    error: fetchError,
    isSuccess,
    isError,
    refetch,
    isRefetching,
  } = useQuery<IUser, AxiosError>({
    queryKey: ["user"],
    queryFn: FetchUserApi,
    enabled: shouldFetch,
  });

  useEffect(() => {
    if (isSuccess && userData) {
      setUser(userData);
      trackUserDataOnce(userData);
    }
  }, [isSuccess, userData, setUser]);

  useEffect(() => {
    if (isError && fetchError) {
      useUserStore.setState({
        error: fetchError instanceof Error ? fetchError.message : "Fetch error",
      });
    }
  }, [isError, fetchError]);

  return {
    user: user || userData,
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
