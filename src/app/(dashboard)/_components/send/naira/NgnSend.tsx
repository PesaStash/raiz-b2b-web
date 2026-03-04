"use client";
import React from "react";
import Tabs from "@/components/ui/Tabs";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Image from "next/image";
import { useSendStore } from "@/store/Send";
import NgnToRaizers from "./toRaizers/NgnToRaizers";
import { INGNSendOptions } from "@/types/misc";
import NgnBankTransfer from "./toBanks/NgnBankTransfer";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

const NgnSend = ({ close }: { close: () => void }) => {
  const { actions, user, ngnSendType, externalUser } = useSendStore();

  const handleTypeChange = (value: INGNSendOptions) => {
    actions.selectNGNSendOption(value);
  };

  const ScanButton = () => {
    return (
      <button
        // onClick={() => {

        // }}
        className="text-right justify-center text-zinc-700 text-sm leading-tight"
      >
        <Image src={"/icons/qr.svg"} alt="scan qr" width={18} height={19.2} />
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {!user && !externalUser && <CenterModalHeader close={close} />}
      {!user && !externalUser && (
        <SideWrapperHeader
          title="Find Recipient"
          close={() => actions.selectUser(null)}
          titleColor="text-zinc-900 "
          backArrow={false}
          // rightComponent={<ScanButton />}
        />
      )}
      {!user && !externalUser && (
        <Tabs
          options={[
            { label: "Send to Raizer", value: "to Raizer" },
            { label: "Send to other bank", value: "to other bank" },
          ]}
          selected={ngnSendType}
          onChange={handleTypeChange}
        />
      )}
      <div className="mb-5" />
      {ngnSendType === "to Raizer" ? <NgnToRaizers /> : <NgnBankTransfer />}
    </div>
  );
};

export default NgnSend;
