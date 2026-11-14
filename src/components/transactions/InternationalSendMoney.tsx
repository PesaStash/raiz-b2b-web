"use client";
import { spendableBalances } from "@/lib/globalBalance";
import { useUser } from "@/lib/hooks/useUser";
import { useSendStore } from "@/store/Send";
import React, { useState } from "react";
import {
  FlowHeader,
  FlowCard,
  FlowRecipient,
  FlowAmount,
  FlowRow,
  FlowTotal,
  FlowActions,
} from "./send-flow/Flow";
import { z } from "zod";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";
import ErrorMessage from "../ui/ErrorMessage";
import InputField from "../ui/InputField";
import { toast } from "sonner";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee: number;
  loading?: boolean;
  minAmount: number;
}

const InternationalSendMoney = ({
  goBack,
  goNext,
  loading = false,
  minAmount,
}: Props) => {
  const { intBeneficiary, amount, purpose, actions } = useSendStore();
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const currency =
    intBeneficiary?.foreign_payout_beneficiary?.beneficiary_currency || "";
  const selectedUser = intBeneficiary?.foreign_payout_beneficiary;
  const amountSchema = z
    .string()
    .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)");

  const purposeSchema = z
    .string()
    .min(3, { message: "Purpose must be at least 3 characters long" });

  const handlePurposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPurpose = e.target.value;
    actions.setAmountAndRemark({ amount, purpose: newPurpose });

    // Re-validate purpose
    const result = purposeSchema.safeParse(newPurpose);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Also validate amount again to clear error if both are valid
    const amountResult = amountSchema.safeParse(amount || "0");
    if (!amountResult.success) {
      setError(amountResult.error.errors[0].message);
      return;
    }

    setError(null);
  };
  const handleNext = () => {
    const parsedAmount = parseFloat(amount || "0");
    if (minAmount && parsedAmount < minAmount) {
      toast.warning(
        `Amount must be at least ${getCurrencySymbol(currency)}${minAmount}`,
      );
      return;
    }
    goNext();
  };
  const validAmount =
    /^\d+(\.\d{1,2})?$/.test(amount) &&
    Number(amount) > 0 &&
    (!minAmount || Number(amount) >= minAmount);
  return (
    <>
      <FlowHeader title="Send money" onBack={goBack} />
      <FlowCard>
        <FlowRecipient
          name={selectedUser?.beneficiary_name || ""}
          detail={selectedUser?.beneficiary_account_number}
          onChange={goBack}
        />
        <FlowAmount
          currency={currency}
          amount={amount}
          recipient={selectedUser?.beneficiary_name || ""}
          onChange={(value) => {
            actions.setAmountAndRemark({ amount: value, purpose });
            setError(null);
          }}
        />
        <FlowRow label="Minimum amount">
          {getCurrencySymbol(currency)}
          {formatAmount(minAmount || 0)}
        </FlowRow>
        <FlowTotal
          currency="USD"
          balance={Number(
            spendableBalances(user?.business_account).find(
              (balance) => balance.currency === "USD",
            )?.available_balance ?? 0,
          )}
        />
        <p className="text-xs text-[#79708d]">
          Get a quote to see the current rate, fees and total USD deducted.
        </p>
        <InputField
          label="Purpose"
          name="purpose"
          value={purpose}
          placeholder="What is the purpose?"
          onChange={handlePurposeChange}
        />
        {error && <ErrorMessage message={error} />}
        <FlowActions
          onNext={handleNext}
          nextLabel="Get quote"
          disabled={!validAmount || !purposeSchema.safeParse(purpose).success}
          loading={loading}
        />
      </FlowCard>
    </>
  );
};
export default InternationalSendMoney;
