"use client";
import { useSendStore } from "@/store/Send";
import React, { useMemo } from "react";
import Image from "next/image";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import Button from "../ui/Button";
import ListDetailItem from "../ui/ListDetailItem";
import CenterModalHeader from "../layouts/CenterModalHeader";
import { convertField, formatAmount } from "@/utils/helpers";

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
    // if ("account_number" in recipient) return recipient.account_number || "";
    if ("usd_beneficiary" in recipient)
      return recipient.usd_beneficiary?.account_number || "";
    if ("foreign_currency_beneficiary" in recipient)
      return (
        recipient.foreign_currency_beneficiary?.account_number ||
        recipient.foreign_currency_beneficiary?.iban ||
        ""
      );
    if ("bank_account_number" in recipient)
      return recipient.bank_account_number || "";
    return "";
  }, [recipient]);

  return (
    <div className="h-full flex flex-col overflow-auto no-scrollbar pb-5 lg:mb-12 xl:mb-0   ">
      <CenterModalHeader close={goBack} />
      <h5 className=" text-raiz-gray-950 text-[22px] font-semibold leading-tight mb-10">
        Send Summary
      </h5>
      <div className="flex h-full flex-col justify-between pb-5 ">
        <div className="rounded-[20px] flex flex-col bg-raiz-gray-50 px-6 lg:py-6 xl:py-10 desktop:py-16  mb-6">
          <div className="flex flex-col items-center justify-center mb-4 text-zinc-900">
            <div className="w-12 h-12 mb-4 flex mx-auto items-center justify-center bg-violet-100 bg-opacity-60 rounded-3xl">
              <Image
                className="w-6 h-6"
                src={category?.category_emoji || "/icons/notif-general.svg"}
                alt={category?.transaction_category || ""}
                width={24}
                height={24}
              />
            </div>
            <p className="text-center text-xl font-bold leading-normal">
              {selectedCurrency?.sign}
              {formatAmount(Number(totalPayable))}
            </p>
            <p className="text-center   text-xs font-normal  leading-tight">
              Send Summary
            </p>
          </div>
          <div className="w-full flex flex-col gap-[15px]">
            {/* Amount */}
            <ListDetailItem
              title="Amount"
              value={`${selectedCurrency?.sign}
              ${formatAmount(Number(amount))}`}
            />
            <ListDetailItem
              title="Transaction fee"
              value={`${selectedCurrency?.sign}
              ${fee.toLocaleString()}`}
            />
            <ListDetailItem title="Beneficiary" value={recipientName} />
            {!selectedUser && (
              <ListDetailItem
                title="Account Number"
                value={recipientAccountNumber}
              />
            )}
            {usdBeneficiary && (
              <ListDetailItem
                title="Payment Rail"
                value={convertField(
                  usdBeneficiary?.usd_beneficiary?.payment_rail,
                )}
              />
            )}
            {foreignBeneficiary && (
              <ListDetailItem
                title="Payment Rail"
                value={convertField(
                  foreignBeneficiary?.foreign_currency_beneficiary?.payment_rail,
                )}
              />
            )}
            <ListDetailItem title="Purpose" value={purpose} />
            <ListDetailItem
              title="Category"
              value={category?.transaction_category || ""}
            />
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <Button
            // disabled={!fee}
            onClick={goNext}
          >
            Send
          </Button>
          <Button onClick={goBack} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendSummary;
