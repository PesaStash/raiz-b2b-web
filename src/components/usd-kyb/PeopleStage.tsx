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
import { registryPersonPrefill, personRemovalReason, ownershipDisplay, registryOwnership, record, display } from "@/lib/usd-kyb/model";
import { correctionPath } from "@/lib/usd-kyb/corrections";
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
      {pending ? "Sending…" : sent ? "Resend invite" : "Send invite"}
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
      else if (action === "resend") await editor.resendPerson(person);
      else await editor.invitePerson(person, action);
    } finally {
      setPending(null);
      setOpen(false);
    }
  };
  return (
    <div ref={menuRef} className="relative shrink-0 text-xs text-primary2">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Manage ${person.first_name} ${person.last_name}`}
        className="flex size-11 items-center justify-center rounded-xl bg-kyb-soft text-base font-semibold leading-none transition-colors hover:bg-kyb-selected"
        onClick={() => setOpen((value) => !value)}
      >
        •••
      </button>
      {(open || pending) && (
        <div className="absolute right-0 z-10 mt-2 flex w-36 flex-col gap-3 rounded-xl border border-kyb-border bg-white p-4 text-center text-xs font-semibold shadow-lg">
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
              {["sent", "expired", "revoked"].includes(person.invitation_status ?? "") && (
                <button
                  type="button"
                  disabled={!!pending || !editor.editable || editor.busy}
                  onClick={() => void invite("resend")}
                  className="inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pending === "send" && <ButtonSpinner />}
                  Resend invite
                </button>
              )}
              {person.invitation_status === "sent" && (
                <button
                  type="button"
                  aria-busy={pending === "revoke"}
                  className="inline-flex items-center justify-center gap-2 disabled:opacity-50"
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
  const snapshot = record(editor.bundle?.case.youverify_lookup_snapshot);
  const corporate = snapshot.corporate_entities;
  const registryMembers = Array.isArray(snapshot.directors) ? snapshot.directors.map(record)
    .filter(person => typeof person.person_key === "string" && person.title === "Member" &&
      !person.is_director && !person.has_control && !person.has_ownership && !person.is_signer &&
      !editor.people.some(saved => saved.person_key === person.person_key)) : [];
  // Registry-only members share the list, but are saved only after details review.
  const displayedPeople: KybPerson[] = [
    ...editor.people,
    ...registryMembers.map(person => registryPersonPrefill(
      { person_key: String(person.person_key) }, snapshot,
    )),
  ];
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
      const corrections = (editor.personErrors?.(editing) ?? []).filter(
        (error) =>
          !(
            correctionPath(error.field) === "has_ownership" &&
            editing.has_ownership === true
          ),
      );
      if (corrections.length) throw new Error(corrections[0].message);
      if (
        !editor.personDetailsSaved(editing) &&
        !(
          editing.associated_person_id ??
          editing.business_usd_kyb_associated_person_id
        )
      )
        throw new Error("Your details could not be saved. Please try again.");
      toast.success("Details saved.");
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
      {Array.isArray(corporate) && corporate.length > 0 && (
        <section className="rounded-xl bg-kyb-soft p-4 space-y-2">
          <h3 className="font-semibold">Corporate shareholders</h3>
          <p className="text-sm text-kyb-muted">These are registered companies. Complete the evidence for the people who ultimately own or control them.</p>
          {corporate.map((item, index) => {
            const holder = record(item);
            return <div key={index} className="text-sm">
              {display(holder.legal_name ?? holder.name ?? holder.company_name)} · Registry ownership: {registryOwnership(holder)}
              {holder.ownership_chain_resolved === false && <p className="text-kyb-muted">Ownership chain evidence required</p>}
            </div>;
          })}
        </section>
      )}
      <div className="space-y-2">
        <details className="text-xs text-kyb-muted">
          <summary className="w-fit cursor-pointer font-semibold text-primary2">
            Who needs to verify?
          </summary>
          <p className="mt-2 max-w-xl leading-relaxed">
            Directors, control persons, signers and owners holding 25% or more
            must verify before provider submission. Send everyone an invite before
            submitting your application; identity checks can finish during review.
            They don’t need a Raiz account.
          </p>
        </details>
      </div>
      {formError && !editing && !ownershipReview && (
        <Notice error>{formError}</Notice>
      )}
      {!displayedPeople.length ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E3E1EC] bg-[#FAFAFC] px-5 py-8 text-center">
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
              {`We couldn’t find anyone on the register for ${businessName(editor)}. Add an owner, director or signer to get started.`}
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
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-kyb-soft px-4 py-3 text-xs">
            <span className="font-semibold text-kyb-ink" role="status">
              {editor.people.length - needingInvitation.length} of {displayedPeople.length} people invited or verified
            </span>
            <span className={total > 100 ? "text-red-700" : "text-kyb-muted"}>
              {total}% ownership recorded
              {ownershipIssues.length > 0 ? ` · ${ownershipIssues.length} to confirm` : ""}
            </span>
          </div>
          {total > 100 && <Notice error>Combined ownership must not exceed 100%.</Notice>}
          <div className="divide-y divide-kyb-border rounded-xl border border-kyb-border">
            {displayedPeople.map((person, index) => {
              const id = person.associated_person_id ?? person.business_usd_kyb_associated_person_id;
              const approved = ["approved", "completed"].includes(person.verification_status ?? "");
              const active = !!person.verification_started_at || !!person.verified_at;
              const sent = ["sent", "expired", "revoked"].includes(person.invitation_status ?? "");
              const needsInvite = needingInvitation.some((p) => p.person_key === person.person_key);
              const detailsSaved = editor.personDetailsSaved(person);
              const needsDetails = !approved && !sent && !active && !detailsSaved;
              const corrections = editor.personErrors?.(person) ?? [];
              const needsOwnership = ownershipNeedsReview(person);
              const needsCorrection = corrections.length > 0;
              const canEdit = editor.canEditPerson(person);
              const editPerson = () => {
                setFormError("");
                if (!canEdit) {
                  setFormError("Editing is unavailable. Refresh this case to continue.");
                  return;
                }
                setEditing({ ...editor.personInput(person) });
              };
              const status = needsOwnership ? "Ownership needed"
                : needsCorrection ? `${corrections.length} ${corrections.length === 1 ? "detail needs" : "details need"} attention`
                : approved ? "Verified"
                : sent && needsInvite ? (person.invitation_status === "revoked" ? "Invite revoked" : "Invite expired")
                : sent ? "Invite sent"
                : active ? "Verifying identity"
                : needsDetails ? "Details needed" : "Ready to invite";
              return (
                <section
                  key={person.person_key}
                  data-kyb-requirement={`associated_persons[${index}]`}
                  className="relative flex gap-3 p-4"
                >
                  <div aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kyb-selected text-xs font-semibold text-primary2">
                    {person.first_name?.[0]}{person.last_name?.[0]}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold">
                        {person.first_name} {person.last_name}
                      </h3>
                      <p className="mt-1 text-xs text-kyb-muted">
                        {[
                          !id && person.title,
                          person.is_director && "Director",
                          person.has_control && "Control person",
                          person.is_signer && "Signer",
                          person.has_ownership && `Owns ${ownershipDisplay(person)}`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-2">
                        <Badge good={approved && !needsOwnership && !needsCorrection}
                          tone={needsOwnership || needsCorrection || needsDetails ? "error" : sent && needsInvite ? "warning" : undefined}>
                          {status}
                        </Badge>
                      </div>
                      {needsOwnership && !canEdit && (
                        <p className="mt-2 text-xs text-red-700">Contact support to correct ownership; verification has started.</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {needsOwnership && canEdit ? (
                        <Action variant="secondary" disabled={!editor.editable || editor.busy}
                          onClick={() => {
                            setFormError("");
                            setOwnershipReview({ ...editor.personInput(person) });
                          }}>
                          Confirm ownership
                        </Action>
                      ) : needsCorrection || needsDetails ? (
                        <Action disabled={!editor.editable || editor.busy} onClick={editPerson}>
                          {needsCorrection ? "Correct details" : "Complete details"}
                        </Action>
                      ) : !needsOwnership && !approved && needsInvite && id && (sent || detailsSaved) ? (
                        <SendInviteButton person={person} editor={editor} />
                      ) : null}
                      <PersonActions person={person} id={id} approved={approved} editor={editor}
                        setFormError={setFormError} setEditing={setEditing} />
                    </div>
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
            noValidate
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (ownershipNeedsReview(ownershipReview)) {
                setFormError(
                  "Enter a whole-number ownership percentage greater than 0 and up to 100. Do not round fractional registry holdings.",
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
            {registryOwnership(ownershipReview) !== "Unavailable" && <Notice>Registry ownership: {registryOwnership(ownershipReview)}. The editable field accepts whole numbers only. Do not round a fractional holding or remove ownership to continue; contact support for guidance.</Notice>}
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
                  min="1"
                  max="100"
                  step="1"
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
            partial={!!(editing.associated_person_id ?? editing.business_usd_kyb_associated_person_id)}
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
