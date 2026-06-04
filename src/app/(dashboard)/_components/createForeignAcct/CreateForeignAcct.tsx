"use client";

import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import Button from "@/components/ui/Button";
import { useUser } from "@/lib/hooks/useUser";
import { CreateForeignAccountApi } from "@/services/business";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { ForeignCurrency } from "@/types/services";
import { getApiErrorMessage } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { toast } from "sonner";

const content: Record<
  ForeignCurrency,
  {
    title: string;
    description: string;
    icon: string;
    features: string[];
  }
> = {
  GBP: {
    title: "Create GBP Account",
    description:
      "Open a GBP virtual account for local collections, deposits, and USD to GBP conversions.",
    icon: "/icons/gbp.png",
    features: [
      "Receive GBP with local account details.",
      "Manage GBP deposits and balances from the dashboard.",
      "Convert between USD and GBP inside the existing swap flow.",
    ],
  },
  EUR: {
    title: "Create EUR Account",
    description:
      "Open a EUR virtual account for SEPA-friendly collections, deposits, and USD to EUR conversions.",
    icon: "/icons/flag-fr.png",
    features: [
      "Receive EUR with IBAN-based account details.",
      "Manage EUR deposits and balances from the dashboard.",
      "Convert between USD and EUR inside the existing swap flow.",
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
  const config = content[currency];

  const createForeignAccountMutation = useMutation({
    mutationFn: () => CreateForeignAccountApi(currency),
    onSuccess: async () => {
      toast.success(`${currency} account created successfully`);
      await qc.invalidateQueries({ queryKey: ["user"] });
      const refreshedUser = await refetch();
      setSelectedCurrency(currency, refreshedUser.data || user);
      close();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, `Unable to create your ${currency} account`),
      );
    },
  });

  return (
    <div className="w-full xl:max-h-[85vh] lg:max-h-[80vh] flex flex-col font-brSonoma">
      <CenterModalHeader close={close} />
      <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
        {config.title}
      </h2>
      <div className="flex flex-col justify-between gap-8 h-full pb-[30px]">
        <div>
          <div className="bg-raiz-gray-50 p-6 rounded-[20px] flex flex-col justify-center text-raiz-gray-950 gap-3">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
              <Image src={config.icon} alt={currency} width={44} height={44} />
            </div>
            <h3 className="xl:text-xl text-lg font-bold leading-normal mt-2">
              What you get with your {currency} account
            </h3>
            <p className="xl:text-sm text-xs font-normal leading-tight">
              {config.description}
            </p>
          </div>

          <div className="bg-raiz-gray-50 p-6 rounded-[20px] flex flex-col gap-[22px] mt-[30px]">
            {config.features.map((feature) => (
              <div key={feature} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-violet-100/60 flex items-center justify-center text-primary text-sm font-bold">
                  {currency}
                </div>
                <p className="text-xs xl:text-[13px] font-normal leading-tight">
                  {feature}
                </p>
              </div>
            ))}

            <div className="rounded-2xl bg-[#FFF3E666] p-4 text-xs xl:text-[13px] leading-tight text-raiz-gray-900">
              You need an active USD account first. If it is missing, the backend
              prerequisite message will be shown here.
            </div>
          </div>
        </div>

        <Button
          onClick={() => createForeignAccountMutation.mutate()}
          loading={createForeignAccountMutation.isPending}
          className="bg-primary disabled:!bg-slate-500"
        >
          Create {currency} Account
        </Button>
      </div>
    </div>
  );
};

export default CreateForeignAcct;
