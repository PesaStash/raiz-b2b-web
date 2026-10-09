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
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import PaystackCheckoutResume from "@/app/(dashboard)/_components/topUp/NgnTopup/PaystackCheckoutResume";

const dashboardRoutes = [
  "/",
  "/settings",
  "/transactions",
  "/analytics",
  "/invoice",
  "/customers",
  "/bill-requests",
  "/gateway",
  "/developers",
  "/team",
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
      <SidebarProvider>
        <MainLayoutContent shouldShowSideNav={shouldShowSideNav}>
          {children}
        </MainLayoutContent>
      </SidebarProvider>
    </MobileNavProvider>
  );
};

const MainLayoutContent = ({
  children,
  shouldShowSideNav,
}: {
  children: ReactNode;
  shouldShowSideNav: boolean;
}) => {
  const { effectiveCollapsed } = useSidebar();
  const pathname = usePathname();
  const isTeam = pathname.startsWith("/team");
  const mainMarginClass = effectiveCollapsed
    ? "md:ml-[88px]"
    : "md:ml-[88px] lg:ml-[256px]";

  return (
    <section className="w-full flex min-h-screen bg-[#F8F7FA]">
      {shouldShowSideNav && <Sidebar />}
      <main
        className={`flex-1 min-w-0 transition-[margin] duration-200 ease-in-out ${
          shouldShowSideNav
            ? `${mainMarginClass} min-h-screen px-4 md:px-4 xl:px-8 pt-0 md:pt-[30px] pb-[88px] md:pb-8`
            : "w-full p-0"
        }`}
      >
        {shouldShowSideNav && (
          <>
            {!isTeam && <MobileHeader />}
            <div className="hidden md:block">
              <Header />
            </div>
          </>
        )}
        {children}
      </main>
      {shouldShowSideNav && (
        <>
          {!isTeam && <MobileBottomNav />}
          <MobileDrawer />
          <PaystackCheckoutResume />
        </>
      )}
    </section>
  );
};

export default MainLayout;
