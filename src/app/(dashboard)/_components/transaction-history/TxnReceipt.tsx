import { ITransaction } from "@/types/transactions";

import React, { useState } from "react";
import TxnReceiptDetail from "./TxnReceiptDetail";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import SideModalWrapper from "../SideModalWrapper";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface Props {
  close: () => void;
  transaction: ITransaction;
}

const TxnReceipt = ({ close, transaction }: Props) => {
  const [step, setStep] = useState(1);

  const displayScreen = () => {
    switch (step) {
      case 1:
        return (
          <TxnReceiptDetail
            close={close}
            transaction={transaction}
            goNext={() => setStep(2)}
          />
        );
      case 2:
        return (
          transaction && (
            <>
              <CenterModalHeader close={close} />
              <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
                Transaction Receipt
              </h2>
              <RaizReceipt close={close} data={transaction} />
            </>
          )
        );

      default:
        break;
    }
  };
  return (
    <CenterModalWrapper close={close}>{displayScreen()}</CenterModalWrapper>
  );
};

export default TxnReceipt;
