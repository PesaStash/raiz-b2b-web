"use client";
import React from "react";
import Overlay from "@/components/ui/Overlay";
import { DateOption } from "./page";

interface Props {
  close: () => void;
  options: DateOption[];
  selectedRange: DateOption;
  setSelectedRange: (i: DateOption) => void;
  onCustomSelect: () => void;
}

const RangeModal = ({
  close,
  options,
  selectedRange,
  setSelectedRange,
  onCustomSelect,
}: Props) => {
  const handleChange = (option: DateOption) => {
    if (option.value === "custom") {
      onCustomSelect(); // tell parent to show calendar
      close(); // close modal
    } else {
      setSelectedRange(option);
      close();
    }
  };

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col gap-5 h-full py-8 px-5 text-raiz-gray-950">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <input
              type="radio"
              name="range"
              value={option.value}
              checked={selectedRange.value === option.value}
              onChange={() => handleChange(option)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                selectedRange.value === option.value
                  ? "border-indigo-900 border-[5px]"
                  : "border-gray-300"
              }`}
            />
            <div className="flex flex-col gap-1">
              <span className="text-zinc-800 text-sm font-bold leading-none">
                {option.label}
              </span>
              <p className="text-zinc-800 text-xs font-normal leading-normal">
                {option.dateRange}
              </p>
            </div>
          </label>
        ))}
      </div>
    </Overlay>
  );
};

export default RangeModal;
