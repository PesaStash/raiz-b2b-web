"use client";

import { useRouter } from "next/navigation";

type Props = {
  href?: string;
  label?: string;
};

const SettingsMobileBack = ({ href = "/settings", label = "Settings" }: Props) => {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="lg:hidden inline-flex items-center gap-1.5 mb-4 -ml-1 px-1 py-1 text-sm font-semibold text-primary2 active:opacity-70"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 6L9 12L15 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
};

export default SettingsMobileBack;
