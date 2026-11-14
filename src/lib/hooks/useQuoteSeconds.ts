"use client";
import { useEffect, useState } from "react";
import { parseServerTime } from "@/lib/swapQuote";

export function useQuoteSeconds(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const expires = expiresAt ? parseServerTime(expiresAt) : NaN;
  return Number.isFinite(expires)
    ? Math.max(0, Math.ceil((expires - now) / 1000))
    : 0;
}
