"use client";
import { useUserStore } from "@/store/useUserStore";
import { accountAccess } from "@/lib/permissions";

export function usePermissions() {
  const user = useUserStore((s) => s.user);
  const verified = useUserStore((s) => s.sessionVerified);
  return { ...accountAccess(verified ? user : null), ready: verified, user };
}
