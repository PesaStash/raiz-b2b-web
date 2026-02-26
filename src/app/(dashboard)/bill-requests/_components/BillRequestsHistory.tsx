"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import dayjs from "dayjs";
import Avatar from "@/components/ui/Avatar";
import {
  FetchBillRequestApi,
  FetchSentRequestApi,
  FetchTransactionCategoriesApi,
} from "@/services/transactions";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { IBillRequestParams, IP2pTransferResponse } from "@/types/services";
import { IBillRequest, PaymentStatusType } from "@/types/transactions";
import { getCurrencySymbol, convertTime, formatAmount } from "@/utils/helpers";
import EmptyList from "@/components/ui/EmptyList";
import AcceptBill from "@/app/(dashboard)/_components/bill-requests/AcceptBill";
import RejectBill from "@/app/(dashboard)/_components/bill-requests/RejectBill";
import PayBill from "@/app/(dashboard)/_components/bill-requests/PayBill";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import SideModalWrapper from "@/app/(dashboard)/_components/SideModalWrapper";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";
import Pagination from "@/components/ui/Pagination";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "all" | "received" | "sent";
type ViewType = "grid" | "table";
type ModalType = "accept" | "pay" | "status" | "receipt" | "reject" | null;
type CurrencyFilter = "all" | "USD" | "NGN" | "SBC";
type DatePreset =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year"
  | "all_time";

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "last_3_months", label: "Last 3 months" },
  { key: "last_6_months", label: "Last 6 months" },
  { key: "this_year", label: "This year" },
  { key: "all_time", label: "All time" },
];

function getDateRange(preset: DatePreset): {
  start_date?: string;
  end_date?: string;
} {
  const now = dayjs();
  switch (preset) {
    case "this_month":
      return {
        start_date: now.startOf("month").format("YYYY-MM-DD"),
        end_date: now.endOf("month").format("YYYY-MM-DD"),
      };
    case "last_month":
      return {
        start_date: now
          .subtract(1, "month")
          .startOf("month")
          .format("YYYY-MM-DD"),
        end_date: now.subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
      };
    case "last_3_months":
      return {
        start_date: now
          .subtract(3, "month")
          .startOf("month")
          .format("YYYY-MM-DD"),
        end_date: now.format("YYYY-MM-DD"),
      };
    case "last_6_months":
      return {
        start_date: now
          .subtract(6, "month")
          .startOf("month")
          .format("YYYY-MM-DD"),
        end_date: now.format("YYYY-MM-DD"),
      };
    case "this_year":
      return {
        start_date: now.startOf("year").format("YYYY-MM-DD"),
        end_date: now.format("YYYY-MM-DD"),
      };
    case "all_time":
    default:
      return {};
  }
}

const CURRENCY_OPTIONS: { key: CurrencyFilter; label: string }[] = [
  { key: "all", label: "All currencies" },
  ...Object.values(ACCOUNT_CURRENCIES)
    .filter((c) => c.name !== "SBC")
    .map((c) => ({ key: c.name as CurrencyFilter, label: c.name })),
  // { key: "SBC", label: "SBC (Stablecoin)" },
];

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-500",
    dot: "bg-amber-400",
  },
  accepted: {
    label: "Accepted",
    color: "text-green-600",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-500",
    dot: "bg-red-500",
  },
};

function normalizeStatus(status?: string) {
  const key = (status || "").toLowerCase();
  return (
    STATUS_MAP[key] ?? {
      label: status ?? "—",
      color: "text-gray-500",
      dot: "bg-gray-400",
    }
  );
}

// ─── Approve/Reject inline buttons ────────────────────────────────────────────

