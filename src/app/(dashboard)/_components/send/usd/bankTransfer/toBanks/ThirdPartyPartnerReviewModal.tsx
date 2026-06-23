"use client";

import Button from "@/components/ui/Button";
import ListDetailItem from "@/components/ui/ListDetailItem";
import Overlay from "@/components/ui/Overlay";
import Avatar from "@/components/ui/Avatar";
import { IThirdPartyUsdBeneficiary } from "@/types/services";
import { getThirdPartyPartnerLogoSrc } from "@/utils/thirdPartyUsdBeneficiary";
import React from "react";

interface Props {
  close: () => void;
  partner: IThirdPartyUsdBeneficiary;
  onConfirm: () => void;
  loading?: boolean;
}

const ThirdPartyPartnerReviewModal = ({
  close,
  partner,
  onConfirm,
  loading = false,
}: Props) => {
  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col items-center py-8 px-5 text-center">
        <div className="relative mb-4">
          <Avatar
            src={getThirdPartyPartnerLogoSrc(partner.third_party_name)}
            name={partner.third_party_name}
          />
        </div>

        <h4 className="text-raiz-gray-950 text-xl font-bold leading-relaxed mb-2">
          Add {partner.third_party_name}?
        </h4>
        <p className="text-raiz-gray-700 text-[13px] font-normal leading-tight mb-6">
          Verify the details below to add this brand as a constant beneficiary.
        </p>

        <div className="w-full flex flex-col gap-3  text-left">
          <ListDetailItem
            title="Routing Number"
            value={partner.routing_number}
            border
          />
          <ListDetailItem
            title="Account Number"
            value={partner.account_number}
            border
          />
          <ListDetailItem
            title="Beneficiary Name"
            value={partner.account_name}
            border
          />
          <ListDetailItem title="Account Type" value="Checking" border />
          <ListDetailItem title="Label/Nickname" value={partner.third_party_name} border />
          {partner.bank_name ? (
              <ListDetailItem title="Bank Name" value={partner.bank_name} border />          
          ) : null}
          {partner.address ? (
            <ListDetailItem title="Address" value={partner.address} border />
          ) : null}
          {partner.zip_code ? (
            <ListDetailItem title="Postal Code" value={partner.zip_code} />
          ) : null}
        </div>

        <div className="flex flex-col gap-[15px] w-full">
          <Button loading={loading} disabled={loading} onClick={onConfirm}>
            Add Beneficiary
          </Button>
          <Button variant="secondary" disabled={loading} onClick={close}>
            Cancel
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

export default ThirdPartyPartnerReviewModal;
