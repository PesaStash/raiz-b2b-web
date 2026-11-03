"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { surface } from "@/components/usd-kyb/KybUI";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function OnboardingSkeleton({
  label = "Loading your setup…",
}: {
  label?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.section
      role="status"
      aria-live="polite"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`${surface} space-y-7 rounded-[20px] bg-white p-5 md:p-8`}
    >
      <span className="sr-only">{label}</span>
      <SkeletonTheme
        baseColor="#F3F3FF"
        highlightColor="#FAF9FE"
        enableAnimation={!reducedMotion}
        borderRadius={12}
      >
        <div aria-hidden="true" className="space-y-7">
          {/* Welcome */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton height={28} width={200} borderRadius={8} />
              <Skeleton height={16} width="70%" borderRadius={6} />
            </div>
            <Skeleton height={36} width={140} borderRadius={999} />
          </header>

          <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Left: section nav */}
            <aside className="space-y-2">
              <div className="flex items-center gap-3 rounded-[14px] border border-kyb-border p-3.5 shadow-[0_4px_14px_rgba(61,41,117,0.08)]">
                <Skeleton circle width={40} height={40} />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton height={15} width="75%" />
                  <Skeleton height={12} width="40%" />
                </div>
                <Skeleton width={18} height={18} borderRadius={4} />
              </div>
              <div className="flex items-center gap-3 p-3.5 opacity-55">
                <Skeleton circle width={40} height={40} />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton height={15} width="70%" />
                  <Skeleton height={12} width="45%" />
                </div>
              </div>
            </aside>

            {/* Right: guide panel */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-kyb-border">
              <header className="flex items-center gap-4 border-b border-kyb-border px-6 py-5">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Skeleton height={24} width={180} borderRadius={8} />
                    <Skeleton height={24} width={80} borderRadius={999} />
                  </div>
                  <Skeleton height={14} width="85%" />
                </div>
                <Skeleton circle width={52} height={52} />
              </header>

              <div className="space-y-1 p-4">
                {/* Done task */}
                <div className="flex items-center gap-3 px-3 py-3.5">
                  <Skeleton circle width={22} height={22} />
                  <Skeleton height={15} width="45%" className="flex-1" />
                  <Skeleton height={13} width={40} />
                </div>

                {/* Open task */}
                <div className="relative flex flex-col items-start gap-5 rounded-2xl border border-kyb-outline bg-kyb-selected/40 p-3 xl:flex-row xl:items-center">
                  <div className="min-w-0 flex-1 space-y-4 py-2 pl-3">
                    <div className="flex items-center gap-2">
                      <Skeleton width={18} height={18} borderRadius={4} />
                      <Skeleton height={20} width="55%" />
                    </div>
                    <div className="space-y-4 pl-[26px]">
                      <div className="flex flex-wrap gap-2">
                        <Skeleton height={26} width={110} borderRadius={999} />
                        <Skeleton height={26} width={130} borderRadius={999} />
                      </div>
                      <Skeleton height={14} count={2} />
                      <div className="flex flex-wrap gap-1.5">
                        <Skeleton height={26} width={120} borderRadius={8} />
                        <Skeleton height={26} width={100} borderRadius={8} />
                        <Skeleton height={26} width={110} borderRadius={8} />
                      </div>
                      <Skeleton height={44} width={170} borderRadius={12} />
                    </div>
                  </div>
                  <Skeleton
                    width={232}
                    height={232}
                    borderRadius={12}
                    className="hidden shrink-0 self-center xl:block"
                  />
                </div>

                {/* Choose accounts row */}
                <div className="flex flex-wrap items-center gap-3 px-3 py-3.5">
                  <Skeleton width={18} height={18} borderRadius={4} />
                  <Skeleton height={15} width="40%" className="flex-1" />
                  <Skeleton height={13} width={80} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </SkeletonTheme>
    </motion.section>
  );
}
