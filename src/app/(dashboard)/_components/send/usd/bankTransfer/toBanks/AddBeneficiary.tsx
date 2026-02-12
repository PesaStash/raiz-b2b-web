import React from "react";
import USBankBeneficiary from "./USBankBeneficiary";
import { bankTypeProp } from "../BankTransfer";
// import InternationalBeneficiary from "../toInternational/InternationalBeneficiary";
import GlobalBeneficiary from "../toGlobal/GlobalBeneficiary";

interface Props {
  type: bankTypeProp;
  close: () => void;
}

const AddBeneficiary = ({ type, close }: Props) => {
  const displayForm = () => {
    switch (type) {
      case "us":
        return <USBankBeneficiary close={close} />;
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
