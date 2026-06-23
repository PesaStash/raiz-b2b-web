"use client";

import { useEffect } from "react";
import RouteSectionInfo from "../_components/RouteSectionInfo";
import SettingsMobileBack from "../_components/SettingsMobileBack";
import NotificationRecipientsTable from "./_components/NotificationRecipientsTable";
import { useUser } from "@/lib/hooks/useUser";
import { markNotificationRecipientsFeatureUsed } from "@/utils/notificationRecipientsFeature";

const NotificationRecipientsIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
    <rect width="40" height="40" rx="20" fill="#F3F1F6" />
    <path
      d="M24 9H16C14.343 9 13 10.343 13 12V28C13 29.657 14.343 31 16 31H24C25.657 31 27 29.657 27 28V12C27 10.343 25.657 9 24 9Z"
      fill="#DEC2FC"
    />
    <path
      d="M22 27C21.814 27 18.186 27 18 27C17.448 27 17 27.448 17 28C17 28.552 17.448 29 18 29C18.186 29 21.814 29 22 29C22.552 29 23 28.552 23 28C23 27.448 22.552 27 22 27Z"
      fill="#A926B2"
    />
    <path
      d="M22.5 13C21.119 13 20 14.119 20 15.5V21.694C20 22.252 20.622 22.585 21.087 22.275L23 21H29.5C30.881 21 32 19.881 32 18.5V15.5C32 14.119 30.881 13 29.5 13H22.5Z"
      fill="#A926B2"
    />
  </svg>
);

const NotificationRecipientsPage = () => {
  const { user } = useUser();

  useEffect(() => {
    markNotificationRecipientsFeatureUsed(user?.business_account_id);
  }, [user?.business_account_id]);

  return (
    <section className="w-full min-w-0">
      <SettingsMobileBack />
      <div className="hidden lg:flex gap-10 items-start w-full">
        {/* <RouteSectionInfo
          title="Notification Recipients"
          subtitle="Manage email addresses that receive transactions notifications"
          icon={<NotificationRecipientsIcon />}
        /> */}
        <div className="flex-1 min-w-0">
          <NotificationRecipientsTable />
        </div>
      </div>
      <div className="lg:hidden bg-white rounded-2xl border border-raiz-gray-100 p-4 shadow-sm">
        <NotificationRecipientsTable />
      </div>
    </section>
  );
};

export default NotificationRecipientsPage;
