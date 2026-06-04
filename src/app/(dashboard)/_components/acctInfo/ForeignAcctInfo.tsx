"use client";

import Overlay from "@/components/ui/Overlay";
import { useUser } from "@/lib/hooks/useUser";
import { ForeignCurrency } from "@/types/services";
import { copyToClipboard, findWalletByCurrency } from "@/utils/helpers";
import Image from "next/image";

interface Props {
  close: () => void;
  currency: ForeignCurrency;
}

const ForeignAcctInfo = ({ close, currency }: Props) => {
  const { user } = useUser();
  const wallet = findWalletByCurrency(user, currency);
  const sortCode =
    wallet?.sort_code ||
    wallet?.routing?.find((route) => route.routing_type_name === "FASTER_PAYMENTS")
      ?.routing ||
    "";

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col h-full py-8 px-5 text-raiz-gray-950">
        <div className="bg-[#EAECFF99] w-12 h-12 rounded-full flex justify-center items-center mx-auto">
          <Image
            src={"/icons/info.svg"}
            alt={"Account Info"}
            width={24}
            height={24}
          />
        </div>
        <h4 className="text-lg font-bold leading-snug text-center mt-4 mb-6">
          {currency} Account Info
        </h4>

        <div className="flex flex-col gap-[15px]">
          <DetailRow label="Bank Name" value={wallet?.bank_name || ""} />

          {currency === "GBP" ? (
            <>
              <CopyRow
                label="Account Number"
                value={wallet?.account_number || ""}
              />
              <CopyRow label="Sort Code" value={sortCode} />
            </>
          ) : (
            <>
              <CopyRow label="IBAN" value={wallet?.iban || wallet?.account_number || ""} />
              <CopyRow label="BIC" value={wallet?.bic || ""} />
            </>
          )}

          <DetailRow label="Bank Address" value={wallet?.bank_address || ""} />
          <DetailRow label="Currency" value={wallet?.wallet_type.currency || currency} />
        </div>
      </div>
    </Overlay>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center border-b border-[#e4e0ea] pb-3 gap-3">
    <span className="text-[13px] font-normal leading-tight">{label}</span>
    <span className="text-sm font-semibold leading-none text-right break-all">
      {value}
    </span>
  </div>
);

const CopyRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center border-b border-[#e4e0ea] pb-3 gap-3">
    <span className="text-[13px] font-normal leading-tight">{label}</span>
    <div className="flex gap-1 items-center min-w-0">
      <span className="text-sm font-semibold leading-none text-right break-all">
        {value}
      </span>
      <button onClick={() => copyToClipboard(value)}>
        <Image src={"/icons/copy.svg"} alt={"copy"} width={16} height={16} />
      </button>
    </div>
  </div>
);

export default ForeignAcctInfo;
