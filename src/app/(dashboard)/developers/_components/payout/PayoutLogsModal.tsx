"use client";

import React, { useMemo, useState } from "react";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import Pagination from "@/components/ui/Pagination";
import { FetchAPILogs } from "@/services/developers";
import { IAPIKeyLogs } from "@/types/services";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";

interface Props {
  close: () => void;
}

const PayoutLogsModal = ({ close }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["payout-logs", currentPage],
    queryFn: () =>
      FetchAPILogs({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      }),
  });

  const logs = useMemo(
    () =>
      (data?.logs ?? []).filter((log: IAPIKeyLogs) =>
        /payout/i.test(log.endpoint),
      ),
    [data?.logs],
  );

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize) || 1;

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-[#41DC0D]";
    if (status >= 400 && status < 500) return "bg-[#FFC857]";
    if (status >= 500) return "bg-[#DC180D]";
    return "bg-[#9CA3AF]";
  };

  return (
    <CenterModalWrapper close={close} wrapperStyle="max-w-[900px]">
      <CenterModalHeader close={close} />
      <div className="flex flex-col font-brSonoma w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-raiz-gray-950 mb-1">
            Payout Logs
          </h2>
          <p className="text-sm text-raiz-gray-600">
            Gateway developer activity for payout endpoints.
          </p>
        </div>

        <div className="bg-raiz-gray-50 rounded-[20px] border border-gray-50 flex-1 overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="p-4">
              <Skeleton count={5} height={40} className="mb-4" />
            </div>
          ) : logs.length > 0 ? (
            <>
              <table className="min-w-full mx-4 text-left text-sm whitespace-nowrap">
                <thead className="border-b border-[#EAECF0] text-[13px] bg-[#F8F7FA]">
                  <tr>
                    <th className="py-4 px-2 text-raiz-gray-700">Timestamp</th>
                    <th className="py-4 px-2 text-raiz-gray-700">Endpoint</th>
                    <th className="py-4 px-2 text-raiz-gray-700">Method</th>
                    <th className="py-4 px-2 text-raiz-gray-700">Status</th>
                    <th className="py-4 px-2 text-raiz-gray-700">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-2 py-4 text-[13px] text-zinc-700">
                        {dayjs(log.created_at).format("DD MMM YYYY, HH:mm:ss")}
                      </td>
                      <td className="px-2 py-4 text-[13px] text-raiz-gray-600 font-mono">
                        {log.endpoint}
                      </td>
                      <td className="px-2 py-4">
                        <span className="font-mono text-[12px] border border-raiz-gray-200 px-2 py-1 rounded">
                          {log.method}
                        </span>
                      </td>
                      <td className="px-2 py-4">
                        <span className="flex w-fit items-center gap-1 px-2.5 py-1 text-[12px] rounded-md border border-raiz-gray-200">
                          <span
                            className={`size-1.5 rounded-full ${getStatusColor(log.status_code)}`}
                          />
                          {log.status_code}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-[13px] text-raiz-gray-700">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center border border-gray-200 border-dashed rounded-lg bg-gray-50 m-4">
              <p className="text-zinc-500">No payout logs found yet.</p>
            </div>
          )}
        </div>
      </div>
    </CenterModalWrapper>
  );
};

export default PayoutLogsModal;
