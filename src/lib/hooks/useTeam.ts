"use client";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "./usePermissions";
import { fetchTeam } from "@/services/team";
export function useTeam() {
  const permissions = usePermissions();
  const queryKey = ["team", permissions.user?.business_account_id, permissions.user?.business_account_user_id];
  const query = useQuery({ queryKey, queryFn: ({ signal }) => fetchTeam(signal), enabled: permissions.canManageTeam, staleTime: 15000, refetchOnWindowFocus: true, retry: false });
  return { ...query, queryKey, permissions };
}
