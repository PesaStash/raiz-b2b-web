import { withBusinessWrite } from "@/components/team/BusinessWrite";
import React from "react";
import SendOptions from "./SendOptions";
import ToRaizers from "./toRaizers/ToRaizers";
import { useTransactionCategories } from "@/lib/hooks/useTransactionCategories";
import { useSendStore } from "@/store/Send";

import BankDestinations from "./bankTransfer/BankDestinations";
import ToGlobal from "./bankTransfer/toGlobal/ToGlobal";
import AlipayWechatSend from "../naira/alipayWechat/AlipayWechatSend";
import SwiftSend from "./swift/SwiftSend";
import CryptoSend from "./crypto/CryptoSend";

interface Props {
  close: () => void;
}

const UsdSend = ({ close }: Props) => {
  const { usdSendType, actions } = useSendStore();
  useTransactionCategories();

  const displayStep = () => {
    switch (usdSendType) {
      case null:
        return <SendOptions close={close} />;
      case "to Raizer":
        return <ToRaizers close={close} />;
      case "usBank":
        return (
          <BankDestinations close={() => actions.selectUSDSendOption(null)} />
        );
      case "internationalRemittance":
        return (
          <ToGlobal
            close={() => actions.selectUSDSendOption(null)}
            bankType="global"
          />
        );
      case "alipay-wechat":
        return <AlipayWechatSend close={() => actions.selectUSDSendOption(null)} />;
      case "crypto":
        return <CryptoSend close={() => actions.selectUSDSendOption(null)} />;
      case "swift":
        return <SwiftSend close={() => actions.selectUSDSendOption(null)} />;
      default:
        break;
    }
  };
  return <>{displayStep()}</>;
};

export default withBusinessWrite(UsdSend);
