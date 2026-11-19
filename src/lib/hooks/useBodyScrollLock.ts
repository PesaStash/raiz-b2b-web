"use client";

import { useEffect } from "react";
import { acquireBodyScrollLock } from "../bodyScrollLock";

export function useBodyScrollLock(enabled = true) {
  useEffect(() => {
    if (enabled) return acquireBodyScrollLock();
  }, [enabled]);
}
