import Overlay from "@/components/ui/Overlay";
import React from "react";
import Image from "next/image";
import { copyToClipboard, findWalletByCurrency } from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";

interface Props {
  close: () => void;
}

const USDAcctInfo = ({ close }: Props) => {
  const { user } = useUser();
  const USDAcct = findWalletByCurrency(user, "USD");
  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col  h-full py-8 px-5  text-raiz-gray-950">
        <div className="bg-[#EAECFF99] w-12 h-12 rounded-full flex justify-center items-center mx-auto">
          <Image
            src={"/icons/info.svg"}
            alt={"Account Info"}
            width={24}
            height={24}
          />
        </div>
        <h4 className="text-lg font-bold leading-snug text-center mt-4 mb-6">
          Account Info
        </h4>
        {/* Acct details */}
        <div className="flex flex-col gap-[15px]">
          {/* Bank Name */}
          <div className="flex justify-between items-center border-b border-[#e4e0ea] pb-3">
            <span className="text-[13px] font-normal leading-tight">
              Bank Name
            </span>
            <span className="text-sm font-semibold leading-none">
              {USDAcct?.bank_name}
            </span>
          </div>

          {/* Account Number */}
          <div className="flex justify-between items-center border-b border-[#e4e0ea] pb-3">
            <span className="text-[13px] font-normal leading-tight">
              Account Number
            </span>
            <div className="flex gap-1 items-center">
              {" "}
              <span className="text-sm font-semibold leading-none">
                {USDAcct?.account_number}
              </span>
              <button
                onClick={() => copyToClipboard(USDAcct?.account_number || "")}
              >
                <Image
                  src={"/icons/copy.svg"}
                  alt={"copy"}
                  width={16}
                  height={16}
                />
              </button>
            </div>
          </div>

          {/* Routing Number (RTP) */}
          <div className="flex justify-between items-center border-b border-[#e4e0ea] pb-3">
            <span className="text-[13px] font-normal leading-tight">
              Routing Number (RTP)
            </span>
            <div className="flex gap-1 items-center">
              {" "}
              <span className="text-sm font-semibold leading-none">
                {
                  USDAcct?.routing?.find(
                    (route) => route.routing_type_name === "RTP"
                  )?.routing
                }
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    USDAcct?.routing?.find(
                      (route) => route.routing_type_name === "RTP"
                    )?.routing || ""
                  )
                }
              >
                <Image
                  src={"/icons/copy.svg"}
                  alt={"copy"}
                  width={16}
                  height={16}
                />
              </button>
            </div>
          </div>

          {/* Routing Number (WIRE) */}
          <div className="flex justify-between items-center border-b border-[#e4e0ea] pb-3">
            <span className="text-[13px] font-normal leading-tight">
              Routing Number (WIRE)
            </span>
            <div className="flex gap-1 items-center">
              {" "}
              <span className="text-sm font-semibold leading-none">
                {
                  USDAcct?.routing?.find(
                    (route) => route.routing_type_name === "WIRE"
                  )?.routing
                }
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    USDAcct?.routing?.find(
                      (route) => route.routing_type_name === "WIRE"
                    )?.routing || ""
                  )
                }
              >
                <Image
                  src={"/icons/copy.svg"}
                  alt={"copy"}
                  width={16}
                  height={16}
                />
              </button>
            </div>
          </div>

          {/* Routing Number (ACH) */}
          <div className="flex justify-between items-center border-b border-[#e4e0ea] pb-3">
            <span className="text-[13px] font-normal leading-tight">
              Routing Number (ACH)
            </span>
            <div className="flex gap-1 items-center">
              {" "}
              <span className="text-sm font-semibold leading-none">
                {
                  USDAcct?.routing?.find(
                    (route) => route.routing_type_name === "ACH"
                  )?.routing
                }
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    USDAcct?.routing?.find(
                      (route) => route.routing_type_name === "ACH"
                    )?.routing || ""
                  )
                }
              >
                <Image
                  src={"/icons/copy.svg"}
                  alt={"copy"}
                  width={16}
                  height={16}
                />
              </button>
            </div>
          </div>

          {/* Currency */}
          <div className="flex justify-between items-center border-b border-[#e4e0ea] pb-3">
            <span className="text-[13px] font-normal leading-tight">
              Currency
            </span>
            <span className="text-sm font-semibold leading-none">
              {USDAcct?.wallet_type.currency}
            </span>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default USDAcctInfo;
