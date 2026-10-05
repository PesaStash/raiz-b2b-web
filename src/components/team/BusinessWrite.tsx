"use client";
import type { ComponentType, ReactNode } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
export function BusinessWrite({ children }: { children: ReactNode }) {
  const { canWriteBusiness } = usePermissions();
  return canWriteBusiness ? children : null;
}
export function withBusinessWrite<P extends object>(Component: ComponentType<P>) {
  return function BusinessWriteComponent(props: P) {
    const { canWriteBusiness } = usePermissions();
    return canWriteBusiness ? <Component {...props} /> : null;
  };
}
