"use client";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import React, { useState } from "react";
import SendOptions from "@/components/transactions/send-flow/SendOptions";
import { FlowHeader } from "@/components/transactions/send-flow/Flow";
import { useTransactionCategories } from "@/lib/hooks/useTransactionCategories";
import { useSendStore } from "@/store/Send";
import NgnToRaizers from "./toRaizers/NgnToRaizers";
import { INGNSendOptions } from "@/types/misc";
import NgnBankTransfer from "./toBanks/NgnBankTransfer";
import AlipayWechatSend from "./alipayWechat/AlipayWechatSend";

const NgnSend = ({ close }: { close: () => void }) => {
  const { actions, user, ngnSendType, externalUser } = useSendStore();
  useTransactionCategories();
  const [choosingMethod, setChoosingMethod] = useState(!user && !externalUser);
  const [chinaPayPastChannel, setChinaPayPastChannel] = useState(false);

  const handleTypeChange = (value: INGNSendOptions) => {
    setChinaPayPastChannel(false);
    actions.selectNGNSendOption(value);
  };

  const showRecipientPicker =
    !user &&
    !externalUser &&
    !(ngnSendType === "alipay-wechat" && chinaPayPastChannel);

  if (choosingMethod)
    return (
      <SendOptions
        close={close}
        onSelect={(method) => {
          handleTypeChange(
            method === "raizer"
              ? "to Raizer"
              : method === "china"
                ? "alipay-wechat"
                : "to other bank",
          );
          setChoosingMethod(false);
        }}
      />
    );

  return (
    <div className="flex flex-col min-h-0">
      {showRecipientPicker && ngnSendType === "to other bank" && (
        <FlowHeader
          title={
            ngnSendType === "to other bank"
              ? "Nigerian bank recipient"
              : "Alipay & WeChat"
          }
          onBack={() => setChoosingMethod(true)}
        />
      )}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {ngnSendType === "to Raizer" && (
          <NgnToRaizers close={() => setChoosingMethod(true)} />
        )}
        {ngnSendType === "to other bank" && (
          <NgnBankTransfer close={() => setChoosingMethod(true)} />
        )}
        {ngnSendType === "alipay-wechat" && (
          <AlipayWechatSend
            close={() => setChoosingMethod(true)}
            onPastChannelChange={setChinaPayPastChannel}
          />
        )}
      </div>
    </div>
  );
};

export default withBusinessWrite(NgnSend);
