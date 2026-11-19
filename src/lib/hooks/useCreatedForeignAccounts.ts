"use client";

import { useQuery } from "@tanstack/react-query";
import { isGlobalBalance } from "@/lib/globalBalance";
import { useUser } from "@/lib/hooks/useUser";
import { FetchReceivingAccountsApi } from "@/services/globalBalance";
import type { ForeignCurrency } from "@/types/services";
import { hasCreatedForeignAccount } from "@/lib/createdForeignAccount";

export function useCreatedForeignAccounts() {
  const { user, isLoading } = useUser();
  const global = isGlobalBalance(user?.business_account);
  const query = useQuery({
    queryKey: ["receiving-accounts", user?.business_account?.entity_id],
    queryFn: FetchReceivingAccountsApi,
    enabled: global && !!user?.business_account?.entity_id,
  });

  return {
    has: (currency: ForeignCurrency) =>
      hasCreatedForeignAccount(user, currency, query.data?.accounts),
    isChecking: (!user && isLoading) || (global && query.isLoading),
    isError: global && query.isError,
    isRetrying: global && query.isFetching && query.isError,
    retry: () => query.refetch(),
  };
}
