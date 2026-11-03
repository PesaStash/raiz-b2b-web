"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePlaceResolver } from "@/components/ui/AddressAutocomplete";
import { Action, Notice } from "@/components/usd-kyb/KybUI";
import CompanyLookupConfirm from "@/components/onboarding/CompanyLookupConfirm";
import {
  buildLookupPrefill,
  registrationNumberForLookup,
  registrationType,
  saveLookupPrefill,
  type LookupPrefill,
} from "@/lib/companyLookup";
import { kybApi } from "@/services/usdKyb";
import { getApiErrorMessage } from "@/utils/helpers";
import type { LookupResult } from "@/types/usdKyb";

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M11.333 2.333a1.414 1.414 0 0 1 2 2L5.5 12.167 2.667 13l.833-2.833L11.333 2.333Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CompanyLookupStep({
  countryCode,
  entityId,
  onConfirmed,
  onManual,
  compact = false,
}: {
  countryCode: string;
  entityId: string;
  onConfirmed: (prefill: LookupPrefill) => void;
  onManual: () => void;
  compact?: boolean;
}) {
  const country = countryCode.toUpperCase();
  const isNg = country === "NG";
  const [kind, setKind] = useState("RC");
  const [digits, setDigits] = useState("");
  const [wait, setWait] = useState(0);
  const [result, setResult] = useState<LookupResult>();
  const [resolving, setResolving] = useState(false);
  const { resolve } = usePlaceResolver();
  const qc = useQueryClient();

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const fullNumber = isNg ? `${kind}${digits.trim()}` : digits.trim();

  const lookupMutation = useMutation({
    mutationFn: () =>
      kybApi.lookup(
        registrationNumberForLookup(country, fullNumber),
        registrationType(country, fullNumber),
        true,
      ),
    onSuccess: async (next) => {
      setResult(next);
      await qc.invalidateQueries({ queryKey: ["usd-kyb"] });
    },
  });

  const canLookup =
    !!digits.trim() && wait <= 0 && !lookupMutation.isPending && !resolving;

  const handleConfirm = async () => {
    if (!result) return;
    setResolving(true);
    try {
      const prefillBase = buildLookupPrefill(
        result,
        fullNumber,
        country,
        null,
      );
      const components = prefillBase.address
        ? await resolve(prefillBase.address)
        : null;
      const prefill = buildLookupPrefill(
        result,
        fullNumber,
        country,
        components,
      );
      if (entityId) saveLookupPrefill(entityId, prefill);
      setResult(undefined);
      onConfirmed(prefill);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-4"}>
      <div>
        <label
          htmlFor={compact ? "modal-company-number" : "guide-company-number"}
          className="mb-2 block text-sm font-semibold text-kyb-ink"
        >
          Business registration number
        </label>
        {isNg ? (
          <div className="flex h-12 items-center gap-2 rounded-xl bg-kyb-field px-4">
            <Image
              src="/images/kyb/registration-ng.png"
              width={22}
              height={15}
              alt=""
              className="rounded-[3px]"
            />
            <select
              aria-label="Registration type"
              value={kind}
              className="w-16 bg-transparent text-sm font-semibold outline-none"
              onChange={(e) => setKind(e.target.value)}
              disabled={lookupMutation.isPending || resolving}
            >
              <option value="RC">RC</option>
              <option value="BN">BN</option>
            </select>
            <input
              id={compact ? "modal-company-number" : "guide-company-number"}
              aria-label="Registration number"
              inputMode="numeric"
              className="min-w-0 flex-1 border-l border-kyb-border bg-transparent pl-3 text-[15px] outline-none"
              placeholder="Enter number"
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
              disabled={lookupMutation.isPending || resolving}
            />
          </div>
        ) : (
          <input
            id={compact ? "modal-company-number" : "guide-company-number"}
            aria-label="Business registration number"
            className="h-12 w-full rounded-xl bg-kyb-field px-4 text-[15px] outline-none"
            placeholder="Enter registration number"
            value={digits}
            onChange={(e) => setDigits(e.target.value)}
            disabled={lookupMutation.isPending || resolving}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Action
          type="button"
          disabled={!canLookup}
          loading={lookupMutation.isPending}
          onClick={() => {
            setWait(15);
            lookupMutation.mutate();
          }}
        >
          {wait > 0 ? `Try again in ${wait}s` : "Find business"}
        </Action>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary2 disabled:opacity-40"
          onClick={onManual}
          disabled={lookupMutation.isPending || resolving}
        >
          <PencilIcon />
          Enter details myself
        </button>
      </div>

      {lookupMutation.isError && (
        <Notice error>
          {getApiErrorMessage(
            lookupMutation.error,
            "Unable to look up this business. Please try again or enter details manually.",
          )}
        </Notice>
      )}

      {result && (
        <CompanyLookupConfirm
          result={result}
          resolving={resolving}
          onDismiss={() => setResult(undefined)}
          onConfirm={() => void handleConfirm()}
        />
      )}
    </div>
  );
}
