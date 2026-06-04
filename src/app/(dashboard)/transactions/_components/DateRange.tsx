"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DateRange as ReactDateRange, RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "@/styles/date-range.css";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import Button from "@/components/ui/Button";

interface DateRangeProps {
  onApply: (range: { startDate?: Date; endDate?: Date }) => void;
  onClose: () => void;
}

const DateRange: React.FC<DateRangeProps> = ({ onApply, onClose }) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile]);

  const handleSelect = (ranges: RangeKeyDict) => {
    const { selection } = ranges;
    setState([
      {
        startDate: selection.startDate || new Date(),
        endDate: selection.endDate || new Date(),
        key: selection.key || "selection",
      },
    ]);
  };

  const handleApply = () => {
    onApply({
      startDate: state[0].startDate,
      endDate: state[0].endDate,
    });
    onClose();
  };

  const picker = (
    <div className="date-range-picker-responsive">
      <ReactDateRange
        onChange={handleSelect}
        moveRangeOnFirstSelection={false}
        months={1}
        ranges={state}
        direction="vertical"
        rangeColors={["#4b0082"]}
        fixedHeight={false}
      />
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-2 p-3 md:p-4 border-t border-raiz-gray-100 shrink-0">
      <Button
        onClick={onClose}
        className="rounded-lg"
        variant="secondary"
      >
        Cancel
      </Button>
      <Button onClick={handleApply} className="rounded-lg">
        Apply
      </Button>
    </div>
  );

  const panel = (
    <div
      className="bg-white border border-raiz-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-raiz-gray-100 md:hidden">
        <span className="text-sm font-bold text-raiz-gray-900">Select dates</span>
        <button
          type="button"
          onClick={onClose}
          className="size-8 flex items-center justify-center rounded-full bg-raiz-gray-50 text-raiz-gray-600"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="shrink-0 overflow-x-auto">{picker}</div>
      {footer}
    </div>
  );

  if (!mounted) return null;

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-label="Close date picker"
        />
        <div className="relative z-[1] w-full max-w-full sm:max-w-[360px] sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)]">
          {panel}
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <div
      className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 mt-2 z-50 w-[min(100vw-2rem,360px)] sm:w-auto sm:min-w-[320px] max-w-[calc(100vw-1rem)]"
      onClick={(e) => e.stopPropagation()}
    >
      {panel}
    </div>
  );
};

export default DateRange;
