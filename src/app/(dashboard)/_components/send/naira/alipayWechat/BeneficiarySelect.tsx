"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetAlipayWechatBeneficiariesApi } from "@/services/transactions";
import { IAlipayWechatBeneficiary } from "@/types/services";
import Avatar from "@/components/ui/Avatar";
import { FlowHeader, FlowCard } from "@/components/transactions/send-flow/Flow";
import CreateBeneficiary from "./CreateBeneficiary";

interface Props {
  channel: "alipay" | "wechat";
  onSelect: (beneficiary: IAlipayWechatBeneficiary) => void;
  onBack: () => void;
}
export default function BeneficiarySelect({
  channel,
  onSelect,
  onBack,
}: Props) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["alipay-wechat-beneficiaries", channel, page],
    queryFn: () => GetAlipayWechatBeneficiariesApi({ page, limit: 20 }),
  });
  const recipients = (data?.beneficiaries ?? []).filter(
    (b) =>
      b.channel === channel &&
      [b.name, b.email, b.phone_number]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  const label = channel === "alipay" ? "Alipay" : "WeChat Pay";
  if (creating)
    return (
      <>
        <FlowHeader
          title={`Add ${label} recipient`}
          subtitle="Enter their details and upload their payment QR code."
          onBack={() => setCreating(false)}
        />
        <FlowCard>
          <CreateBeneficiary
            channel={channel}
            onCreated={(b) => {
              refetch();
              onSelect(b);
            }}
          />
        </FlowCard>
      </>
    );
  return (
    <>
      <FlowHeader
        title={`Send to ${label}`}
        subtitle="Choose a saved recipient or add someone new."
        onBack={onBack}
      />
      <FlowCard>
        <label className="text-[13px] text-[#79708d]">
          Search recipients
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email or phone number"
            className="mt-2 w-full rounded-xl bg-[#f4f4f8] px-4 py-3.5 text-sm text-[#19151e] outline-primary2"
          />
        </label>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-xl border border-[#eaecf0] p-4 text-left text-sm font-semibold text-primary2"
        >
          + Add a new recipient
        </button>
        {isPending && (
          <p role="status" className="py-6 text-center text-sm text-[#79708d]">
            Loading recipients…
          </p>
        )}
        {isError && (
          <p role="alert" className="text-sm">
            Could not load recipients.{" "}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-primary2 font-semibold"
            >
              Retry
            </button>
          </p>
        )}
        {!isPending && !isError && recipients.length === 0 && (
          <p className="py-6 text-center text-sm text-[#79708d]">
            {search
              ? "No matching recipients on this page."
              : "No saved recipients on this page."}
          </p>
        )}
        {recipients.map((b) => (
          <button
            key={b.alipay_wechat_beneficiary_id}
            type="button"
            onClick={() => onSelect(b)}
            className="flex items-center gap-3 rounded-xl border border-[#eaecf0] px-4 py-3 text-left hover:bg-[#f8f7fa]"
          >
            <Avatar name={b.name} src="" size={44} />
            <span className="min-w-0">
              <strong className="block text-sm">{b.name}</strong>
              <span className="block break-words text-xs text-[#79708d]">
                {b.phone_number || b.email}
              </span>
            </span>
          </button>
        ))}
        {data && data.pagination.total_pages > 1 && (
          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              disabled={!data.pagination.previous_page}
              onClick={() => setPage((p) => p - 1)}
              className="text-primary2 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              {data.pagination.current_page} / {data.pagination.total_pages}
            </span>
            <button
              type="button"
              disabled={!data.pagination.next_page}
              onClick={() => setPage((p) => p + 1)}
              className="text-primary2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </FlowCard>
    </>
  );
}
