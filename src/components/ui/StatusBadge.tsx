"use client";

import React from "react";

type StatusTone = "success" | "warning" | "danger" | "neutral" | "outline";

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  /** `filled` is the tinted badge. `outlined` matches the transaction table status chip. */
  variant?: "filled" | "outlined";
}

const filledStyles: Record<StatusTone, string> = {
  success: "bg-[#E2F0D9] text-[#39A062] border-transparent",
  warning: "bg-[#FFF3E6] text-[#B45309] border-transparent",
  danger: "bg-[#FFE6E6] text-[#DC180D] border-transparent",
  neutral: "bg-[#F3F1F6] text-[#6F5B86] border-transparent",
  outline: "bg-white text-[#443852] border-[#E4E0EA]",
};

const dotStyles: Record<StatusTone, string> = {
  success: "bg-[#39A062]",
  warning: "bg-[#F2A735]",
  danger: "bg-[#DC180D]",
  neutral: "bg-[#A89AB9]",
  outline: "bg-[#F2A735]",
};

const outlinedDotStyles: Record<StatusTone, string> = {
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  neutral: "bg-[#A89AB9]",
  outline: "bg-yellow-500",
};

const StatusBadge = ({
  label,
  tone = "neutral",
  variant = "filled",
}: StatusBadgeProps) => {
  const isOutlined = variant === "outlined";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border ${
        isOutlined
          ? "w-fit gap-1 rounded-md border-raiz-gray-200 bg-white px-1.5 py-0.5 text-xs font-brSonoma text-raiz-gray-950"
          : `gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${filledStyles[tone]}`
      }`}
    >
      <span
        className={`rounded-full ${
          isOutlined ? "h-2 w-2" : "size-1.5"
        } ${isOutlined ? outlinedDotStyles[tone] : dotStyles[tone]}`}
      />
      {label}
    </span>
  );
};

export default StatusBadge;
