"use client";
import Image from "next/image";
import { copyToClipboard, findWalletByCurrency } from "@/utils/helpers";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface Props {
  close: () => void;
}

const TopUp = ({ close }: Props) => {
  const { user } = useUser();
  const { selectedCurrency, selectedWallet } = useCurrencyStore();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");

  const getCurrentWallet = () => {
    if (selectedWallet) {
      return selectedWallet;
    } else {
      if (selectedCurrency.name === "NGN") {
        return NGNAcct;
      } else if (selectedCurrency.name === "USD") {
        return USDAcct;
      }
    }
  };

  const currentWallet = getCurrentWallet();
  return (
    <div className="pb-8 flex flex-col justify-between xl:h-[95vh]">
      <div className="mb-3 ">
        <CenterModalHeader close={close} />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
            Add Funds
          </h2>
          <div />
        </div>
        <div className="p-6 bg-raiz-gray-50 rounded-[20px]">
          <p className="text-slate-800 text-sm font-normal leading-snug">
            Make a bank transfer from another account using these details. The
            account number provided is unique to your Raiz account
          </p>
          <div className="p-7 bg-violet-100/60 rounded-[20px] inline-flex flex-col justify-center items-center gap-5 w-full my-[30px]">
            {/* Bank details */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-raiz-gray-600 text-[15px] font-normal leading-normal">
                Bank Name
              </span>
              <p className="text-center justify-start text-raiz-gray-950 text-lg font-semibold  leading-normal">
                {currentWallet?.bank_name || ""}
              </p>
            </div>
            {/* Acct number */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-raiz-gray-600 text-[15px] font-normal leading-normal">
                Account Number
              </span>
              <div className="flex items-center gap-2">
                <p className="text-center justify-start text-raiz-gray-950 text-lg font-semibold  leading-normal">
                  {currentWallet?.account_number || ""}
                </p>
                <button
                  onClick={() =>
                    copyToClipboard(currentWallet?.account_number || "")
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
            {selectedCurrency.name === "USD" && (
              <div className="w-full flex flex-col justify-center items-center">
                <span className="text-center justify-start text-raiz-gray-600 text-[15px] font-normal leading-normal">
                  Routing Number (ACH)
                </span>
                <div className="flex items-center gap-2">
                  <p className="text-center justify-start text-raiz-gray-950 text-lg font-semibold  leading-normal">
                    {
                      currentWallet?.routing?.find(
                        (route) => route.routing_type_name === "ACH",
                      )?.routing
                    }
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        currentWallet?.routing?.find(
                          (route) => route.routing_type_name === "ACH",
                        )?.routing || "",
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
            )}
            {/* Routing Number (WIRE) */}
            {selectedCurrency.name === "USD" && (
              <div className="w-full flex flex-col justify-center items-center">
                <span className="text-center justify-start text-raiz-gray-600 text-[15px] font-normal leading-normal">
                  Routing Number (WIRE)
                </span>
                <div className="flex items-center gap-2">
                  <p className="text-center justify-start text-raiz-gray-950 text-lg font-semibold  leading-normal">
                    {
                      currentWallet?.routing?.find(
                        (route) => route.routing_type_name === "WIRE",
                      )?.routing
                    }
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        currentWallet?.routing?.find(
                          (route) => route.routing_type_name === "WIRE",
                        )?.routing || "",
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
            )}
            {/* Currency */}
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-center justify-start text-raiz-gray-600 text-[15px] font-normal leading-normal">
                Currency
              </span>
              <p className="text-center justify-start text-raiz-gray-950 text-lg font-semibold  leading-normal">
                {currentWallet?.wallet_type.currency || ""}
              </p>
            </div>
            {/*  Address */}
            {selectedCurrency.name === "USD" && (
              <div className="w-full flex flex-col justify-center items-center">
                <div className="flex gap-2 items-center">
                  <span className="text-center justify-start text-raiz-gray-600 text-[15px] font-normal leading-normal">
                    Address
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard("1801 Main St., Kansas City, MO 64108")
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
                {/* Fix this */}
                <div className="flex items-start gap-2">
                  <p className="text-center justify-start  text-raiz-gray-950 text-lg font-semibold  leading-normal">
                    1801 Main St., Kansas City, MO 64108
                  </p>
                </div>
              </div>
            )}
          </div>
          <p className=" text-slate-800 text-sm font-normal leading-snug mb-2">
            Transfer the amount you want to fund using mobile banking
          </p>
          <p className=" text-slate-800 text-sm font-normal leading-snug">
            Your Raiz account balance will be funded immediately
          </p>
        </div>
      </div>
      {/* <Button
            onClick={() => copyToClipboard(currentWallet?.account_number || "")}
          >
            Copy Account Details
          </Button> */}
    </div>
  );
};

export default TopUp;
