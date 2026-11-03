"use client";

import Overlay from "@/components/ui/Overlay";
import Button from "@/components/ui/Button";
import { InfoBannerIcon } from "./PayoutUiParts";

interface Props {
  close: () => void;
  onConfirm: () => void;
  isSaving: boolean;
  sourceWallet: string;
  perTransactionLimit: string;
  dailyLimit: string;
  manualApproval: string;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 w-full">
    <p className="text-[13px] text-[#A89AB9] leading-[1.5] shrink-0">{label}</p>
    <p className="text-[13px] font-semibold text-raiz-gray-950 leading-[1.5] text-right">
      {value}
    </p>
  </div>
);

const EnablePayoutConfirmModal = ({
  close,
  onConfirm,
  isSaving,
  sourceWallet,
  perTransactionLimit,
  dailyLimit,
  manualApproval,
}: Props) => (
  <Overlay
    width="420px"
    close={() => {
      if (!isSaving) close();
    }}
  >
    <div className="flex flex-col items-center p-8 gap-8 text-center">
      <div className="flex flex-col items-center gap-5 w-full">
        <InfoBannerIcon variant="info" />
        <div className="flex flex-col items-center gap-3">
          <h4 className="text-raiz-gray-950 text-lg font-bold leading-[1.2]">
            Enable Live NGN Payouts?
          </h4>
          <p className="text-raiz-gray-600 text-sm leading-[1.4]">
            Live payouts move real funds from your NGN wallet. Please confirm
            your settings are correct before proceeding.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full bg-[#F8F7FA] rounded-2xl p-4 text-left">
        <DetailRow label="Source Wallet" value={sourceWallet} />
        <DetailRow label="Per-Transaction Limit" value={perTransactionLimit} />
        <DetailRow label="Daily Limit" value={dailyLimit} />
        <DetailRow label="Manual Approval" value={manualApproval} />
      </div>

      <div className="flex flex-col gap-[15px] w-full">
        <Button onClick={onConfirm} loading={isSaving} disabled={isSaving}>
          Enable Payouts
        </Button>
        <Button
          variant="secondary"
          className="!bg-[#E4E0EA] hover:!bg-[#D0C8D9]"
          onClick={close}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  </Overlay>
);

export default EnablePayoutConfirmModal;
