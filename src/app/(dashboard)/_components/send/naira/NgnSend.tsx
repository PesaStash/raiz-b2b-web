"use client";
import React from "react";
import Tabs from "@/components/ui/Tabs";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import { useSendStore } from "@/store/Send";
import NgnToRaizers from "./toRaizers/NgnToRaizers";
import { INGNSendOptions } from "@/types/misc";
import NgnBankTransfer from "./toBanks/NgnBankTransfer";
import AlipayWechatSend from "./alipayWechat/AlipayWechatSend";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import MobileSheetHeader from "@/components/mobile/MobileSheetHeader";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

const NgnSend = ({ close }: { close: () => void }) => {
  const { actions, user, ngnSendType, externalUser } = useSendStore();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleTypeChange = (value: INGNSendOptions) => {
    actions.selectNGNSendOption(value);
  };

  const showRecipientPicker = !user && !externalUser;

  return (
    <div className="flex flex-col h-full min-h-0">
      {showRecipientPicker &&
        (isMobile ? (
          <MobileSheetHeader title="Find Recipient" onBack={close} />
        ) : (
          <>
            <CenterModalHeader close={close} />
            <SideWrapperHeader
              title="Find Recipient"
              close={() => actions.selectUser(null)}
              titleColor="text-zinc-900 "
              backArrow={false}
            />
          </>
        ))}

      {showRecipientPicker && (
        <Tabs
          className="!mt-0 md:!mb-3 !mb-6"
          options={[
            { label: "Send to Raizer", shortLabel: "Raizer", value: "to Raizer" },
            { label: "Send to bank", shortLabel: "Bank", value: "to other bank" },
            {
              label: "Alipay / WeChat",
              shortLabel: "Alipay",
              value: "alipay-wechat",
            },
          ]}
          selected={ngnSendType}
          onChange={handleTypeChange}
        />
      )}

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {ngnSendType === "to Raizer" && <NgnToRaizers />}
        {ngnSendType === "to other bank" && <NgnBankTransfer />}
        {ngnSendType === "alipay-wechat" && <AlipayWechatSend close={close} />}
      </div>
    </div>
  );
};

export default NgnSend;
