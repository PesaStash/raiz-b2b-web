"use client";

import React from "react";

type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "outline"
  | "refunded";

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  /** `filled` is the tinted badge. `outlined` matches the transaction table status chip. */
  variant?: "filled" | "outlined";
}

const filledStyles: Record<StatusTone, string> = {
  success: "bg-[#E8F6EE] text-[#1F9D55] border-transparent",
  warning: "bg-[#FDF5E1] text-[#B07A00] border-transparent",
  danger: "bg-[#FFE6E6] text-[#DC180D] border-transparent",
  neutral: "bg-[#F3F1F6] text-[#6F5B86] border-transparent",
  outline: "bg-white text-[#443852] border-[#E4E0EA]",
  refunded: "bg-[#F3F1FD] text-[#3C2875] border-transparent",
};

const dotStyles: Record<StatusTone, string> = {
  success: "bg-[#39A062]",
  warning: "bg-[#F2A735]",
  danger: "bg-[#DC180D]",
  neutral: "bg-[#A89AB9]",
  outline: "bg-[#F2A735]",
  refunded: "bg-[#6B4EFF]",
};

const outlinedDotStyles: Record<StatusTone, string> = {
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  neutral: "bg-[#A89AB9]",
  outline: "bg-yellow-500",
  refunded: "bg-[#6B4EFF]",
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
          : `gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${filledStyles[tone]}`
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
