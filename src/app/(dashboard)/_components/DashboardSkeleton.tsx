"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

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

function TxRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton circle width={40} height={40} />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton height={14} width="45%" />
        <Skeleton height={12} width="28%" />
      </div>
      <Skeleton height={14} width={72} />
    </div>
  );
}

export default function DashboardSkeleton() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex min-w-0 flex-col gap-5 md:gap-0"
    >
      <span className="sr-only">Loading your business…</span>
      <SkeletonTheme
        baseColor="#F3F3FF"
        highlightColor="#FAF9FE"
        enableAnimation={!reducedMotion}
        borderRadius={12}
      >
        <div aria-hidden="true">
          <section className="min-w-0 md:inline-flex md:w-full md:flex-col md:items-center md:justify-start md:gap-8 md:rounded-[20px] md:bg-raiz-gray-50 md:p-6 md:xl:p-8">
            <div className="w-full">
              {/* Mobile: wallet + quick actions */}
              <div className="lg:hidden">
                <Skeleton height={160} borderRadius={20} className="mb-4" />
                <div className="mb-6 flex justify-between gap-2 px-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <Skeleton circle width={48} height={48} />
                      <Skeleton height={10} width={44} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: greeting + action pills */}
              <div className="mb-6 hidden flex-wrap items-center justify-between gap-4 lg:flex">
                <Skeleton height={28} width={180} borderRadius={8} />
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      height={40}
                      width={i === 0 ? 127 : 105}
                      borderRadius={24}
                    />
                  ))}
                </div>
              </div>

              {/* Info cards */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton height={88} borderRadius={16} />
                <Skeleton height={88} borderRadius={16} />
                <Skeleton
                  height={88}
                  borderRadius={16}
                  className="hidden lg:block"
                />
              </div>

              {/* Chart + exchange rate */}
              <div className="mt-6 flex min-w-0 flex-col gap-6 md:mt-8 lg:flex-row lg:justify-between lg:gap-8">
                <div className="hidden min-w-0 w-full lg:block lg:w-1/2">
                  <Skeleton height={280} borderRadius={20} />
                </div>
                <div className="min-w-0 w-full lg:w-1/2">
                  <Skeleton height={280} borderRadius={20} />
                </div>
              </div>
            </div>
          </section>

          {/* Recent activity */}
          <section className="mt-5 min-w-0 md:mt-10">
            <div className="mb-3 flex items-center justify-between px-0.5 md:hidden">
              <Skeleton height={12} width={110} />
              <Skeleton height={12} width={64} />
            </div>
            <div className="min-w-0 md:inline-flex md:w-full md:flex-col md:items-center md:justify-start md:gap-8 md:rounded-[20px] md:bg-raiz-gray-50 md:p-6 md:xl:p-8">
              <div className="hidden w-full items-center justify-between md:mb-2 md:flex">
                <Skeleton height={20} width={160} borderRadius={8} />
                <Skeleton height={14} width={72} />
              </div>
              <div className="w-full divide-y divide-raiz-gray-100">
                {Array.from({ length: 4 }).map((_, i) => (
                  <TxRow key={i} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </SkeletonTheme>
    </motion.div>
  );
}
