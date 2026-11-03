import React from "react";
import USBankBeneficiary from "./USBankBeneficiary";
import { bankTypeProp } from "../BankTransfer";
import GlobalBeneficiary from "../toGlobal/GlobalBeneficiary";

interface Props {
  type: bankTypeProp;
  close: () => void;
  goNext?: () => void;
}

const AddBeneficiary = ({ type, close, goNext }: Props) => {
  const displayForm = () => {
    switch (type) {
      case "us":
        return goNext && <USBankBeneficiary close={close} goNext={goNext} />;
      case "global":
        return <GlobalBeneficiary close={close} />;
      default:
        break;
    }
  };
  return <>{displayForm()}</>;
};

export default AddBeneficiary;
