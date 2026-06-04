"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SidebarMenus } from "@/constants/SidebarMenuData";
import { useMobileNav } from "@/context/MobileNavContext";
import { useUser } from "@/lib/hooks/useUser";
import FeedbacksModal from "../modals/FeedbacksModal";
import LogoutModal from "../modals/LogoutModal";
import { useState } from "react";

const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 36 36" fill="none" aria-hidden>
    <rect width="36" height="36" rx="18" fill="#FDDCDA" />
    <path
      opacity="0.35"
      d="M25.1998 11.7001V24.3001C25.1998 25.7914 23.9911 27.0001 22.4998 27.0001H13.4998C12.0085 27.0001 10.7998 25.7914 10.7998 24.3001V11.7001C10.7998 10.2088 12.0085 9.00006 13.4998 9.00006H22.4998C23.9911 9.00006 25.1998 10.2088 25.1998 11.7001Z"
      fill="#B3261E"
    />
    <path
      d="M23.3998 16.2001H17.0998C16.1053 16.2001 15.2998 17.0056 15.2998 18.0001C15.2998 18.9946 16.1053 19.8001 17.0998 19.8001H23.3998V16.2001Z"
      fill="#951F38"
    />
    <path
      d="M22.1211 21.7179C22.1211 22.4118 22.9581 22.761 23.4513 22.2723L26.955 18.8019C27.4005 18.36 27.4005 17.64 26.955 17.1981L23.4513 13.7277C22.9581 13.2399 22.1211 13.5891 22.1211 14.2821V21.7179Z"
      fill="#951F38"
    />
  </svg>
);

const MobileDrawer = () => {
  const { isDrawerOpen, closeDrawer } = useMobileNav();
  const pathName = usePathname();
  const { user } = useUser();
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (link: string) =>
    link === "/" ? pathName === "/" : pathName.startsWith(link);

  return (
    <>
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/40 md:hidden"
              onClick={closeDrawer}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-[90] w-[min(300px,85vw)] bg-white shadow-xl flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-raiz-gray-100">
                <Image
                  src="/icons/Logo-2.svg"
                  width={40}
                  height={40}
                  alt="Raiz"
                />
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="size-10 flex items-center justify-center rounded-full bg-raiz-gray-50"
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6L18 18M18 6L6 18"
                      stroke="#443852"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-5 py-4 border-b border-raiz-gray-100">
                <p className="text-sm font-bold text-raiz-gray-900 truncate">
                  {user?.business_account?.business_name}
                </p>
                <p className="text-xs text-raiz-gray-500 truncate mt-0.5">
                  {user?.email}
                </p>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
                {SidebarMenus.map((item, index) => (
                  <Link
                    key={index}
                    href={item.link}
                    onClick={closeDrawer}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                      isActive(item.link)
                        ? "bg-[#eaecff]/50 text-primary2 font-bold"
                        : "text-raiz-gray-600 font-medium hover:bg-raiz-gray-50"
                    }`}
                  >
                    {item.icon(isActive(item.link))}
                    {item.name}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    setShowFeedbacks(true);
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-raiz-gray-600 font-medium hover:bg-raiz-gray-50 text-left w-full"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17 18.43H13L8.55 21.39C7.89 21.83 7 21.36 7 20.56V18.43C4 18.43 2 16.43 2 13.43V7.43C2 4.43 4 2.43 7 2.43H17C20 2.43 22 4.43 22 7.43V13.43C22 16.43 20 18.43 17 18.43Z"
                      stroke="#A89AB9"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Feedback & Requests
                </button>
              </nav>

              <div className="shrink-0 px-3 py-4 border-t border-raiz-gray-100 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    setShowLogoutModal(true);
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-[#B3261E] font-semibold hover:bg-red-50/80 w-full text-left"
                >
                  <LogoutIcon />
                  Log out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {showFeedbacks && (
        <FeedbacksModal close={() => setShowFeedbacks(false)} />
      )}
      {showLogoutModal && (
        <LogoutModal close={() => setShowLogoutModal(false)} />
      )}
    </>
  );
};

export default MobileDrawer;
