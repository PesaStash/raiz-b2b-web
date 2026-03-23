"use client";
import Button from "@/components/ui/Button";
import ListDetailItem from "@/components/ui/ListDetailItem";
import Overlay from "@/components/ui/Overlay";
import { useTopupStore } from "@/store/TopUp";
import { formatAmount } from "@/utils/helpers";
import dayjs from "dayjs";
import React from "react";

interface Props {
  goBack: () => void;
  goNext: () => void;
  type: "guest" | "top-up";
}

const ZelleTopupInfo = ({ goBack, goNext, type }: Props) => {
  const { zelleInfo } = useTopupStore();
  return (
    <Overlay close={goBack} width="375px">
      <div className="flex flex-col  h-full py-8 px-5 ">
        <div className="text-center mb-4">
          <h3 className="text-zinc-900 text-xl font-bold leading-normal">
            {type === "guest" ? "Send" : "Top up"} via Zelle
          </h3>
          <p className="text-yellow-500 font-medium">Important:</p>
          <p className="text-zinc-900 text-left text-xs leading-tight">
            Make sure the memo code and amount matches or funds won&apos;t be
            credited.
          </p>
          <p className="text-yellow-500 text-left text-xs leading-tight">
            Zelle payments must come from an account in your name. Third party
            payments will be require verifications before being credited.
          </p>
        </div>
        <div className="flex flex-col gap-5 mb-5">
          <ListDetailItem
            border
            title="Amount"
            value={`$${formatAmount(zelleInfo?.expected_amount || 0)}`}
            copyable
          />
          <ListDetailItem
            border
            title="Memo code"
            value={zelleInfo?.memo_code || 0}
            copyable
          />
          <ListDetailItem
            border
            title="Send to"
            value={zelleInfo?.send_to || ""}
            copyable
          />
          <ListDetailItem
            title="Expires at"
            value={dayjs(zelleInfo?.expires_at || "").format(
              "DD/MM/YYYY, h:mm:ss A",
            )}
          />
          <div className="rounded-md text-xs p-2 bg-zinc-100">
            <p className="font-semibold mb-1 ">
              If verification is required, you'll need to provide:
            </p>
            <div className="flex flex-col gap-1">
              <li className="list-disc ml-4">The name on Zelle account</li>
              <li className="list-disc ml-4">
                The phone number or email connected to the zelle account.
              </li>
            </div>
          </div>
        </div>
        <Button onClick={goNext}>I&apos;ve completed the Zelle transfer</Button>
      </div>
    </Overlay>
  );
};

export default ZelleTopupInfo;
