"use client";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import type { KybEditor } from "@/lib/hooks/useUsdKyb";
import {
  ConfirmBridgeTosApi,
  GenerateBridgeTosUrlApi,
  SaveBridgeTosApi,
} from "@/services/business";
import { persistAgreement, signedAgreementId } from "@/lib/usd-kyb/agreement";
import { readApiError } from "@/lib/apiError";
import { sessionGeneration } from "@/lib/session";
import BridgeToSWebview from "@/app/(dashboard)/_components/BridgeToSWebview";
import { Action, Badge, Notice } from "./KybUI";

export default function KybTerms({
  editor,
  onBusyChange,
}: {
  editor: KybEditor;
  onBusyChange: (busy: boolean) => void;
}) {
  const [url, setUrl] = useState("");
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setInlineError] = useState("");
  const setError = (message: string) => {
    setInlineError(message);
    if (message) toast.error(message, { id: "onboarding-error" });
  };
  const pending = useRef(false);
  const savePending = useRef(false);
  const alive = useRef(true);
  const generation = useRef(sessionGeneration());
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const active = () =>
    alive.current && generation.current === sessionGeneration();
  const accepted = !!signedAgreementId(editor.bundle);
  const writable =
    editor.access.canWriteBusiness &&
    !["completed", "rejected"].includes(editor.bundle?.case.status ?? "");
  const release = () => {
    pending.current = false;
    if (active()) {
      setOpening(false);
      setSaving(false);
      onBusyChange(false);
    }
  };
  const refresh = async () => editor.reload(editor.editable);
  const open = async () => {
    if (pending.current || !writable || editor.busy || editor.conflict) return;
    pending.current = true;
    setOpening(true);
    setError("");
    onBusyChange(true);
    try {
      if (editor.editable) await editor.flush();
      const hostedUrl = await GenerateBridgeTosUrlApi();
      if (!active()) return;
      if (new URL(hostedUrl).protocol !== "https:")
        throw new Error(
          "Unable to open a secure terms page. Please try again.",
        );
      setUrl(hostedUrl);
      setOpening(false);
    } catch (failure) {
      if (active())
        setError(
          readApiError(failure).message ||
            "Unable to open account terms. Please try again.",
        );
      release();
    }
  };
  const close = () => {
    if (savePending.current) return;
    setUrl("");
    release();
  };
  const acceptedTerms = async (id: string) => {
    if (savePending.current || !active()) return;
    savePending.current = true;
    setSaving(true);
    try {
      await persistAgreement(id, {
        save: SaveBridgeTosApi,
        confirm: ConfirmBridgeTosApi,
        refresh: async () => {
          if (!active())
            throw new Error("Session changed. Reload your account.");
          return refresh();
        },
        writeEditableDraft: editor.editable
          ? async (agreement) => {
              if (!active())
                throw new Error("Session changed. Reload your account.");
              editor.change("business_profile.signed_agreement_id", agreement);
              await editor.flush();
            }
          : undefined,
      });
      if (active()) {
        setError("");
        setUrl("");
      }
    } catch (failure) {
      if (active())
        setError(
          readApiError(failure).message || "Unable to save terms acceptance.",
        );
      throw failure;
    } finally {
      savePending.current = false;
      if (active()) setSaving(false);
    }
    release();
  };
  const checkStatus = async () => {
    if (pending.current || editor.busy || editor.conflict) return;
    pending.current = true;
    setOpening(true);
    setError("");
    onBusyChange(true);
    try {
      const confirmed = await ConfirmBridgeTosApi();
      const latest = await refresh();
      if (active() && (!confirmed || !signedAgreementId(latest)))
        setError(
          "Terms acceptance is not yet confirmed on your verification case. Review and accept terms, or contact support if you already accepted them.",
        );
    } catch (failure) {
      if (active())
        setError(
          readApiError(failure).message ||
            "Unable to refresh terms status. Please try again.",
        );
    } finally {
      release();
    }
  };
  return (
    <section
      className="mt-6 space-y-4 rounded-2xl border border-kyb-border bg-kyb-soft p-5"
      data-kyb-requirement="account-terms"
      aria-label="Account terms"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Accept account terms</h2>
        <Badge good={accepted}>
          {accepted ? "Terms accepted" : "Action needed"}
        </Badge>
      </div>
      <p className="text-sm leading-[21px] text-kyb-muted">
        {accepted
          ? "Your signed agreement is saved on this verification case."
          : "Review and accept Bridge’s hosted account terms before submitting your business for operations review."}
      </p>
      {!accepted && writable && (
        <Action
          onClick={() => void open()}
          disabled={pending.current || editor.busy || editor.conflict}
          loading={opening}
        >
          {editor.editable ? "Review and accept terms" : "Accept account terms"}
        </Action>
      )}
      {!accepted && !editor.access.canWriteBusiness && (
        <p className="text-[13px] text-kyb-muted">
          An authorised business owner or admin must complete this step.
        </p>
      )}
      {error && (
        <Notice error>
          {error}{" "}
          <a className="font-semibold underline" href="mailto:support@raiz.app">
            Contact support
          </a>
        </Notice>
      )}
      {!url && (
        <button
          type="button"
          disabled={pending.current || editor.busy || editor.conflict}
          className="text-xs font-semibold text-primary2 disabled:opacity-50"
          onClick={() => void checkStatus()}
        >
          Refresh terms status
        </button>
      )}
      {url && (
        <BridgeToSWebview
          bridgeUrl={url}
          close={close}
          onAccepted={acceptedTerms}
        />
      )}
      <span className="sr-only" role="status">
        {saving ? "Saving terms acceptance…" : ""}
      </span>
    </section>
  );
}
