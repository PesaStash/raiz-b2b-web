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

  // Narrow desktops (1024–1279px) default to collapsed; 1280px+ to expanded.
  const defaultCollapsed = !isXLarge;
  const collapsed = hydrated ? (preference ?? defaultCollapsed) : defaultCollapsed;

  const toggleCollapsed = useCallback(() => {
    setPreference((prev) => {
      const current = prev ?? defaultCollapsed;
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, [defaultCollapsed]);

  const value = useMemo(
    () => ({
      collapsed,
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
