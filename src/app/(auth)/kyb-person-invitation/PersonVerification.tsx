"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HiOutlineShieldCheck,
  HiOutlineIdentification,
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { personInvitationApi } from "@/services/usdKyb";
import { readApiError } from "@/lib/apiError";
import { label, terminalIdentity } from "@/lib/usd-kyb/model";
import { Action, Badge, Notice, surface } from "@/components/usd-kyb/KybUI";
import type { PersonInvitation } from "@/types/usdKyb";
const errorMessage = (error: unknown) => {
  const { status } = readApiError(error);
  if (status === 404)
    return "This invitation is invalid, revoked or already used. Contact the business that invited you.";
  if (status === 410)
    return "This invitation has expired. Ask the business to send a new link.";
  if (status === 429)
    return "Too many attempts. Wait a minute before trying again.";
  return "Verification is temporarily unavailable. Please try again later.";
};
export default function PersonVerification() {
  const token = useRef("");
  const bootstrapped = useRef(false);
  const pending = useRef(false);
  const [person, setPerson] = useState<PersonInvitation>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [pollingStopped, setPollingStopped] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    if (!bootstrapped.current) {
      const address = new URL(window.location.href);
      const fragment = new URLSearchParams(address.hash.slice(1));
      token.current =
        fragment.get("token") ?? address.searchParams.get("token") ?? "";
      window.history.replaceState(
        window.history.state,
        "",
        "/kyb-person-invitation",
      );
      bootstrapped.current = true;
    }
    if (!token.current) {
      setError("Open the secure invitation link from your email.");
      setLoading(false);
    } else
      void personInvitationApi
        .inspect(token.current, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) setPerson(result);
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(errorMessage(failure));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    return () => {
      alive.current = false;
      controller.abort();
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);
  const retryInspect = async () => {
    if (pending.current || cooldown || !token.current) return;
    pending.current = true;
    setBusy(true);
    setCooldown(true);
    setError("");
    try {
      const next = await personInvitationApi.inspect(token.current);
      if (alive.current) setPerson(next);
    } catch (failure) {
      if (alive.current) setError(errorMessage(failure));
    } finally {
      pending.current = false;
      if (alive.current) {
        setBusy(false);
        cooldownTimer.current = setTimeout(() => setCooldown(false), 60000);
      }
    }
  };
  const refresh = async () => {
    if (pending.current || cooldown || !token.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setCooldown(true);
    try {
      const next = await personInvitationApi.status(token.current);
      if (alive.current) setPerson(next);
    } catch (failure) {
      if (alive.current) setError(errorMessage(failure));
    } finally {
      pending.current = false;
      if (alive.current) {
        setBusy(false);
        cooldownTimer.current = setTimeout(() => setCooldown(false), 60000);
      }
    }
  };
  useEffect(() => {
    if (
      !person ||
      terminalIdentity(person.verification_status) ||
      pollingStopped
    )
      return;
    const controller = new AbortController();
    let requests = 0;
    let inFlight = false;
    const timer = setInterval(() => {
      if (document.hidden || pending.current || inFlight) return;
      if (++requests > 60) {
        clearInterval(timer);
        setPollingStopped(true);
        return;
      }
      inFlight = true;
      void personInvitationApi
        .status(token.current, controller.signal)
        .then((next) => {
          if (!controller.signal.aborted) setPerson(next);
        })
        .catch((failure) => {
          if (!controller.signal.aborted) {
            setError(errorMessage(failure));
            clearInterval(timer);
            setPollingStopped(true);
          }
        })
        .finally(() => {
          inFlight = false;
        });
    }, 10000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
    // Status changes restart the effect only at a terminal boundary; polling is bounded.
  }, [!!person, terminalIdentity(person?.verification_status), pollingStopped]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = async () => {
    if (
      pending.current ||
      cooldown ||
      !person ||
      terminalIdentity(person.verification_status)
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    setCooldown(true);
    try {
      const session = await personInvitationApi.session(token.current);
      if (!alive.current) return;
      setSessionStarted(true);
      if (session.url) {
        const target = new URL(session.url);
        if (target.protocol !== "https:")
          throw new Error("Invalid verification URL");
        setUrl(target.href);
      } else setUrl("");
    } catch (failure) {
      if (alive.current) setError(errorMessage(failure));
    } finally {
      pending.current = false;
      if (alive.current) {
        setBusy(false);
        cooldownTimer.current = setTimeout(() => setCooldown(false), 60000);
      }
    }
  };
  const complete = ["approved", "completed"].includes(
    person?.verification_status ?? "",
  );
  const terminal = terminalIdentity(person?.verification_status);
  const personName = [person?.first_name, person?.last_name].filter(Boolean).join(" ");
  const expiry = person?.expires_at ? new Date(person.expires_at) : null;
  const expiryLabel = expiry && !Number.isNaN(expiry.getTime())
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "numeric", minute: "2-digit", timeZoneName: "short",
      }).format(expiry)
    : null;
  return (
    <main className={`${surface} min-h-screen bg-[#F8F7FB] px-4 py-6 sm:px-6 sm:py-10`}>
      <div className={`mx-auto ${url && !terminal ? "max-w-4xl" : "max-w-xl"}`}>
        <header className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
          <Link href="/" aria-label="Raiz Business home" className="flex items-center gap-2.5">
            <Image src="/icons/logoWText.svg" alt="" width={36} height={36} />
            <span className="text-lg font-bold tracking-tight text-kyb-ink">Raiz <span className="font-normal text-kyb-muted">Business</span></span>
          </Link>
          <span className="flex items-center gap-1.5 text-xs text-kyb-muted">
            <HiOutlineShieldCheck aria-hidden className="size-4 text-primary2" />
            Identity verification
          </span>
        </header>

        <section aria-labelledby="verification-heading" className="overflow-hidden rounded-3xl border border-kyb-border bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className={`mb-5 flex size-14 items-center justify-center rounded-2xl ${complete ? "bg-[#E8F7EF] text-[#159C52]" : "bg-kyb-selected text-primary2"}`}>
              {complete ? <HiOutlineCheckCircle aria-hidden className="size-7" /> : <HiOutlineShieldCheck aria-hidden className="size-7" />}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary2">Business verification</p>
            <h1 id="verification-heading" className="mt-2 text-2xl font-bold tracking-tight text-kyb-ink sm:text-3xl">
              {complete ? "You’re verified" : "Verify your identity"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-kyb-muted">
              {complete
                ? "Your status has been shared with the business that invited you. You can close this page."
                : "Help the business that invited you complete its verification. You don’t need a Raiz account."}
            </p>

            {loading && (
              <div role="status" className="mt-6 flex items-center gap-3 rounded-xl bg-kyb-soft p-4 text-sm text-kyb-muted">
                <HiOutlineArrowPath aria-hidden className="size-5 animate-spin text-primary2" />
                Checking your invitation…
              </div>
            )}
            {error && <div className="mt-5"><Notice error>{error}</Notice></div>}
            {!loading && !person && token.current && (
              <Action className="mt-5 !w-full" variant="tertiary" disabled={cooldown} loading={busy} onClick={() => void retryInspect()}>
                Check invitation again
              </Action>
            )}
            {person && (
              <div className="mt-6 space-y-5">
                <div className="rounded-xl border border-kyb-border bg-kyb-soft p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-kyb-muted">{personName ? "Invited to verify" : "Your invitation"}</p>
                      {personName && <p className="mt-1 break-words text-sm font-semibold">{personName}</p>}
                    </div>
                    <Badge good={complete}>{label(person.verification_status ?? "Ready to verify")}</Badge>
                  </div>
                  {expiryLabel && !terminal && (
                    <p className="mt-3 flex items-start gap-1.5 border-t border-kyb-border pt-3 text-xs leading-relaxed text-kyb-muted">
                      <HiOutlineClock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      <span>Link expires <time dateTime={person.expires_at ?? undefined}>{expiryLabel}</time></span>
                    </p>
                  )}
                </div>

                {!terminal && !url && (
                  <>
                    {sessionStarted ? (
                      <Notice>Your verification is in progress and may be awaiting review. You can resume or check your status below.</Notice>
                    ) : (
                      <div className="flex gap-3 py-1">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-kyb-soft text-primary2">
                          <HiOutlineIdentification aria-hidden className="size-5" />
                        </span>
                        <div>
                          <h2 className="text-sm font-semibold">Have your government ID ready</h2>
                          <p className="mt-1 text-xs leading-relaxed text-kyb-muted">Follow the prompts to complete your identity check.</p>
                        </div>
                      </div>
                    )}
                    <Action className="!h-12 !w-full" loading={busy} disabled={cooldown} onClick={() => void start()}>
                      <span className="flex items-center justify-center gap-2">
                        {sessionStarted ? "Resume verification" : "Start verification"}
                        <HiOutlineArrowRight aria-hidden className="size-4" />
                      </span>
                    </Action>
                  </>
                )}
                {url && !terminal && (
                  <iframe title="Secure identity verification" src={url} referrerPolicy="no-referrer"
                    allow="camera; microphone; fullscreen"
                    className="h-[65vh] min-h-[420px] w-full rounded-xl border border-kyb-border" />
                )}
                {terminal && !complete && (
                  <Notice>Verification is {label(person.verification_status ?? "").toLowerCase()}. Contact the business that invited you for help.</Notice>
                )}
                {!complete && (
                  <button type="button" disabled={cooldown || busy} onClick={() => void refresh()}
                    className="mx-auto flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary2 hover:bg-kyb-soft disabled:cursor-not-allowed disabled:opacity-50">
                    <HiOutlineArrowPath aria-hidden className="size-4" />
                    Check verification status
                  </button>
                )}
                {cooldown && (
                  <p role="status" className="text-center text-xs leading-relaxed text-kyb-muted">
                    Please wait a minute before another action.
                    {!pollingStopped && !terminal && " Status updates continue automatically."}
                  </p>
                )}
                {pollingStopped && !terminal && (
                  <p className="text-center text-xs leading-relaxed text-kyb-muted">Automatic updates have paused. Select “Check verification status” to refresh.</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2.5 border-t border-kyb-border bg-[#FCFBFE] px-6 py-4 sm:px-8">
            <HiOutlineShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary2" />
            <p className="text-xs leading-relaxed text-kyb-muted">Your identity documents are handled securely and aren’t displayed in the business portal.</p>
          </div>
        </section>
        <p className="mx-auto mt-5 max-w-sm text-center text-xs leading-relaxed text-kyb-muted">Need help? Contact the business that sent your invitation.</p>
      </div>
    </main>
  );
}
