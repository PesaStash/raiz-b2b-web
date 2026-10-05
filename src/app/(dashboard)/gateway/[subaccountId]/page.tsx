"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import Loading from "@/app/loading";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { FetchGatewaySubaccountApi } from "@/services/gateway";
import {
  getGatewayStatusLabel,
  getGatewayStatusTone,
  getSubaccountDisplayName,
  shouldShowRejectionBanner,
} from "../_utils/subaccountHelpers";
import RejectionBanner from "../_components/RejectionBanner";
import AccountInstructions from "../_components/AccountInstructions";
import SubaccountActivities from "../_components/SubaccountActivities";

const SubaccountDetailPage = () => {
  const params = useParams<{ subaccountId: string }>();
  const router = useRouter();
  const subaccountId = params.subaccountId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["gateway-subaccount", subaccountId],
    queryFn: () => FetchGatewaySubaccountApi(subaccountId),
    enabled: !!subaccountId,
  });

  if (isLoading) return <Loading />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-raiz-gray-700 text-sm">
          Gateway subaccount not found
        </p>
        <Button
          className="!w-auto h-10 px-5"
          onClick={() => router.push("/gateway")}
        >
          Back to Gateway
        </Button>
      </div>
    );
  }

  const name = getSubaccountDisplayName(data);
  const email = data.customer_snapshot?.email;
  const phone = data.customer_snapshot?.phone;
  const showBanner = shouldShowRejectionBanner(data.status);
  const metaParts = [
    email,
    // phone,
    data.created_at
      ? `Created ${dayjs(data.created_at).format("MMM D, YYYY")}`
      : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-5 md:gap-6 min-w-0 pb-24 md:pb-8">
      <div className="flex items-start gap-3 min-w-0">
        <Link
          href="/gateway"
          className="inline-flex items-center justify-center size-10 rounded-full border border-raiz-gray-200 bg-white hover:bg-raiz-gray-50 shrink-0"
          aria-label="Back to Gateway"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="#443852"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl  font-bold text-raiz-gray-950 truncate leading-tight">
              {name}
            </h1>
            <StatusBadge
              label={getGatewayStatusLabel(data.status)}
              tone={getGatewayStatusTone(data.status)}
              variant="outlined"
            />
          
          </div>
          {metaParts.length > 0 ? (
            <p className="mt-1.5 text-[13px] text-[#6F5B86]">
              {metaParts.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      {showBanner ? (
        <RejectionBanner
          status={data.status}
          rejectionReasons={data.rejection_reasons}
          missingRequirements={data.missing_requirements}
          retryEligible={data.retry_eligible}
          kycLink={data.kyc_link}
        />
      ) : null}

      <AccountInstructions
        accounts={data.accounts || []}
        status={data.status}
      />

      <SubaccountActivities subaccountId={data.subaccount_id} />
    </div>
  );
};

export default SubaccountDetailPage;
