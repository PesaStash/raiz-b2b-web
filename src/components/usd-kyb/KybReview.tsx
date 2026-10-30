"use client";
import { groupFieldErrors } from "@/lib/usd-kyb/corrections";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SetTransactionPin from "@/app/(dashboard)/_components/transaction-pin/SetTransactionPin";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import { KybIcon, businessName } from "./KybGuide";
import { Notice, ReadRows } from "./KybUI";
import {
  ACCOUNT_PURPOSE_OPTIONS,
  SOURCE_OF_FUNDS_OPTIONS,
  REVENUE_OPTIONS,
  HIGH_RISK_ACTIVITIES,
} from "@/lib/usd-kyb/bridgeOptions";
import {
  peopleNeedingInvitation,
  personRequirementMessage,
} from "@/lib/usd-kyb/personDetails";
import type { KybPerson } from "@/types/usdKyb";
import type { KybEditor } from "@/lib/hooks/useUsdKyb";
import {
  deferredRequirements,
  display,
  getPath,
  label,
  record,
  requirementStage,
} from "@/lib/usd-kyb/model";
export function Requirements({
  editor,
  navigate,
}: {
  editor: KybEditor;
  navigate?: (step: number, requirement?: string) => void;
}) {
  const correctionFor = (key: string) =>
    groupFieldErrors(editor.fieldErrors ?? []).find(
      (error) => error.field === key,
    );
  const hard = [
    ...new Set([
      ...editor.missing.filter((key) => !deferredRequirements.has(key)),
      ...(editor.fieldErrors ?? []).map((error) => error.field),
      ...(peopleNeedingInvitation(editor.people).length
        ? ["associated_persons.invitations"]
        : []),
    ]),
  ];
  const pending = [
    ...new Set([
      ...editor.missing.filter((key) => deferredRequirements.has(key)),
      ...(editor.bundle?.review_blockers ?? []),
    ]),
  ];
  return (
    <>
      {hard.length > 0 && (
        <Notice error>
          <p className="font-semibold">These items need attention</p>
          <ul className="mt-2 space-y-2">
            {hard.map((key) => (
              <li key={key}>
                {navigate ? (
                  <button
                    type="button"
                    className="text-left underline"
                    onClick={() => navigate?.(requirementStage(key), key)}
                  >
                    {key === "signed_agreement_id"
                      ? "Account terms"
                      : (correctionFor(key)?.message ??
                        personRequirementMessage(key, editor.people) ??
                        label(key.replaceAll(".", " · ")))}
                  </button>
                ) : key === "signed_agreement_id" ? (
                  "Account terms"
                ) : (
                  (correctionFor(key)?.message ??
                  personRequirementMessage(key, editor.people) ??
                  label(key.replaceAll(".", " · ")))
                )}
              </li>
            ))}
          </ul>
        </Notice>
      )}
      {pending.length > 0 && (
        <Notice>
          <p className="font-semibold">
            Can follow after operations submission
          </p>
          <ul className="mt-2 list-inside list-disc">
            {pending.map((key) => (
              <li key={key}>
                {key === "signed_agreement_id"
                  ? "Account terms"
                  : (correctionFor(key)?.message ??
                    personRequirementMessage(key, editor.people) ??
                    label(key.replaceAll(".", " · ")))}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            These items are still required before provider submission.
          </p>
        </Notice>
      )}
    </>
  );
}
function isBlank(value: unknown): boolean {
  if (value == null || value === "") return true;
  if (Array.isArray(value)) return value.every(isBlank);
  if (typeof value === "object")
    return Object.values(value as Record<string, unknown>).every(isBlank);
  return false;
}
function fieldText(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.includes("_") && !value.includes(" "))
    return label(value);
  return display(value);
}
function SubmittedValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    const items = value.filter((item) => !isBlank(item));
    if (!items.length) return <span>Not provided</span>;
    const grouped = items.every((item) => item && typeof item === "object");
    if (grouped)
      return (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl bg-kyb-soft px-3 py-2">
              <SubmittedValue value={item} />
            </div>
          ))}
        </div>
      );
    return (
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>
            <SubmittedValue value={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(record(value)).filter(
      ([, item]) => !isBlank(item),
    );
    if (!entries.length) return <span>Not provided</span>;
    return (
      <dl className="space-y-3">
        {entries.map(([key, item]) => (
          <div key={key}>
            <dt className="text-kyb-muted">{label(key)}</dt>
            <dd className="mt-0.5 font-medium">
              <SubmittedValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span>{fieldText(value)}</span>;
}
export default function KybReview({
  editor,
  navigate,
}: {
  editor: KybEditor;
  navigate?: (step: number, requirement?: string) => void;
}) {
  const profile = record(editor.draft.business_profile);
  const activity = record(editor.draft.industry_purpose);
  const tinNumber = (() => {
    const identifiers = Array.isArray(editor.draft.identifying_information)
      ? (editor.draft.identifying_information as Record<string, unknown>[])
      : [];
    return display(identifiers.find((item) => item.type === "tin")?.number);
  })();
  const optionLabel = (
    value: unknown,
    choices: { value: string; label: string }[],
  ) => choices.find((o) => o.value === value)?.label ?? label(display(value));
  const usdAmount = (value: unknown) => {
    if (value == null || value === "") return display(value);
    const amount =
      typeof value === "number"
        ? value
        : typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())
          ? Number(value)
          : NaN;
    if (!Number.isFinite(amount)) return display(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };
  const readable = (value: unknown): string =>
    Array.isArray(value)
      ? value.map(readable).join(", ")
      : value && typeof value === "object"
        ? Object.values(value)
            .filter((v) => v != null && v !== "")
            .map(readable)
            .join(", ")
        : typeof value === "boolean"
          ? value
            ? "Yes"
            : "No"
          : display(value);
  const sections = [
    {
      title: "About the business",
      index: 1,
      data: {
        "Registered name": profile.business_legal_name,
        "Trading name": profile.business_trade_name,
        "Business type": profile.business_type,
        TIN: tinNumber,
        Industry: readable(activity.business_industry),
        Address: readable(editor.draft.registered_address),
      },
    },
    {
      title: "Owners and directors",
      index: 2,
      data: Object.fromEntries(
        editor.people.map((p) => [
          `${p.first_name} ${p.last_name}`,
          [
            p.is_director && "Director",
            p.has_control && "Control person",
            p.is_signer && "Signer",
            p.has_ownership && `${p.ownership_percentage}%`,
            label(
              p.verification_status ?? p.invitation_status ?? "Not invited",
            ),
          ]
            .filter(Boolean)
            .join(" · "),
        ]),
      ),
    },
    {
      title: "How you’ll use Raiz",
      index: 3,
      data: {
        "Source of funds": optionLabel(
          activity.source_of_funds,
          SOURCE_OF_FUNDS_OPTIONS,
        ),
        "Account purpose": optionLabel(
          activity.account_purpose,
          ACCOUNT_PURPOSE_OPTIONS,
        ),
        "Annual revenue": optionLabel(
          activity.estimated_annual_revenue_usd,
          REVENUE_OPTIONS,
        ),
        "Monthly payments (USD)": usdAmount(
          activity.expected_monthly_payments_usd,
        ),
        "Higher-risk activities": Array.isArray(
          record(editor.draft.risk_profile).high_risk_activities,
        )
          ? (record(editor.draft.risk_profile).high_risk_activities as string[])
              .map((v) => optionLabel(v, HIGH_RISK_ACTIVITIES))
              .join(", ")
          : "Not provided",
        "Acting as intermediary": readable(
          record(editor.draft.risk_profile).acting_as_intermediary,
        ),
      },
    },
    {
      title: "Documents",
      index: 4,
      data: {
        Uploaded:
          editor.bundle?.documents
            .map(
              (d) =>
                d.description ||
                d.file_name ||
                d.purposes.map(label).join(", "),
            )
            .join(", ") || "No documents uploaded",
      },
    },
  ];
  const submitted = Object.entries(record(editor.draft)).filter(
    ([, value]) => !isBlank(value),
  );
  return (
    <div className="space-y-6">
      <Requirements editor={editor} navigate={navigate} />
      {sections.map((section) => (
        <section
          key={section.title}
          className="overflow-hidden rounded-2xl border border-kyb-border"
        >
          <header className="flex items-center justify-between gap-3 bg-kyb-soft px-5 py-4">
            <h3 className="text-sm font-semibold">{section.title}</h3>
            {navigate && (
              <button
                type="button"
                onClick={() => navigate(section.index)}
                className="text-xs font-semibold text-primary2"
              >
                {editor.editable ? "Edit" : "View"}
              </button>
            )}
          </header>
          <div className="px-5 py-3">
            <ReadRows data={section.data} />
          </div>
        </section>
      ))}
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-primary2">
          View all submitted fields
        </summary>
        <div className="mt-4 space-y-4">
          {submitted.length ? (
            submitted.map(([key, value]) => (
              <section
                key={key}
                className="rounded-2xl border border-kyb-border px-5 py-4"
              >
                <h3 className="text-sm font-semibold">{label(key)}</h3>
                <div className="mt-3">
                  <SubmittedValue value={value} />
                </div>
              </section>
            ))
          ) : (
            <p className="text-kyb-muted">Nothing has been submitted yet.</p>
          )}
        </div>
      </details>
    </div>
  );
}
function ResendPersonLink({
  person,
  editor,
}: {
  person: KybPerson;
  editor: KybEditor;
}) {
  const [sending, setSending] = useState(false);
  const previousInvite = ["sent", "expired", "revoked"].includes(
    person.invitation_status ?? "",
  );
  if (!previousInvite)
    return (
      <a
        href="mailto:support@raiz.app"
        className="col-start-2 justify-self-start sm:col-start-auto sm:justify-self-end shrink-0 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold leading-[19px] text-primary2"
        aria-label={`Contact support about inviting ${person.first_name} ${person.last_name}`}
      >
        Contact support
      </a>
    );
  return (
    <button
      type="button"
      aria-label={`Resend link to ${person.first_name} ${person.last_name}`}
      aria-busy={sending}
      disabled={sending || editor.busy || !editor.canResendPerson(person)}
      onClick={() => {
        setSending(true);
        void editor.resendPerson(person).finally(() => setSending(false));
      }}
      className="col-start-2 justify-self-start sm:col-start-auto sm:justify-self-end inline-flex shrink-0 items-center gap-1.5 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold leading-[19px] text-primary2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {sending ? (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        <Image
          src="/images/kyb/review-message.svg"
          width={14}
          height={14}
          alt=""
        />
      )}
      {sending ? "Sending…" : "Resend link"}
    </button>
  );
}
export function SubmittedCase({ editor }: { editor: KybEditor }) {
  const [createPin, setCreatePin] = useState(false);
  const hasTransactionPin = editor.access.user?.has_transaction_pin === true;
  const c = editor.bundle!.case;
  const done = c.status === "completed";
  const rejected = c.status === "rejected";
  const titles: Record<string, string> = {
    awaiting_admin_review: "We’re reviewing your business",
    submitted_to_bridge: "Your verification has been sent to our provider",
    under_review: "Your verification is under review",
    awaiting_ubo: "Waiting for owner verification",
    rejected: "Your verification was declined",
    completed: "Your USD verification is complete",
  };
  const requiredPeople = editor.people.filter(
    (p) =>
      (p.has_ownership && Number(p.ownership_percentage) >= 25) ||
      p.is_director ||
      p.has_control ||
      p.is_signer,
  );
  const pending = requiredPeople.filter(
    (p) => !["approved", "completed"].includes(p.verification_status ?? ""),
  );
  const identityPending =
    pending.length > 0 ||
    editor.missing.some(
      (key) =>
        key === "associated_persons.identity_verification" ||
        key === "associated_persons.government_id_document",
    );
  const steps = [
    "Submitted",
    "Owners verify their ID",
    "We check your details",
    "Your accounts open",
  ];
  const current = done ? 4 : identityPending ? 1 : 2;
  const submittedDate = c.submitted_for_review_at
    ? new Date(c.submitted_for_review_at)
    : null;
  const submittedAt =
    submittedDate && !Number.isNaN(submittedDate.getTime())
      ? submittedDate.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "";
  const email =
    getPath(editor.draft, "business_profile.email") ||
    c.business_email ||
    editor.access.user?.business_account?.business_email;
  const details = [
    submittedAt ? `Submitted ${submittedAt}.` : "Your details are saved.",
    email
      ? `We’ll email ${String(email)} when your status changes.`
      : "We’ll contact you when your status changes.",
  ].join(" ");
  return (
    <div className="space-y-7">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 sm:flex-1">
          <h1 className="text-[23px] font-semibold leading-[1.2]">
            Hi
            {editor.access.user?.first_name
              ? `, ${editor.access.user.first_name}`
              : ""}{" "}
            👋🏾
          </h1>
          <p className="mt-1.5 text-[15px] leading-[22px] text-kyb-muted">
            {done
              ? `${businessName(editor)} is verified. View your available account details on your Dashboard.`
              : rejected
                ? "We’ve reviewed your business verification. See the outcome below."
                : `Thanks for submitting. We’ll email you when ${businessName(editor)}’s verification status changes.`}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-kyb-border px-3 py-2 text-[13px] leading-[19px] text-kyb-muted">
          <KybIcon name="check" />
          {submittedAt ? `Submitted ${submittedAt}` : "Submitted"}
        </span>
      </header>
      {done && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#BCEACF] bg-[#F1FAF5] p-6">
          <KybIcon name="check" />
          <div className="flex-1">
            <h2 className="font-bold">
              You’re approved — welcome to Raiz Business
            </h2>
            <p className="mt-1 text-sm text-kyb-muted">
              Your USD verification is complete.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-raiz-usd-primary px-6 py-3 text-sm font-semibold text-white"
          >
            View your accounts
          </Link>
        </div>
      )}
      <section className="grid overflow-hidden rounded-2xl border border-kyb-border md:grid-cols-[minmax(0,1fr)_36%]">
        <div className="space-y-4 p-5 sm:p-8">
          <div className="flex items-center gap-3.5">
            <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#FDF5E1]">
              <Image
                src="/images/kyb/review-status.svg"
                width={28}
                height={28}
                alt=""
              />
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-[17px] ${done ? "bg-[#E8F7EF] text-[#159C52]" : rejected ? "bg-[#FDEDEE] text-[#D93A3A]" : "bg-[#FFF4DE] text-[#B06A00]"}`}
            >
              {!done && !rejected && (
                <Image
                  src="/images/kyb/review-clock.svg"
                  width={13}
                  height={13}
                  alt=""
                />
              )}
              {done ? "Approved" : rejected ? "Declined" : "In review"}
            </span>
          </div>
          <h2 className="text-2xl font-bold leading-8">
            {c.status === "awaiting_admin_review"
              ? `We’re reviewing ${businessName(editor)}`
              : (titles[c.status] ?? "Your case is read-only")}
          </h2>
          <p className="text-sm xl:text-[15px] leading-[22px] text-kyb-muted">
            {rejected
              ? display(c.failure_reason)
              : done
                ? "Your available accounts and balances are on your dashboard."
                : details}
          </p>
          {pending.length > 0 && (
            <div className="space-y-3 rounded-[14px] bg-kyb-selected p-4">
              <h3 className="text-sm font-semibold">
                Waiting on {pending.length}{" "}
                {pending.length === 1 ? "person" : "people"} to verify their ID
              </h3>
              <div className="space-y-3">
                {pending.map((p) => (
                  <div
                    key={p.person_key}
                    className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-2 sm:grid-cols-[32px_minmax(0,1fr)_auto]"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F6F1FC] text-xs font-semibold text-primary2">
                      {p.first_name?.[0]}
                      {p.last_name?.[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold leading-5">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs leading-[17px] text-kyb-muted">
                        {p.invitation_status === "sent"
                          ? "Invite link sent"
                          : p.invitation_status === "expired"
                            ? "Invite link expired"
                            : p.invitation_status === "revoked"
                              ? "Invite revoked"
                              : "Not invited yet"}
                      </p>
                    </div>
                    <ResendPersonLink person={p} editor={editor} />
                  </div>
                ))}
              </div>
              {pending.some(
                (person) =>
                  !["sent", "expired", "revoked"].includes(
                    person.invitation_status ?? "",
                  ),
              ) && (
                <p className="text-xs leading-[17px] text-kyb-muted">
                  People not yet invited need their details completed before a
                  first invitation. Contact support to resolve this on your
                  submitted case.
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            className="text-xs font-semibold text-primary2"
            disabled={editor.busy}
            onClick={() => void editor.reload(false)}
          >
            {editor.busy ? "Refreshing…" : "Refresh status"}
          </button>
        </div>
        <aside className="border-t border-kyb-border bg-[#F9F9FB] p-5 sm:p-8 md:border-l md:border-t-0">
          <h3 className="mb-4 text-[13px] font-semibold leading-[19px] text-kyb-muted">
            Progress
          </h3>
          <ol>
            {steps.map((title, index) => (
              <li key={title} className="relative flex min-h-16 gap-3.5 pb-0">
                <div className="relative flex w-6 shrink-0 justify-center">
                  {index < steps.length - 1 && (
                    <span
                      className={`absolute left-1/2 top-6 h-10 w-0.5 ${index < current ? "bg-[#16A058]" : "bg-kyb-border"}`}
                    />
                  )}
                  <span className="relative h-6 bg-[#F9F9FB]">
                    {index < current ? (
                      <Image
                        src="/images/kyb/review-done.svg"
                        width={24}
                        height={24}
                        alt=""
                      />
                    ) : (
                      <span
                        className={`block size-6 rounded-full border ${index === current ? "border-[7px] border-primary2" : "border-[#C7CCDA] bg-white"}`}
                      />
                    )}
                  </span>
                </div>
                <div>
                  <p
                    className={`text-sm xl:text-[15px] leading-[22px] ${index <= current ? "font-semibold" : "text-kyb-muted"}`}
                  >
                    {title}
                  </p>
                  {index === 0 && c.submitted_for_review_at && (
                    <p className="mt-0.5 text-xs xl:text-[13px] leading-[19px] text-kyb-muted">
                      {submittedAt}
                    </p>
                  )}
                  {index === 1 && (
                    <p className="mt-0.5 text-xs xl:text-[13px] leading-[19px] text-kyb-muted">
                      {requiredPeople.length
                        ? `${requiredPeople.length - pending.length} of ${requiredPeople.length} done`
                        : identityPending
                          ? "Verification pending"
                          : "No outstanding identity checks"}
                    </p>
                  )}
                  {index === 3 && (
                    <p className="mt-0.5 text-xs xl:text-[13px] leading-[19px] text-kyb-muted">
                      USD and NGN accounts
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>
      <section>
        <h2 className="mb-3 font-bold">
          {done ? "Next steps" : "While you wait"}
        </h2>
        <div
          className={`grid gap-4 ${hasTransactionPin ? "" : "sm:grid-cols-2"}`}
        >
          <Link
            href="/team"
            className="flex items-center gap-3.5 rounded-[14px] border border-kyb-border px-[18px] py-4"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E6F4FB]">
              <Image
                src="/images/kyb/review-team.svg"
                width={24}
                height={24}
                alt=""
              />
            </span>
            <div>
              <p className="text-[15px] font-semibold">Invite your team</p>
              <p className="mt-1 text-[13px] text-kyb-muted">
                Invite and manage business team members
              </p>
            </div>
            <Image
              src="/images/kyb/review-arrow.svg"
              width={18}
              height={18}
              alt=""
              className="ml-auto shrink-0"
            />
          </Link>
          {!hasTransactionPin && (
            <button
              type="button"
              onClick={() => setCreatePin(true)}
              className="flex w-full items-center gap-3.5 rounded-[14px] border border-kyb-border px-[18px] py-4 text-left"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E5F6F6]">
                <Image
                  src="/images/kyb/review-pin.svg"
                  width={24}
                  height={24}
                  alt=""
                />
              </span>
              <div>
                <p className="text-[15px] font-semibold">
                  Create your transaction PIN
                </p>
                <p className="mt-1 text-[13px] text-kyb-muted">
                  Secure your payments
                </p>
              </div>
              <Image
                src="/images/kyb/review-arrow.svg"
                width={18}
                height={18}
                alt=""
                className="ml-auto shrink-0"
              />
            </button>
          )}
        </div>
      </section>
      {createPin && !hasTransactionPin && (
        <CenterModalWrapper close={() => setCreatePin(false)}>
          <SetTransactionPin close={() => setCreatePin(false)} />
        </CenterModalWrapper>
      )}
      {/* Temporarily hidden on the submitted-status page.
      <details className="rounded-xl border border-kyb-border p-5">
        <summary className="cursor-pointer text-sm font-semibold">
          View submitted details
        </summary>
        <div className="mt-5">
          <KybReview editor={editor} />
        </div>
      </details>
      */}
    </div>
  );
}
