"use client";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import React from "react";

interface TabsProps<T> {
  options: { label: string; value: T; shortLabel?: string }[];
  selected: T;
  onChange: (value: T) => void;
  className?: string;
}

const Tabs = <T,>({ options, selected, onChange, className }: TabsProps<T>) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div
      className={`overflow-x-auto no-scrollbar mt-3 mb-4 transition-all duration-200 ease-in-out ${className ?? ""}`}
    >
      <div className="flex min-w-full h-11 p-1 bg-raiz-gray-100 rounded-2xl items-center gap-1">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-2.5 py-2 rounded-xl flex-1 min-w-0 whitespace-nowrap transition-all duration-200 ${
              isMobile ? "text-[11px]" : "text-sm lg:text-[10px] xl:text-sm"
            } ${
              selected === option.value
                ? "bg-white text-raiz-gray-950 font-bold shadow-sm"
                : "text-raiz-gray-600 font-medium"
            }`}
          >
            {isMobile && option.shortLabel ? option.shortLabel : option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
