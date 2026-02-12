"use client";
import React, { useState } from "react";
import ToUsdBanks from "./toBanks/ToUsdBanks";
// import ToInternational from "./toInternational/ToInternational";
import BankTypeModal from "./toBanks/BankTypeModal";
import SendOptions from "../SendOptions";
import ToGlobal from "./toGlobal/ToGlobal";

export type bankTypeProp = "us" | "int" | "global";

interface Props {
  close: () => void;
}

const BankTransfer = ({ close }: Props) => {
  const [bankType, setBankType] = useState<bankTypeProp | undefined>();

  const displayScreen = () => {
    switch (bankType) {
      case undefined:
        return (
          <>
            <SendOptions close={close} />
            <BankTypeModal
              close={close}
              bankType={bankType}
              setBankType={setBankType}
            />
          </>
        );
      case "us":
        return bankType && <ToUsdBanks close={close} bankType={bankType} />;
      // case "int":
      //   return <ToInternational close={close} bankType={bankType} />;
      case "global":
        return <ToGlobal close={close} bankType={bankType} />;
      default:
        break;
    }
  };
  return <>{displayScreen()}</>;
};

export default BankTransfer;
