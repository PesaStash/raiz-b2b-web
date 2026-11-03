"use client";
import Link from "next/link";
import { TeamIcon, confirmIcon, teamConfirm } from "./TeamUI";
export type Outcome =
  | "ready"
  | "expired"
  | "unavailable"
  | "used"
  | "deactivated";
export default function InvitationOutcome({
  state,
  email,
  business,
  expiresAt,
}: {
  state: Outcome;
  email?: string;
  business?: string;
  expiresAt?: string;
}) {
  const copy = {
    ready: {
      title: "Your account is ready",
      body: `Sign in${email ? ` with ${email}` : ""}${business ? ` to access ${business}` : " to access your business"}.`,
      icon: "success",
    },
    expired: {
      title: "Invitation expired",
      body: "This invitation has expired. Ask the business owner to send a new one.",
      icon: "expired",
    },
    unavailable: {
      title: "Invitation unavailable",
      body: "This invitation is no longer available. Ask the business owner for a new invitation.",
      icon: "unavailable",
    },
    used: {
      title: "Invitation already used",
      body: "This invitation has already been used. Try signing in, or contact the business owner.",
      icon: "used",
    },
    deactivated: {
      title: "You have been signed out",
      body: "Your access to this business has been deactivated. Contact the business owner if you think this is a mistake.",
      icon: "signed-out",
    },
  }[state];
  return (
    <section className={teamConfirm} aria-live="polite">
      <div
        className={confirmIcon(
          state === "unavailable" || state === "deactivated",
        )}
      >
        <TeamIcon name={copy.icon} />
      </div>
      <h2 className="font-bold text-lg md:text-xl leading-[1.35]">
        {copy.title}
      </h2>
      <p className="text-[13px] leading-normal">{copy.body}</p>
      {state === "expired" && expiresAt && (
        <p className="text-[13px] leading-normal text-raiz-gray-500">
          Expired {new Date(expiresAt).toLocaleString()}
        </p>
      )}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 min-h-[40px] w-full rounded-full py-4 bg-raiz-usd-primary max-md:bg-primary2 text-white font-brSonoma text-sm font-medium"
      >
        Go to sign in
      </Link>
    </section>
  );
}
