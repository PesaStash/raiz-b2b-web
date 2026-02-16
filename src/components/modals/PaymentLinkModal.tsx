"use client";
import React, { useState } from "react";
import Overlay from "../ui/Overlay";
import Image from "next/image";
import ListDetailItem from "../ui/ListDetailItem";
import { useUser } from "@/lib/hooks/useUser";
import { copyToClipboard, truncateString } from "@/utils/helpers";
import QRCode from "react-qr-code";
// import InputField from "@/components/ui/InputField";
import { encryptData } from "@/lib/headerEncryption";

interface Props {
  close: () => void;
}

const PaymentLinkModal = ({ close }: Props) => {
  const { user } = useUser();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [amount, setAmount] = useState("");
  const username = user?.business_account?.username;
  const baseLink =
    typeof window !== "undefined" && username
      ? `${window.location.origin}/pay/${username}`
      : "";

  const link = amount
    ? `${baseLink}?data=${encodeURIComponent(
        encryptData(JSON.stringify({ amount }))
      )}`
    : baseLink;

  return (
    <Overlay width="375px" close={close}>
      <div className="flex flex-col justify-center items-center  h-full py-8 px-5  text-center ">
        <Image src={"/icons/paylink.svg"} width={44} height={44} alt="" />
        <h4 className="text-zinc-900 text-xl font-bold">Payment Link</h4>
        <p className="text-center  text-zinc-900 text-xs leading-tight">
          Allow guest users send you money securely
        </p>
        {/* <div className="my-4 w-full">
          <InputField
            name="amount"
            type="number"
            label="Amount in USD (Optional)"
            placeholder="0.00"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAmount(e.target.value)
            }
          />
        </div> */}
        <div className="w-44 h-44 relative bg-violet-100/60 rounded-[20px] p-[17px] my-4">
          {/* <Image src={"/icons/qr.svg"} alt="QR Code" width={231} height={231} /> */}
          <QRCode value={link} size={140} />
        </div>
        <div className="flex flex-col gap-2 mt-4 w-full">
          <ListDetailItem title="Receiver" value={username || ""} border />
          <div className="flex justify-between items-center pb-3">
            <span className="text-[13px] font-normal leading-tight">
              Share link
            </span>
            <div className="flex gap-1 items-center">
              {truncateString(link, 18)}
              <span className="text-sm font-semibold leading-none">{}</span>
              <button onClick={() => copyToClipboard(link)}>
                <Image
                  src={"/icons/copy.svg"}
                  alt={"copy"}
                  width={16}
                  height={16}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default PaymentLinkModal;
