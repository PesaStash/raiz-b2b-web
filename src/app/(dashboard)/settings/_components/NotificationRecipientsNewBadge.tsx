"use client";

import { useNotificationRecipientsNewBadge } from "@/lib/hooks/useNotificationRecipientsNewBadge";

type Props = {
  className?: string;
};

const NotificationRecipientsNewBadge = ({ className = "" }: Props) => {
  const { showNewBadge } = useNotificationRecipientsNewBadge();

  if (!showNewBadge) return null;

  return (
    <div
      className={`bg-raiz-usd-primary w-10 px-1 text-center py-1 text-raiz-gray-50 text-[10px] font-semibold leading-tight rounded-full ${className}`}
    >
      New
    </div>
  );
};

export default NotificationRecipientsNewBadge;
