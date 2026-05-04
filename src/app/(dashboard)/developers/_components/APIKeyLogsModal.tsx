import React, { useState } from "react";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import {
  IDeveloperApiKey,
  IAPILogsParams,
  IAPIKeyLogs,
} from "@/types/services";
import { useQuery } from "@tanstack/react-query";
import { FetchAPILogs } from "@/services/developers";
import Pagination from "@/components/ui/Pagination";
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";

interface Props {
  apiKey: IDeveloperApiKey;
  close: () => void;
}

const APIKeyLogsModal = ({ apiKey, close }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["api-logs", apiKey.id, currentPage],
    queryFn: () =>
      FetchAPILogs({
        key_id: apiKey.id,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      }),
    enabled: !!apiKey.id,
  });

  const logs: IAPIKeyLogs[] = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-[#41DC0D] ";
    if (status >= 400 && status < 500) return "bg-[#FFC857] ";
    if (status >= 500) return "bg-[#DC180D] ";
    return "bg-[#9CA3AF] ";
  };

  return (
    <CenterModalWrapper close={close} wrapperStyle="max-w-[800px]">
      <CenterModalHeader close={close} />
      <div className="flex flex-col font-brSonoma w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-raiz-gray-950 mb-1">
            {apiKey.name}
          </h2>
        </div>

        <div className="bg-raiz-gray-50 rounded-[20px] shadow-[0px_4px_30px_0px_rgba(0,0,0,0.03)] border border-gray-50 flex-1 overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="p-4">
              <Skeleton count={5} height={40} className="mb-4" />
            </div>
          ) : logs.length > 0 ? (
            <>
              <p className="text-raiz-gray-950  p-5 text-lg font-bold leading-5">
                {`${apiKey?.key_prefix}_••••••••••••${apiKey?.id?.slice(-4)}`}
              </p>
              <table className="min-w-[90%]  mx-6 text-left text-sm whitespace-nowrap">
                <thead className="border-b border-[#EAECF0] text-[13px] bg-[#F8F7FA]">
                  <tr>
                    <th className="py-4 px-2 text-raiz-gray-700  whitespace-nowrap">
                      Time stamp
                    </th>
                    <th className="py-4 px-2 text-raiz-gray-700 ">Endpoint</th>
                    <th className="py-4 px-2 text-raiz-gray-700 ">Method</th>
                    <th className="py-4 px-2 text-raiz-gray-700 ">Status</th>

                    <th className="py-4 px-2 text-raiz-gray-700 ">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-2 py-4 text-[13px] text-zinc-700 font-medium">
                        {dayjs(log.created_at).format("DD MMM YYYY, HH:mm:ss")}
                      </td>
                      <td className="px-2 py-4 text-[13px] text-raiz-gray-600 font-mono">
                        {log.endpoint}
                      </td>
                      <td className="px-2 py-4">
                        <span className="font-mono text-[12px] font-medium text-raiz-gray-700 border border-raiz-gray-200 px-2 py-1 rounded">
                          {log.method}
                        </span>
                      </td>
                      <td className="px-2 py-4">
                        <span
                          className={` items-center gap-1 px-2.5 py-1 text-[12px] flex w-fit rounded-md border border-raiz-gray-200 text-raiz-gray-700 font-medium`}
                        >
                          <div
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
              <p className="text-zinc-500">No logs found for this API key.</p>
            </div>
          )}
        </div>
      </div>
    </CenterModalWrapper>
  );
};

export default APIKeyLogsModal;
