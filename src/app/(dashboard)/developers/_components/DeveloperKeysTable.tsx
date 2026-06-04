"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import { IDeveloperApiKey } from "@/types/services";
import { FetchDeveloperApiKeysApi, RevokeAPIKey } from "@/services/developers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
// import DateRange from "../../transactions/_components/DateRange";
// import { format } from "date-fns";
import { LiaTimesSolid } from "react-icons/lia";
import APIKeyTableOptions from "./APIKeyTableOptions";
import APIKeyLogsModal from "./APIKeyLogsModal";
import Overlay from "@/components/ui/Overlay";

const columnHelper = createColumnHelper<IDeveloperApiKey>();

interface DeveloperKeysTableProps {
  onGenerateKey: () => void;
}

const DeveloperKeysTable = ({ onGenerateKey }: DeveloperKeysTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [selectedKeyForLogs, setSelectedKeyForLogs] =
    useState<IDeveloperApiKey | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<IDeveloperApiKey | null>(null);
  const pageSize = 10;

  const queryClient = useQueryClient();

  const { mutate: revokeKey, isPending: isRevokePending } = useMutation({
    mutationFn: RevokeAPIKey,
    onSuccess: () => {
      toast.success("API key revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["developer-keys"] });
      setKeyToRevoke(null);
    },
    onError: (err: any) => {
      setKeyToRevoke(null);
    },
  });

  const handleRevoke = (apiKey: IDeveloperApiKey) => {
    setKeyToRevoke(apiKey);
  };

  const confirmRevoke = () => {
    if (keyToRevoke) {
      revokeKey(keyToRevoke.id);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["developer-keys"],
    queryFn: FetchDeveloperApiKeysApi,
  });

  const keys = data || [];
  const totalPages = Math.ceil(keys.length / pageSize) || 1;
  const paginatedKeys = useMemo(
    () => keys.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [keys, currentPage, pageSize],
  );

  const columns = useMemo<ColumnDef<IDeveloperApiKey, any>[]>(
    () => [
      columnHelper.accessor("name", {
        header: () => "Name/Preview",
        cell: (info) => (
          <div className="flex flex-col py-1">
            <span className="text-[14px] font-bold text-zinc-900 mb-1">
              {info.getValue()}
            </span>
            <span className="text-[13px] text-zinc-500 font-medium">
              {`${info.row.original.key_prefix}_••••••••••••${info.row.original.id.slice(
                -4,
              )}`}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("permissions", {
        header: () => "Permissions",
        cell: (info) => {
          const permissions = info.getValue() || [];
          return (
            <div className="flex flex-wrap gap-2 min-w-[200px] lg:min-w-[350px] max-w-full lg:max-w-[450px]">
              {permissions.map((perm: string, i: number) => {
                let label = perm;
                if (perm === "customers:write" || perm === "Cust... write")
                  label = "Cust... write";
                else if (perm === "customers:read" || perm === "Cust... read")
                  label = "Cust... read";
                else if (perm === "payments:write" || perm === "Paym... write")
                  label = "Paym... write";
                else if (perm === "payments:read" || perm === "Paym... read")
                  label = "Paym... read";
                else if (perm === "webhooks:write" || perm === "webh... write")
                  label = "webh... write";
                else if (perm === "webhooks:read" || perm === "webh... read")
                  label = "webh... read";

                return (
                  <div
                    key={i}
                    title={perm}
                    className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-zinc-700 bg-white shadow-sm whitespace-nowrap"
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => "Date",
        cell: (info) => (
          <span className="text-[14px] text-zinc-600 font-medium">
            {info.getValue()
              ? dayjs(info.getValue()).format("DD MMM YYYY @ HH:mm")
              : "-"}
          </span>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: () => "Status",
        cell: (info) => {
          const isActive = info.getValue() !== false;
          return (
            <div className="w-fit flex items-center px-2 py-1 gap-1.5 text-[13px] border border-gray-200 rounded-md font-medium text-zinc-700 bg-white shadow-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              {isActive ? "Active" : "Disabled"}
            </div>
          );
        },
      }),
      columnHelper.accessor("environment", {
        header: () => "Environment",
        cell: (info) => {
          const env = (info.getValue() as string)?.toLowerCase() || "";

          return (
            <div
              className={`w-fit flex items-center px-3 py-1.5 gap-1.5 text-[13px] border rounded-md font-medium ${
                env === "production"
                  ? "border-[#1671D9] bg-[#1671D9]/10 text-[#1671D9]"
                  : "border-[#F2A735] bg-[#F2A735]/10 text-[#F2A735]"
              }`}
            >
              {env}
            </div>
          );
        },
      }),
      columnHelper.accessor("id", {
        header: "",
        cell: (info) => {
          const isLast =
            info.row.index >= info.table.getRowModel().rows.length - 3;
          return (
            <APIKeyTableOptions
              apiKey={info.row.original}
              isLast={isLast}
              onViewLogs={setSelectedKeyForLogs}
              onRevoke={handleRevoke}
              onDelete={() => {}}
            />
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: paginatedKeys,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full flex flex-col flex-1 bg-white rounded-[20px] shadow-[0px_4px_30px_0px_rgba(0,0,0,0.03)] border border-gray-50 mt-6 p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h3 className="text-[18px] font-bold text-zinc-900">Your Keys</h3>
        {/* <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDateRange(!showDateRange)}
              className="flex gap-1.5 items-center px-3.5 py-2.5 rounded-lg border border-gray-200 shadow-sm transition-colors hover:bg-gray-50"
            >
              <Image
                src={"/icons/calendar.svg"}
                alt="calendar"
                width={20}
                height={20}
              />
              <span className="text-zinc-800 text-sm font-semibold leading-none">
                {dateRange.startDate && dateRange.endDate
                  ? `${format(dateRange.startDate, "dd MMM")} - ${format(
                      dateRange.endDate,
                      "dd MMM",
                    )}`
                  : "Select dates"}
              </span>
            </button>
            {showDateRange && (
              <DateRange
                onApply={setDateRange}
                onClose={() => setShowDateRange(false)}
              />
            )}
          </div>
          {dateRange.startDate && (
            <button
              onClick={() => setDateRange({})}
              className="flex items-center justify-center w-10 h-10 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline outline-1 outline-offset-[-1px] outline-zinc-200"
            >
              <LiaTimesSolid />
            </button>
          )}
          
        </div> */}
      </div>

      {isLoading ? (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="whitespace-nowrap">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="py-4 px-4 text-zinc-500 bg-[#FAFAFA] text-[13px] font-medium"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td colSpan={5}>
                  <Skeleton count={4} className="mb-3" height={60} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : keys.length > 0 ? (
        <div className="flex flex-col">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-[#FAFAFA]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="whitespace-nowrap">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-4 px-6 text-zinc-500 text-[13px] font-medium"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/50 transition-colors whitespace-nowrap"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center border border-gray-200 border-dashed rounded-lg bg-gray-50">
          <p className="text-zinc-500 mb-4">No API keys found.</p>
          <Button
            onClick={onGenerateKey}
            width="fit"
            className="px-5 py-2.5 h-10 gap-2 rounded-full flex items-center "
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M9.99996 1.66663C5.40829 1.66663 1.66663 5.40829 1.66663 9.99996C1.66663 14.5916 5.40829 18.3333 9.99996 18.3333C14.5916 18.3333 18.3333 14.5916 18.3333 9.99996C18.3333 5.40829 14.5916 1.66663 9.99996 1.66663ZM13.3333 10.625H10.625V13.3333C10.625 13.675 10.3416 13.9583 9.99996 13.9583C9.65829 13.9583 9.37496 13.675 9.37496 13.3333V10.625H6.66663C6.32496 10.625 6.04163 10.3416 6.04163 9.99996C6.04163 9.65829 6.32496 9.37496 6.66663 9.37496H9.37496V6.66663C9.37496 6.32496 9.65829 6.04163 9.99996 6.04163C10.3416 6.04163 10.625 6.32496 10.625 6.66663V9.37496H13.3333C13.675 9.37496 13.9583 9.65829 13.9583 9.99996C13.9583 10.3416 13.675 10.625 13.3333 10.625Z"
                  fill="#FDFDFD"
                />
              </svg>
            }
          >
            <span className="text-[15px] font-medium ml-4">
              Generate your first API key
            </span>
          </Button>
        </div>
      )}

      {selectedKeyForLogs && (
        <APIKeyLogsModal
          apiKey={selectedKeyForLogs}
          close={() => setSelectedKeyForLogs(null)}
        />
      )}

      {keyToRevoke && (
        <Overlay
          width="400px"
          close={() => !isRevokePending && setKeyToRevoke(null)}
        >
          <div className="flex flex-col p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-raiz-gray-950 font-bold text-lg leading-normal">
                Revoke API Key
              </h4>
              <button
                onClick={() => !isRevokePending && setKeyToRevoke(null)}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                disabled={isRevokePending}
              >
                <LiaTimesSolid size={20} />
              </button>
            </div>

            <p className="text-sm text-raiz-gray-600 mb-6">
              Are you sure you want to revoke the{" "}
              <span className="font-semibold text-raiz-gray-950">
                {keyToRevoke.name}
              </span>{" "}
              API key? This action is permanent and any integrations using this
              key will immediately fail.
            </p>

            <div className="bg-[#FFE6E666] rounded-md p-3 flex items-center gap-2 mb-6">
              <Image
                src={"/icons/info-green.svg"}
                alt="info"
                width={20}
                height={20}
              />
              <span className="text-raiz-gray-600 text-[11px]">
                This action cannot be undone.
              </span>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="primary"
                className="flex-1 py-3 bg-red-600 hover:!bg-red-700 border-none"
                onClick={confirmRevoke}
                loading={isRevokePending}
              >
                Revoke
              </Button>
              <Button
                variant="tertiary"
                className="flex-1 py-3 bg-[#FDDCDA] hover:!bg-[#FDDCDA]/80"
                onClick={() => setKeyToRevoke(null)}
                disabled={isRevokePending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};

export default DeveloperKeysTable;
