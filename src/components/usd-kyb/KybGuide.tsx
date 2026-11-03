"use client";
import Image from "next/image";
import { useState } from "react";
import type { KybEditor } from "@/lib/hooks/useUsdKyb";
import { getPath } from "@/lib/usd-kyb/model";
import { Action } from "./KybUI";
import { IdentityStage } from "./BusinessStages";

const dimensions: Record<string, number> = {
  setup: 22,
  business: 22,
  documents: 22,
  check: 16,
  shield: 14,
  clock: 14,
  chevron: 18,
  lock: 16,
  upload: 20,
  "drop-upload": 24,
  review: 28,
  team: 24,
  pin: 24,
  support: 24,
};
export function KybIcon({
  name,
  circle = false,
}: {
  name: string;
  circle?: boolean;
}) {
  const size = dimensions[name] ?? 22;
  const icon = (
    <Image
      src={`/images/kyb/${name}.svg`}
      alt=""
      width={size}
      height={size}
      className="shrink-0"
    />
  );
  return circle ? (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3F3FF]">
      {icon}
    </span>
  ) : (
    icon
  );
}
export const taskGroups = [
  {
    title: "Verify your business",
    icon: "setup",
    description:
      "Your shared business details and account choice are complete.",
  },
  {
    title: "About the business",
    icon: "business",
    description: "We fill in most of this from the CAC register.",
  },
  {
    title: "Documents and submit",
    icon: "documents",
    description:
      "Upload your company documents, then check everything and submit.",
  },
];
export function businessName(editor: KybEditor) {
  return String(
    getPath(editor.draft, "business_profile.business_legal_name") ||
      editor.access.user?.business_account?.business_name ||
      "your business",
  );
}
export function Greeting({
  editor,
  children,
}: {
  editor: KybEditor;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="pr-24 text-[23px] font-semibold leading-[1.2]">
        Hi
        {editor.access.user?.first_name
          ? `, ${editor.access.user.first_name}`
          : ""}{" "}
        👋🏽
      </h1>
      <p className="mt-2 text-[15px] leading-[22px] text-kyb-muted">
        {children ??
          `Let’s get ${businessName(editor)} verified. Your setup guide saves as you go.`}
      </p>
    </div>
  );
}
export function groupTasks(editor: KybEditor, group: number) {
  const complete = (key: string) =>
    !!editor.bundle?.completion.sections[
      key as keyof NonNullable<typeof editor.bundle>["completion"]["sections"]
    ]?.complete;
  return group === 1
    ? [
        {
          title: "Find your business",
          step: 0,
          // Manual entry and registry lookup both lead to this same task.
          // Its completion must follow business details, not the separate identity flag.
          done: complete("business_details"),
        },
        {
          title: "Owners and directors",
          step: 2,
          done: complete("owners_directors"),
        },
        { title: "How you’ll use Raiz", step: 3, done: complete("activity") },
      ]
    : group === 2
      ? [
          {
            title: "Upload company documents",
            step: 4,
            done: complete("documents"),
          },
          { title: "Check and submit", step: 5, done: complete("review") },
        ]
      : [
          { title: "Create your Raiz account", step: -1, done: true },
          { title: "Basic business details", step: -1, done: true },
          { title: "Choose your accounts", step: -1, done: true },
        ];
}
const tips = [
  [
    "Why we look you up",
    "The CAC register confirms your business is real and active, and saves you typing most of the next steps.",
  ],
  [
    "Why we ask",
    "Your industry and description help us understand your business. Your TIN is only used for compliance checks.",
  ],
  [
    "Why we ask everyone",
    "We need to know who owns and controls the business. Each person gets a secure link to verify — no Raiz account needed.",
  ],
  [
    "Why we ask",
    "Knowing what’s normal for your business helps us understand your payments and reduces questions later.",
  ],
  [
    "Tips for a quick approval",
    "Clear scans with every page, no photos of screens. Names and the RC number must match the CAC register.",
  ],
  [
    "What happens next",
    "We review your details and contact you if we need anything. Once approved, available account details appear on your Dashboard.",
  ],
];
export function GroupProgress({
  editor,
  step,
  navigate,
}: {
  editor: KybEditor;
  step: number;
  navigate: (step: number) => void;
}) {
  const group = step < 4 ? 1 : 2;
  const tasks = groupTasks(editor, group);
  return (
    <aside className="rounded-2xl border border-kyb-border bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <KybIcon name={taskGroups[group].icon} circle />
        <div>
          <h2 className="text-[15px] font-semibold">
            {taskGroups[group].title}
          </h2>
          <p className="mt-1 text-xs text-primary2">
            {tasks.filter((t) => t.done).length} of {tasks.length} done
          </p>
        </div>
      </div>
      <nav aria-label="Verification steps" className="space-y-1">
        {tasks.map((task) => (
          <button
            key={task.title}
            type="button"
            onClick={() => navigate(task.step)}
            disabled={editor.busy}
            aria-current={
              step === task.step || (step === 1 && task.step === 0)
                ? "step"
                : undefined
            }
            className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-kyb-muted aria-[current=step]:bg-kyb-selected aria-[current=step]:font-semibold aria-[current=step]:text-kyb-ink hover:bg-kyb-soft"
          >
            {task.done ? (
              <KybIcon name="check" />
            ) : (
              <span
                className={`size-5 shrink-0 rounded-full border ${step === task.step || (step === 1 && task.step === 0) ? "border-[6px] border-primary2" : "border-[#C7CCDA]"}`}
              />
            )}
            {task.title}
          </button>
        ))}
      </nav>
      <div className="mt-4 rounded-xl bg-kyb-tip p-4">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-primary2">
          <KybIcon name="shield" />
          {tips[step][0]}
        </h3>
        <p className="mt-2 text-[13px] leading-[19px] text-[#444454]">
          {tips[step][1]}
        </p>
      </div>
    </aside>
  );
}
export default function SetupGuide({
  editor,
  navigate,
}: {
  editor: KybEditor;
  navigate: (step: number) => void;
}) {
  const [group, setGroup] = useState(
    groupTasks(editor, 1).every((t) => t.done) ? 2 : 1,
  );
  const [open, setOpen] = useState(() =>
    Math.max(
      0,
      groupTasks(editor, group).findIndex((t) => !t.done),
    ),
  );
  const tasks = groupTasks(editor, group);
  return (
    <div className="space-y-7">
      <Greeting editor={editor} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(210px,300px)_minmax(0,1fr)]">
        <nav aria-label="Setup sections" className="space-y-2">
          {taskGroups.map((g, index) => (
            <button
              type="button"
              key={g.title}
              onClick={() => {
                setGroup(index);
                setOpen(
                  Math.max(
                    0,
                    groupTasks(editor, index).findIndex((t) => !t.done),
                  ),
                );
              }}
              aria-current={group === index ? "step" : undefined}
              className="flex w-full items-center gap-3 rounded-2xl border border-transparent p-3.5 text-left aria-[current=step]:border-kyb-border aria-[current=step]:shadow-[0_4px_8px_rgba(20,20,30,0.05)]"
            >
              <KybIcon name={g.icon} circle />
              <span className="flex-1">
                <span className="block text-[15px] font-semibold">
                  {g.title}
                </span>
                <span className="mt-1 block text-xs text-kyb-muted">
                  {index === 0
                    ? "3 of 3 done"
                    : `${groupTasks(editor, index).filter((t) => t.done).length} of ${groupTasks(editor, index).length} done`}
                </span>
              </span>
              <span className="-rotate-90">
                <KybIcon name="chevron" />
              </span>
            </button>
          ))}
        </nav>
        <section className="overflow-hidden rounded-2xl border border-kyb-border">
          <header className="flex items-center justify-between gap-3 border-b border-kyb-border p-6">
            <div>
              <h2 className="flex flex-wrap items-center gap-3 text-xl font-bold">
                {taskGroups[group].title}
                <span className="rounded-full bg-kyb-selected px-2.5 py-1 text-xs font-semibold text-primary2">
                  {group === 2
                    ? "Last step"
                    : group === 1
                      ? "Up next"
                      : "Start here"}
                </span>
              </h2>
              <p className="mt-2 text-sm leading-[21px] text-kyb-muted">
                {taskGroups[group].description}
              </p>
            </div>
            <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full border-4 border-[#EBE6F7] text-sm font-bold">
              {tasks.filter((t) => t.done).length}/{tasks.length}
            </span>
          </header>
          <div className="p-4">
            {tasks.map((task, index) => (
              <div
                key={task.title}
                className={
                  open === index && !task.done
                    ? "relative rounded-2xl border border-kyb-outline bg-[#FAF9FE] p-4"
                    : ""
                }
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 py-3 text-left"
                  aria-expanded={open === index}
                  onClick={() => setOpen(index)}
                >
                  {task.done ? (
                    <KybIcon name="check" />
                  ) : (
                    <span className={open === index ? "rotate-180" : ""}>
                      <KybIcon name="chevron" />
                    </span>
                  )}
                  <span className="flex-1 text-[15px] font-semibold">
                    {task.title}
                  </span>
                  <span className="text-xs text-kyb-muted">
                    {task.done ? "Done" : ""}
                  </span>
                </button>
                {open === index && !task.done && (
                  <div
                    className={`pb-2 pl-[30px] ${(group === 0 && index === 1) || (group > 0 && index === 0) ? "xl:min-h-[218px] xl:pr-[252px]" : ""}`}
                  >
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs">
                          <KybIcon name="clock" />
                          {group === 2 ? "About 3 mins" : "About 2 mins"}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs">
                          <KybIcon name="shield" />
                          {group === 1
                            ? "Pre-filled from CAC"
                            : group === 2
                              ? "Private uploads"
                              : "Identity verification"}
                        </span>
                      </div>
                      {group === 1 && index === 0 ? (
                        <IdentityStage
                          editor={editor}
                          compact
                          onManual={() => navigate(1)}
                          onFound={() => navigate(1)}
                        />
                      ) : (
                        <>
                          <p className="text-sm leading-[21px] text-[#444454]">
                            {group === 0
                              ? "ID verification and personal role setup aren’t available in this flow yet. You can continue with your business details."
                              : group === 2
                                ? "Clear scans with every page. Names and the RC number must match the CAC register. Up to 10 MiB each."
                                : index === 1
                                  ? "Add everyone who owns or controls your business and send their secure verification links."
                                  : "Tell us how your business earns money and how you’ll use your account."}
                          </p>
                          <Action
                            disabled={editor.busy}
                            onClick={() =>
                              group === 0
                                ? (setGroup(1), setOpen(0))
                                : navigate(task.step)
                            }
                          >
                            {group === 0
                              ? "Continue to business"
                              : group === 2 && index === 0
                                ? "Upload documents"
                                : "Continue"}
                          </Action>
                        </>
                      )}
                    </div>
                    {((group === 0 && index === 1) ||
                      (group > 0 && index === 0)) && (
                      <Image
                        src={`/images/kyb/${group === 0 ? "verify" : group === 1 ? "business" : "documents"}.png`}
                        alt=""
                        width={232}
                        height={232}
                        className="absolute right-3 top-7 hidden size-[232px] rounded-xl object-cover xl:block"
                      />
                    )}
                  </div>
                )}
                {task.done && open === index && group > 0 && (
                  <button
                    className="mb-3 ml-7 text-sm font-semibold text-primary2"
                    onClick={() => navigate(task.step)}
                  >
                    View details →
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
