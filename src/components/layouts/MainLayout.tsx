"use client";
import { usePathname } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAutoLogout } from "@/lib/hooks/useAutoLogout";
import MobileScreen from "./MobileScreen";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const [screenSize, setScreenSize] = useState<number | null>(null);
  const pathName = usePathname();
  useAutoLogout();

  const dashboardRoutes = [
    "/",
    "/settings",
    "/transactions",
    "/analytics",
    "/invoice",
    "/customers",
  ];

  const shouldShowSideNav = dashboardRoutes.some(
    (route) => pathName === route || pathName.startsWith(route + "/"),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setScreenSize(window.innerWidth);

      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  if (screenSize === null) {
    return null;
  }

  return (
    <>
      {screenSize < 1024 && !!shouldShowSideNav ? (
        <MobileScreen />
      ) : (
        <section className="w-full flex h-full">
          {shouldShowSideNav && <Sidebar />}
          <main
            className={`${
              shouldShowSideNav
                ? "w-[80.555%] left-[19.444%] bg-gray-50 relative min-h-[100vh] px-4 xl:px-8 pt-[30px] "
                : "w-full p-0"
            } `}
          >
            {shouldShowSideNav && <Header />}
            {children}
          </main>
        </section>
      )}
    </>
  );
};

export default MainLayout;
