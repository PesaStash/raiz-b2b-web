import React from "react";
import Avatar from "@/components/ui/Avatar";
import { BeneficiaryType } from "@/components/modals/PaymentStatusModal";

interface LoadingStatusProps {
  user?: BeneficiaryType;
  loadingText: string;
  type: "p2p" | "external" | "crypto";
}

const LoadingStatus: React.FC<LoadingStatusProps> = ({
  user,
  loadingText,
  type = "p2p",
}) => {
  const getAccountName = (): string => {
    if (user) {
      if ("account_name" in user) return user.account_name; // ISearchedUser
      if ("bank_account_name" in user) return user?.bank_account_name || ""; // IExternalAccount
      if ("usd_beneficiary" in user) return user.usd_beneficiary.account_name; // EntityBeneficiary
      if ("foreign_payout_beneficiary" in user)
        return user.foreign_payout_beneficiary.beneficiary_name; // EntityForeignPayout
    }
    return "Recipient";
  };

  const getAvatarSrc = (): string | null => {
    if (type === "p2p" && user && "selfie_image" in user) {
      return user.selfie_image;
    }
    return null;
  };

  const accountName = getAccountName();
  const avatarSrc = getAvatarSrc();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-[36px] bg-gradient-to-l from-indigo-900 to-violet-600 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
      <div className="relative size-40">
        <span className="absolute h-full w-full animate-ping rounded-full bg-[#6167a5] opacity-75" />
        <div className="relative flex size-40 items-center justify-center rounded-full bg-[#8987c3]">
          <Avatar name={accountName} src={avatarSrc} />
        </div>
      </div>
      <div className="mt-20 flex flex-col items-center gap-2 text-center">
        <p className="text-base font-normal leading-normal text-gray-100">
          {loadingText}
        </p>
        <p className="text-lg font-bold leading-snug text-neutral-50">
          {accountName}
        </p>
      </div>
    </div>
  );
};

export default LoadingStatus;
