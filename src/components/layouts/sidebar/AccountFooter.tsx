"use client";

import { useCallback, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import { truncateString } from "@/utils/helpers";

type AccountFooterProps = {
  collapsed: boolean;
  userPfp: string;
  businessName?: string;
  email?: string;
  avatarSize?: number;
  onLogout: () => void;
};

export function AccountFooter({
  collapsed,
  userPfp,
  businessName,
  email,
  avatarSize = 38,
  onLogout,
}: AccountFooterProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = useOutsideClick(closeMenu, menuButtonRef);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Account menu"
          className="flex size-12 items-center justify-center rounded-xl text-base font-bold text-raiz-gray-950 hover:bg-raiz-gray-50 outline-none"
        >
          •••
        </button>
        {menuOpen && (
          <div
            ref={menuRef}
            className="fixed bottom-[76px] left-[92px] z-50 min-w-[140px] rounded-xl border border-raiz-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onLogout();
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-semibold text-[#B3261E] hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        )}
        <Avatar src={userPfp} name={businessName || "Account"} size={44} />
      </div>
    );
  }

  return (
    <div className="relative flex w-full items-center gap-2.5 border-t border-raiz-gray-200 pt-3.5">
      <Avatar src={userPfp} name={businessName || "Account"} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-raiz-gray-950">
          {businessName}
        </p>
        <p className="truncate text-[11px] text-raiz-gray-600">
          {truncateString(email || "", 24)}
        </p>
      </div>
      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Account menu"
        className="shrink-0 px-1 text-base font-bold text-raiz-gray-500 hover:text-raiz-gray-700 outline-none"
      >
        •••
      </button>
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full right-0 z-30 mb-2 min-w-[140px] rounded-xl border border-raiz-gray-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => {
              closeMenu();
              onLogout();
            }}
            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-[#B3261E] hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
