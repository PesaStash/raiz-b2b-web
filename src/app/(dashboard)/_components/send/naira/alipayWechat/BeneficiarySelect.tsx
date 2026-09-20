"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { GetAlipayWechatBeneficiariesApi } from "@/services/transactions";
import { IAlipayWechatBeneficiary } from "@/types/services";
import Avatar from "@/components/ui/Avatar";
import Overlay from "@/components/ui/Overlay";
import SideWrapperHeader from "@/components/SideWrapperHeader";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showChooser, setShowChooser] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["alipay-wechat-beneficiaries", channel, page],
    queryFn: () => GetAlipayWechatBeneficiariesApi({ page, limit: 20 }),
  });

  const filtered = useMemo(() => {
    const list = data?.beneficiaries.filter((b) => b.channel === channel) ?? [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter((b) => {
      const haystack = [b.name, b.email, b.phone_number].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }, [data?.beneficiaries, channel, searchTerm]);

  const pagination = data?.pagination;
  const hasBeneficiaries = filtered.length > 0;

  const handleSelect = (b: IAlipayWechatBeneficiary) => {
    setSelectingId(b.alipay_wechat_beneficiary_id);
    setShowChooser(false);
    onSelect(b);
  };

  const handleCreated = (b: IAlipayWechatBeneficiary) => {
    refetch();
    onSelect(b);
  };

  const subtitleFor = (b: IAlipayWechatBeneficiary) => {
    if (b.phone_number) return b.phone_number;
    if (b.email) return b.email;
    return "";
  };

  return (
    <div className="p-0 md:p-6 h-full flex flex-col min-h-0 overflow-y-auto no-scrollbar">
      <SideWrapperHeader
        title={channelLabel[channel]}
        close={onBack}
        titleColor="text-zinc-900"
        rightComponent={
          <Image src="/icons/users.svg" alt="" width={20} height={20} />
        }
      />

      <div className="relative w-full shrink-0 mb-5">
        <Image
          className="absolute top-1/2 left-3.5 -translate-y-1/2 pointer-events-none"
          src="/icons/search.svg"
          alt=""
          width={20}
          height={20}
        />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter a username or email address"
          className="pl-11 pr-4 h-12 w-full bg-raiz-gray-50 text-sm rounded-2xl border border-raiz-gray-200 focus:outline-none focus:border-primary2/40 focus:ring-2 focus:ring-primary2/10"
        />
      </div>

      <div className="rounded-[20px] bg-raiz-gray-50 p-4 md:p-5 flex-1 min-h-0">
        <h4 className="text-raiz-gray-950 text-sm font-bold leading-tight mb-3">
          Beneficiary
        </h4>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-raiz-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <p className="text-raiz-gray-500 text-sm text-center">
              Could not load beneficiaries.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-primary2 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && !hasBeneficiaries && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-raiz-gray-200 flex items-center justify-center flex-shrink-0">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="text-raiz-gray-500"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 7v5l3 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-raiz-gray-500 text-sm">No beneficiary yet</p>
          </div>
        )}

        {!isLoading && !isError && hasBeneficiaries && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 mb-6">
            {filtered.map((b) => {
              const isSelecting =
                selectingId === b.alipay_wechat_beneficiary_id;
              return (
                <button
                  key={b.alipay_wechat_beneficiary_id}
                  type="button"
                  onClick={() => handleSelect(b)}
                  disabled={selectingId !== null}
                  className="flex flex-col items-center gap-1.5 min-w-[72px] max-w-[88px] disabled:opacity-60"
                >
                  <div className="relative">
                    <Avatar
                      name={b.name}
                      src={b.qr_code_url || null}
                      size={52}
                    />
                    {isSelecting && (
                      <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-raiz-gray-950 text-xs font-semibold truncate w-full text-center">
                    {b.name}
                  </p>
                  <p className="text-raiz-gray-500 text-[10px] truncate w-full text-center">
                    {subtitleFor(b)}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && (
          <CreateBeneficiary
            channel={channel}
            onCreated={handleCreated}
            showChooseLink={hasBeneficiaries}
            onChooseBeneficiary={() => setShowChooser(true)}
            submitLabel={hasBeneficiaries ? "Save Recipient" : "Continue"}
          />
        )}

        {pagination && pagination.total_pages > 1 && hasBeneficiaries && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.previous_page}
              className="text-primary2 text-sm disabled:text-raiz-gray-300"
            >
              Previous
            </button>
            <span className="text-raiz-gray-500 text-xs">
              {pagination.current_page} / {pagination.total_pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.next_page}
              className="text-primary2 text-sm disabled:text-raiz-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showChooser && (
        <Overlay close={() => setShowChooser(false)} width="400px">
          <div className="flex flex-col h-full py-8 px-5">
            <h5 className="text-raiz-gray-950 text-xl font-bold leading-normal mb-4">
              Choose Beneficiary
            </h5>
            <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar">
              {filtered.map((b) => (
                <button
                  key={b.alipay_wechat_beneficiary_id}
                  type="button"
                  onClick={() => handleSelect(b)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-raiz-gray-200 bg-white hover:border-primary2/40 text-left"
                >
                  <Avatar name={b.name} src={b.qr_code_url || null} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-raiz-gray-950 text-sm font-bold truncate">
                      {b.name}
                    </p>
                    <p className="text-raiz-gray-500 text-xs truncate">
                      {subtitleFor(b)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};

export default BeneficiarySelect;
