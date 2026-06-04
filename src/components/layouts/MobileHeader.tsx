"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { getMobilePageTitle } from "@/lib/mobilePageTitle";
import { useMobileNav } from "@/context/MobileNavContext";
import { useNotifications } from "@/lib/hooks/useNotifications";
import Notifications from "@/app/(dashboard)/_components/notification/Notifications";
import CenterModalWrapper from "./CenterModalWrapper";

const MobileHeader = () => {
  const pathName = usePathname();
  const { openDrawer } = useMobileNav();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data, refetch } = useNotifications(15);

  const notifications = data?.pages[0]?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const title = getMobilePageTitle(pathName);

  useEffect(() => {
    refetch();
  }, [pathName, refetch]);

  return (
    <>
      <header className="sticky top-0 z-40 md:hidden bg-[#F8F7FA]/95 backdrop-blur-sm px-4 pt-3 pb-3 -mx-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={openDrawer}
            className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-white border border-raiz-gray-100 shadow-sm"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7H20M4 12H20M4 17H14"
                stroke="#443852"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <h1 className="flex-1 text-center text-base font-bold text-raiz-gray-950 truncate">
            {title}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="relative size-10 flex items-center justify-center rounded-xl bg-white border border-raiz-gray-100 shadow-sm"
              aria-label="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 15 17" fill="none">
                <path
                  d="M13.551 13.3429H1.46031C0.957856 13.3429 0.497097 13.0898 0.228147 12.6653C-0.0408029 12.2408 -0.074161 11.7167 0.139748 11.2622L1.25099 9.02635V6.41316C1.25099 2.97769 3.86585 0.163931 7.20416 0.00673055C8.93503 -0.071661 10.5733 0.536708 11.8222 1.72801C13.0723 2.92015 13.7603 4.52759 13.7603 6.25429V9.02635L14.8653 11.2501C15.085 11.7167 15.0521 12.2412 14.7831 12.6657C14.5142 13.0902 14.0534 13.3429 13.551 13.3429ZM5.04131 14.1768C5.24062 15.3581 6.26805 16.2617 7.50564 16.2617C8.74322 16.2617 9.77024 15.3581 9.96997 14.1768H5.04131Z"
                  fill="#19151E"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary2 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Link
              href="/settings"
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-raiz-gray-100 shadow-sm"
              aria-label="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M15.075 6.91507C13.7175 6.91507 13.1625 5.95507 13.8375 4.77757C14.2275 4.09507 13.995 3.22507 13.3125 2.83507L12.015 2.09257C11.4225 1.74007 10.6575 1.95007 10.305 2.54257L10.2225 2.68507C9.5475 3.86257 8.4375 3.86257 7.755 2.68507L7.6725 2.54257C7.335 1.95007 6.57 1.74007 5.9775 2.09257L4.68 2.83507C3.9975 3.22507 3.765 4.10257 4.155 4.78507C4.8375 5.95507 4.2825 6.91507 2.925 6.91507C2.145 6.91507 1.5 7.55257 1.5 8.34007V9.66007C1.5 10.4401 2.1375 11.0851 2.925 11.0851C4.2825 11.0851 4.8375 12.0451 4.155 13.2226C3.765 13.9051 3.9975 14.7751 4.68 15.1651L5.9775 15.9076C6.57 16.2601 7.335 16.0501 7.6875 15.4576L7.77 15.3151C8.445 14.1376 9.555 14.1376 10.2375 15.3151L10.32 15.4576C10.6725 16.0501 11.4375 16.2601 12.03 15.9076L13.3275 15.1651C14.01 14.7751 14.2425 13.8976 13.8525 13.2226C13.17 12.0451 13.725 11.0851 15.0825 11.0851C15.8625 11.0851 16.5075 10.4476 16.5075 9.66007V8.34007C16.5 7.56007 15.8625 6.91507 15.075 6.91507ZM9 11.4376C7.6575 11.4376 6.5625 10.3426 6.5625 9.00007C6.5625 7.65757 7.6575 6.56257 9 6.56257C10.3425 6.56257 11.4375 7.65757 11.4375 9.00007C11.4375 10.3426 10.3425 11.4376 9 11.4376Z"
                  fill="#19151E"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showNotifications && (
          <CenterModalWrapper close={() => setShowNotifications(false)}>
            <Notifications close={() => setShowNotifications(false)} />
          </CenterModalWrapper>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileHeader;
