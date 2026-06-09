"use client";

import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import Button from "@/components/ui/Button";
import { FOREIGN_ACCOUNT_ACTIVATION_FEE_USD } from "@/constants/misc";
import { useUser } from "@/lib/hooks/useUser";
import { CreateForeignAccountApi } from "@/services/business";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ForeignCurrency } from "@/types/services";
import {
  getInsufficientUsdForForeignAccountMessage,
  getUsdAccountBalance,
  hasSufficientUsdForForeignAccount,
} from "@/utils/foreignAccount";
import { getApiErrorMessage } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { toast } from "sonner";

const config: Record<
  ForeignCurrency,
  {
    currencyIcon: string;
    benefitsTitle: string;
    description: string;
    features: { icon: string; title: string; text: string }[];
  }
> = {
  GBP: {
    currencyIcon: "/icons/pounds.svg",
    benefitsTitle: "GBP Account Benefits",
    description:
      "Hold, send, and receive Pounds with ease, making global payments and transfers simple.",
    features: [
      {
        icon: "/icons/send.svg",
        title: "Send Money",
        text: "Easily send GBP to bank accounts in seconds.",
      },
      {
        icon: "/icons/receive.svg",
        title: "Receive Funds",
        text: "Receive GBP from external bank accounts directly into your account.",
      },
      {
        icon: "/icons/swap-c.svg",
        title: "Swap Money",
        text: "Easily convert your Pounds balance to US Dollars right inside your account.",
      },
      {
        icon: "/icons/money.svg",
        title: `Activation Fee ($${FOREIGN_ACCOUNT_ACTIVATION_FEE_USD})`,
        text: `Activate your Pounds account for a one-time fee of $${FOREIGN_ACCOUNT_ACTIVATION_FEE_USD}.`,
      },
    ],
  },
  EUR: {
    currencyIcon: "/icons/euro.svg",
    benefitsTitle: "EUR Account Benefits",
    description:
      "Hold, send, and receive Euros with ease, making global payments and transfers simple.",
    features: [
      {
        icon: "/icons/send.svg",
        title: "Send Money",
        text: "Easily send EUR to bank accounts in seconds.",
      },
      {
        icon: "/icons/receive.svg",
        title: "Receive Funds",
        text: "Receive EUR from external bank accounts directly into your account.",
      },
      {
        icon: "/icons/swap-c.svg",
        title: "Swap Money",
        text: "Easily convert your Euro balance to US Dollars right inside your account.",
      },
      {
        icon: "/icons/money.svg",
        title: `Activation Fee ($${FOREIGN_ACCOUNT_ACTIVATION_FEE_USD})`,
        text: `Activate your Euro account for a one-time fee of $${FOREIGN_ACCOUNT_ACTIVATION_FEE_USD}.`,
      },
    ],
  },
};

const CreateForeignAcct = ({
  close,
  currency,
}: {
  close: () => void;
  currency: ForeignCurrency;
}) => {
  const qc = useQueryClient();
  const { user, refetch } = useUser();
  const { setSelectedCurrency } = useCurrencyStore();
  const accountConfig = config[currency];
  const canCreate = hasSufficientUsdForForeignAccount(user);
  const usdBalance = getUsdAccountBalance(user);

  const createForeignAccountMutation = useMutation({
    mutationFn: () => CreateForeignAccountApi(currency),
    onSuccess: async () => {
      toast.success(`${currency} account created successfully`);
      await qc.invalidateQueries({ queryKey: ["user"] });
      const refreshedUser = await refetch();
      setSelectedCurrency(currency, refreshedUser.data || user);
      close();
    },
    // onError: (error) => {
    //   toast.error(
    //     getApiErrorMessage(error, `Unable to create your ${currency} account`),
    //   );
    // },
  });

  const handleCreate = () => {
    if (!canCreate) {
      toast.warning(getInsufficientUsdForForeignAccountMessage());
      return;
    }
    createForeignAccountMutation.mutate();
  };

  return (
    <div className="flex h-full w-full flex-col font-brSonoma xl:max-h-[85vh] lg:max-h-[80vh]">
      <CenterModalHeader close={close} />
      <h2 className="mb-4 text-xl font-bold text-raiz-gray-950">
        {currency} Account
      </h2>
      <div className="flex h-full flex-col justify-between gap-8 pb-[30px]">
        <div>
          <div className="flex flex-col justify-center gap-3 rounded-[20px] bg-raiz-gray-50 p-6 text-raiz-gray-950">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <Image
                src={accountConfig.currencyIcon}
                alt={currency}
                width={32}
                height={32}
              />
            </div>
            <h3 className="mt-2 text-lg font-bold leading-normal xl:text-xl">
              {accountConfig.benefitsTitle}
            </h3>
            <p className="text-xs font-normal leading-tight xl:text-sm">
              {accountConfig.description}
            </p>
          </div>

          <div className="mt-[30px] flex flex-col gap-[22px] rounded-[20px] bg-raiz-gray-50 p-6 xl:gap-[32px]">
            {accountConfig.features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={30}
                  height={30}
                />
                <div className="flex flex-col gap-1">
                  <h6 className="text-[13px] font-bold leading-[16.80px] xl:text-sm">
                    {feature.title}
                  </h6>
                  <p className="text-xs font-normal leading-tight xl:text-[13px]">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {!canCreate && (
            <div className="mt-[30px] rounded-2xl bg-[#FFF3E666] p-4 text-xs leading-tight text-raiz-gray-900 xl:text-[13px]">
              Your USD balance is ${usdBalance.toFixed(2)}. You need at least $
              {FOREIGN_ACCOUNT_ACTIVATION_FEE_USD} to activate a {currency}{" "}
              account.
            </div>
          )}
        </div>

        <Button
          onClick={handleCreate}
          loading={createForeignAccountMutation.isPending}
          disabled={!canCreate}
          className="bg-primary disabled:!bg-slate-500"
        >
          Create {currency} Account for ${FOREIGN_ACCOUNT_ACTIVATION_FEE_USD}
        </Button>
      </div>
    </div>
  );
};

export default CreateForeignAcct;
