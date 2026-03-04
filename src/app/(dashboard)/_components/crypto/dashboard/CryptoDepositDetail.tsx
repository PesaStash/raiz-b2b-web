"use client";
import React from "react";
import SideModalWrapper from "../../SideModalWrapper";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import QRCode from "react-qr-code";
import { ICryptoWallet } from "@/types/user";
import ListDetailItem from "@/components/ui/ListDetailItem";
import { copyToClipboard, truncateString } from "@/utils/helpers";
import Image from "next/image";
import Button from "@/components/ui/Button";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface Props {
  close: () => void;
  wallet: ICryptoWallet;
}

const CryptoDepositDetail = ({ close, wallet }: Props) => {
  return (
    <CenterModalWrapper close={close}>
      <div className="w-full h-full flex flex-col">
        <CenterModalHeader close={close} />
        <h2 className="text-xl font-bold text-raiz-gray-950 mb-10">
          Deposit {wallet?.chain}
        </h2>
        <div className="flex flex-col h-full justify-between items-center">
          <div className="flex flex-col w-full justify-center items-center gap-8 rounded-[20px] bg-raiz-gray-50 p-6 overflow-y-auto mb-6 no-scrollbar">
            {/*Change this   wallet.qrcode */}
            <QRCode
              value={wallet?.qr_code || wallet?.address || ""}
              size={231}
              className="p-[17px] bg-[#EAECFF99] rounded-[20px]"
            />
            <div className="w-full">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200 mb-[15px]">
                <span className="text-xs font-normal leading-tight">
                  Deposit Address
                </span>
                <div className="flex gap-1 items-center">
                  <span className="text-sm text-right font-semibold font-brSonoma leading-tight">
                    {truncateString(wallet?.address, 16)}
                  </span>
                  <button onClick={() => copyToClipboard(wallet?.address)}>
                    <Image
                      src={"/icons/copy.svg"}
                      alt={"copy"}
                      width={16}
                      height={16}
                    />
                  </button>
                </div>
              </div>
              <ListDetailItem title="Chain" value={wallet?.chain} />
            </div>
          </div>
          {/* <Button onClick={() => copyToClipboard()}>Save or Share Address</Button> */}
        </div>
      </div>
    </CenterModalWrapper>
  );
};

export default CryptoDepositDetail;
