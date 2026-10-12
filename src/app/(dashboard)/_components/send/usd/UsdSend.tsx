import { withBusinessWrite } from "@/components/team/BusinessWrite";
import React from "react";
import SendOptions from "./SendOptions";
import ToRaizers from "./toRaizers/ToRaizers";
import { useSendStore } from "@/store/Send";

import ToUsdBanks from "./bankTransfer/toBanks/ToUsdBanks";
import ToGlobal from "./bankTransfer/toGlobal/ToGlobal";
import SwiftSend from "./swift/SwiftSend";

interface Props {
  close: () => void;
}

const UsdSend = ({ close }: Props) => {
  const { usdSendType, actions } = useSendStore();

  const displayStep = () => {
    switch (usdSendType) {
      case null:
        return <SendOptions close={close} />;
      case "to Raizer":
        return <ToRaizers close={close} />;
      case "usBank":
        return (
          <ToUsdBanks
            close={() => actions.selectUSDSendOption(null)}
            bankType="us"
          />
        );
      case "internationalRemittance":
        return (
          <ToGlobal
            close={() => actions.selectUSDSendOption(null)}
            bankType="global"
          />
        );
      case "swift":
        return <SwiftSend close={() => actions.selectUSDSendOption(null)} />;
      default:
        break;
    }
  };
  return <>{displayStep()}</>;
};

export default withBusinessWrite(UsdSend);
