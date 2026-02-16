import Overlay from "@/components/ui/Overlay";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useUser } from "@/lib/hooks/useUser";
import { useSwapStore } from "@/store/Swap";
import { IWallet } from "@/types/user";
import { toast } from "sonner";
import { CurrencyTypeKey } from "@/store/Swap/swapSlice.types";

interface Props {
  close: () => void;
}

const SelectCurrencyModal = ({ close }: Props) => {
  const [search, setSearch] = useState("");
  const { actions, swapFromCurrency, swapToCurrency } = useSwapStore();
  const { user } = useUser();

  const wallets = useMemo(
    () => user?.business_account?.wallets || [],
    [user?.business_account?.wallets]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Get available swap destinations based on the current FROM currency
  // Now includes the FROM currency itself to allow direction switching
  const getAvailableDestinations = (): CurrencyTypeKey[] => {
    const availableCurrencies = wallets.map(
      (w) => w.wallet_type.currency as CurrencyTypeKey
    );

    switch (swapFromCurrency) {
      case "USD":
        // USD can swap to NGN, SBC, or itself (to trigger reverse swap)
        return availableCurrencies.filter(
          (c) => c === "NGN" || c === "SBC" || c === "USD"
        );

      case "NGN":
        // NGN can swap to USD or itself (to trigger reverse swap)
        return availableCurrencies.filter((c) => c === "USD" || c === "NGN");

      case "SBC":
        // SBC can swap to USD or itself (to trigger reverse swap)
        return availableCurrencies.filter((c) => c === "USD" || c === "SBC");

      default:
        return [];
    }
  };

  const availableDestinations = getAvailableDestinations();

  // Filter wallets based on available destinations and search term
  const filteredWallets = useMemo(() => {
    return wallets.filter((wallet) => {
      const currency = wallet.wallet_type.currency as CurrencyTypeKey;
      const matchesDestination = availableDestinations.includes(currency);
      const matchesSearch = wallet.wallet_type.currency
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesDestination && matchesSearch;
    });
  }, [search, wallets, availableDestinations]);

  const handleSelect = (selectedWallet: IWallet) => {
    const newCurrency = selectedWallet.wallet_type.currency as CurrencyTypeKey;

    const isReverse = swapFromCurrency === newCurrency;
    const from = isReverse ? swapToCurrency : swapFromCurrency;
    const to = isReverse ? swapFromCurrency : newCurrency;

    if (!actions.isValidSwapPair(from, to)) {
      if (from === "SBC" && to === "NGN") {
        toast.warning(
          "Direct SBC to NGN swaps are not allowed. Please swap SBC → USD → NGN."
        );
      } else if (from === "NGN" && to === "SBC") {
        toast.warning(
          "Direct NGN to SBC swaps are not allowed. Please swap NGN → USD → SBC."
        );
      } else {
        toast.warning("This swap pair is not allowed.");
      }
      return;
    }

    const success = actions.switchSwapWallet(newCurrency, wallets);

    if (success) {
      actions.setAmount("");
      close();
    } else {
      toast.error("Failed to update swap destination");
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "USD":
        return "/icons/dollar.svg";
      case "NGN":
        return "/icons/ngn.svg";
      case "SBC":
        return "/icons/bsc.svg";
      default:
        return "/icons/dollar.svg";
    }
  };

  const getHelpText = () => {
    if (swapFromCurrency === "SBC") {
      return {
        show: true,
        message:
          "SBC can only be swapped to USD. To get NGN, swap to USD first, then USD → NGN.",
        type: "warning",
      };
    }
    if (swapFromCurrency === "NGN") {
      return {
        show: true,
        message:
          "NGN can only be swapped to USD. To get SBC, swap to USD first, then USD → SBC.",
        type: "info",
      };
    }
    return { show: false, message: "", type: "" };
  };

  const helpText = getHelpText();

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col h-full py-8 px-5">
        <h5 className="text-raiz-gray-950 text-xl font-bold leading-normal">
          Select Destination Currency
        </h5>
        <p className="text-raiz-gray-600 text-sm mt-1 mb-4">
          From: <span className="font-semibold">{swapFromCurrency}</span>
        </p>

        {/* Search Input */}
        <div className="relative h-12 min-w-[300px] mb-6">
          <Image
            className="absolute top-3.5 left-3"
            src={"/icons/search.svg"}
            alt="search"
            width={22}
            height={22}
          />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search currency"
            className="pl-10 h-full bg-[#fcfcfc] rounded-[20px] border border-raiz-gray-200 justify-start items-center gap-2 inline-flex w-full outline-none text-sm"
          />
        </div>

        {/* Help Text */}
        {helpText.show && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              helpText.type === "warning"
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <p
              className={`text-xs ${
                helpText.type === "warning"
                  ? "text-yellow-800"
                  : "text-blue-800"
              }`}
            >
              <strong>Note:</strong> {helpText.message}
            </p>
          </div>
        )}

        {/* Wallet List */}
        <div className="flex-1 overflow-y-auto">
          {filteredWallets.length > 0 ? (
            filteredWallets.map((wallet, index) => {
              const isSelected = wallet.wallet_type.currency === swapToCurrency;

              return (
                <button
                  onClick={() => handleSelect(wallet)}
                  key={index}
                  className={`flex justify-between w-full p-3 rounded-xl transition-colors `}
                >
                  <div className="flex items-center gap-2">
                    <Image
                      className="w-6 h-6 rounded-full"
                      src={getCurrencyIcon(wallet.wallet_type.currency)}
                      alt={wallet?.wallet_name}
                      width={24}
                      height={24}
                    />
                    <div className="text-left">
                      <span className="text-raiz-gray-950 text-sm font-semibold block">
                        {wallet?.wallet_type.wallet_type_name}
                      </span>
                      <span className="text-raiz-gray-600 text-xs">
                        {wallet?.wallet_type.currency}
                        {/* {wallet.wallet_type.currency === swapFromCurrency &&
                          " (Reverse swap)"} */}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                          fill="#6366F1"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-raiz-gray-600">
                {availableDestinations.length === 0
                  ? `No available destinations for ${swapFromCurrency}`
                  : "No matching currency found"}
              </p>
              {availableDestinations.length === 0 && (
                <p className="text-xs text-raiz-gray-500 mt-2">
                  Create additional wallets to enable more swap options
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
};

export default SelectCurrencyModal;
