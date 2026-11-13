"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useUser } from "@/lib/hooks/useUser";
import { useNgnOnboarding } from "@/lib/hooks/useNgnOnboarding";
import {
  canResumeNgnKybSession,
  getCombinedNgnKybUiState,
  getCombinedNgnKybActionLabel,
  getNgnKybRequirementLabel,
} from "@/utils/ngnKyb";
import { Action, Notice } from "@/components/usd-kyb/KybUI";
import Overlay from "@/components/ui/Overlay";
import DiditVerificationWebview from "@/app/(dashboard)/_components/createNgnAcct/DiditVerificationWebview";
import { OnboardingAccess } from "./OnboardingFlow";
import {
  DoneTask,
  GuideSection,
  OnboardingPanel,
  OpenTask,
  Tags,
  Welcome,
} from "./OnboardingUI";
export default function NgnSetup() {
  return (
    <OnboardingAccess requireBasic ngn>
      <NgnSetupContent />
    </OnboardingAccess>
  );
}
function NgnSetupContent() {
  const { user } = useUser();
  const ngn = useNgnOnboarding();
  return <NgnSetupView user={user} ngn={ngn} />;
}
export function NgnSetupView({
  user,
  ngn,
}: {
  user?: import("@/types/user").IUser;
  ngn: ReturnType<typeof useNgnOnboarding>;
}) {
  const router = useRouter();
  const [session, setSession] = useState<{
    mode: "browser" | "phone";
    url: string | null;
  } | null>(null);
  const state = getCombinedNgnKybUiState(ngn.requirements);
  const hasWallet = user?.business_account?.wallets?.some(
    (w) => w.wallet_type.currency === "NGN",
  );
  const start = async (mode: "browser" | "phone") => {
    if (
      ngn.isStartingSession ||
      !ngn.requirements ||
      !canResumeNgnKybSession(state)
    )
      return;
    setSession({ mode, url: null });
    try {
      const result = await ngn.startKybSession();
      setSession(result.url ? { mode, url: result.url } : null);
    } catch {
      setSession(null);
    }
  };
  const close = () => {
    setSession(null);
    void ngn.refetch();
  };
  return (
    <OnboardingPanel>
      <Welcome name={user?.first_name}>
        Let’s set up your naira account. One short part, about 3 minutes.
      </Welcome>
      <GuideSection
        title="Get set up"
        description="Verify your identity and CAC document to set up your naira account."
        done={ngn.canCreateAccount || hasWallet ? 3 : 2}
      >
        <DoneTask>Create your Raiz account</DoneTask>
        <DoneTask>Basic business details</DoneTask>
        {hasWallet ? (
          <>
            <DoneTask>NGN account created</DoneTask>
            <Action onClick={() => router.push("/")}>Go to dashboard</Action>
          </>
        ) : (
          <>
            <OpenTask
              title="Verify your ID and selfie"
              minutes="About 2 mins"
              tag="Secured by Didit"
              image="ngn"
            >
              <p className="text-sm leading-[21px] text-[#444454]">
                Take a photo of your ID, then a short selfie video. We read your
                name and date of birth from the ID, so there’s nothing to type.
                Have your CAC document ready too.
              </p>
              <div>
                <p className="mb-2 text-xs font-semibold text-kyb-muted">
                  Accepted IDs and documents
                </p>
                <Tags
                  items={[
                    "Passport",
                    "Driver’s licence",
                    "NIN slip",
                    "CAC document",
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {ngn.canCreateAccount ? (
                  <Action
                    loading={ngn.isCreatingAccount}
                    disabled={ngn.isCreatingAccount}
                    onClick={async () => {
                      try {
                        if (await ngn.createNgnAccount()) router.push("/");
                      } catch {
                        /* API client reports the error. */
                      }
                    }}
                  >
                    Create NGN account
                  </Action>
                ) : (
                  <>
                    <Action
                      loading={ngn.isStartingSession}
                      disabled={
                        !ngn.requirements ||
                        !!ngn.error ||
                        !canResumeNgnKybSession(state) ||
                        ngn.isStartingSession
                      }
                      onClick={() => void start("browser")}
                    >
                      {state === "start"
                        ? "Start verification"
                        : getCombinedNgnKybActionLabel(state)}
                    </Action>
                    <button
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary2 disabled:opacity-40"
                      disabled={
                        !ngn.requirements ||
                        !!ngn.error ||
                        !canResumeNgnKybSession(state) ||
                        ngn.isStartingSession
                      }
                      onClick={() => void start("phone")}
                    >
                      <Image
                        src="/images/kyb/mobile.svg"
                        width={18}
                        height={18}
                        alt=""
                      />
                      Use my phone
                    </button>
                  </>
                )}
              </div>
            </OpenTask>
            {ngn.isLoading && (
              <p role="status" className="p-3 text-sm text-kyb-muted">
                Loading verification status…
              </p>
            )}
            {ngn.error ? (
              <Notice error>
                Unable to load verification status.{" "}
                <button
                  className="underline"
                  onClick={() => void ngn.refetch()}
                >
                  Try again
                </button>
              </Notice>
            ) : (
              ngn.requirements &&
              state !== "start" && (
                <div className="space-y-2 p-3 text-sm">
                  <p>
                    CAC document: {getNgnKybRequirementLabel(ngn.cacStatus)}
                  </p>
                  <p>
                    Owner identity: {getNgnKybRequirementLabel(ngn.uboStatus)}
                  </p>
                  {ngn.isPolling && (
                    <p className="text-kyb-muted">
                      Your status updates automatically while verification is in
                      progress.
                    </p>
                  )}
                </div>
              )
            )}
          </>
        )}
      </GuideSection>
      <Link
        href="/onboarding/accounts"
        className="inline-block text-sm font-semibold text-primary2"
      >
        ← Change account choice
      </Link>
      {session &&
        !ngn.canCreateAccount &&
        (session.mode === "browser" ? (
          <DiditVerificationWebview
            url={session.url}
            isLoading={ngn.isStartingSession}
            close={close}
          />
        ) : (
          <Overlay close={close} width="440px">
            <div className="space-y-5 p-6">
              <h2 className="text-xl font-bold">Continue on your phone</h2>
              <p className="text-sm text-kyb-muted">
                Scan this code with your phone’s camera to open your secure
                verification session.
              </p>
              {session.url ? (
                <div className="mx-auto w-fit bg-white p-4">
                  <QRCode value={session.url} size={220} />
                </div>
              ) : (
                <p role="status">Starting verification…</p>
              )}
              <Action variant="secondary" onClick={close}>
                Back to setup
              </Action>
            </div>
          </Overlay>
        ))}
    </OnboardingPanel>
  );
}
