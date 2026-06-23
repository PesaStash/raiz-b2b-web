"use client";

import Button from "@/components/ui/Button";
import { UpdateNotificationEmailApi } from "@/services/business";
import { INotificationEmail } from "@/types/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { markNotificationRecipientsFeatureUsed } from "@/utils/notificationRecipientsFeature";

interface Props {
  close: () => void;
  recipient: INotificationEmail;
}

const RemoveRecipientModal = ({ close, recipient }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const removeMutation = useMutation({
    mutationFn: () =>
      UpdateNotificationEmailApi(
        recipient.business_transaction_notification_email_id,
        { active: false },
      ),
    onSuccess: () => {
      markNotificationRecipientsFeatureUsed(user?.business_account_id);
      toast.success("Recipient removed successfully");
      queryClient.invalidateQueries({ queryKey: ["notification-emails"] });
      close();
    },
  });

  return (
    <div className="flex flex-col items-center p-6 sm:p-8 w-full text-center">
      <div className="size-14 mb-5 rounded-2xl bg-[#FDDCDA] flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12H19M19 12L14 7M19 12L14 17"
            stroke="#DC180D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-raiz-gray-950 mb-2">
        Remove Recipient
      </h2>
      <p className="text-sm text-raiz-gray-600 mb-8">
        Are you sure you want to remove{" "}
        <span className="font-semibold text-raiz-gray-900">
          {recipient.email}
        </span>
        ?
      </p>
      <div className="flex flex-col gap-3 w-full">
        <Button
          type="button"
          onClick={() => removeMutation.mutate()}
          loading={removeMutation.isPending}
          disabled={removeMutation.isPending}
          className="w-full !bg-red-600 hover:!bg-red-700"
        >
          Remove Recipient
        </Button>
        <Button
          type="button"
          variant="tertiary"
          onClick={close}
          disabled={removeMutation.isPending}
          className="w-full bg-[#FDDCDA] hover:!bg-[#FDDCDA]/80"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default RemoveRecipientModal;
