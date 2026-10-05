"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import useMediaQuery from "@mui/material/useMediaQuery";
import Link from "next/link";
import Image from "next/image";
import { getInvitation, acceptInvitation } from "@/services/team";
import { invitationErrorState, readApiError } from "@/lib/apiError";
import { isInvitationExpired, personName, roleDescriptions } from "@/lib/team";
import Slider from "../_components/authSlide/Slider";
import { newPasswordSchema } from "../register/_components/validation";
import {
  TeamButton,
  TeamDialog,
  TeamError,
  TeamField,
  TeamIcon,
  teamSurface,
} from "@/components/team/TeamUI";
import InvitationOutcome, {
  Outcome,
} from "@/components/team/InvitationOutcome";
import type { InvitationDetails } from "@/types/team";

export default function AcceptInvite() {
  const desktop = useMediaQuery("(min-width:768px)");
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [state, setState] = useState<
    "loading" | "valid" | "submitting" | "error" | Outcome
  >("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const [retry, setRetry] = useState(0);
  const submitting = useRef(false);
  const epoch = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++epoch.current;
    setDetails(null);
    setPassword("");
    setConfirm("");
    setFailure("");
    setErrors({});
    if (!token) {
      setState("unavailable");
      return;
    }
    setState("loading");
    getInvitation(token, controller.signal)
      .then((value) => {
        if (current !== epoch.current || controller.signal.aborted) return;
        setDetails(value);
        setState(isInvitationExpired(value) ? "expired" : "valid");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState(invitationErrorState(error));
        setFailure(
          readApiError(error).message ??
            "We couldn't check your invitation. Please try again.",
        );
      });
    return () => {
      controller.abort();
      epoch.current++;
    };
  }, [token, retry]);
  useEffect(() => {
    if (!details || state !== "valid") return;
    const timer = setTimeout(
      () => setState("expired"),
      Math.min(
        Math.max(0, Date.parse(details.expires_at) - Date.now()),
        2147483647,
      ),
    );
    return () => clearTimeout(timer);
  }, [details, state]);
  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (submitting.current || !details || !["valid", "error"].includes(state))
      return;
    if (isInvitationExpired(details)) {
      setState("expired");
      return;
    }
    const check = newPasswordSchema.safeParse(password);
    const next: Record<string, string> = {};
    if (!check.success) next.password = check.error.issues[0].message;
    if (!confirm || password !== confirm)
      next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    submitting.current = true;
    setState("submitting");
    setFailure("");
    const current = epoch.current;
    try {
      await acceptInvitation(token, password);
      if (current !== epoch.current) return;
      setPassword("");
      setConfirm("");
      setState("ready");
    } catch (error) {
      if (current !== epoch.current) return;
      const outcome = invitationErrorState(error);
      setState(outcome === "error" ? "valid" : outcome);
      setFailure(
        readApiError(error).message ??
          "We couldn't create your account. Your details are still here. Check your connection, then try again.",
      );
    } finally {
      submitting.current = false;
    }
  };
  const terminal = ["ready", "expired", "unavailable", "used"].includes(state);
  return (
    <main
      className={`${teamSurface} p-6 md:p-12 lg:px-8 xl:px-12 min-h-[100vh] bg-[#f8f7fa] md:bg-raiz-gray-50`}
    >
      <div className="flex flex-col md:flex-row items-stretch min-h-[calc(100vh-6rem)] gap-8 md:gap-12">
        <div className="relative hidden md:block w-[50%] xl:w-[54%] self-stretch min-h-[calc(100vh-6rem)]">
          <div className="absolute inset-0">
            <Slider className="md:!flex md:!w-full md:!h-full" />
          </div>
        </div>
        <div className="w-full max-w-[560px] mx-auto lg:w-[50%] xl:w-[46%] py-4">
        <Link href="/login" aria-label="Raiz sign in">
          <Image
            src="/icons/Logo.svg"
            alt="Raiz"
            width={104}
            height={40}
            className="mb-10"
          />
        </Link>
        {state === "loading" && (
          <p role="status" className="py-16 text-raiz-gray-600">
            Checking your invitation…
          </p>
        )}
        {state === "error" && (
          <TeamError retry={() => setRetry((n) => n + 1)}>{failure}</TeamError>
        )}
        {details && !terminal && state !== "loading" && state !== "error" && (
          <div className="max-md:bg-white max-md:border max-md:border-raiz-gray-200 max-md:p-[18px] max-md:rounded-2xl">
            <span className="hidden md:block mb-5">
              <TeamIcon name="name" />
            </span>
            <h1 className="text-xl md:text-[23px] leading-[1.3] font-bold">
              You have been invited to join {details.business_name}
            </h1>
            <p className="hidden md:block text-[13px] text-raiz-gray-600 mt-2">
              Create your Raiz sign-in to accept this invitation.
            </p>
            <form
              className="grid mt-6 gap-[18px] md:mt-9 md:gap-5"
              onSubmit={submit}
              noValidate
            >
              <TeamField
                name="full_name"
                label="Full name"
                value={personName(details)}
                readOnly
                icon={<TeamIcon name="lock-field" />}
              />
              <TeamField
                name="email"
                label="Work email"
                value={details.email}
                readOnly
                icon={<TeamIcon name="lock-field" />}
              />
              <div className="bg-[#f6f1fc] p-4 rounded-xl text-xs">
                <div className="flex justify-between gap-3">
                  <strong className="capitalize">
                    {details.role}{" "}
                    <span className="normal-case font-normal">
                      • Assigned role
                    </span>
                  </strong>
                  <span className="text-[10px]">
                    Invitation expires
                    <br />
                    {new Date(details.expires_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-raiz-gray-600 mt-2 leading-relaxed">
                  {roleDescriptions[details.role]}
                </p>
              </div>
              <div>
                <TeamField
                  name="password"
                  label="New password"
                  autoComplete="new-password"
                  type="password"
                  value={password}
                  disabled={state === "submitting"}
                  onChange={(e) => setPassword(e.target.value)}
                  errorMessage={errors.password}
                />
                <p className="text-[11px] text-raiz-gray-600 mt-2 leading-relaxed">
                  Use 8–200 characters with uppercase and lowercase letters, a
                  number and a symbol. Avoid a password you use elsewhere.
                </p>
              </div>
              <TeamField
                name="confirmPassword"
                label="Confirm new password"
                autoComplete="new-password"
                type="password"
                value={confirm}
                disabled={state === "submitting"}
                onChange={(e) => setConfirm(e.target.value)}
                errorMessage={errors.confirm}
              />
              {failure && (
                <TeamError retry={() => void submit()}>{failure}</TeamError>
              )}
              <div className="mt-5">
                <p className="text-xs text-raiz-gray-600 mb-3 leading-relaxed">
                  By continuing, you agree to Raiz&apos;s{" "}
                  <a
                    className="font-bold text-raiz-gray-800"
                    href="https://www.raiz.app/terms"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Terms of Service
                  </a>{" "}
                  and acknowledge our{" "}
                  <a
                    className="font-bold text-raiz-gray-800"
                    href="https://www.raiz.app/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
                <TeamButton
                  type="submit"
                  tone="brand"
                  loading={state === "submitting"}
                >
                  Create account
                </TeamButton>
              </div>
              <p className="text-center text-xs">
                Already have an account?{" "}
                <Link href="/login" className="font-bold">
                  Login
                </Link>
              </p>
            </form>
          </div>
        )}
        {terminal && (
          <>
            {!desktop ? (
              <div className="bg-white border border-[#e4e0ea] rounded-2xl p-6">
                <InvitationOutcome
                  state={state as Outcome}
                  email={details?.email}
                  business={details?.business_name}
                  expiresAt={details?.expires_at}
                />
              </div>
            ) : (
              <div>
                <TeamDialog
                  title="Invitation status"
                  close={() => window.location.assign("/login")}
                >
                  <InvitationOutcome
                    state={state as Outcome}
                    email={details?.email}
                    business={details?.business_name}
                    expiresAt={details?.expires_at}
                  />
                </TeamDialog>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </main>
  );
}
