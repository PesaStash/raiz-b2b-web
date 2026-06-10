"use client";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";
import { useSyncSelectedCurrency } from "@/lib/hooks/useSyncSelectedCurrency";
import MobileBottomNav from "./MobileBottomNav";
import MobileHeader from "./MobileHeader";
import MobileDrawer from "./MobileDrawer";
import { MobileNavProvider } from "@/context/MobileNavContext";

const dashboardRoutes = [
  "/",
  "/settings",
  "/transactions",
  "/analytics",
  "/invoice",
  "/customers",
  "/bill-requests",
  "/developers",
];

const isDashboardRoute = (pathName: string) =>
  dashboardRoutes.some(
    (route) => pathName === route || pathName.startsWith(route + "/"),
  );

const MainLayout = ({ children }: { children: ReactNode }) => {
  const pathName = usePathname();
  const shouldShowSideNav = isDashboardRoute(pathName);

  useAutoLogout();
  useSyncSelectedCurrency({ enabled: shouldShowSideNav });

  return (
    <MobileNavProvider>
      <section className="w-full flex min-h-screen bg-[#F8F7FA]">
        {shouldShowSideNav && <Sidebar />}
        <main
          className={`flex-1 min-w-0 ${
            shouldShowSideNav
              ? "md:ml-16 lg:ml-[19.444%] min-h-screen px-4 md:px-4 xl:px-8 pt-0 md:pt-[30px] pb-[88px] md:pb-8"
              : "w-full p-0"
          }`}
        >
          {shouldShowSideNav && (
            <>
              <MobileHeader />
              <div className="hidden md:block">
                <Header />
              </div>
            </>
          )}
          {children}
        </main>
        {shouldShowSideNav && (
          <>
            <MobileBottomNav />
            <MobileDrawer />
          </>
        )}
      </section>
    </MobileNavProvider>
  );
};

export default MainLayout;
