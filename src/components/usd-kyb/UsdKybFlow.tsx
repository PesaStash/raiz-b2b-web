"use client";
import {
  personRequirementMessage,
  peopleNeedingInvitation,
} from "@/lib/usd-kyb/personDetails";
import { toast } from "sonner";
import { focusAttention } from "@/lib/usd-kyb/attention";
import { basicDetailsComplete } from "@/lib/onboarding";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { hasSession } from "@/utils/CookiesFunc";
import { useUsdKyb, type KybEditor } from "@/lib/hooks/useUsdKyb";
import { kybApi } from "@/services/usdKyb";
import {
  deferredRequirements,
  display,
  editableStatus,
  getPath,
  label,
  options,
  requirementStage,
  stages,
} from "@/lib/usd-kyb/model";
import Checkbox from "@/components/ui/Checkbox";
import { Action, Notice, surface } from "./KybUI";
import {
  ActivityStage,
  BusinessDetails,
  IdentityStage,
} from "./BusinessStages";
import PeopleStage from "./PeopleStage";
import DocumentsStage from "./DocumentsStage";
import KybTerms from "./KybTerms";
import { signedAgreementId } from "@/lib/usd-kyb/agreement";
import KybReview, { SubmittedCase } from "./KybReview";
import SetupGuide, { GroupProgress, KybIcon } from "./KybGuide";
import KybSkeleton from "./KybSkeleton";

