"use client";
import { IInvoiceLogs } from "@/types/invoice";
import dayjs from "dayjs";
import React from "react";

interface Props {
  activities: IInvoiceLogs[];
}

const InvoiceActivity = ({ activities }: Props) => {
  return (
    <div className="w-full py-[30px] h-full">
      <h3 className="mb-6 text-zinc-900 text-base font-bold leading-tight">
        Activities
      </h3>

      <div className="flex flex-col relative max-h-[70%] overflow-y-auto no-scrollbar">
        {activities?.map((activity, index) => (
          <div
            key={activity.invoice_activity_log_id}
            className="flex items-start relative pb-5 last:pb-0"
          >
            {/* Circle */}
            <div className="flex flex-col items-center">
              <span
                className={`w-3 h-3 rounded-full bg-[#6b5b95] mt-[3px]`}
              ></span>
              {/* Vertical line */}
              {index !== activities.length - 1 && (
                <div className="w-px flex-1 bg-gray-100 mt-1 mb-0.5"></div>
              )}
            </div>

            {/* Text */}
            <p className="ml-3  text-zinc-700 text-xs leading-tight">
              {activity.activity_type} on{" "}
              {dayjs(activity.updated_at).format("DD MMM YYYY")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoiceActivity;
