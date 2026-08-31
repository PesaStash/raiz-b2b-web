"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenus } from "@/constants/SidebarMenuData";

const tabs = [
  { name: "Home", link: "/", menuName: "Dashboard" },
  { name: "Transactions", link: "/transactions", menuName: "Transactions" },
  { name: "Analytics", link: "/analytics", menuName: "Analytics" },
  { name: "Invoices", link: "/invoice", menuName: "Invoices" },
  { name: "Settings", link: "/settings", menuName: "Settings" },
] as const;

const MobileBottomNav = () => {
  const pathName = usePathname();

  const isActive = (link: string) =>
    link === "/" ? pathName === "/" : pathName.startsWith(link);

  const getMenuIcon = (menuName: string, active: boolean) => {
    const item = SidebarMenus.find((m) => m.name === menuName);
    return item ? item.icon(active) : null;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-raiz-gray-100 shadow-[0_-4px_24px_rgba(16,24,40,0.06)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around px-1 h-[64px]">
        {tabs.map((tab) => {
          const active = isActive(tab.link);
          return (
            <Link
              key={tab.link}
              href={tab.link}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-0 px-1"
            >
              <span
                className={`flex items-center justify-center transition-colors ${
                  active ? "text-primary2" : "text-raiz-gray-400"
                }`}
              >
                {getMenuIcon(tab.menuName, active)}
              </span>
              <span
                className={`text-[10px] leading-tight truncate max-w-full ${
                  active
                    ? "font-bold text-primary2"
                    : "font-medium text-raiz-gray-500"
                }`}
              >
                {tab.name}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-primary2 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
