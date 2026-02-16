import React from "react";
import SendOptions from "./SendOptions";
import ToRaizers from "./toRaizers/ToRaizers";
import { useSendStore } from "@/store/Send";

import ToUsdBanks from "./bankTransfer/toBanks/ToUsdBanks";
import ToGlobal from "./bankTransfer/toGlobal/ToGlobal";
// import ToZelle from "./zelle/ToZelle";

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
      // case "bank transfer":
      //   return <BankTransfer close={() => actions.selectUSDSendOption(null)} />;
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
      // case "to debit card":
      //   return <ToDebitCard close={() => actions.selectUSDSendOption(null)} />;
      // case "to paypal":
      //   return <ToPaypal close={() => actions.selectUSDSendOption(null)} />;
      // case "to canada":
      //   return <ToCanada close={() => actions.selectUSDSendOption(null)} />;
      // case "to zelle":
      //   return <ToZelle close={() => actions.selectUSDSendOption(null)} />;
      default:
        break;
    }
  };
  return <>{displayStep()}</>;
};

export default UsdSend;
