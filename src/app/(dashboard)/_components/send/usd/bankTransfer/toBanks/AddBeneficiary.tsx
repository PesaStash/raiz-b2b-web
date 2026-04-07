import React from "react";
import USBankBeneficiary from "./USBankBeneficiary";
import { bankTypeProp } from "../BankTransfer";
// import InternationalBeneficiary from "../toInternational/InternationalBeneficiary";
import GlobalBeneficiary from "../toGlobal/GlobalBeneficiary";

interface Props {
  type: bankTypeProp;
  close: () => void;
  goNext: () => void;
}

const AddBeneficiary = ({ type, close, goNext }: Props) => {
  const displayForm = () => {
    switch (type) {
      case "us":
        return <USBankBeneficiary close={close} goNext={goNext} />;
      // case "int":
      //   return <InternationalBeneficiary close={close} />;
      case "global":
        return <GlobalBeneficiary close={close} />;
      default:
        break;
    }
  };
  return <>{displayForm()}</>;
};

export default AddBeneficiary;
