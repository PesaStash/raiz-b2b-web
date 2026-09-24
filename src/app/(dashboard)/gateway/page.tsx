"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { GatewaySummaryFilterKey } from "./_utils/subaccountHelpers";
import SubaccountsSummary from "./_components/SubaccountsSummary";
import SubaccountsTable from "./_components/SubaccountsTable";

const GatewayPage = () => {
  const router = useRouter();
  const [statusFilter, setStatusFilter] =
    useState<GatewaySummaryFilterKey>("all");

  return (
    <div className="flex flex-col gap-4 md:gap-6 min-w-0 px-0 pb-24 md:pb-0">
      <section className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h2 className="text-zinc-900 text-2xl  font-bold leading-8">
            Gateway
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <a
              href="https://raiz-33e99515.mintlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 py-2.5 rounded-full border border-zinc-300 hover:bg-zinc-100 text-zinc-900 text-sm font-medium inline-flex items-center justify-center gap-2 w-full sm:w-auto transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7.5 12.5L12.5 7.5M12.5 7.5H8.333M12.5 7.5V11.667"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.333 3.333H5.833C4.453 3.333 3.333 4.453 3.333 5.833V14.167C3.333 15.547 4.453 16.667 5.833 16.667H14.167C15.547 16.667 16.667 15.547 16.667 14.167V11.667"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              API docs
            </a>
            <Button
              className="h-11 px-5 py-2.5 rounded-full !w-full items-center sm:!w-auto"
              onClick={() => router.push("/gateway/settings")}
            >
              <svg
                className="mt-1"
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10.833 2.5H9.167L8.75 4.167C8.292 4.308 7.858 4.5 7.458 4.742L5.833 4.083L5 5.75L6.333 7.083C6.25 7.375 6.208 7.683 6.208 8C6.208 8.317 6.25 8.625 6.333 8.917L5 10.25L5.833 11.917L7.458 11.258C7.858 11.5 8.292 11.692 8.75 11.833L9.167 13.5H10.833L11.25 11.833C11.708 11.692 12.142 11.5 12.542 11.258L14.167 11.917L15 10.25L13.667 8.917C13.75 8.625 13.792 8.317 13.792 8C13.792 7.683 13.75 7.375 13.667 7.083L15 5.75L14.167 4.083L12.542 4.742C12.142 4.5 11.708 4.308 11.25 4.167L10.833 2.5ZM10 9.667C9.08 9.667 8.333 8.92 8.333 8C8.333 7.08 9.08 6.333 10 6.333C10.92 6.333 11.667 7.08 11.667 8C11.667 8.92 10.92 9.667 10 9.667Z"
                  fill="#FDFDFD"
                />
              </svg>
              <span className="text-sm font-medium ml-2">Gateway Settings</span>
            </Button>
          </div>
        </div>

        <div className="mt-6 md:mt-8">
          <SubaccountsSummary
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </div>
      </section>

      <SubaccountsTable statusFilter={statusFilter} />
    </div>
  );
};

export default GatewayPage;
