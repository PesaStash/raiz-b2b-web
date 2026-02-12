"use client";
import BankModal from "@/components/modals/BankModal";
import BeneficiariesModal from "@/components/modals/BeneficiariesModal";
import RecentUsers from "@/components/transactions/RecentUsers";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import InputLabel from "@/components/ui/InputLabel";
import ModalTrigger from "@/components/ui/ModalTrigger";
import Spinner from "@/components/ui/Spinner";
import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import { useExternalBeneficiaries } from "@/lib/hooks/useExternalBeneficiaries";
import { useUser } from "@/lib/hooks/useUser";
import { FetchNgnAcctDetailsApi } from "@/services/transactions";
import { useSendStore } from "@/store/Send";
import { IBank } from "@/types/misc";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { ImSpinner2 } from "react-icons/im";
import { z } from "zod";

export const NGNAcctNoSchema = z
  .string()
  .nonempty("Account number is required")
  .regex(/^\d+$/, "Account number must contain only digits")
  .min(10, "Account number must be at least 10 digits long")
  .max(20, "Account number must not exceed 20 digits");

const SelectUser = () => {
  const { actions } = useSendStore();
  const { user } = useUser();
  const [showModal, setShowModal] = useState<"bank" | "beneficiary" | null>(
    null
  );
  const [bank, setBank] = useState<IBank>();
  const [acctNo, setAccountNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const currentWallet = useCurrentWallet(user);
  const { recents, favourites, isLoading } = useExternalBeneficiaries({
    walletId: currentWallet?.wallet_id,
    limit: 50,
  });

  useEffect(() => {
    const result = NGNAcctNoSchema.safeParse(acctNo);
    setIsValid(result.success);
    setError(result.success ? null : result.error.errors[0].message);
  }, [acctNo]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccountNo(value);

    const result = NGNAcctNoSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0].message);
    } else {
      setError(null);
    }
  };

  const { data, isFetching } = useQuery({
    queryKey: [
      "ngnAcctDetails",
      { account_number: acctNo, bank_code: bank?.bankCode },
    ],
    queryFn: async ({ queryKey }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, params] = queryKey as [
        string,
        { account_number: string; bank_code: string }
      ];
      return await FetchNgnAcctDetailsApi(params);
    },
    enabled: isValid && !!bank,
  });

  const userPayload = {
    bank_account_name: data?.account_name || null,
    bank_account_number: acctNo,
    bank_name: bank?.bankName || null,
    bank_short_code: bank?.bankCode || null,
  };

  const handleNext = () => {
    if (!bank) return;
    actions.selectExternalUser(userPayload);
  };

  if (isLoading)
    return (
      <div className="absolute inset-0 flex items-center justify-center ">
        <Spinner />
      </div>
    );
  return (
    <div className="flex flex-col h-full">
      {recents.length !== 0 && (
        <RecentUsers
          type="external"
          users={recents}
          setSelectedUser={actions.selectExternalUser}
        />
      )}
      <div className="flex flex-col justify-between h-full mt-[35px] pb-6">
        <div className="w-full">
          <div className="flex justify-between items-center mb-[15px]">
            <h5 className="text-zinc-900 text-sm font-bold leading-none">
              Other Bank
            </h5>
            <button
              onClick={() => setShowModal("beneficiary")}
              className="text-indigo-900 text-xs font-bold leading-tight"
            >
              Choose Beneficiary
            </button>
          </div>
          <InputField
            name="account_number"
            label="Account Number"
            placeholder="Enter account number"
            value={acctNo}
            onChange={handleAccountChange}
            errorMessage={error ? error : undefined}
          />
          <div className="mt-[15px]">
            <InputLabel content={"Bank Name"} />
            <ModalTrigger
              onClick={() => setShowModal("bank")}
              placeholder="Enter bank name"
              value={bank?.bankName || ""}
            />
          </div>
          <div className="flex gap-2 mt-2 items-center">
            {isFetching ? (
              <ImSpinner2 className="animate-spin w-4 h-4" />
            ) : (
              <span>{data?.account_name}</span>
            )}
          </div>
        </div>
        <Button disabled={!data || isFetching} onClick={handleNext}>
          Continue
        </Button>
      </div>
      {showModal === "bank" && (
        <BankModal setSelectedBank={setBank} close={() => setShowModal(null)} />
      )}
      {showModal === "beneficiary" && (
        <BeneficiariesModal
          setUser={actions.selectExternalUser}
          close={() => setShowModal(null)}
          users={favourites}
        />
      )}
    </div>
  );
};

export default SelectUser;
