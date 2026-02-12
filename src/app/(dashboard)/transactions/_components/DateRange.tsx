"use client";
import React, { useState } from "react";
import { DateRangePicker, RangeKeyDict } from "react-date-range";
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
  const isDesktop = useMediaQuery("(min-width: 1350px)");
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

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

  return (
    <div className="absolute top-12 right-0 z-50 bg-white border rounded-lg shadow-lg">
      <DateRangePicker
        onChange={handleSelect}
        moveRangeOnFirstSelection={false}
        months={1}
        ranges={state}
        direction={!isDesktop ? "horizontal" : "vertical"}
      />
      <div className="flex justify-end p-4">
        <button
          onClick={onClose}
          className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <Button onClick={handleApply} className=" rounded-md ">
          Apply
        </Button>
      </div>
    </div>
  );
};

export default DateRange;
