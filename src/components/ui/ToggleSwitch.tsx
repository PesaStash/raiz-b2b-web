"use client";

import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  checkedColor?: string;
}

const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  id,
  className = "",
  checkedColor = "#7F56D9", 
}: ToggleSwitchProps) => {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={checked ? { backgroundColor: checkedColor } : undefined}
      className={`relative inline-flex h-[26px] w-[48px] shrink-0 items-center rounded-full transition-colors ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${checked ? "" : "bg-[#E4E0EA]"} ${className}`}
    >
      <span
        className={`inline-block size-[22px] transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[24px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;
