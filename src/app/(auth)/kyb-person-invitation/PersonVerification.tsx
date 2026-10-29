"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  return (
    <main
      className={`${surface} mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-10`}
    >
      <section className="rounded-2xl border border-raiz-gray-200 bg-white p-6 md:p-10">
        <Link href="/" className="text-xl font-bold text-primary2">
          Raiz Business
        </Link>
        <h1 className="mt-8 text-2xl font-bold">
          {complete ? "Your identity is verified" : "Verify your identity"}
        </h1>
        <p className="mb-6 mt-3 text-sm leading-relaxed text-raiz-gray-600">
          {complete
            ? "Your verification status has been shared with the business that invited you. You can close this page."
            : "Complete secure identity verification for the business that invited you. You don’t need a Raiz account."}
        </p>
        {loading && <p role="status">Checking your invitation…</p>}
        {error && <Notice error>{error}</Notice>}
        {!loading && !person && token.current && (
          <div className="mt-4">
            <Action
              variant="tertiary"
              disabled={cooldown}
              loading={busy}
              onClick={() => void retryInspect()}
            >
              Check invitation again
            </Action>
          </div>
        )}
        {person && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">
                {person.first_name} {person.last_name}
              </p>
              <Badge good={complete}>
                {label(person.verification_status ?? "Ready to verify")}
              </Badge>
            </div>
            {person.expires_at && (
              <p className="text-xs text-raiz-gray-600">
                Invitation expires{" "}
                {new Date(person.expires_at).toLocaleString()}
              </p>
            )}
            {!terminal && !url && (
              <>
                <Notice>
                  {sessionStarted
                    ? "Your verification session is already in progress. It may be awaiting review. Check your status below."
                    : "Have a valid government ID ready. Your identity documents are handled securely and are not displayed in the business portal."}
                </Notice>
                <Action
                  loading={busy}
                  disabled={cooldown}
                  onClick={() => void start()}
                >
                  {sessionStarted
                    ? "Resume verification"
                    : "Start verification"}
                </Action>
              </>
            )}
            {url && !terminal && (
              <iframe
                title="Secure identity verification"
                src={url}
                referrerPolicy="no-referrer"
                allow="camera; microphone; fullscreen"
                className="h-[65vh] min-h-[420px] w-full rounded-xl border border-raiz-gray-200"
              />
            )}
            {terminal && !complete && (
              <Notice>
                Verification is{" "}
                {label(person.verification_status ?? "").toLowerCase()}. Contact
                the business that invited you for help.
              </Notice>
            )}
            {!complete && (
              <Action
                variant="tertiary"
                disabled={cooldown || busy}
                onClick={() => void refresh()}
              >
                Check verification status
              </Action>
            )}
            {cooldown && (
              <p className="text-xs text-raiz-gray-600">
                Please wait a minute before another action. Status updates
                continue automatically.
              </p>
            )}
            {pollingStopped && !terminal && (
              <p className="text-xs text-raiz-gray-600">
                Automatic updates have paused. Use “Check verification status”
                to check again.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
