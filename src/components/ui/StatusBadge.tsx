"use client";

import React from "react";

interface StatusBadgeProps {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "outline";
}

const toneStyles = {
  success: "bg-[#E2F0D9] text-[#39A062] border-transparent",
  warning: "bg-[#FFF3E6] text-[#B45309] border-transparent",
  danger: "bg-[#FFE6E6] text-[#DC180D] border-transparent",
  neutral: "bg-[#F3F1F6] text-[#6F5B86] border-transparent",
  outline: "bg-white text-[#443852] border-[#E4E0EA]",
};

const StatusBadge = ({ label, tone = "neutral" }: StatusBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium whitespace-nowrap border ${toneStyles[tone]}`}
  >
    <span
      className={`size-1.5 rounded-full ${
        tone === "success"
          ? "bg-[#39A062]"
          : tone === "warning" || tone === "outline"
            ? "bg-[#F2A735]"
            : tone === "danger"
              ? "bg-[#DC180D]"
              : "bg-[#A89AB9]"
      }`}
    />
    {label}
  </span>
);

export default StatusBadge;
