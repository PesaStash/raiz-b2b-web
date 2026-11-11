"use client";
import { useQuery } from "@tanstack/react-query";
import type { IUser } from "@/types/user";
import { basicDetailsComplete } from "@/lib/onboarding";
import { kybApi } from "@/services/usdKyb";

/** Read the canonical KYB case; browser preferences and legacy USD request flags can be absent after login. */
export function useKybNavigation(user?: IUser) {
  const tenant = user?.business_account?.entity_id;
  return useQuery({
    queryKey: ["usd-kyb", tenant],
    queryFn: kybApi.get,
    enabled: !!tenant && basicDetailsComplete(user),
    staleTime: 30_000,
    retry: false,
  });
}
