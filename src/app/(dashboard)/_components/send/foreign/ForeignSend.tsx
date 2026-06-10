"use client";

import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import MobileSheetHeader from "@/components/mobile/MobileSheetHeader";
import Tabs from "@/components/ui/Tabs";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { IForeignSendOptions } from "@/types/misc";
import React from "react";
import ForeignBankSend from "./ForeignBankSend";
import ForeignToRaizers from "./toRaizers/ForeignToRaizers";

interface Props {
  close: () => void;
}

const ForeignSend = ({ close }: Props) => {
  const { actions, user, foreignBeneficiary, foreignSendType } = useSendStore();
  const { selectedCurrency } = useCurrencyStore();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleTypeChange = (value: IForeignSendOptions) => {
    actions.selectForeignSendOption(value);
  };

  const showInitialScreen = !user && !foreignBeneficiary;
  const bankTabLabel = `Send to ${selectedCurrency.name} bank`;

  return (
    <div className="flex flex-col h-full min-h-0">
      {showInitialScreen &&
        (isMobile ? (
          <MobileSheetHeader title="Find Recipient" onBack={close} />
        ) : (
          <>
            <CenterModalHeader close={close} />
            <SideWrapperHeader
              title="Find Recipient"
              close={() => actions.selectUser(null)}
              titleColor="text-zinc-900 "
              backArrow={false}
            />
          </>
        ))}

      {showInitialScreen && (
        <Tabs
          className="!mt-0 !mb-3"
          options={[
            { label: "Send to Raizer", shortLabel: "Raizer", value: "to Raizer" },
            { label: bankTabLabel, shortLabel: "Bank", value: "to bank" },
          ]}
          selected={foreignSendType}
          onChange={handleTypeChange}
        />
      )}

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {foreignSendType === "to Raizer" && <ForeignToRaizers />}
        {foreignSendType === "to bank" && (
          <ForeignBankSend close={close} hideBeneficiaryHeader={showInitialScreen} />
        )}
      </div>
    </div>
  );
};

export default ForeignSend;
