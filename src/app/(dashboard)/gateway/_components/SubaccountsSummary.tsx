"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { FetchGatewaySubaccountsSummaryApi } from "@/services/gateway";
import { GatewaySummaryFilterKey } from "../_utils/subaccountHelpers";

type Props = {
  activeFilter: GatewaySummaryFilterKey;
  onFilterChange: (filter: GatewaySummaryFilterKey) => void;
};

const PRIMARY_CARDS: {
  key: GatewaySummaryFilterKey;
  label: string;
  summaryKey: keyof Awaited<
    ReturnType<typeof FetchGatewaySubaccountsSummaryApi>
  >;
}[] = [
  { key: "all", label: "Total Sub-Accounts", summaryKey: "total_requested" },
  { key: "active", label: "Active / Approved", summaryKey: "active" },
  { key: "under_review", label: "Pending Review", summaryKey: "under_review" },
  { key: "rejected", label: "Rejected", summaryKey: "rejected" },
];

const SECONDARY_CARDS: typeof PRIMARY_CARDS = [
  { key: "requires_kyc", label: "Requires KYC", summaryKey: "requires_kyc" },
  { key: "failed", label: "Failed", summaryKey: "failed" },
];

const SummaryCard = ({
  label,
  value,
  isActive,
  isLoading,
  onClick,
}: {
  label: string;
  value: number;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left p-4 md:p-5 bg-white rounded-2xl border shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] flex flex-col gap-3 md:gap-4 min-w-0 transition-colors ${
      isActive
        ? "border-[#7F56D9] ring-1 ring-[#7F56D9]/20"
        : "border-raiz-gray-100 hover:border-indigo-200"
    }`}
  >
    <span className="text-raiz-gray-600 text-xs md:text-sm font-medium leading-tight">
      {label}
    </span>
    {isLoading ? (
      <Skeleton height={32} width={56} />
    ) : (
      <span className="text-raiz-gray-950 text-2xl md:text-[32px] font-semibold tabular-nums leading-none">
        {value.toLocaleString()}
      </span>
    )}
  </button>
);

const SubaccountsSummary = ({ activeFilter, onFilterChange }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["gateway-subaccounts-summary"],
    queryFn: FetchGatewaySubaccountsSummaryApi,
    refetchOnMount: "always",
  });

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {PRIMARY_CARDS.map((card) => (
          <SummaryCard
            key={card.key}
            label={card.label}
            value={data?.[card.summaryKey] ?? 0}
            isActive={activeFilter === card.key}
            isLoading={isLoading}
            onClick={() => onFilterChange(card.key)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {SECONDARY_CARDS.map((card) => (
          <SummaryCard
            key={card.key}
            label={card.label}
            value={data?.[card.summaryKey] ?? 0}
            isActive={activeFilter === card.key}
            isLoading={isLoading}
            onClick={() => onFilterChange(card.key)}
          />
        ))}
      </div>
    </div>
  );
};

export default SubaccountsSummary;
