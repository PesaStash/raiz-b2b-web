"use client";
import { spendableBalances } from "@/lib/globalBalance";
import { useUser } from "@/lib/hooks/useUser";
import { useSendStore } from "@/store/Send";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import ErrorMessage from "../ui/ErrorMessage";
import InputField from "../ui/InputField";
import { toast } from "sonner";
import {
  FlowHeader,
  FlowCard,
  FlowRecipient,
  FlowAmount,
  FlowRow,
  FlowTotal,
  FlowActions,
} from "./send-flow/Flow";
import { formatAmount } from "@/utils/helpers";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee: number;
  loading?: boolean;
  minAmount?: number;
}

const SendMoney = ({
  goBack,
  goNext,
  fee,
  minAmount,
  loading = false,
}: Props) => {
  const {
    user: selectedUser,
    externalUser,
    amount,
    purpose,
    actions,
    usdBeneficiary,
    foreignBeneficiary,
  } = useSendStore();
  const { user, refetch } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const availableBalance = Number(
    spendableBalances(user?.business_account).find(
      (balance) => balance.currency === selectedCurrency.name,
    )?.available_balance ?? 0,
  );

  useEffect(() => {
    refetch();
  }, []);

  const effectiveMinAmount = minAmount ?? 1;

  const amountSchema = useMemo(
    () =>
      z
        .string()
        .regex(/^\d*\.?\d{0,2}$/, "Enter a valid amount (max 2 decimal places)")
        .refine((val) => parseFloat(val) >= effectiveMinAmount, {
          message: `Amount must be at least ${effectiveMinAmount}`,
        })
        .refine(
          (val) => {
            const totalAvailable = availableBalance;
            return parseFloat(val) <= totalAvailable;
          },
          {
            message: `Amount cannot exceed available balance`,
          },
        ),
    [availableBalance, effectiveMinAmount],
  );

  const minPurposeLength =
    selectedCurrency.name === "GBP" || selectedCurrency.name === "EUR" ? 6 : 3;

  const purposeSchema = useMemo(
    () =>
      z.string().min(minPurposeLength, {
        message: `Purpose must be at least ${minPurposeLength} characters long`,
      }),
    [minPurposeLength],
  );

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
    if (
      !amountSchema.safeParse(amount).success ||
      !purposeSchema.safeParse(purpose).success
    )
      return;
    const parsedAmount = parseFloat(amount || "0");
    const totalAvailable = availableBalance;

    if (parsedAmount + fee > totalAvailable) {
      toast.warning("Account balance too low to carry out this transaction");
      return;
    }

    if (minAmount && parsedAmount < minAmount) {
      toast.warning(
        `Amount must be at least ${selectedCurrency?.sign}${minAmount}`,
      );
      return;
    }

    goNext();
  };

  const recipient = useMemo(() => {
    if (selectedUser) return selectedUser;
    if (usdBeneficiary) return usdBeneficiary;
    if (foreignBeneficiary) return foreignBeneficiary;
    if (externalUser) return externalUser;
    return null;
  }, [selectedUser, usdBeneficiary, foreignBeneficiary, externalUser]);

  const recipientName = useMemo(() => {
    if (!recipient) return "";
    if ("account_name" in recipient) return recipient.account_name || "";
    if ("usd_beneficiary" in recipient)
      return recipient.usd_beneficiary.account_name || "";
    if ("bank_account_name" in recipient)
      return recipient.bank_account_name || "";
    if ("foreign_currency_beneficiary" in recipient)
      return recipient.foreign_currency_beneficiary.account_name || "";
    return "";
  }, [recipient]);

  const recipientImage = useMemo(() => {
    if (!recipient) return "";
    if ("selfie_image" in recipient) return recipient.selfie_image;
    return "";
  }, [recipient]);

  const amountValid = amountSchema.safeParse(amount).success;
  const purposeValid = purposeSchema.safeParse(purpose).success;
  return (
    <>
      <FlowHeader title="Send money" onBack={goBack} />
      <FlowCard>
        <FlowRecipient
          name={recipientName}
          image={recipientImage || ""}
          detail={
            selectedUser ? `@${selectedUser.username} · Raizer` : "Bank account"
          }
          onChange={goBack}
        />
        <FlowAmount
          currency={selectedCurrency.name}
          amount={amount}
          recipient={recipientName}
          onChange={(value) => {
            actions.setAmountAndRemark({ amount: value, purpose });
            setError(null);
          }}
        />
        <div className="flex flex-col gap-4 [@media(max-height:800px)]:gap-0 max-md:gap-0">
          <FlowRow label="Rate">No conversion</FlowRow>
          {selectedUser && <FlowRow label="Arrives">Instant</FlowRow>}
          <FlowRow label="You send">
            {selectedCurrency.sign}
            {formatAmount(Number(amount) || 0)}
          </FlowRow>
          <FlowRow label="Fee">
            {fee ? `${selectedCurrency.sign}${formatAmount(fee)}` : "Free"}
          </FlowRow>
        </div>
        <FlowTotal
          currency={selectedCurrency.name}
          total={(Number(amount) || 0) + fee}
          balance={availableBalance}
        />
        <InputField
          label="Purpose"
          name="purpose"
          placeholder="What is the purpose?"
          value={purpose}
          onChange={handlePurposeChange}
        />
        {error && <ErrorMessage message={error} />}
        {amount && !amountValid && (
          <ErrorMessage
            message={`Enter an amount of at least ${selectedCurrency.sign}${effectiveMinAmount} within your available balance.`}
          />
        )}
        <FlowActions
          onNext={handleNext}
          disabled={!amountValid || !purposeValid || loading}
          loading={loading}
        />
      </FlowCard>
    </>
  );
};
export default SendMoney;
