"use client";

import { useQuery } from "@tanstack/react-query";
import { FetchTransactionCategoriesApi } from "@/services/transactions";

export const transactionCategoriesQueryKey = ["transactions-category"] as const;

export function useTransactionCategories() {
  return useQuery({
    queryKey: transactionCategoriesQueryKey,
    queryFn: FetchTransactionCategoriesApi,
  });
}
