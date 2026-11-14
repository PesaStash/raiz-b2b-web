"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

const STORAGE_KEY = "sidebar-collapsed";

type SidebarContextValue = {
  collapsed: boolean;
  effectiveCollapsed: boolean;
  isLargeDesktop: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // null = no explicit user choice; fall back to the breakpoint default
  const [preference, setPreference] = useState<boolean | null>(null);
  const [narrowOverride, setNarrowOverride] = useState<boolean | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const isLargeDesktop = useMediaQuery("(min-width: 1024px)");
  const isXLarge = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setPreference(true);
      else if (stored === "false") setPreference(false);
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  // Entering the 1024–1279px range always starts collapsed. A saved choice
  // from a wider screen does not keep it open, and the user can still expand it.
  useEffect(() => {
    setNarrowOverride(null);
  }, [isLargeDesktop, isXLarge]);

  const collapsed = isXLarge
    ? hydrated
      ? (preference ?? false)
      : false
    : (narrowOverride ?? true);

  const toggleCollapsed = useCallback(() => {
    if (!isXLarge) {
      setNarrowOverride((prev) => !(prev ?? true));
      return;
    }
    setPreference((prev) => {
      const next = !(prev ?? false);
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, [isXLarge]);

  const value = useMemo(
    () => ({
      collapsed,
      // Below 1024px the rail stays collapsed. From 1024px it follows `collapsed`.
      effectiveCollapsed: !isLargeDesktop || collapsed,
      isLargeDesktop,
      toggleCollapsed,
    }),
    [collapsed, isLargeDesktop, toggleCollapsed],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}
