"use client";
import { toast } from "sonner";
import { useState } from "react";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import Image from "next/image";
import { TeamDialog } from "@/components/team/TeamUI";
import { readApiError } from "@/lib/apiError";
import { kybApi } from "@/services/usdKyb";
import type { KybEditor } from "@/lib/hooks/useUsdKyb";
import type { KybPerson } from "@/types/usdKyb";
import { label, personRemovalReason } from "@/lib/usd-kyb/model";
import { Action, Badge, Notice } from "./KybUI";
import { businessName } from "./KybGuide";
import PersonDetailsForm from "./PersonDetailsForm";
import {
  personDetailsErrors,
  peopleNeedingInvitation,
  ownershipNeedsReview,
} from "@/lib/usd-kyb/personDetails";
function ButtonSpinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
function SendInviteButton({
  person,
  editor,
}: {
  person: KybPerson;
  editor: KybEditor;
}) {
  const [pending, setPending] = useState(false);
  const sent = ["sent", "expired", "revoked"].includes(
    person.invitation_status ?? "",
  );
  return (
    <button
      type="button"
      aria-busy={pending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raiz-usd-primary px-5 text-sm font-semibold text-white disabled:opacity-50"
      disabled={
        pending ||
        !editor.editable ||
        editor.busy ||
        (!sent && !editor.personDetailsSaved(person))
      }
      onClick={() => {
        setPending(true);
        void (
          sent
            ? editor.resendPerson(person)
            : editor.invitePerson(person, "send")
        ).finally(() => setPending(false));
      }}
    >
      {pending && <ButtonSpinner />}
      {pending ? "Sending…" : sent ? "Resend invite link" : "Send invite link"}
    </button>
  );
}
function PersonActions({
  person,
  id,
  approved,
  editor,
  setFormError,
  setEditing,
}: {
  person: KybPerson;
  id?: string;
  approved: boolean;
  editor: KybEditor;
  setFormError: (message: string) => void;
  setEditing: (person: KybPerson) => void;
}) {
  const removalReason = personRemovalReason(person, editor.bundle?.case);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<"send" | "revoke" | null>(null);
  const menuRef = useOutsideClick(() => {
    if (!pending) setOpen(false);
  });
  const close = () => setOpen(false);
  const invite = async (action: "send" | "resend" | "revoke") => {
    if (!id || pending) return;
    setPending(action === "revoke" ? "revoke" : "send");
    try {
      if (action === "revoke")
        await editor.command(() => kybApi.invitation(id, action));
      else await editor.invitePerson(person, action);
    } finally {
      setPending(null);
      setOpen(false);
    }
  };
  return (
    <div ref={menuRef} className="absolute right-3 top-4 text-xs text-primary2">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Manage ${person.first_name} ${person.last_name}`}
        className="cursor-pointer px-1 font-semibold"
        onClick={() => setOpen((value) => !value)}
      >
        •••
      </button>
      {(open || pending) && (
        <div className="absolute right-0 z-10 mt-2 flex w-36 flex-col gap-3 rounded-xl border border-kyb-border bg-white p-4 text-left text-xs font-semibold shadow-lg">
          <button
            type="button"
            onClick={() => {
              close();
              setFormError("");
              if (!editor.canEditPerson(person)) {
                setFormError(
                  "Editing is unavailable. Refresh this case to continue.",
                );
                return;
              }
              setEditing({ ...editor.personInput(person) });
            }}
            disabled={!!pending || !editor.editable || editor.busy}
          >
            Edit
          </button>
          {id && !approved && (
            <>
              {person.invitation_status === "sent" && (
                <button
                  type="button"
                  aria-busy={pending === "revoke"}
                  className="inline-flex items-center gap-2 disabled:opacity-50"
                  disabled={!!pending || !editor.editable || editor.busy}
                  onClick={() => void invite("revoke")}
                >
                  {pending === "revoke" && <ButtonSpinner />}
                  Revoke link
                </button>
              )}
            </>
          )}
          {person.can_remove === true && (
            <button
              type="button"
              className="text-red-700"
              title={removalReason}
              disabled={!editor.editable || editor.busy || !!removalReason}
              onClick={() => {
                if (removalReason) return;
                close();
                if (
                  !window.confirm(
                    `Remove ${person.first_name ?? "this person"}? Any active invitation will be revoked.`,
                  )
                )
                  return;
                void editor.removePerson(person);
              }}
            >
              Remove person
            </button>
          )}
          {removalReason && (
            <p className="text-[11px] font-normal leading-relaxed text-kyb-muted">
              {removalReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
export default function PeopleStage({
  editor,
  guide,
}: {
  editor: KybEditor;
  guide?: import("@/types/usdKyb").KybFormGuide;
}) {
  const [editing, setEditing] = useState<KybPerson>();
  const [ownershipReview, setOwnershipReview] = useState<KybPerson>();
  const ownershipIssues = editor.people.filter(ownershipNeedsReview);
  const needingInvitation = peopleNeedingInvitation(editor.people);
  const [formError, setInlineError] = useState("");
  const setFormError = (message: string) => {
    setInlineError(message);
    if (message) toast.error(message, { id: "onboarding-error" });
  };
  const [savingPerson, setSavingPerson] = useState(false);
  const [savedPerson, setSavedPerson] = useState<string>();
  const total = editor.people.reduce(
    (sum, p) =>
      sum + (p.has_ownership ? Number(p.ownership_percentage ?? 0) : 0),
    0,
  );
  const addPerson = () => {
    setFormError("");
    setEditing({
      person_key: crypto.randomUUID(),
      first_name: "",
      last_name: "",
      email: "",
      has_ownership: false,
      has_control: false,
      is_signer: false,
      is_director: false,
    });
  };
  const savePerson = async (editing: KybPerson) => {
    if (
      !editing.associated_person_id &&
      !editing.business_usd_kyb_associated_person_id &&
      Object.keys(personDetailsErrors(editing)).length
    )
      return;
    if (editing.has_ownership && editing.ownership_percentage == null) {
      setFormError("Enter this owner’s ownership percentage.");
      return;
    }
    const next = editor.people.some((p) => p.person_key === editing.person_key)
      ? editor.people.map((p) =>
          p.person_key === editing.person_key ? editing : p,
        )
      : [...editor.people, editing];
    const total = next.reduce(
      (sum, p) =>
        sum + (p.has_ownership ? Number(p.ownership_percentage ?? 0) : 0),
      0,
    );
    if (total > 100) {
      setFormError("Combined ownership cannot exceed 100%.");
      return;
    }
    setSavingPerson(true);
    setFormError("");
    try {
      editor.changePeople(next);
      await editor.flush();
      const corrections = editor.personErrors?.(editing) ?? [];
      if (corrections.length) throw new Error(corrections[0].message);
      if (
        !editor.personDetailsSaved(editing) &&
        !(
          editing.associated_person_id ??
          editing.business_usd_kyb_associated_person_id
        )
      )
        throw new Error("Your details could not be saved. Please try again.");
      setSavedPerson(editing.person_key);
      setEditing(undefined);
    } catch (failure) {
      setFormError(
        readApiError(failure).message ||
          "We couldn’t save these details. Your entries are still here. Try saving again before sending an invite.",
      );
    } finally {
      setSavingPerson(false);
    }
  };
  return (
    <div data-kyb-requirement="associated_persons" className="space-y-6">
      <p className="text-[13px] leading-[19px] text-kyb-muted">
        First, complete and save each person’s details. Then send their invite
        link from their card below. Directors, control persons, signers, and
        owners holding 25% or more need identity verification.
      </p>
      {editor.people.length > 0 && (
        <Notice>
          <p className="font-semibold">
            {editor.people.length - needingInvitation.length} of{" "}
            {editor.people.length} people invited or verified
          </p>
          <p className="mt-1">
            {needingInvitation.length
              ? "Before submitting, complete each person’s details and send their invite link. Resend expired or revoked links. They can finish ID verification while your application is reviewed."
              : "Everyone has an invite or has already verified. You can submit while identity checks finish."}
          </p>
          <p className="mt-2">
            Added someone by mistake? Use their ••• menu to remove eligible
            people before your first submission.
          </p>
        </Notice>
      )}
      {formError && !editing && !ownershipReview && (
        <Notice error>{formError}</Notice>
      )}
      {ownershipIssues.length > 0 && (
        <Notice error>
          <p className="font-semibold">
            Confirm ownership for {ownershipIssues.length}{" "}
            {ownershipIssues.length === 1 ? "person" : "people"}
          </p>
          <p className="mt-1">
            These profiles are marked as owners but need a valid ownership
            percentage. Enter their share, or confirm they are not an owner. ID
            verification can finish later.
          </p>
          <ul className="mt-3 space-y-3">
            {ownershipIssues.map((person) => (
              <li
                key={person.person_key}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  {person.first_name} {person.last_name}
                </span>
                {editor.canEditPerson(person) ? (
                  <button
                    type="button"
                    disabled={!editor.editable || editor.busy}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    onClick={() => {
                      setFormError("");
                      setOwnershipReview({ ...editor.personInput(person) });
                    }}
                  >
                    Confirm ownership
                  </button>
                ) : (
                  <span className="text-xs">
                    Contact support to correct ownership; verification has
                    already started.
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Notice>
      )}
      {!editor.people.length ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E3E1EC] bg-[#FAFAFC] px-10 py-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-[#E6F4FB]">
            <span className="relative size-8 shrink-0 overflow-hidden">
              <span className="absolute bottom-[12.5%] left-[4.17%] right-[4.17%] top-3/4">
                <Image
                  src="/images/kyb/people-empty-base.svg"
                  alt=""
                  width={29.3333}
                  height={4}
                  className="absolute inset-0 max-w-none size-full"
                />
              </span>
              <span className="absolute inset-[12.5%_12.5%_33.33%_12.5%]">
                <Image
                  src="/images/kyb/people-empty-heads.svg"
                  alt=""
                  width={24}
                  height={17.3333}
                  className="absolute inset-0 max-w-none size-full"
                />
              </span>
            </span>
          </span>
          <div className="flex max-w-[420px] flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-[#19151E]">
              No owners or directors yet
            </h3>
            <p className="text-sm text-kyb-muted">
              {`We couldn’t find anyone on the register for ${businessName(editor)}. Complete each owner and director’s details, then send them a link to verify.`}
            </p>
          </div>
          <Action
            className="!h-12 w-full max-w-[260px]"
            disabled={!editor.editable || editor.busy}
            onClick={addPerson}
          >
            Add an owner or director
          </Action>
          <p className="flex items-center gap-1.5 text-xs text-kyb-muted">
            <Image
              src="/images/kyb/shield-tick.svg"
              alt=""
              width={16}
              height={16}
            />
            No Raiz account needed for them
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-kyb-border bg-kyb-soft p-5">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Ownership accounted for</span>
              <Badge good={total === 100 && ownershipIssues.length === 0}>
                {total}%
                {ownershipIssues.length > 0
                  ? ` · ${ownershipIssues.length} to confirm`
                  : ""}
              </Badge>
            </div>
            <div
              role="progressbar"
              aria-label="Ownership accounted for"
              aria-valuenow={total}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-[#E9E5F2]"
            >
              {editor.people
                .filter((p) => p.has_ownership)
                .map((p, i) => (
                  <span
                    key={p.person_key}
                    className={i % 2 === 0 ? "bg-primary2" : "bg-[#BBA5F5]"}
                    style={{
                      width: `${Math.min(Number(p.ownership_percentage ?? 0), 100)}%`,
                    }}
                  />
                ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-kyb-muted">
              {editor.people
                .filter((p) => p.has_ownership)
                .map((p) => (
                  <span key={p.person_key}>
                    {p.first_name} {p.last_name} ·{" "}
                    {p.ownership_percentage ?? "?"}%
                  </span>
                ))}
            </div>
            {total > 100 && (
              <p className="mt-2 text-sm text-red-700">
                Combined ownership must not exceed 100%.
              </p>
            )}
          </section>
          <div className="divide-y divide-kyb-border rounded-xl border border-kyb-border">
            {editor.people.map((person, index) => {
              const id =
                person.associated_person_id ??
                person.business_usd_kyb_associated_person_id;
              const approved = ["approved", "completed"].includes(
                person.verification_status ?? "",
              );
              const active =
                !!person.verification_started_at || !!person.verified_at;
              const sent = ["sent", "expired", "revoked"].includes(
                person.invitation_status ?? "",
              );
              const detailsSaved = editor.personDetailsSaved(person);
              const needsDetails =
                !approved && !sent && !active && !detailsSaved;
              return (
                <section
                  key={person.person_key}
                  data-kyb-requirement={`associated_persons[${index}]`}
                  className="relative flex gap-3 px-5 py-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-kyb-selected text-sm font-semibold text-primary2">
                    {person.first_name?.[0]}
                    {person.last_name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 pr-7">
                      <h3 className="text-sm font-semibold">
                        {person.first_name} {person.last_name}
                      </h3>
                      <Badge
                        good={approved}
                        tone={
                          sent ? "warning" : needsDetails ? "error" : undefined
                        }
                      >
                        {approved
                          ? "Verified"
                          : sent
                            ? person.invitation_status === "expired"
                              ? "Link expired — resend"
                              : person.invitation_status === "revoked"
                                ? "Link revoked — resend"
                                : "Link sent"
                            : needsDetails
                              ? "Complete details first"
                              : detailsSaved
                                ? "Ready to invite"
                                : label(
                                    person.verification_status ??
                                      person.invitation_status ??
                                      "Not invited",
                                  )}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-kyb-muted">
                      {[
                        person.is_director && "Director",
                        person.has_control && "Control person",
                        person.is_signer && "Signer",
                        person.has_ownership &&
                          `Owns ${person.ownership_percentage ?? "?"}%`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      {person.email && !approved ? ` · ${person.email}` : ""}
                    </p>

                    {(editor.personErrors?.(person) ?? []).length > 0 && (
                      <Notice error>
                        <ul className="space-y-1">
                          {editor.personErrors(person).map((error) => (
                            <li key={error.field}>{error.message}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          disabled={!editor.editable || editor.busy}
                          className="mt-2 font-semibold underline"
                          onClick={() => {
                            setFormError("");
                            setEditing(editor.personInput(person));
                          }}
                        >
                          Correct details
                        </button>
                      </Notice>
                    )}
                    {!approved && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs leading-relaxed text-kyb-muted">
                          {sent
                            ? needingInvitation.some(
                                (p) => p.person_key === person.person_key,
                              )
                              ? "Resend their invitation before submitting so they have a valid link."
                              : "Invite sent. They can use their link to verify their identity."
                            : active
                              ? "Identity verification is in progress."
                              : detailsSaved
                                ? "Details saved. Send their invite link to start identity verification."
                                : "Step 1 of 2 · Complete their personal details, address, and business roles. You can send their invite link after saving."}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          {!sent && !active && (
                            <Action
                              variant={needsDetails ? "primary" : "tertiary"}
                              disabled={!editor.editable || editor.busy}
                              onClick={() => {
                                setFormError("");
                                if (!editor.canEditPerson(person)) {
                                  setFormError(
                                    "Editing is unavailable. Refresh this case to continue.",
                                  );
                                  return;
                                }
                                setEditing({ ...editor.personInput(person) });
                              }}
                            >
                              {needsDetails
                                ? "Complete details"
                                : "Review details"}
                            </Action>
                          )}
                          {id && (sent || detailsSaved) && (
                            <SendInviteButton person={person} editor={editor} />
                          )}
                        </div>
                        {savedPerson === person.person_key &&
                          detailsSaved &&
                          !sent && (
                            <p
                              role="status"
                              className="text-xs font-semibold text-[#159C52]"
                            >
                              Details saved — you can now send the invite link.
                            </p>
                          )}
                      </div>
                    )}
                    <PersonActions
                      person={person}
                      id={id}
                      approved={approved}
                      editor={editor}
                      setFormError={setFormError}
                      setEditing={setEditing}
                    />
                  </div>
                </section>
              );
            })}
          </div>
          <Action
            variant="tertiary"
            className="w-full border-dashed"
            disabled={!editor.editable || editor.busy}
            onClick={addPerson}
          >
            ＋ Add an owner, director or signer
          </Action>
          <Notice>
            Send everyone their invite link before submitting. They can finish
            verifying while your application is reviewed. Directors, control
            persons, signers and owners with at least 25% ownership must verify
            before provider submission.
          </Notice>
        </>
      )}
      {ownershipReview && (
        <TeamDialog
          title="Confirm ownership"
          wide
          pending={savingPerson}
          close={() => setOwnershipReview(undefined)}
        >
          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (ownershipNeedsReview(ownershipReview)) {
                setFormError(
                  "Enter an ownership percentage greater than 0 and up to 100.",
                );
                return;
              }
              if (
                ![
                  ownershipReview.has_ownership,
                  ownershipReview.is_director,
                  ownershipReview.has_control,
                  ownershipReview.is_signer,
                ].some(Boolean)
              ) {
                setFormError(
                  "This person needs a business role. Complete their details to confirm whether they are a director, control person or signer.",
                );
                return;
              }
              const updated = {
                ...ownershipReview,
                has_ownership: !!ownershipReview.has_ownership,
                ownership_percentage: ownershipReview.has_ownership
                  ? ownershipReview.ownership_percentage
                  : null,
              };
              const next = editor.people.map((person) =>
                person.person_key === updated.person_key ? updated : person,
              );
              if (
                next.reduce(
                  (sum, person) =>
                    sum +
                    (person.has_ownership
                      ? Number(person.ownership_percentage ?? 0)
                      : 0),
                  0,
                ) > 100
              ) {
                setFormError("Combined ownership cannot exceed 100%.");
                return;
              }
              setSavingPerson(true);
              setFormError("");
              try {
                editor.changePeople(next);
                await editor.flush();
                setOwnershipReview(undefined);
                toast.success("Ownership details saved.");
              } catch (failure) {
                setFormError(
                  readApiError(failure).message ||
                    "Unable to save ownership details. Try again.",
                );
              } finally {
                setSavingPerson(false);
              }
            }}
          >
            <div>
              <h2 className="text-xl font-bold">Confirm ownership</h2>
              <p className="mt-2 text-sm text-kyb-muted">
                {ownershipReview.first_name} {ownershipReview.last_name}
              </p>
            </div>
            {formError && <Notice error>{formError}</Notice>}
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-primary2"
                disabled={savingPerson}
                checked={!!ownershipReview.has_ownership}
                onChange={(event) =>
                  setOwnershipReview({
                    ...ownershipReview,
                    has_ownership: event.target.checked,
                    ownership_percentage: event.target.checked
                      ? ownershipReview.ownership_percentage
                      : null,
                  })
                }
              />
              <span>This person owns part of the business</span>
            </label>
            {ownershipReview.has_ownership && (
              <label className="block text-sm font-semibold">
                Ownership percentage *
                <input
                  aria-label="Ownership percentage"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-kyb-border bg-kyb-field px-3"
                  disabled={savingPerson}
                  value={ownershipReview.ownership_percentage ?? ""}
                  onChange={(event) =>
                    setOwnershipReview({
                      ...ownershipReview,
                      ownership_percentage:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
              </label>
            )}
            <p className="text-sm leading-relaxed text-kyb-muted">
              Only uncheck ownership if they do not own the business. Their
              other roles stay unchanged. You’ll still need to complete their
              personal details before inviting them.
            </p>
            <div className="flex justify-between gap-3">
              <Action
                variant="tertiary"
                disabled={savingPerson}
                onClick={() => setOwnershipReview(undefined)}
              >
                Cancel
              </Action>
              <Action type="submit" disabled={savingPerson}>
                {savingPerson ? "Saving…" : "Save ownership"}
              </Action>
            </div>
          </form>
        </TeamDialog>
      )}
      {editing && (
        <TeamDialog
          title={
            editor.people.some((p) => p.person_key === editing.person_key)
              ? "Edit person"
              : "Add a person"
          }
          wide
          pending={savingPerson}
          close={() => setEditing(undefined)}
        >
          <PersonDetailsForm
            initial={editing}
            corrections={editor.personErrors?.(editing) ?? []}
            identificationTypes={guide?.identification_types}
            partial={
              !!(
                editing.associated_person_id ??
                editing.business_usd_kyb_associated_person_id
              ) &&
              (!!editing.verification_started_at ||
                !!editing.verified_at ||
                ["approved", "completed", "pending", "in_progress"].includes(
                  editing.verification_status ?? "",
                ) ||
                (editor.personErrors?.(editing).length ?? 0) > 0)
            }
            disabled={savingPerson || !editor.editable || editor.busy}
            saving={savingPerson}
            error={formError}
            save={savePerson}
            close={() => setEditing(undefined)}
          />
        </TeamDialog>
      )}
    </div>
  );
}
