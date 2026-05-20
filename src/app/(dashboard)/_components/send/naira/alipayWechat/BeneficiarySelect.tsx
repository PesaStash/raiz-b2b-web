"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { GetAlipayWechatBeneficiariesApi } from "@/services/transactions";
import { IAlipayWechatBeneficiary } from "@/types/services";
import CreateBeneficiary from "./CreateBeneficiary";

interface Props {
  channel: "alipay" | "wechat";
  onSelect: (beneficiary: IAlipayWechatBeneficiary) => void;
  onBack: () => void;
}

const channelLabel: Record<"alipay" | "wechat", string> = {
  alipay: "Alipay",
  wechat: "WeChat Pay",
};

const BeneficiarySelect = ({ channel, onSelect, onBack }: Props) => {
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["alipay-wechat-beneficiaries", channel, page],
    queryFn: () => GetAlipayWechatBeneficiariesApi({ page, limit: 20 }),
  });

  const filtered =
    data?.beneficiaries.filter((b) => b.channel === channel) ?? [];
  const pagination = data?.pagination;

  const handleCreated = (b: IAlipayWechatBeneficiary) => {
    refetch();
    onSelect(b);
  };

  if (showCreate) {
    return (
      <div className="p-6 h-full overflow-y-auto no-scrollbar">
        <button onClick={() => setShowCreate(false)} className="mb-6">
          <Image
            src="/icons/arrow-left.svg"
            width={18}
            height={18}
            alt="back"
          />
        </button>
        <h3 className="text-raiz-gray-950 text-base font-bold leading-tight mb-6">
          New {channelLabel[channel]} recipient
        </h3>
        <CreateBeneficiary
          channel={channel}
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto no-scrollbar">
      <button onClick={onBack} className="mb-6 self-start">
        <Image src="/icons/arrow-left.svg" width={18} height={18} alt="back" />
      </button>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-raiz-gray-950 text-base font-bold leading-tight">
          Select recipient
        </h3>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-raiz-purple-600 text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Add new
        </button>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-raiz-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-raiz-gray-500 text-sm text-center">
            Could not load beneficiaries.
          </p>
          <button
            onClick={() => refetch()}
            className="text-raiz-purple-600 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-raiz-gray-100 flex items-center justify-center">
            <img
              src={`/icons/${channel}.svg`}
              width={32}
              height={32}
              alt={channelLabel[channel]}
            />
          </div>
          <div>
            <p className="text-raiz-gray-950 text-sm font-bold mb-1">
              No saved recipients
            </p>
            <p className="text-raiz-gray-500 text-xs">
              Add a {channelLabel[channel]} recipient to get started.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 rounded-2xl bg-raiz-purple-600 text-white text-sm font-bold"
          >
            Add recipient
          </button>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="flex flex-col gap-3 flex-1">
          {filtered.map((b) => {
            const isSelecting = selectingId === b.alipay_wechat_beneficiary_id;
            return (
              <button
                key={b.alipay_wechat_beneficiary_id}
                onClick={() => {
                  setSelectingId(b.alipay_wechat_beneficiary_id);
                  onSelect(b);
                }}
                disabled={selectingId !== null}
                className="flex items-center gap-3 p-3 rounded-2xl border border-raiz-gray-200 bg-white hover:border-raiz-purple-500 hover:bg-raiz-purple-50 transition-all duration-200 text-left disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-raiz-gray-100 flex-shrink-0">
                  {b.qr_code_url ? (
                    <img
                      src={b.qr_code_url}
                      alt={`${b.name} QR`}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={`/icons/${channel}.svg`}
                      width={24}
                      height={24}
                      alt={channelLabel[channel]}
                      className="m-2"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-raiz-gray-950 text-sm font-bold truncate">
                    {b.name}
                  </p>
                  <p className="text-raiz-gray-500 text-xs truncate">{b.email}</p>
                </div>
                {isSelecting ? (
                  <div className="w-4 h-4 border-2 border-raiz-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="flex-shrink-0 text-raiz-gray-300"
                  >
                    <path
                      d="M6 3L11 8L6 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.previous_page}
                className="text-raiz-purple-600 text-sm disabled:text-raiz-gray-300"
              >
                Previous
              </button>
              <span className="text-raiz-gray-500 text-xs">
                {pagination.current_page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.next_page}
                className="text-raiz-purple-600 text-sm disabled:text-raiz-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BeneficiarySelect;
