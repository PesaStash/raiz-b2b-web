"use client";
import { useSendStore } from "@/store/Send";
import React, { useMemo } from "react";
import Image from "next/image";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import {
  FlowHeader,
  FlowCard,
  FlowRow,
  FlowActions,
  FlowCurrency,
} from "./send-flow/Flow";
import { convertField, formatAmount, maskAccountNumber } from "@/utils/helpers";
import { formatUsdPaymentRailLabel } from "@/utils/thirdPartyUsdBeneficiary";

interface Props {
  goBack: () => void;
  goNext: () => void;
  fee: number;
}

const SendSummary = ({ goBack, goNext, fee }: Props) => {
  const {
    category,
    amount,
    purpose,
    user: selectedUser,
    usdBeneficiary,
    foreignBeneficiary,
    externalUser,
  } = useSendStore();
  const { selectedCurrency } = useCurrencyStore();

  const totalPayable = fee ? parseFloat(amount) + fee : amount;

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
    if ("foreign_currency_beneficiary" in recipient)
      return recipient.foreign_currency_beneficiary.account_name || "";
    if ("bank_account_name" in recipient)
      return recipient.bank_account_name || "";
    return "";
  }, [recipient]);

  const recipientAccountNumber = useMemo(() => {
    if (!recipient) return "";
    if ("usd_beneficiary" in recipient)
      return recipient.usd_beneficiary?.account_number || "";
    if ("foreign_currency_beneficiary" in recipient)
      return (
        recipient.foreign_currency_beneficiary.account_number ||
        recipient.foreign_currency_beneficiary.iban ||
        ""
      );
    if ("bank_account_number" in recipient)
      return recipient.bank_account_number || "";
    return "";
  }, [recipient]);

  return (
    <>
      <FlowHeader title="Review your transfer" onBack={goBack} />
      <FlowCard>
        <div className="flex items-center gap-2.5">
          <FlowCurrency currency={selectedCurrency.name} size={36} />
          <Image
            src="/images/send/chevron.svg"
            width={18}
            height={18}
            alt="to"
            className="rotate-180"
          />
          <Image
            src={
              selectedUser ? "/images/send/raizer.svg" : "/images/send/bank.svg"
            }
            width={44}
            height={44}
            alt=""
          />
        </div>
        <p className="text-4xl font-semibold">
          {selectedCurrency.sign}
          {formatAmount(Number(totalPayable))}
        </p>
        <p className="text-sm text-[#79708d]">
          Total {selectedCurrency.name} deducted from your balance
        </p>
        <FlowRow label="To">
          {recipientName}
          {selectedUser ? ` · @${selectedUser.username} · Raizer` : ""}
        </FlowRow>
        {!selectedUser && recipientAccountNumber && (
          <FlowRow label="Account number">
            {maskAccountNumber(recipientAccountNumber)}
          </FlowRow>
        )}
        {usdBeneficiary?.usd_beneficiary?.bank_name && (
          <FlowRow label="Bank">
            {usdBeneficiary.usd_beneficiary.bank_name}
          </FlowRow>
        )}
        {usdBeneficiary && (
          <FlowRow label="Payment rail">
            {formatUsdPaymentRailLabel(
              usdBeneficiary.usd_beneficiary.payment_rail,
            )}
          </FlowRow>
        )}
        {foreignBeneficiary && (
          <FlowRow label="Payment rail">
            {convertField(
              foreignBeneficiary.foreign_currency_beneficiary.payment_rail,
            )}
          </FlowRow>
        )}
        <FlowRow label="You send">
          {selectedCurrency.sign}
          {formatAmount(Number(amount))}
        </FlowRow>
        <FlowRow label="Fee">
          {fee ? `${selectedCurrency.sign}${formatAmount(fee)}` : "Free"}
        </FlowRow>
        <FlowRow label={`Total ${selectedCurrency.name} deducted`}>
          {selectedCurrency.sign}
          {formatAmount(Number(totalPayable))}
        </FlowRow>
        <FlowRow label="Rate">No conversion</FlowRow>
        {category && (
          <FlowRow label="Category">{category.transaction_category}</FlowRow>
        )}
        <FlowRow label="Purpose">{purpose}</FlowRow>
        <FlowRow label="Recipient gets">
          {selectedCurrency.sign}
          {formatAmount(Number(amount))}
        </FlowRow>
        <FlowActions
          onBack={goBack}
          onNext={goNext}
          nextLabel={`Send ${selectedCurrency.sign}${formatAmount(Number(amount))}`}
        />
      </FlowCard>
    </>
  );
};
export default SendSummary;
