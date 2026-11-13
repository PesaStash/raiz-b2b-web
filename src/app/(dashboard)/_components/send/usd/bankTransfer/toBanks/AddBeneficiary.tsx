import { IIntCountry } from "@/constants/send";
import React from "react";
import USBankBeneficiary from "./USBankBeneficiary";
import { bankTypeProp } from "../BankTransfer";
import GlobalBeneficiary from "../toGlobal/GlobalBeneficiary";

interface Props {
  type: bankTypeProp;
  close: () => void;
  goNext?: () => void;
  initialCountry?: IIntCountry;
  allowedCountryCodes?: string[];
}

const AddBeneficiary = ({
  type,
  close,
  goNext,
  initialCountry,
  allowedCountryCodes,
}: Props) => {
  const displayForm = () => {
    switch (type) {
      case "us":
        return goNext && <USBankBeneficiary close={close} goNext={goNext} />;
      case "global":
        return (
          <GlobalBeneficiary
            close={close}
            initialCountry={initialCountry}
            allowedCountryCodes={allowedCountryCodes}
          />
        );
      default:
        break;
    }
  };
  return <>{displayForm()}</>;
};

export default AddBeneficiary;
