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

interface Props {
  close: () => void;
  wallet: ICryptoWallet;
}

const CryptoDepositDetail = ({ close, wallet }: Props) => {
  return (
    <SideModalWrapper close={close}>
      <div className="w-full h-full flex flex-col">
        <SideWrapperHeader
          close={close}
          title={`Deposit ${wallet?.chain}`}
          titleColor="text-zinc-900"
          // rightComponent={<SkipButton />}
        />
        <div className="flex flex-col h-full justify-between items-center">
          <div className="flex flex-col w-full justify-center items-center gap-8">
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
          <Button>Save or Share Address</Button>
        </div>
      </div>
    </SideModalWrapper>
  );
};

export default CryptoDepositDetail;
