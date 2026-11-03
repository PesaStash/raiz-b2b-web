"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { useMobileNav } from "@/context/MobileNavContext";
import { useNotifications } from "@/lib/hooks/useNotifications";
import Notifications from "@/app/(dashboard)/_components/notification/Notifications";
import CenterModalWrapper from "./CenterModalWrapper";

const MobileHeader = () => {
  const pathName = usePathname();
  const { openDrawer, isDrawerOpen  } = useMobileNav();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data, refetch } = useNotifications(15);

  const notifications = data?.pages[0]?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    refetch();
  }, [pathName, refetch]);

  return (
    <>
      <header className="sticky top-0 z-40 -mx-4 mb-4 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2" title="Raiz">
            <Image
              src="/icons/Logo-2.svg"
              width={30}
              height={30}
              alt="Raiz"
              className="size-[30px] shrink-0 rounded-full"
            />
            <Image
              src="/icons/sidebar/raiz-wordmark.svg"
              alt=""
              width={39}
              height={16}
              className="w-[39px] h-[16px]"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="relative flex size-10 items-center justify-center"
              aria-label="Notifications"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M11.01 4.4C8.49 4.4 6.44 6.45 6.44 8.97V11.15C6.44 11.61 6.24 12.32 6.01 12.71L5.15 14.15C4.62 15.04 4.99 16.02 5.97 16.35C9.22 17.44 12.74 17.44 15.99 16.35C16.9 16.05 17.3 14.98 16.8 14.15L15.94 12.71C15.71 12.32 15.51 11.61 15.51 11.15V8.97C15.51 6.46 13.45 4.4 11.01 4.4Z"
                  stroke="#19151E"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                />
                <path
                  d="M12.4 4.62C12.17 4.55 11.93 4.5 11.68 4.47C10.96 4.38 10.27 4.43 9.62 4.62C9.84 4.06 10.38 3.67 11.01 3.67C11.64 3.67 12.18 4.06 12.4 4.62Z"
                  stroke="#19151E"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.27 16.62C13.27 17.86 12.26 18.87 11.02 18.87C10.4 18.87 9.83 18.61 9.42 18.2C9.01 17.79 8.75 17.22 8.75 16.62"
                  stroke="#19151E"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary2 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openDrawer}
              className={`flex size-11 items-center justify-center rounded-2xl ${isDrawerOpen ? "bg-[#F1EFFF]" : ""} `}
              aria-label="Open menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M3.5 6H16.5"
                  stroke="#19151E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M3.5 10H16.5"
                  stroke="#19151E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M3.5 14H16.5"
                  stroke="#19151E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
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
