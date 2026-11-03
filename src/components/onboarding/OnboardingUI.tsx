"use client";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { KybIcon } from "@/components/usd-kyb/KybGuide";
import { surface } from "@/components/usd-kyb/KybUI";
export function OnboardingPanel({ children }: { children: ReactNode }) {
  return (
    <section
      className={`${surface} rounded-[20px] bg-white p-5 md:p-8 space-y-7`}
    >
      {children}
    </section>
  );
}
export function Crumbs({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <Link href="/onboarding" className="font-semibold text-primary2">
        ← Setup guide
      </Link>
      <span className="text-kyb-muted">/ {title}</span>
    </nav>
  );
}
export function Welcome({
  name,
  children,
  note,
}: {
  name?: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[23px] font-semibold leading-7">
          Hi{name ? `, ${name}` : ""} 👋🏾
        </h1>
        <p className="mt-2 text-[15px] leading-[22px] text-kyb-muted">
          {children}
        </p>
      </div>
      {note && (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-kyb-border px-3 py-2 text-[13px] text-kyb-muted">
          <KybIcon name="check" />
          {note}
        </span>
      )}
    </header>
  );
}
export function DoneTask({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3.5 text-[15px] text-kyb-muted">
      <Image src="/images/kyb/done.svg" width={22} height={22} alt="" />
      <span className="flex-1">{children}</span>
      <span className="text-[13px] font-semibold text-[#1F9D55]">Done</span>
    </div>
  );
}
export function GuideSection({
  title,
  description,
  done,
  children,
  secondary = false,
}: {
  title: string;
  description: string;
  done: number;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-2">
        <div className="flex items-center gap-3 rounded-[14px] border border-kyb-border p-3.5 shadow-[0_4px_14px_rgba(61,41,117,0.08)]">
          <KybIcon name={secondary ? "company" : "setup"} circle />
          <div className="flex-1">
            <p className="text-[15px] font-semibold">{title}</p>
            <p className="mt-0.5 text-xs text-primary2">{done} of 3 done</p>
          </div>
          <span className="-rotate-90">
            <KybIcon name="chevron" />
          </span>
        </div>
        {secondary && (
          <div className="flex items-center gap-3 p-3.5 opacity-55">
            <KybIcon name="wallet" circle />
            <div>
              <p className="text-[15px] font-semibold">Set up your accounts</p>
              <p className="mt-0.5 text-xs text-kyb-muted">
                Unlocks after step 1
              </p>
            </div>
          </div>
        )}
      </aside>
      <section className="min-w-0 rounded-2xl border border-kyb-border">
        <header className="flex items-center gap-4 border-b border-kyb-border px-6 py-5">
          <div className="flex-1">
            <h2 className="flex flex-wrap items-center gap-2.5 text-xl font-bold">
              {title}
              <span className="rounded-full bg-kyb-selected px-2.5 py-1 text-xs font-semibold text-primary2">
                Start here
              </span>
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-kyb-muted">
              {description}
            </p>
          </div>
          <span className="relative flex size-[52px] shrink-0 items-center justify-center text-sm font-bold">
            <Image
              src="/images/kyb/progress-ring.svg"
              width={52}
              height={52}
              alt=""
              className="absolute inset-0"
            />
            {(done === 1 || done === 2) && (
              <Image
                src={`/images/kyb/progress-${done === 1 ? "one" : "two"}.svg`}
                width={26}
                height={done === 1 ? 39 : 52}
                alt=""
                className="absolute right-0 top-0"
              />
            )}
            {done}/3
          </span>
        </header>
        <div className="space-y-1 p-4">{children}</div>
      </section>
    </div>
  );
}
export function OpenTask({
  title,
  minutes,
  tag,
  image,
  children,
}: {
  title: string;
  minutes: string;
  tag: string;
  image: string;
  children: ReactNode;
}) {
  return (
    <section className="relative flex flex-col items-start gap-5 rounded-2xl border border-kyb-outline bg-kyb-selected/40 p-3 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1 py-2 pl-3">
        <h3 className="flex items-center gap-2 text-lg font-bold leading-[26px]">
          <span className="rotate-180">
            <KybIcon name="chevron" />
          </span>
          {title}
        </h3>
        <div className="mt-2 space-y-4 pl-[26px]">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1">
              <KybIcon name="clock" />
              {minutes}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1">
              <KybIcon name="shield" />
              {tag}
            </span>
          </div>
          {children}
        </div>
      </div>
      <Image
        src={`/images/kyb/${image}.png`}
        width={232}
        height={232}
        alt=""
        className="size-[232px] shrink-0 self-center rounded-xl object-cover"
      />
    </section>
  );
}
export function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-lg border border-kyb-border bg-white px-2.5 py-1 text-xs leading-[17px]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
