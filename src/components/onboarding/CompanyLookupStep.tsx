"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import Checkbox from "@/components/ui/Checkbox";
import { usePlaceResolver } from "@/components/ui/AddressAutocomplete";
import { Action, Notice } from "@/components/usd-kyb/KybUI";
import CompanyLookupConfirm from "./CompanyLookupConfirm";
import { buildLookupPrefill, saveLookupDecision, clearLookupPrefill, saveLookupPrefill, type LookupPrefill } from "@/lib/companyLookup";
import { inquiryErrors, inquiryRequest, matchesInquiry } from "@/lib/companyInquiry";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { editableStatus, record } from "@/lib/usd-kyb/model";
import { kybApi } from "@/services/usdKyb";
import type { InquiryRequest, KybBundle, LookupResult } from "@/types/usdKyb";

export default function CompanyLookupStep({ countryCode, entityId, onConfirmed, onManual }: {
  countryCode: string;
  entityId: string;
  onConfirmed: (prefill: LookupPrefill) => void;
  onManual: () => void;
  compact?: boolean;
}) {
  const id = useId();
  const access = usePermissions();
  const qc = useQueryClient();
  const { resolve } = usePlaceResolver();
  const requirements = useQuery({ queryKey: ["company-lookup-requirements", entityId], queryFn: kybApi.lookupRequirements, enabled: access.ready && !!entityId, staleTime: 3600_000 });
  const country = (
    access.user?.business_account?.entity?.country?.country_code || countryCode
  ).trim().toUpperCase();
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  const [bundle, setBundle] = useState<KybBundle>();
  const [result, setResult] = useState<LookupResult>();
  const [request, setRequest] = useState<InquiryRequest>();
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => {
    if (!wait) return;
    const timer = setTimeout(() => setWait(n => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  const selected = requirements.data?.countries.find(c => c.country_code === country);
  const fields = selected?.fields.filter(f => !["country_code", "jurisdiction_code", "consent", "registration_name"].includes(f.name) && (country === "NG" || f.name !== "registration_type")) ?? [];
  const effectiveValues = { ...Object.fromEntries(fields.map(f => [f.name, f.value ?? f.default ?? (f.type === "boolean" ? false : "")])), ...values };
  const cached = qc.getQueryData<KybBundle>(["usd-kyb", entityId]);
  const locked = !!(bundle ?? cached) && !editableStatus((bundle ?? cached)!.case.status);
  const disabled = pending || resolving || !access.canWriteBusiness || locked;
  const refresh = async () => {
    const next = await kybApi.get();
    qc.setQueryData(["usd-kyb", entityId], next);
    setBundle(next);
    return next;
  };
  const recover = async (sent: InquiryRequest) => {
    const next = await refresh();
    const snapshot = next.case.youverify_lookup_snapshot as Record<string, unknown> | undefined;
    if (snapshot && matchesInquiry(snapshot, sent) && editableStatus(next.case.status)) {
      saveLookupDecision(entityId, snapshot, false);
      setResult({ lookup: snapshot, differences: next.case.youverify_lookup_differences ?? [], cached: true, case: next.case });
      setError("");
    }
    setNeedsRefresh(false);
  };
  const submit = async () => {
    if (!selected || disabled || busy.current || wait) return;
    const errors = inquiryErrors(selected, effectiveValues, consent);
    if (errors.length) { setError(errors.join(" ")); return; }
    busy.current = true;
    setPending(true);
    setError("");
    const sent = inquiryRequest(selected, effectiveValues, consent);
    setRequest(sent);
    clearLookupPrefill(entityId);
    const token = generation.current;
    let found: LookupResult | undefined;
    try {
      found = await kybApi.lookup(sent);
      saveLookupDecision(entityId, found.lookup, false);
      const next = await refresh();
      if (generation.current !== token) return;
      setResult({ ...found, case: next.case, differences: next.case.youverify_lookup_differences ?? found.differences });
      setNeedsRefresh(false);
    } catch (err) {
      if (generation.current !== token) return;
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const body = isAxiosError(err) ? err.response?.data : undefined;
      const messages = [body?.message, ...(Array.isArray(body?.errors) ? body.errors.filter((e: unknown) => typeof e === "string") : []), body?.correlation_id ? `Reference: ${body.correlation_id}` : ""].filter(Boolean);
      setError(messages.join(". ") || "The inquiry could not be completed. Check the saved result before trying again.");
      if (status === 429) {
        const retry = isAxiosError(err) ? Number(err.response?.headers["retry-after"]) : 60;
        setWait(Number.isFinite(retry) && retry > 0 ? Math.ceil(retry) : 60);
      }
      if (found || !status || status >= 500 || status === 409) {
        setNeedsRefresh(true);
        try { await recover(sent); } catch { /* Require a successful saved-state check before another inquiry. */ }
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  const confirm = async () => {
    if (!result || !request || !bundle || busy.current) return;
    busy.current = true;
    setResolving(true);
    try {
      const base = buildLookupPrefill(result, request.registration_number, request.country_code, null, bundle);
      const parts = !base.resolved && base.address ? await resolve(base.address, base.country_code) : null;
      let savedBundle = bundle;
      if (parts) {
        const previous = record(bundle.prefilled_draft.registered_address);
        const candidates = {
          street_line_1: [parts.building_number, parts.street].filter(Boolean).join(" "),
          city: parts.city,
          subdivision: parts.state,
          postal_code: parts.zip_code,
          country: parts.country_code,
        };
        const missing = Object.fromEntries(Object.entries(candidates).filter(([key, value]) => value && !String(previous[key] ?? "").trim()));
        if (Object.keys(missing).length) {
          await kybApi.patch({ expected_version: bundle.payload_version, draft_payload: { registered_address: missing } });
          savedBundle = await refresh();
        }
      }
      const prefill = buildLookupPrefill(result, request.registration_number, request.country_code, parts, savedBundle);
      saveLookupDecision(entityId, result.lookup, true);
      saveLookupPrefill(entityId, prefill);
      onConfirmed(prefill);
    } catch {
      try { await refresh(); } catch { /* Keep the current result available for retry. */ }
      setError("Unable to save the address details. Please try continuing again.");
    } finally { busy.current = false; setResolving(false); }
  };
  const inputClass = "mt-2 h-12 w-full rounded-xl bg-kyb-field px-4 text-sm outline-none";
  return <div className="space-y-4">
    {requirements.isPending && <p className="text-sm text-kyb-muted">Loading supported registries…</p>}
    {requirements.isError && <Notice error>Unable to load supported registries. <button type="button" className="underline" onClick={() => void requirements.refetch()}>Try again</button></Notice>}
    {requirements.data?.countries.length === 0 && <Notice>No registries are currently available. You can enter your details manually.</Notice>}
    {requirements.data && requirements.data.countries.length > 0 && country && !selected && <Notice>Registry lookup is not available for your signup country. Please enter your business details manually.</Notice>}
    {requirements.data && <>
      {selected?.requires_subdivision && <label className="block text-sm font-semibold" htmlFor={`${id}-jurisdiction`}>Registry jurisdiction
        <select id={`${id}-jurisdiction`} className={inputClass} value={String(values.jurisdiction_code ?? "")} disabled={disabled} onChange={e => setValues(v => ({ ...v, jurisdiction_code: e.target.value }))}>
          <option value="">Select registry jurisdiction</option>
          {selected.subdivisions.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
        </select>
      </label>}
      {fields.map(f => f.type === "boolean" ? <Checkbox key={f.name} id={`${id}-${f.name}`} checked={effectiveValues[f.name] === true} disabled={disabled} label={f.label ?? f.name.replaceAll("_", " ")} onChange={value => setValues(v => ({ ...v, [f.name]: value }))} /> : <label key={f.name} className="block text-sm font-semibold" htmlFor={`${id}-${f.name}`}>
        {f.label ?? f.name.replaceAll("_", " ")}{f.required || selected?.required_fields.includes(f.name) ? " *" : ""}
        {f.options?.length ? <select id={`${id}-${f.name}`} className={inputClass} disabled={disabled} value={String(effectiveValues[f.name] ?? "")} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}>
          <option value="">Select an option</option>{f.options.map(o => <option key={typeof o === "string" ? o : o.code} value={typeof o === "string" ? o : o.code}>{typeof o === "string" ? o : o.name}</option>)}
        </select> : <input id={`${id}-${f.name}`} className={inputClass} disabled={disabled} minLength={f.min_length} maxLength={f.max_length} value={String(effectiveValues[f.name] ?? "")} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))} />}
      </label>)}
      {selected && <Checkbox id={`${id}-consent`} checked={consent} disabled={disabled} onChange={setConsent} label="I consent to Raiz looking up this company’s registration details." bgStyle="border-primary2 bg-primary2" checkMarkColor="#FFFFFF" />}
    </>}
    {!access.canWriteBusiness && access.ready && <Notice>An owner or admin can look up this business.</Notice>}
    {locked && <Notice>This business is under review. Registry inquiries are currently locked.</Notice>}
    {error && <Notice error>{error}</Notice>}
    <div className="flex flex-wrap items-center gap-4">
      {needsRefresh ? <Action type="button" disabled={pending || !request} loading={pending} onClick={async () => { if (!request || busy.current) return; busy.current = true; setPending(true); try { await recover(request); } catch { setError("Unable to check the saved inquiry. Please try again."); } finally { busy.current = false; setPending(false); } }}>Check saved inquiry</Action> : <Action type="button" disabled={disabled || !selected || !consent || wait > 0} loading={pending} onClick={() => void submit()}>{wait ? `Try again in ${wait}s` : "Find business"}</Action>}
      <button type="button" className="text-sm font-semibold text-primary2 disabled:opacity-40" disabled={disabled} onClick={() => { clearLookupPrefill(entityId); onManual(); }}>Enter details myself</button>
    </div>
    {result && <CompanyLookupConfirm result={result} resolving={resolving} error={error} onDismiss={() => { if (!resolving) { clearLookupPrefill(entityId); setResult(undefined); } }} onConfirm={() => void confirm()} />}
  </div>;
}