export default function UsdKybFlow() {
  const user = useUser();
  const access = usePermissions();
  const router = useRouter();
  useEffect(() => {
    if (!hasSession()) router.replace("/login");
    else if (user.user && !basicDetailsComplete(user.user))
      router.replace("/onboarding/business");
  }, [router, user.user]);
  if (user.error)
    return (
      <Notice error>
        We couldn’t check your account.{" "}
        <button className="underline" onClick={() => void user.refetch()}>
          Try again
        </button>
      </Notice>
    );
  if (!access.ready) return <KybSkeleton label="Checking your account…" />;
  if (!basicDetailsComplete(user.user))
    return <KybSkeleton label="Loading business setup…" />;
  return <KybFlowContent key={access.user?.business_account?.entity_id} />;
}
function KybFlowContent() {
  const editor = useUsdKyb();
  return <KybWorkspace editor={editor} />;
}
export function KybWorkspace({
  editor,
  basePath = "/onboarding/usd",
}: {
  editor: KybEditor;
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("step");
  const attention = params.get("attention");
  const panel = useRef<HTMLElement>(null);
  const step = stages.findIndex((s) => s.key === requested);
  const [declaration, setDeclaration] = useState(false);
  const [termsBusy, setTermsBusy] = useState(false);
  const [issues, setIssueState] = useState<string[]>([]);
  const setIssues = (keys: string[]) => {
    setIssueState(keys);
    if (keys.length)
      toast.error("Complete these items before continuing", {
        id: "onboarding-error",
        description: keys
          .map(
            (key) =>
              personRequirementMessage(key, editor.people) ??
              label(key.replaceAll(".", " · ")),
          )
          .join(", "),
      });
  };
  const heading = useRef<HTMLHeadingElement>(null);
  const guide = useQuery({
    queryKey: [
      "usd-kyb-reference",
      editor.access.user?.business_account?.entity_id,
      "guide",
    ],
    queryFn: kybApi.guide,
    enabled: editor.access.ready,
    staleTime: Infinity,
    retry: false,
  });
  useEffect(() => {
    if (step < 0) return;
    const frame = requestAnimationFrame(() => {
      if (attention && panel.current) focusAttention(panel.current, attention);
      else heading.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [step, attention]);
  useEffect(() => {
    if (!editor.editable || !guide.data) return;
    const bridgeTypes = options(guide.data.business_types);
    if (!bridgeTypes.length) return;
    const current = String(
      getPath(editor.draft, "business_profile.business_type") ?? "",
    );
    if (!current || bridgeTypes.some((option) => option.value === current))
      return;
    editor.change("business_profile.business_type", "");
  }, [editor, guide.data]);
  const navigate = async (next: number, requirement?: string) => {
    if (termsBusy) return;
    try {
      if (editor.editable) await editor.flush();
      router.replace(
        next < 0
          ? basePath
          : `${basePath}?step=${stages[next]?.key ?? "review"}${requirement ? `&attention=${encodeURIComponent(requirement)}` : ""}`,
        { scroll: false },
      );
      setIssues([]);
      if (next === step && requirement && panel.current)
        focusAttention(panel.current, requirement);
    } catch {
      /* Dirty edits stay in memory; the editor shows the failure. */
    }
  };
  const next = async () => {
    const result = await editor.command(() => kybApi.validate());
    if (!result) return;
    const errors = result.validation.missing_requirements.filter(
      (k) => !deferredRequirements.has(k) && requirementStage(k) === step,
    );
    if (errors.length) {
      setIssues(errors);
      return;
    }
    await navigate(step + 1);
  };
  const submit = async () => {
    if (!declaration || termsBusy || !signedAgreementId(editor.bundle)) return;
    await editor.command(async (current) => {
      const validation = await kybApi.validate();
      const hard = validation.validation.missing_requirements.filter(
        (k) => !deferredRequirements.has(k),
      );
      if (hard.length) {
        setIssues(hard);
        editor.setMissing(validation.validation.missing_requirements);
        return validation;
      }
      const fresh = await kybApi.get();
      if (peopleNeedingInvitation(fresh.associated_persons).length) {
        setIssues(["associated_persons.invitations"]);
        return fresh;
      }
      if (!signedAgreementId(fresh)) {
        setIssues(["signed_agreement_id"]);
        return fresh;
      }
      return kybApi.submit(
        fresh.case.payload_version ?? current.case.payload_version,
        (message) => toast.success(message),
      );
    });
  };
  if (editor.query.isError)
    return (
      <section className={`${surface} mt-6 rounded-2xl bg-white p-6`}>
        <Notice error>
          We couldn’t load your verification case.{" "}
          <button
            className="underline"
            onClick={() => {
              void editor.query.refetch();
            }}
          >
            Try again
          </button>
        </Notice>
        <Link href="/" className="mt-5 block text-sm underline">
          Back to dashboard
        </Link>
      </section>
    );
  if (!editor.bundle)
    return <KybSkeleton label="Loading your USD verification…" />;
  const locked = !editableStatus(editor.bundle.case.status);
  const corrections = editor.bundle.requested_corrections?.length
    ? editor.bundle.requested_corrections
    : (editor.bundle.case.requested_changes ?? []);
  return (
    <section
      ref={panel}
      className={`${surface} relative my-8 rounded-[20px] bg-white p-4 md:p-8`}
    >
      {!locked && (
        <header
          className={`flex flex-wrap items-center justify-between gap-3 ${step < 0 || locked ? "absolute right-4 top-4 md:right-8 md:top-8" : "mb-7"}`}
        >
          <button
            type="button"
            onClick={() => void navigate(-1)}
            disabled={editor.busy}
            className={`${step < 0 || locked ? "hidden" : ""} text-sm font-semibold text-primary2`}
          >
            ← Setup guide{step >= 0 ? ` / ${stages[step].group}` : ""}
          </button>
          <span
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 rounded-full border border-kyb-border px-3 py-2 text-xs text-kyb-muted"
          >
            {editor.saveState === "Saved" && <KybIcon name="check" />}
            {editor.cooldown
              ? `Try again in ${editor.cooldown}s`
              : editor.busy
                ? "Updating…"
                : editor.saveState}
          </span>
        </header>
      )}
      <div className="space-y-4 [&:not(:empty)]:mb-5">
        {editor.error && (
          <Notice error>
            {editor.error}
            {!editor.conflict && (
              <button
                className="ml-3 underline"
                onClick={() => void editor.flush().catch(() => undefined)}
              >
                Retry save
              </button>
            )}
          </Notice>
        )}
        {editor.conflict && (
          <Notice error>
            <p className="font-semibold">The saved case has changed</p>
            <p className="mt-2">
              Your unsaved changes are still in this tab. Load the latest case,
              or explicitly reapply your changes to the latest version. A
              conflict may also mean a locked case or a person that needs admin
              resolution.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Action
                variant="tertiary"
                disabled={editor.busy}
                onClick={() => void editor.reload(false)}
              >
                Load saved case
              </Action>
              <Action
                disabled={editor.busy || locked}
                onClick={() => void editor.reload(true)}
              >
                Reapply my changes
              </Action>
            </div>
          </Notice>
        )}
        {!editor.access.canWriteBusiness && (
          <Notice>
            You have read-only access. A business owner or admin can update and
            submit this case.
          </Notice>
        )}
        {editor.bundle.case.status === "requires_correction" && (
          <Notice>
            <p className="font-semibold">Changes requested by operations</p>
            {corrections.map((change, index) => (
              <p key={index} className="mt-2 break-words">
                {display(change)}
              </p>
            ))}
            {editor.bundle.case.review_note && (
              <p className="mt-3">{editor.bundle.case.review_note}</p>
            )}
          </Notice>
        )}
        {guide.isError && (
          <Notice error>
            Some form choices couldn’t be loaded.{" "}
            <button className="underline" onClick={() => void guide.refetch()}>
              Try again
            </button>
          </Notice>
        )}
      </div>
      {locked ? (
        <SubmittedCase editor={editor} />
      ) : step < 0 ? (
        <SetupGuide editor={editor} navigate={(n) => void navigate(n)} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,30.3%)]">
          <section className="min-w-0 rounded-2xl border border-kyb-border p-5 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary2">
              {stages[step].group} · Task{" "}
              {step < 2 ? 1 : step < 4 ? step : step - 3} of {step < 4 ? 3 : 2}
            </p>
            <h1
              ref={heading}
              tabIndex={-1}
              className="mt-2 text-2xl leading-8 font-bold outline-none"
            >
              {stages[step].title}
            </h1>
            <p className="mb-7 mt-2 text-[15px] leading-[22px] text-kyb-muted">
              {stages[step].description}
            </p>
            {issues.length > 0 && (
              <div className="mb-5">
                <Notice error>
                  <p>Complete these items before continuing:</p>
                  <ul className="mt-2 space-y-1">
                    {issues.map((key) => (
                      <li key={key}>
                        <button
                          className="text-left underline"
                          onClick={() =>
                            void navigate(requirementStage(key), key)
                          }
                        >
                          {personRequirementMessage(key, editor.people) ??
                            label(key.replaceAll(".", " · "))}
                        </button>
                      </li>
                    ))}
                  </ul>
                </Notice>
              </div>
            )}
            <fieldset
              disabled={!editor.editable || editor.busy}
              className="min-w-0 disabled:opacity-80"
            >
              {step === 0 && (
                <IdentityStage
                  editor={editor}
                  onManual={() => void navigate(1)}
                />
              )}
              {step === 1 && (
                <BusinessDetails editor={editor} guide={guide.data} />
              )}
              {step === 2 && <PeopleStage editor={editor} guide={guide.data} />}
              {step === 3 && (
                <ActivityStage editor={editor} guide={guide.data} />
              )}
              {step === 4 && <DocumentsStage editor={editor} />}
            </fieldset>
            {step === 5 && (
              <>
                <KybReview
                  editor={editor}
                  navigate={(n, key) => void navigate(n, key)}
                />
                <KybTerms editor={editor} onBusyChange={setTermsBusy} />
                <div
                  className={`mt-6 rounded-xl border border-kyb-outline bg-kyb-selected p-4 ${!editor.editable || editor.busy || termsBusy ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  onClick={(event) => {
                    if (
                      !editor.editable ||
                      editor.busy ||
                      termsBusy ||
                      (event.target as HTMLElement).closest("input")
                    )
                      return;
                    setDeclaration(!declaration);
                  }}
                >
                  <Checkbox
                    id="kyb-declaration"
                    checked={declaration}
                    disabled={!editor.editable || editor.busy || termsBusy}
                    label="I confirm this information is true and that I’m authorised to open this account for this business."
                    className="pointer-events-none w-full !items-start"
                    labelClass="!ml-3 !min-w-0 !flex-1 !text-sm !leading-snug !text-kyb-ink"
                    bgStyle="border-primary2 bg-primary2"
                    checkMarkColor="#FFFFFF"
                    onChange={setDeclaration}
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-kyb-muted">
                  Submitting locks your details for operations review. Pending
                  identity verification can follow later. Account terms must be
                  accepted before submission.
                </p>
              </>
            )}
            <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-kyb-border pt-5">
              <p className="text-xs text-kyb-muted">
                Your progress saves as you go
              </p>
              <div className="flex w-full flex-wrap justify-end gap-3 sm:w-auto">
                <Action
                  variant="tertiary"
                  disabled={editor.busy || termsBusy}
                  onClick={() => void navigate(step - 1)}
                >
                  Back
                </Action>
                {step < 5 ? (
                  <Action
                    disabled={!editor.editable || guide.isError}
                    loading={editor.busy}
                    onClick={() => void next()}
                  >
                    Save and continue
                  </Action>
                ) : (
                  <Action
                    className="max-w-full !h-auto !min-h-11 !py-2"
                    disabled={
                      !editor.editable ||
                      !declaration ||
                      termsBusy ||
                      !signedAgreementId(editor.bundle)
                    }
                    loading={editor.busy}
                    onClick={() => void submit()}
                  >
                    Submit for review
                  </Action>
                )}
              </div>
            </footer>
          </section>
          <GroupProgress
            editor={editor}
            step={step}
            navigate={(n) => void navigate(n)}
          />
        </div>
      )}
    </section>
  );
}
