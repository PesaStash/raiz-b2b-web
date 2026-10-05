"use client";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import React, { useState } from "react";
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
  const [chinaPayPastChannel, setChinaPayPastChannel] = useState(false);

  const handleTypeChange = (value: INGNSendOptions) => {
    setChinaPayPastChannel(false);
    actions.selectNGNSendOption(value);
  };

  const showRecipientPicker =
    !user && !externalUser && !(ngnSendType === "alipay-wechat" && chinaPayPastChannel);

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
            {
              label: "China Pay",
              shortLabel: "China Pay",
              value: "alipay-wechat",
            },
            {
              label: "Send to other bank",
              shortLabel: "Bank",
              value: "to other bank",
            },
          ]}
          selected={ngnSendType}
          onChange={handleTypeChange}
        />
      )}

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {ngnSendType === "to Raizer" && <NgnToRaizers />}
        {ngnSendType === "to other bank" && <NgnBankTransfer />}
        {ngnSendType === "alipay-wechat" && (
          <AlipayWechatSend
            close={close}
            onPastChannelChange={setChinaPayPastChannel}
          />
        )}
      </div>
    </div>
  );
};

export default withBusinessWrite(NgnSend);
