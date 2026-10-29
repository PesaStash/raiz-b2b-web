"use client";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  accountChoiceRoute,
  basicDetailsComplete,
  readAccountChoice,
  saveAccountChoice,
  type AccountChoice,
} from "@/lib/onboarding";
import { Action, Notice } from "@/components/usd-kyb/KybUI";
import { KybIcon } from "@/components/usd-kyb/KybGuide";
import { BasicBusinessForm } from "@/app/(dashboard)/_components/BusinessVerificationModal";
import {
  Crumbs,
  DoneTask,
  GuideSection,
  OnboardingPanel,
  OpenTask,
  Tags,
  Welcome,
} from "./OnboardingUI";
import OnboardingSkeleton from "./OnboardingSkeleton";

const subscribeChoice = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};

export function OnboardingAccess({
  children,
  requireBasic = false,
  ngn = false,
}: {
  children: ReactNode;
  requireBasic?: boolean;
  ngn?: boolean;
}) {
  const { user, isLoading, error, refetch } = useUser();
  const access = usePermissions();
  const router = useRouter();
  const needsBasic = !!user && requireBasic && !basicDetailsComplete(user);
  const wrongCountry =
    !!user && ngn && user.business_account.entity.country.country_code !== "NG";
  useEffect(() => {
    if (needsBasic) router.replace("/onboarding/business");
    else if (wrongCountry) router.replace("/onboarding/accounts");
  }, [needsBasic, wrongCountry, router]);
  if (error)
    return (
      <Notice error>
        Unable to load your account.{" "}
        <button className="underline" onClick={() => void refetch()}>
          Try again
        </button>
      </Notice>
    );
  if (isLoading || !access.ready || needsBasic || wrongCountry)
    return <OnboardingSkeleton label="Loading your setup…" />;
  if (!access.canWriteBusiness)
    return (
      <Notice>
        An owner or admin can complete business verification for this account.
      </Notice>
    );
  return children;
}
export function StartGuide() {
  const { user } = useUser();
  return <StartGuideView user={user} />;
}
export function StartGuideView({
  user,
}: {
  user?: import("@/types/user").IUser;
}) {
  const router = useRouter();
  const complete = basicDetailsComplete(user);
  const resume = useSyncExternalStore(
    subscribeChoice,
    () => readAccountChoice(user?.business_account?.entity_id),
    () => null,
  );
  return (
    <OnboardingPanel>
      <Welcome name={user?.first_name} note="Takes about 4 mins">
        Welcome to Raiz. Verify your business and pick your accounts to get
        started.
      </Welcome>
      <GuideSection
        title="Verify your business"
        description="Done once. We reuse these details for every account you open."
        done={complete ? 2 : 1}
        secondary
      >
        <DoneTask>Create your Raiz account</DoneTask>
        {complete ? (
          <DoneTask>Basic business details</DoneTask>
        ) : (
          <OpenTask
            title="Add your basic business details"
            minutes="About 3 mins"
            tag="Pre-fills later steps"
            image="basic"
          >
            <p className="text-sm leading-[21px] text-[#444454]">
              Your business name, registration number, email and address. We use
              them to open USD, NGN or both, so you never type them twice.
            </p>
            <div>
              <p className="mb-2 text-xs font-semibold text-kyb-muted">
                You’ll need
              </p>
              <Tags
                items={[
                  "Registration number",
                  "Business email",
                  "Business address",
                ]}
              />
            </div>
            <Action onClick={() => router.push("/onboarding/business")}>
              Add business details
            </Action>
          </OpenTask>
        )}
        <div className="flex flex-wrap items-center gap-3 px-3 py-3.5">
          <KybIcon name="chevron" />
          <button
            className="flex-1 text-left text-[15px] font-semibold disabled:text-kyb-muted"
            disabled={!complete}
            onClick={() => router.push("/onboarding/accounts")}
          >
            Choose your accounts
          </button>
          <span className="text-[13px] text-kyb-muted">About 1 min</span>
        </div>
        {complete && resume && (
          <div className="px-3 pb-3">
            <Action onClick={() => router.push(accountChoiceRoute(resume))}>
              Resume {resume === "BOTH" ? "USD and NGN" : resume} setup
            </Action>
          </div>
        )}
      </GuideSection>
    </OnboardingPanel>
  );
}
export function BasicBusinessPage() {
  const { user } = useUser();
  return (
    <OnboardingAccess>
      <BasicBusinessView user={user} />
    </OnboardingAccess>
  );
}
export function BasicBusinessView({
  user,
}: {
  user?: import("@/types/user").IUser;
}) {
  const router = useRouter();
  return (
    <OnboardingPanel>
      <Crumbs title="Basic business details" />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <BasicBusinessForm
          user={user}
          page
          close={() => router.push("/onboarding")}
          onVerificationSuccess={() => router.push("/onboarding/accounts")}
        />
        <aside className="space-y-5">
          <div className="rounded-2xl border border-kyb-border p-5">
            <div className="flex items-center gap-3">
              <KybIcon name="company" circle />
              <div>
                <h2 className="font-semibold">Verify your business</h2>
                <p className="mt-1 text-xs text-kyb-muted">1 of 3 done</p>
              </div>
            </div>
            <ol className="mt-5 space-y-5 text-sm">
              <li className="flex gap-3 text-kyb-muted">
                <KybIcon name="check" />
                Create your Raiz account
              </li>
              <li className="flex gap-3 font-semibold text-primary2">
                <span className="size-4 rounded-full border-4 border-primary2" />
                Basic business details
              </li>
              <li className="flex gap-3 text-kyb-muted">
                <span className="size-4 rounded-full border border-kyb-border" />
                Choose your accounts
              </li>
            </ol>
          </div>
          <div className="rounded-2xl bg-kyb-tip p-5">
            <KybIcon name="shield" />
            <h3 className="mt-3 font-semibold">Why we ask</h3>
            <p className="mt-2 text-[13px] leading-[19px] text-kyb-muted">
              Your registered details help us verify your business and meet
              compliance requirements. We reuse them for the accounts you
              choose.
            </p>
          </div>
        </aside>
      </div>
    </OnboardingPanel>
  );
}
const choices: {
  key: AccountChoice;
  title: string;
  description: string;
  needs: string[];
  flags: string[];
  time: string;
}[] = [
  {
    key: "USD",
    title: "USD account",
    description:
      "Get paid from the US, Europe and the UK, and receive USDT or USDC. All lands in one USD balance.",
    needs: [
      "Owner ID and selfie",
      "Business details and owners",
      "Company documents",
    ],
    flags: ["us", "eu", "gb"],
    time: "About 10 min",
  },
  {
    key: "NGN",
    title: "NGN account",
    description:
      "Collect and pay in naira across Nigeria with your own local account number.",
    needs: ["Owner ID and selfie", "CAC documents"],
    flags: ["ng"],
    time: "About 3 min",
  },
  {
    key: "BOTH",
    title: "Both",
    description:
      "Start with USD verification. Your saved business details also carry over to your NGN account setup.",
    needs: ["Everything for USD", "NGN verification and approval"],
    flags: ["us", "ng"],
    time: "USD setup · about 10 min",
  },
];
export function AccountChoices({
  nigerian,
  name,
  onContinue,
}: {
  nigerian: boolean;
  name?: string;
  onContinue: (choice: AccountChoice) => void;
}) {
  const [selected, setSelected] = useState<AccountChoice>(
    nigerian ? "BOTH" : "USD",
  );
  return (
    <OnboardingPanel>
      <Crumbs title="Choose your accounts" />
      <header>
        <p className="text-xs font-semibold text-primary2">
          VERIFY YOUR BUSINESS · TASK 3 OF 3
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-9">
          Which accounts do you need?
        </h1>
        <p className="mt-2 text-[15px] text-kyb-muted">
          Pick one or both. You can add the other later. Your business details
          carry over.
        </p>
      </header>
      <div
        role="radiogroup"
        aria-label="Accounts to set up"
        className="grid gap-5 md:grid-cols-3"
      >
        {choices.map((choice) => {
          const disabled = !nigerian && choice.key !== "USD";
          return (
            <button
              type="button"
              role="radio"
              aria-checked={selected === choice.key}
              disabled={disabled}
              key={choice.key}
              onClick={() => setSelected(choice.key)}
              className={`flex min-h-[430px] flex-col gap-5 rounded-2xl border p-6 text-left disabled:opacity-45 ${selected === choice.key ? "border-primary2 bg-kyb-selected" : "border-kyb-border bg-white"}`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex -space-x-2">
                  {choice.flags.map((flag) => (
                    <span
                      key={flag}
                      className="flex size-11 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white"
                    >
                      <Image
                        src={`/images/kyb/flag-${flag}.svg`}
                        width={flag === "gb" ? 42.364 : 36}
                        height={
                          flag === "gb" ? 42.364 : flag === "us" ? 36.045 : 36
                        }
                        className="max-w-none shrink-0"
                        alt={flag.toUpperCase()}
                      />
                    </span>
                  ))}
                </div>
                <span
                  aria-hidden="true"
                  className={`flex size-5 items-center justify-center rounded border text-sm ${selected === choice.key ? "border-primary2 bg-primary2 text-white" : "border-[#D0D5DD]"}`}
                >
                  {selected === choice.key ? "✓" : ""}
                </span>
              </div>
              <div>
                <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">
                  {choice.title}
                  {choice.key === "BOTH" && (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-primary2">
                      Recommended
                    </span>
                  )}
                </h2>
                <p className="mt-2 text-sm leading-[21px] text-kyb-muted">
                  {choice.description}
                </p>
              </div>
              <div className="w-full space-y-3 border-t border-kyb-border pt-5">
                <p className="text-xs font-semibold text-kyb-muted">
                  You’ll need
                </p>
                {choice.needs.map((item) => (
                  <p className="flex items-center gap-2 text-sm" key={item}>
                    <KybIcon name="check" />
                    {item}
                  </p>
                ))}
              </div>
              <span className="mt-auto rounded-full bg-kyb-soft px-3 py-1.5 text-xs text-kyb-muted">
                {disabled ? "Available to Nigerian businesses" : choice.time}
              </span>
            </button>
          );
        })}
      </div>
      <Notice>
        {name || "Your business"}’s basic details are saved. We’ll fill them in
        for you.
      </Notice>
      <footer className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[13px] text-kyb-muted">
          Not sure? Start with one. You can add the other later.
        </p>
        <Action onClick={() => onContinue(selected)}>
          Continue with {selected === "BOTH" ? "both" : selected}
        </Action>
      </footer>
    </OnboardingPanel>
  );
}
export function AccountsPage() {
  const { user } = useUser();
  const router = useRouter();
  return (
    <OnboardingAccess requireBasic>
      <AccountChoices
        nigerian={
          user?.business_account?.entity?.country?.country_code === "NG"
        }
        name={user?.business_account?.business_name}
        onContinue={(choice) => {
          if (!user) return;
          saveAccountChoice(user.business_account.entity_id, choice);
          router.push(accountChoiceRoute(choice));
        }}
      />
    </OnboardingAccess>
  );
}
export function OnboardingEntry() {
  return (
    <OnboardingAccess>
      <StartGuide />
    </OnboardingAccess>
  );
}

