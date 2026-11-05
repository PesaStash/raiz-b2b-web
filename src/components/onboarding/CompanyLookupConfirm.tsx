"use client";

import Overlay from "@/components/ui/Overlay";
import { Action, Badge, Notice } from "@/components/usd-kyb/KybUI";
import { KybIcon } from "@/components/usd-kyb/KybGuide";
import { formatLookupAddress } from "@/lib/companyLookup";
import { display, label } from "@/lib/usd-kyb/model";
import type { LookupResult } from "@/types/usdKyb";

const DETAIL_KEYS = [
  "country_code",
  "jurisdiction_code",
  "registration_number",
  "company_type",
  "status",
  "incorporation_date",
  "registered_address",
] as const;

function detailValue(key: string, value: unknown): string {
  if (key === "registered_address") {
    return formatLookupAddress(value) || display(value);
  }
  return display(value);
}

export default function CompanyLookupConfirm({
  result,
  resolving = false,
  error,
  onConfirm,
  onDismiss,
}: {
  result: LookupResult;
  resolving?: boolean;
  error?: string;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const lookup = result.lookup;
  const details = Object.fromEntries(
    DETAIL_KEYS.filter((key) => lookup[key] != null).map((key) => [
      key,
      lookup[key],
    ]),
  );

  return (
    <Overlay close={onDismiss} width="480px">
      <div className="space-y-6 p-6 md:p-8">
        <header className="space-y-3">
          <div className="flex items-start gap-3">
            <KybIcon name="company" circle />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-kyb-ink">
                Is this your business?
              </h2>
              <div className="mt-2">
                <Badge good>
                  Found on the register
                  {result.cached ? " · Saved result" : ""}
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-sm leading-[21px] text-kyb-muted">
            Confirm these details before we fill in the rest of your
            form.
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-kyb-border bg-kyb-soft p-5">
          <h3 className="text-lg font-bold text-kyb-ink">
            {display(lookup.legal_name)}
          </h3>
          <dl className="mt-4">
            {Object.entries(details).map(([key, value]) => (
              <div
                key={key}
                className="grid gap-1 py-1.5 text-sm sm:grid-cols-[minmax(100px,1fr)_2fr] sm:gap-5"
              >
                <dt className="text-kyb-muted text-xs">{label(key)}</dt>
                <dd className="break-words text-right text-sm font-medium capitalize">
                  {detailValue(key, value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {!!result.differences?.length && (
          <Notice>
            Some register details differ from what we already have for this
            business. Your existing entries are kept where they conflict.
            <dl className="mt-3 space-y-3">
              {result.differences.map((difference, index) => (
                <div key={`${difference.field}-${index}`}>
                  <dt className="font-semibold">{label(difference.field)}</dt>
                  <dd>Your entry: {detailValue(difference.field.includes("address") ? "registered_address" : difference.field, difference.current)}</dd>
                  <dd>Registry: {detailValue(difference.field.includes("address") ? "registered_address" : difference.field, difference.provider)}</dd>
                </div>
              ))}
            </dl>
          </Notice>
        )}

        {error && <Notice error>{error}</Notice>}
        <footer className="flex flex-wrap items-center justify-end gap-3">
          <Action
            type="button"
            variant="secondary"
            disabled={resolving}
            onClick={onDismiss}
          >
            Not my business
          </Action>
          <Action
            type="button"
            loading={resolving}
            disabled={resolving}
            onClick={onConfirm}
          >
            Yes, continue
          </Action>
        </footer>
      </div>
    </Overlay>
  );
}