const ActionButtons = ({
  request,
  onAccept,
  onReject,
}: {
  request: IBillRequest;
  onAccept: (r: IBillRequest) => void;
  onReject: (r: IBillRequest) => void;
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={(e) => {
        e.stopPropagation();
        onReject(request);
      }}
      className="h-8 px-4 bg-orange-100 rounded-full text-xs font-medium text-raiz-gray-800 whitespace-nowrap"
    >
      Reject
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAccept(request);
      }}
      className="h-8 px-4 bg-[#3c2875] rounded-full flex items-center gap-1.5 text-xs font-medium text-white whitespace-nowrap"
    >
      <svg width="14" height="14" viewBox="0 0 17 16" fill="none">
        <path
          d="M11.2601 1.97336L5.24008 3.97336C1.19341 5.3267 1.19341 7.53336 5.24008 8.88003L7.02674 9.47336L7.62008 11.26C8.96674 15.3067 11.1801 15.3067 12.5267 11.26L14.5334 5.2467C15.4267 2.5467 13.9601 1.07336 11.2601 1.97336ZM11.4734 5.56003L8.94008 8.1067C8.84008 8.2067 8.71341 8.25336 8.58674 8.25336C8.46008 8.25336 8.33341 8.2067 8.23341 8.1067C8.04008 7.91336 8.04008 7.59336 8.23341 7.40003L10.7667 4.85336C10.9601 4.66003 11.2801 4.66003 11.4734 4.85336C11.6667 5.0467 11.6667 5.3667 11.4734 5.56003Z"
          fill="#F4F4F4"
        />
      </svg>
      Approve
    </button>
  </div>
);

// ─── Grid card ────────────────────────────────────────────────────────────────

