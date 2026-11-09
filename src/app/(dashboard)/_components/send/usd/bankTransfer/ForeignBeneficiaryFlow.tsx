"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { FlowActions, FlowCard, FlowCurrency, FlowHeader, FlowRow } from "@/components/transactions/send-flow/Flow";
import { CreateForeignBeneficiaryApi, FetchForeignBeneficiariesApi } from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import type { ForeignCurrency, IForeignBeneficiary, IForeignBeneficiaryPayload } from "@/types/services";
import { getApiErrorMessage } from "@/utils/helpers";

type Mode = "form" | "preview" | "list";

const fieldClass = "h-12 w-full rounded-xl border-0 bg-[#f4f4f8] px-4 text-sm text-[#14141e] outline-none ring-1 ring-transparent focus:bg-white focus:ring-primary2";

export default function ForeignBeneficiaryFlow({ currency, close, goNext }: { currency: ForeignCurrency; close: () => void; goNext: () => void }) {
  const qc = useQueryClient();
  const { actions } = useSendStore();
  const [mode, setMode] = useState<Mode>("form");
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [routing, setRouting] = useState("");
  const [nickname, setNickname] = useState("");
  const [save, setSave] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["foreign-beneficiaries", currency],
    queryFn: () => FetchForeignBeneficiariesApi(currency, { page: 1, limit: 50 }),
  });
  const beneficiaries = useMemo(() => (data?.beneficiaries ?? []).filter((item) => {
    const detail = item.foreign_currency_beneficiary;
    return `${detail.account_name} ${detail.bank_name} ${detail.account_number ?? ""} ${detail.iban ?? ""}`.toLowerCase().includes(search.toLowerCase());
  }), [data, search]);
  const selectedBank = currency === "EUR" ? "EU bank" : "UK bank";
  const valid = name.trim().length > 1 && (currency === "EUR" ? account.replaceAll(" ", "").length >= 10 : /^\d{6,8}$/.test(account.replaceAll(" ", ""))) && (currency === "EUR" || /^\d{6}$/.test(routing.replaceAll("-", "")));
  const mutation = useMutation({
    mutationFn: async () => {
      const cleanAccount = account.replaceAll(" ", "");
      const payload = (currency === "GBP"
        ? { bank_name: "", account_owner_name: name.trim(), account_number: cleanAccount, sort_code: routing.replaceAll("-", "") }
        : { bank_name: "", account_owner_name: name.trim(), iban: cleanAccount, bic: routing.trim() || undefined, country: cleanAccount.slice(0, 2), street_line_1: "", city: "", postal_code: "" }) as IForeignBeneficiaryPayload;
      await CreateForeignBeneficiaryApi({ currency, label: nickname.trim(), data: payload });
      const refreshed = await FetchForeignBeneficiariesApi(currency, { page: 1, limit: 50 });
      return refreshed.beneficiaries.find((item) => {
        const detail = item.foreign_currency_beneficiary;
        return currency === "GBP" ? detail.account_number === cleanAccount : detail.iban === cleanAccount;
      }) ?? refreshed.beneficiaries[0];
    },
    onSuccess: async (beneficiary) => {
      await qc.invalidateQueries({ queryKey: ["foreign-beneficiaries", currency] });
      if (beneficiary) actions.selectForeignBeneficiary(beneficiary);
      goNext();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Unable to add this beneficiary.")),
  });
  const choose = (beneficiary: IForeignBeneficiary) => { actions.selectForeignBeneficiary(beneficiary); goNext(); };
  const accountLabel = currency === "EUR" ? "IBAN" : "Account number";
  const routingLabel = currency === "EUR" ? "BIC / SWIFT · optional" : "Sort code";

  if (mode === "list") return <><FlowHeader title="Choose a beneficiary" subtitle={`${currency === "EUR" ? "EU" : "UK"} banks`} onBack={() => setMode("form")} /><FlowCard><label className="text-xs">Search<input autoFocus className={`${fieldClass} mt-2`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, bank or account" /></label><div className="flex flex-col">{isLoading ? <p className="py-6 text-sm text-[#79708d]">Loading beneficiaries…</p> : beneficiaries.map((item) => { const detail = item.foreign_currency_beneficiary; const ref = detail.account_number || detail.iban || ""; return <button key={item.entity_foreign_currency_beneficiary_id} type="button" onClick={() => choose(item)} className="flex min-h-[60px] items-center gap-3 rounded-xl px-3 text-left hover:bg-[#f8f7fa]"><span className="relative"><Avatar name={detail.account_name} src="" size={40} /><span className="absolute -bottom-1 -right-1"><FlowCurrency currency={currency} size={16} /></span></span><span className="min-w-0 flex-1"><strong className="block text-sm">{detail.account_name}</strong><small className="text-[#79708d]">{detail.bank_name}{detail.bank_name && " · "}••{ref.slice(-4)}</small></span><span className="text-xl text-[#8c86a0]">→</span></button>; })}</div></FlowCard></>;
  if (mode === "preview") return <><FlowHeader title={`Check ${currency === "EUR" ? "EU" : "UK"} bank details`} onBack={() => setMode("form")} /><div className="mb-5"><div className="grid grid-cols-2 gap-2"><span className="h-1.5 rounded-full bg-primary2" /><span className="h-1.5 rounded-full bg-primary2" /></div><p className="mt-4 text-sm text-[#79708d]">Step 2 of 2 · Preview</p></div><FlowCard><FlowRow label="Beneficiary name">{name}</FlowRow><FlowRow label={accountLabel}>{account}</FlowRow><FlowRow label={routingLabel.replace(" · optional", "")}>{routing || "—"}</FlowRow><FlowRow label="Nickname">{nickname || "—"}</FlowRow><FlowRow label="Bank">{selectedBank}</FlowRow>{currency === "EUR" && <FlowRow label="Country">{account.slice(0, 2).toUpperCase()}</FlowRow>}<FlowRow label="Recipient receives">{currency}</FlowRow><div className="rounded-xl bg-[#f1edff] p-4"><strong className="text-sm">Check the beneficiary details</strong><p className="mt-1 text-xs text-[#79708d]">Incorrect details can delay or return the transfer.</p></div><FlowActions onBack={() => setMode("form")} backLabel="Edit details" onNext={() => save ? mutation.mutate() : setError("Save this beneficiary to continue with the currently supported payout API.")} nextLabel="Continue to amount" loading={mutation.isPending} />{error && <p role="alert" className="text-sm text-[#d92d20]">{error}</p>}</FlowCard></>;
  return <><FlowHeader title={`${currency === "EUR" ? "EU" : "UK"} bank beneficiary`} onBack={close} /><div className="mb-5"><div className="grid grid-cols-2 gap-2"><span className="h-1.5 rounded-full bg-primary2" /><span className="h-1.5 rounded-full bg-[#e5e2ec]" /></div><p className="mt-4 text-sm text-[#79708d]">Step 1 of 2 · Beneficiary details</p></div><FlowCard><div className="flex items-center justify-between"><strong className="text-sm">Beneficiaries</strong><button type="button" onClick={() => setMode("list")} className="text-sm font-semibold text-primary2">See all</button></div><div className="flex gap-3 overflow-x-auto pb-1"><button type="button" className="flex w-[72px] shrink-0 flex-col items-center gap-1 text-xs"><span className="flex size-[52px] items-center justify-center rounded-full border border-dashed border-primary2 text-2xl text-primary2">＋</span>New</button>{(data?.beneficiaries ?? []).slice(0, 3).map((item) => { const detail=item.foreign_currency_beneficiary; const ref=detail.account_number || detail.iban || ""; return <button key={item.entity_foreign_currency_beneficiary_id} type="button" onClick={() => choose(item)} className="flex w-[84px] shrink-0 flex-col items-center text-xs"><span className="relative"><Avatar name={detail.account_name} src="" size={52} /><span className="absolute -bottom-1 -right-1"><FlowCurrency currency={currency} size={18} /></span></span><strong className="mt-1 max-w-full truncate">{item.label || detail.account_name.split(" ")[0]}</strong><small className="text-[#79708d]">••{ref.slice(-4)}</small></button>; })}</div><label className="text-xs">Beneficiary name<input className={`${fieldClass} mt-2`} value={name} onChange={(event) => setName(event.target.value)} /></label>{currency === "GBP" && <label className="text-xs">Sort code<input inputMode="numeric" className={`${fieldClass} mt-2`} value={routing} onChange={(event) => setRouting(event.target.value.replace(/[^\d-]/g, ""))} placeholder="00-00-00" /></label>}<label className="text-xs">{accountLabel}<input className={`${fieldClass} mt-2`} value={account} onChange={(event) => setAccount(event.target.value.toUpperCase())} /></label>{currency === "EUR" && <label className="text-xs">{routingLabel}<input className={`${fieldClass} mt-2`} value={routing} onChange={(event) => setRouting(event.target.value.toUpperCase())} /></label>}<label className="text-xs">Nickname · optional<input className={`${fieldClass} mt-2`} value={nickname} onChange={(event) => setNickname(event.target.value)} /></label><div className="flex items-center justify-between text-sm"><span>Save as a beneficiary</span><button type="button" role="switch" aria-checked={save} onClick={() => setSave(!save)} className={`relative h-6 w-11 rounded-full ${save ? "bg-primary2" : "bg-[#d0cdd8]"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-white transition ${save ? "right-0.5" : "left-0.5"}`} /></button></div><Button type="button" onClick={() => setMode("preview")} disabled={!valid} className="!h-12 !rounded-xl enabled:!bg-[#0d719f]">Next: preview</Button></FlowCard></>;
}
