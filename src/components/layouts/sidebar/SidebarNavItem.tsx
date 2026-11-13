"use client";

import Image from "next/image";
import Link from "next/link";
import { ISidebarMenuItem } from "@/types/misc";

type SidebarNavItemProps = {
  item: ISidebarMenuItem;
  isActive: boolean;
  collapsed: boolean;
  badgeCount?: number;
  onFeedbackClick?: () => void;
};

export function SidebarNavItem({
  item,
  isActive,
  collapsed,
  badgeCount = 0,
  onFeedbackClick,
}: SidebarNavItemProps) {
  const isLocked = item.locked;
  const showBadge = item.badge === "bill-requests" && badgeCount > 0;
  const label = collapsed ? (item.collapsedLabel ?? item.name) : item.name;

  const sharedClasses = isLocked
    ? "cursor-not-allowed pointer-events-none opacity-60"
    : "";

  const expandedActive = isActive && !isLocked;
  const expandedClasses = expandedActive
    ? "bg-kyb-selected"
    : "bg-white hover:bg-kyb-selected/50";
  const expandedLabelClasses = expandedActive
    ? "font-semibold text-primary2"
    : "font-medium text-kyb-muted";

  if (item.action === "feedback") {
    if (collapsed) {
      return (
        <button
          type="button"
          onClick={onFeedbackClick}
          title={item.name}
          className={`relative flex h-[58px] w-[72px] flex-col items-center justify-center gap-1 rounded-xl outline-none ${
            isActive
              ? "bg-[#F0EEFF]"
              : "hover:bg-raiz-gray-50"
          } ${sharedClasses}`}
        >
          <span className="relative size-6 shrink-0">{item.icon(isActive)}</span>
          <span
            className={`max-w-[68px] truncate text-center text-[10px] leading-3 ${
              isActive ? "font-semibold text-primary" : "text-raiz-gray-600"
            }`}
          >
            {label}
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onFeedbackClick}
        title={item.name}
        className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-monzo outline-none ${expandedClasses} ${sharedClasses}`}
      >
        <span className="relative size-6 shrink-0">{item.icon(isActive)}</span>
        <span className={`min-w-0 flex-1 text-sm leading-6 ${expandedLabelClasses}`}>
          {label}
        </span>
      </button>
    );
  }

  if (collapsed) {
    return (
      <Link
        href={isLocked ? "#" : item.link}
        tabIndex={isLocked ? -1 : 0}
        title={item.name}
        className={`relative flex h-[58px] w-[72px] flex-col items-center justify-center gap-1 rounded-xl outline-none ${
          isActive && !isLocked
            ? "bg-[#F0EEFF]"
            : "hover:bg-raiz-gray-50"
        } ${sharedClasses}`}
      >
        {isActive && !isLocked && (
          <span className="absolute left-0 top-[14px] h-5 w-[3px] rounded-full bg-[#5A00A8]" />
        )}
        <span className="relative size-6 shrink-0">
          {item.icon(isActive && !isLocked)}
          {showBadge && (
            <span className="absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full bg-raiz-error text-[11px] font-bold leading-none text-white">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </span>
        <span
          className={`max-w-[68px] truncate text-center text-[10px] leading-3 ${
            isActive && !isLocked
              ? "font-semibold text-primary"
              : "text-raiz-gray-600"
          }`}
        >
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={isLocked ? "#" : item.link}
      tabIndex={isLocked ? -1 : 0}
      title={item.name}
      className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2 font-monzo outline-none ${expandedClasses} ${sharedClasses}`}
    >
      <span className="relative size-6 shrink-0">
        {item.icon(expandedActive)}
      </span>
      <span className={`min-w-0 flex-1 text-sm leading-6 ${expandedLabelClasses}`}>
        {label}
      </span>
      {showBadge && (
        <span className="size-2 shrink-0 rounded-full bg-raiz-error" aria-label={`${badgeCount} pending`} />
      )}
      {isLocked && (
        <Image
          src="/icons/sidebar/lock.svg"
          alt="Locked"
          width={20}
          height={20}
          className="size-5 shrink-0"
        />
      )}
    </Link>
  );
}
