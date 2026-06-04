"use client";

import Avatar from "@/components/ui/Avatar";
import EmptyList from "@/components/ui/EmptyList";
import { IForeignBeneficiary } from "@/types/services";
import { truncateString } from "@/utils/helpers";

interface Props {
  beneficiaries: IForeignBeneficiary[];
  onSelect: (beneficiary: IForeignBeneficiary) => void;
}

const ForeignBeneficiaryList = ({ beneficiaries, onSelect }: Props) => {
  if (!beneficiaries.length) {
    return <EmptyList text={"No beneficiary yet"} />;
  }

  return (
    <div className="flex gap-2 overflow-x-scroll no-scrollbar">
      {beneficiaries.map((beneficiary) => {
        const details = beneficiary.foreign_currency_beneficiary;
        const accountRef =
          details.account_number || details.iban || details.routing_number || "";

        return (
          <button
            key={beneficiary.entity_foreign_currency_beneficiary_id}
            className="flex flex-col justify-center items-center gap-1 px-2 flex-shrink-0"
            onClick={() => onSelect(beneficiary)}
          >
            <Avatar name={details.account_name} src={null} />
            <p className="text-center text-raiz-gray-950 text-[13px] font-semibold leading-none">
              {beneficiary.label || details.bank_name}
            </p>
            <p className="text-center text-raiz-gray-700 text-xs leading-[18px]">
              {truncateString(accountRef, 20)}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default ForeignBeneficiaryList;
