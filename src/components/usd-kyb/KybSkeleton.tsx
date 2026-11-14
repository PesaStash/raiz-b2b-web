"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { surface } from "./KybUI";

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

export default function KybSkeleton({
  label = "Loading your USD verification…",
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
      className={`${surface} relative my-8 rounded-[20px] bg-white p-4 md:p-8`}
    >
      <span className="sr-only">{label}</span>
      <SkeletonTheme
        baseColor="#F3F3FF"
        highlightColor="#FAF9FE"
        enableAnimation={!reducedMotion}
        borderRadius={12}
      >
        <div aria-hidden="true" className="space-y-7">
          {/* Save-status pill */}
          <div className="absolute right-4 top-4 md:right-8 md:top-8">
            <Skeleton height={32} width={88} borderRadius={999} />
          </div>

          {/* Greeting */}
          <div className="pr-24">
            <Skeleton height={28} width={220} borderRadius={8} />
            <div className="mt-2">
              <Skeleton height={16} width="60%" borderRadius={6} />
            </div>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(210px,300px)_minmax(0,1fr)]">
            {/* Left: setup groups */}
            <nav className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 ${
                    i === 0
                      ? "border-kyb-border shadow-[0_4px_8px_rgba(20,20,30,0.05)]"
                      : "border-transparent"
                  }`}
                >
                  <Skeleton circle width={40} height={40} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton height={15} width="70%" />
                    <Skeleton height={12} width="40%" />
                  </div>
                  <Skeleton width={18} height={18} borderRadius={4} />
                </div>
              ))}
            </nav>

            {/* Right: task panel */}
            <div className="overflow-hidden rounded-2xl border border-kyb-border">
              <header className="flex items-center justify-between gap-3 border-b border-kyb-border p-6">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton height={24} width={180} borderRadius={8} />
                    <Skeleton height={24} width={72} borderRadius={999} />
                  </div>
                  <Skeleton height={14} width="80%" />
                </div>
                <Skeleton circle width={52} height={52} />
              </header>

              <div className="space-y-1 p-4">
                {/* Expanded first task */}
                <div className="relative rounded-2xl border border-kyb-outline bg-[#FAF9FE] p-4">
                  <div className="flex w-full items-center gap-3 py-3">
                    <Skeleton width={18} height={18} borderRadius={4} />
                    <Skeleton height={15} width="45%" className="flex-1" />
                  </div>
                  <div className="space-y-4 pb-2 pl-[30px]">
                    <div className="flex flex-wrap gap-2">
                      <Skeleton height={26} width={110} borderRadius={999} />
                      <Skeleton height={26} width={130} borderRadius={999} />
                    </div>
                    <Skeleton height={14} count={2} />
                    <Skeleton height={44} width={140} borderRadius={12} />
                  </div>
                </div>

                {/* Collapsed tasks */}
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex w-full items-center gap-3 px-4 py-3"
                  >
                    <Skeleton width={18} height={18} borderRadius={4} />
                    <Skeleton height={15} width="50%" className="flex-1" />
                    <Skeleton height={12} width={36} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SkeletonTheme>
    </motion.section>
  );
}
