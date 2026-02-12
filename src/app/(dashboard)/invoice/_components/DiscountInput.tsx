"use client";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import Image from "next/image";
import React, { useRef, useState } from "react";

interface DiscountInputProps {
  value: number;
  mode?: "percent" | "value";
  onChange: (val: number) => void;
  onModeChange?: (mode: "percent" | "value") => void;
  className?: string;
  currency: "NGN" | "USD" | "SBC";
}

const DiscountInput: React.FC<DiscountInputProps> = ({
  value,
  mode: initialMode = "percent",
  onChange,
  onModeChange,
  className = "",
  currency,
}) => {
  const [mode, setMode] = useState<"percent" | "value">(initialMode);
  const [open, setOpen] = useState(false);
  const handleModeChange = (newMode: "percent" | "value") => {
    setMode(newMode);
    setOpen(false);
    if (onModeChange) onModeChange(newMode);
  };
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useOutsideClick(() => setOpen(false), btnRef);

  return (
    <div className={`relative flex justify-end ${className}`}>
      {/* Input */}
      <input
        type="number"
        min={0}
        className="w-[134px] border text-right rounded-l-lg p-2 h-9 text-sm text-gray-900 bg-white focus:outline-none"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      {/* Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="w-12 border-l-0 border rounded-r-lg h-9 font-brSonoma text-xs flex items-center justify-center text-zinc-700 bg-gray-100"
        >
          {mode === "percent" ? "%" : currency}
          <Image
            className="ml-1"
            src="/icons/s-arrow-down.svg"
            alt="arrow-down"
            width={12}
            height={12}
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-16 text-zinc-700  bg-white border rounded-lg shadow-md z-10">
            <button
              type="button"
              onClick={() => handleModeChange("percent")}
              className={`block w-full text-center py-2 text-xs hover:bg-violet-100/60 ${
                mode === "percent" ? "bg-gray-50 font-semibold" : ""
              }`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("value")}
              className={`block w-full text-center py-2 text-xs hover:bg-violet-100/60 ${
                mode === "value" ? "bg-gray-50 font-semibold" : ""
              }`}
            >
              {currency}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountInput;