const GridCard = ({
  request,
  isSelected,
  onClick,
  onAccept,
  onReject,
  isSent,
}: {
  request: IBillRequest;
  isSelected: boolean;
  onClick: () => void;
  onAccept: (r: IBillRequest) => void;
  onReject: (r: IBillRequest) => void;
  isSent: boolean;
}) => {
  const date = dayjs(convertTime(request.created_at));
  const statusKey = request.status?.status?.toLowerCase() ?? "pending";
  const isPending = statusKey === "pending";
  const statusInfo = normalizeStatus(request.status?.status);

  return (
    <div
      onClick={onClick}
      className={`w-full px-4 py-4 rounded-2xl border cursor-pointer transition-all ${
        isSelected
          ? "border-[#3c2875] bg-white shadow-md"
          : "border-raiz-gray-100 bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <Avatar
          name={request.third_party_account?.account_name}
          src={request.third_party_account?.selfie_image}
        />
        <span
          className={`flex items-center gap-1.5 text-xs font-medium ${statusInfo.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
          {statusInfo.label}
        </span>
      </div>
      <p className="text-raiz-gray-900 text-sm font-semibold leading-snug">
        {request.third_party_account?.account_name}
      </p>
      <p className="text-raiz-gray-900 text-lg font-bold leading-tight mt-0.5">
        {getCurrencySymbol(request.currency)}
        {request.transaction_amount?.toLocaleString()}
      </p>
      <p className="text-raiz-gray-500 text-xs mt-2">
        {isSent ? "Outbound" : "Inbound"} • {date.format("MMM D, h:mm A")}
      </p>

      {isPending && !isSent && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReject(request);
            }}
            className="flex-1 h-9 bg-orange-100 rounded-full text-xs font-medium text-raiz-gray-800"
          >
            Reject
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept(request);
            }}
            className="flex-1 h-9 bg-[#3c2875] rounded-full flex items-center justify-center gap-1.5 text-xs font-medium text-white"
          >
            <svg width="12" height="12" viewBox="0 0 17 16" fill="none">
              <path
                d="M11.2601 1.97336L5.24008 3.97336C1.19341 5.3267 1.19341 7.53336 5.24008 8.88003L7.02674 9.47336L7.62008 11.26C8.96674 15.3067 11.1801 15.3067 12.5267 11.26L14.5334 5.2467C15.4267 2.5467 13.9601 1.07336 11.2601 1.97336ZM11.4734 5.56003L8.94008 8.1067C8.84008 8.2067 8.71341 8.25336 8.58674 8.25336C8.46008 8.25336 8.33341 8.2067 8.23341 8.1067C8.04008 7.91336 8.04008 7.59336 8.23341 7.40003L10.7667 4.85336C10.9601 4.66003 11.2801 4.66003 11.4734 4.85336C11.6667 5.0467 11.6667 5.3667 11.4734 5.56003Z"
                fill="#F4F4F4"
              />
            </svg>
            Approve
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Detail panel ─────────────────────────────────────────────────────────────

const DetailPanel = ({
  request,
  onAccept,
  onReject,
  isSent,
}: {
  request: IBillRequest;
  onAccept: (r: IBillRequest) => void;
  onReject: (r: IBillRequest) => void;
  isSent: boolean;
}) => {
  const statusKey = request.status?.status?.toLowerCase() ?? "pending";
  const isPending = statusKey === "pending";
  const submittedDate = dayjs(convertTime(request.created_at)).format(
    "MMM D, YYYY @ h:mm A",
  );

  return (
    <div className="flex-1 bg-white rounded-2xl border border-raiz-gray-100 p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-raiz-gray-950 text-sm mb-1 font-semibold">
            Bill Request
          </p>
          <p className="text-raiz-gray-900 text-2xl font-bold">
            {getCurrencySymbol(request.currency)}
            {formatAmount(request.transaction_amount)}
          </p>
          <p className="text-raiz-gray-700 font-brSonoma text-sm mt-1 leading-5">
            {isSent ? "Sent Request" : "Received Request"}
          </p>
        </div>
        {isPending && !isSent && (
          <ActionButtons
            request={request}
            onAccept={onAccept}
            onReject={onReject}
          />
        )}
      </div>

      <hr className="border-raiz-gray-100" />

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-raiz-gray-700 text-sm mb-1">Requester</p>
          <p className="text-raiz-gray-700 text-base font-semibold">
            {isSent ? "You" : request.third_party_account?.account_name}
          </p>
        </div>
        <div>
          <p className="text-raiz-gray-700 text-sm mb-1">Submitted Date</p>
          <p className="text-raiz-gray-700 text-base font-semibold">
            {submittedDate}
          </p>
        </div>
      </div>

      <hr className="border-raiz-gray-100" />

      {/* Description */}
      {request.narration && (
        <div>
          <p className="text-raiz-gray-700 text-sm font-bold mb-2">
            Description
          </p>
          <p className="text-raiz-gray-700 text-base leading-relaxed">
            {request.narration}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Table row ────────────────────────────────────────────────────────────────

const TableRow = ({
  request,
  onAccept,
  onReject,
  isSent,
}: {
  request: IBillRequest;
  onAccept: (r: IBillRequest) => void;
  onReject: (r: IBillRequest) => void;
  isSent: boolean;
}) => {
  const date = dayjs(convertTime(request.created_at));
  const statusKey = request.status?.status?.toLowerCase() ?? "pending";
  const isPending = statusKey === "pending";
  const statusInfo = normalizeStatus(request.status?.status);

  const { data } = useQuery({
    queryKey: ["transactions-category"],
    queryFn: () => FetchTransactionCategoriesApi(),
  });

  console.log("data", data);

  return (
    <tr className="border-b border-raiz-gray-100 hover:bg-gray-50 transition-colors">
      {/* Client */}
      <td className="py-4 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <Avatar
            name={request.third_party_account?.account_name}
            src={request.third_party_account?.selfie_image}
          />
          <span className="text-raiz-gray-950 text-sm font-medium">
            {request.third_party_account?.account_name}
          </span>
        </div>
      </td>

      {/* Amount */}
      <td className="py-4 px-3">
        <span
          className={`text-sm font-normal ${
            isSent ? "text-raiz-gray-700" : "text-green-600"
          }`}
        >
          {isSent ? "- " : "+ "}
          {getCurrencySymbol(request.currency)}
          {request.transaction_amount?.toLocaleString()}
        </span>
      </td>

      {/* Category */}
      {/* <td className="py-4 px-3">
        <span className="inline-flex items-center font-brSonoma font-medium gap-1.5 text-xs border border-raiz-gray-200 rounded-md px-2 py-1 text-raiz-gray-700 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          {data?.find(
            (item) =>
              item.transaction_category_id === request.transaction_category_id,
          )?.transaction_category || "General"}
        </span>
      </td> */}

      {/* Date */}
      <td className="py-4 px-3 text-raiz-gray-600 text-sm">
        {isSent ? "Sent" : "Inbound"} • {date.format("MMM D, h:mm A")}
      </td>

      {/* Status / Actions */}
      <td className="py-4 px-3">
        {isPending && !isSent ? (
          <ActionButtons
            request={request}
            onAccept={onAccept}
            onReject={onReject}
          />
        ) : (
          <span
            className={`flex items-center gap-1.5 text-xs font-medium ${statusInfo.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
        )}
      </td>

      {/* Three-dot */}
      {/* <td className="py-4 px-4">
        <button className="text-raiz-gray-400 hover:text-raiz-gray-700 transition-colors">
          <svg
            width="4"
            height="16"
            viewBox="0 0 4 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="2" cy="2" r="2" fill="currentColor" />
            <circle cx="2" cy="8" r="2" fill="currentColor" />
            <circle cx="2" cy="14" r="2" fill="currentColor" />
          </svg>
        </button>
      </td> */}
    </tr>
  );
};

// ─── Loading skeletons ────────────────────────────────────────────────────────

const GridSkeleton = () => (
  <div className="grid grid-cols-[300px_1fr] gap-4">
    <div className="flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border border-raiz-gray-100 bg-white"
        >
          <div className="flex justify-between mb-3">
            <Skeleton circle width={40} height={40} />
            <Skeleton width={60} height={16} />
          </div>
          <Skeleton width={120} height={14} className="mb-1" />
          <Skeleton width={100} height={22} className="mb-2" />
          <Skeleton width={140} height={12} />
        </div>
      ))}
    </div>
    <div className="rounded-2xl border border-raiz-gray-100 bg-white p-6">
      <Skeleton width={200} height={16} className="mb-2" />
      <Skeleton width={160} height={36} className="mb-2" />
      <Skeleton width={120} height={14} />
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="flex flex-col gap-4 mt-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton circle width={40} height={40} />
        <Skeleton width={120} height={14} />
        {/* <Skeleton width={80} height={14} className="ml-auto" /> */}
        <Skeleton width={80} height={24} borderRadius={6} />
        <Skeleton width={120} height={14} />
        <Skeleton width={80} height={14} />
      </div>
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const BillRequestsHistory = () => {
  const { selectedCurrency } = useCurrencyStore();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<IBillRequest | null>(
    null,
  );
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType>(null);
  const [paymentError, setPaymentError] = useState("");
  const [transactionDetail, setTransactionDetail] =
    useState<IP2pTransferResponse | null>(null);

  // ── Filter state ──
  const [filterCurrency, setFilterCurrency] = useState<CurrencyFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all_time");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(e.target as Node)
      ) {
        setCurrencyDropdownOpen(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(e.target as Node)
      ) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dateRange = getDateRange(datePreset);
  const currencyParam = filterCurrency === "all" ? "" : filterCurrency;

  const LIMIT = 10;

  const receivedParams: IBillRequestParams = {
    ...(currencyParam && { currency: currencyParam }),
    page: currentPage,
    limit: LIMIT,
    ...dateRange,
  };

  const sentParams: IBillRequestParams = {
    ...(currencyParam && { currency: currencyParam }),
    page: currentPage,
    limit: LIMIT,
    ...dateRange,
  };

  const { data: receivedData, isLoading: receivedLoading } = useQuery({
    queryKey: ["bill-requests-received", receivedParams],
    queryFn: () => FetchBillRequestApi(receivedParams),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: sentData, isLoading: sentLoading } = useQuery({
    queryKey: ["bill-requests-sent", sentParams],
    queryFn: () => FetchSentRequestApi(sentParams),
    refetchOnMount: "always",
  });

  const receivedRequests = receivedData?.data ?? [];
  const sentRequests = sentData?.data ?? [];
  const allRequests = [...receivedRequests, ...sentRequests].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const pendingCount = receivedRequests.filter(
    (r) => r.status?.status?.toLowerCase() === "pending",
  ).length;

  const isLoading =
    activeTab === "all"
      ? receivedLoading || sentLoading
      : activeTab === "received"
        ? receivedLoading
        : sentLoading;

  const currentRequests =
    activeTab === "all"
      ? allRequests
      : activeTab === "received"
        ? receivedRequests
        : sentRequests;

  const isSentTab = activeTab === "sent";

  const currentPaginationDetails =
    activeTab === "received"
      ? receivedData?.pagination_details
      : activeTab === "sent"
        ? sentData?.pagination_details
        : receivedData?.pagination_details;

  const totalPages = currentPaginationDetails?.total_pages ?? 1;

  const handleAccept = (request: IBillRequest) => {
    setSelectedRequest(request);
    setOpenModal("accept");
  };

  const handleReject = (request: IBillRequest) => {
    setSelectedRequest(request);
    setOpenModal("reject");
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedRequest(null);
  };

  const handleCurrencySelect = (key: CurrencyFilter) => {
    setFilterCurrency(key);
    setCurrencyDropdownOpen(false);
    setCurrentPage(1);
    setSelectedRequest(null);
  };

  const handleDateSelect = (key: DatePreset) => {
    setDatePreset(key);
    setDateDropdownOpen(false);
    setCurrentPage(1);
    setSelectedRequest(null);
  };

  const activeDateLabel =
    DATE_PRESETS.find((p) => p.key === datePreset)?.label ?? "This month";
  const activeCurrencyLabel =
    filterCurrency === "all" ? "All currencies" : filterCurrency;

  return (
    <div className="mt-6 p-6 bg-raiz-gray-50 rounded-[20px]">
      {/* ── Controls ── */}
      <div className="flex items-center justify-between mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          {(["all", "received", "sent"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary2  text-primary2"
                  : "border-transparent text-raiz-gray-500 hover:text-raiz-gray-700"
              }`}
            >
              {tab === "all"
                ? "All Requests"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "all" && pendingCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-[#DC180D] text-raiz-gray-50 rounded-full text-xs font-semibold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Table / Grid toggle */}
          <div className="flex items-center gap-1 p-1 border border-raiz-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewType("table")}
              className={`flex items-center gap-1.5 px-2 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                viewType === "table"
                  ? "bg-[#EAECFFB2] text-raiz-gray-900"
                  : "text-raiz-gray-400 hover:text-raiz-gray-700"
              }`}
            >
              <svg
                className={` ${viewType === "table" ? "fill-[#3C2875]" : "fill-[#D0C8D9]"}`}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M16.6667 16.05H9.10838C8.73338 16.05 8.42505 15.7417 8.42505 15.3667C8.42505 14.9917 8.73338 14.6833 9.10838 14.6833H16.6667C17.0417 14.6833 17.35 14.9917 17.35 15.3667C17.35 15.75 17.0417 16.05 16.6667 16.05Z" />
                <path d="M16.6667 10.8083H9.10838C8.73338 10.8083 8.42505 10.5 8.42505 10.125C8.42505 9.74998 8.73338 9.44165 9.10838 9.44165H16.6667C17.0417 9.44165 17.35 9.74998 17.35 10.125C17.35 10.5 17.0417 10.8083 16.6667 10.8083Z" />
                <path d="M16.6667 5.55832H9.10838C8.73338 5.55832 8.42505 5.24998 8.42505 4.87498C8.42505 4.49998 8.73338 4.19165 9.10838 4.19165H16.6667C17.0417 4.19165 17.35 4.49998 17.35 4.87498C17.35 5.24998 17.0417 5.55832 16.6667 5.55832Z" />
                <circle
                  cx="4.84595"
                  cy="4.87506"
                  r="1.25"
                  fill={viewType === "table" ? "#3C2875" : "#D0C8D9"}
                />
                <circle
                  cx="4.8457"
                  cy="10.125"
                  r="1.25"
                  fill={viewType === "table" ? "#3C2875" : "#D0C8D9"}
                />
                <circle
                  cx="4.84595"
                  cy="15.125"
                  r="1.25"
                  fill={viewType === "table" ? "#3C2875" : "#D0C8D9"}
                />
              </svg>
              Table
            </button>
            <button
              onClick={() => setViewType("grid")}
              className={`flex items-center gap-1.5 px-2 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                viewType === "grid"
                  ? "bg-[#EAECFFB2] text-raiz-gray-900"
                  : "text-raiz-gray-400 hover:text-raiz-gray-700"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V6.75C16.5 3 15 1.5 11.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5Z"
                  stroke={viewType === "grid" ? "#3C2875" : "#D0C8D9"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 1.5V16.5"
                  stroke={viewType === "grid" ? "#3C2875" : "#D0C8D9"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1.5 9H16.5"
                  stroke={viewType === "grid" ? "#3C2875" : "#D0C8D9"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Grid
            </button>
          </div>

          {/* Currency filter */}
          <div ref={currencyDropdownRef} className="relative">
            <button
              onClick={() => {
                setCurrencyDropdownOpen((v) => !v);
                setDateDropdownOpen(false);
              }}
              className={`flex items-center gap-2 h-9 px-4 text-xs font-medium border rounded-xl transition-colors ${
                currencyDropdownOpen || filterCurrency !== "all"
                  ? "border-[#3c2875] text-[#3c2875] bg-[#3c2875]/5"
                  : "border-raiz-gray-200 text-raiz-gray-700 hover:border-raiz-gray-300"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.99996 18.3334C14.6023 18.3334 18.3333 14.6024 18.3333 10C18.3333 5.39765 14.6023 1.66669 9.99996 1.66669C5.39759 1.66669 1.66663 5.39765 1.66663 10C1.66663 14.6024 5.39759 18.3334 9.99996 18.3334Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.66667 2.5H7.5C5.875 7.36667 5.875 12.6333 7.5 17.5H6.66667"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.5 2.5C14.125 7.36667 14.125 12.6333 12.5 17.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.5 13.3333V12.5C7.36667 14.125 12.6333 14.125 17.5 12.5V13.3333"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.5 7.5C7.36667 5.875 12.6333 5.875 17.5 7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {activeCurrencyLabel}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform ${currencyDropdownOpen ? "rotate-180" : ""}`}
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {currencyDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] bg-white border border-raiz-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
                {CURRENCY_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleCurrencySelect(key)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-left hover:bg-raiz-gray-50 transition-colors ${
                      filterCurrency === key
                        ? "text-[#3c2875] font-semibold bg-[#3c2875]/5"
                        : "text-raiz-gray-700"
                    }`}
                  >
                    {label}
                    {filterCurrency === key && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="#3c2875"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date filter */}
          <div ref={dateDropdownRef} className="relative">
            <button
              onClick={() => {
                setDateDropdownOpen((v) => !v);
                setCurrencyDropdownOpen(false);
              }}
              className={`flex items-center gap-2 h-9 px-4 text-xs font-medium border rounded-xl transition-colors ${
                dateDropdownOpen
                  ? "border-[#3c2875] text-[#3c2875] bg-[#3c2875]/5"
                  : "border-raiz-gray-200 text-raiz-gray-700 hover:border-raiz-gray-300"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect
                  x="1"
                  y="2"
                  width="11"
                  height="10"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M4 1v2M9 1v2M1 5.5h11"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              {activeDateLabel}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`}
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[170px] bg-white border border-raiz-gray-100 rounded-xl shadow-lg py-1 overflow-hidden">
                {DATE_PRESETS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleDateSelect(key)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-left hover:bg-raiz-gray-50 transition-colors ${
                      datePreset === key
                        ? "text-[#3c2875] font-semibold bg-[#3c2875]/5"
                        : "text-raiz-gray-700"
                    }`}
                  >
                    {label}
                    {datePreset === key && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="#3c2875"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        viewType === "grid" ? (
          <GridSkeleton />
        ) : (
          <TableSkeleton />
        )
      ) : currentRequests.length === 0 ? (
        <EmptyList text="No bill requests found" />
      ) : viewType === "grid" ? (
        // ── Grid view ──
        <div className="flex gap-4">
          {/* Cards list */}
          <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
            {currentRequests.map((request) => (
              <GridCard
                key={request.request_transfer_id}
                request={request}
                isSelected={
                  selectedRequest?.request_transfer_id ===
                  request.request_transfer_id
                }
                onClick={() => setSelectedRequest(request)}
                onAccept={handleAccept}
                onReject={handleReject}
                isSent={
                  isSentTab ||
                  sentRequests.some(
                    (s) =>
                      s.request_transfer_id === request.request_transfer_id,
                  )
                }
              />
            ))}
          </div>

          {/* Detail panel */}
          {selectedRequest ? (
            <DetailPanel
              request={selectedRequest}
              onAccept={handleAccept}
              onReject={handleReject}
              isSent={
                isSentTab ||
                sentRequests.some(
                  (s) =>
                    s.request_transfer_id ===
                    selectedRequest.request_transfer_id,
                )
              }
            />
          ) : (
            <div className="flex-1 bg-white rounded-2xl border border-raiz-gray-100 flex items-center justify-center text-raiz-gray-400 text-sm">
              Select a request to view details
            </div>
          )}
        </div>
      ) : (
        // ── Table view ──
        <div className="bg-white rounded-2xl border border-raiz-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-raiz-gray-100 bg-[#F8F7FA]">
                <th className="text-left py-3 pl-4 pr-3 text-[13px] font-medium text-raiz-gray-700">
                  Client / Recipient
                </th>
                <th className="text-left py-3 px-3 text-[13px] font-medium text-raiz-gray-700">
                  Amount
                </th>
                {/* <th className="text-left py-3 px-3 text-[13px] font-medium text-raiz-gray-700">
                  Category
                </th> */}
                <th className="text-left py-3 px-3 text-[13px] font-medium text-raiz-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-3 text-[13px] font-medium text-raiz-gray-700">
                  Status
                </th>
                {/*  <th className="py-3 px-4" /> */}
              </tr>
            </thead>
            <tbody>
              {currentRequests.map((request) => (
                <TableRow
                  key={request.request_transfer_id}
                  request={request}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isSent={
                    isSentTab ||
                    sentRequests.some(
                      (s) =>
                        s.request_transfer_id === request.request_transfer_id,
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && currentRequests.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => {
            setCurrentPage(p);
            setSelectedRequest(null);
          }}
        />
      )}

      {/* ── Modals ── */}
      {openModal === "accept" && selectedRequest && (
        <AcceptBill
          close={() => setOpenModal(null)}
          request={selectedRequest}
          openPayModal={() => setOpenModal("pay")}
        />
      )}
      {openModal === "pay" && selectedRequest && (
        <PayBill
          close={() => setOpenModal(null)}
          goNext={() => setOpenModal("status")}
          status={paymentStatus}
          setStatus={setPaymentStatus}
          request={selectedRequest}
          setPaymentError={setPaymentError}
          setTransactionDetail={setTransactionDetail}
        />
      )}
      {openModal === "status" && selectedRequest && (
        <PaymentStatusModal
          status={paymentStatus}
          amount={selectedRequest.transaction_amount || 0}
          currency={selectedRequest.currency || ""}
          user={selectedRequest.third_party_account}
          close={() => setOpenModal(null)}
          error={paymentError}
          tryAgain={() => setOpenModal("accept")}
          viewReceipt={() => setOpenModal("receipt")}
          type="p2p"
        />
      )}
      {openModal === "receipt" && transactionDetail && (
        <SideModalWrapper close={() => {}}>
          <RaizReceipt
            close={() => setOpenModal(null)}
            data={transactionDetail}
          />
        </SideModalWrapper>
      )}
      {openModal === "reject" && selectedRequest && (
        <RejectBill
          request={selectedRequest}
          close={() => setOpenModal(null)}
        />
      )}
    </div>
  );
};

export default BillRequestsHistory;
