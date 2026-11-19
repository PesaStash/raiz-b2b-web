"use client";
import SendOptions from "@/components/transactions/send-flow/SendOptions";
import { useSendStore } from "@/store/Send";

export default function UsdSendOptions({ close }: { close: () => void }) {
  const { actions } = useSendStore();
  return (
    <SendOptions
      close={close}
      onSelect={(method) => {
        if (method === "raizer") actions.selectUSDSendOption("to Raizer");
        if (method === "bank") actions.selectUSDSendOption("usBank");
        if (method === "remittance")
          actions.selectUSDSendOption("internationalRemittance");
        if (method === "china") actions.selectUSDSendOption("alipay-wechat");
        if (method === "crypto") actions.selectUSDSendOption("crypto");
        if (method === "swift") actions.selectUSDSendOption("swift");
      }}
    />
  );
}
