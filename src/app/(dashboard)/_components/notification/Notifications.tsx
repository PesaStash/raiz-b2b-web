"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { groupByDate, truncateString } from "@/utils/helpers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import NotificationDetailModal from "./NotificationDetailModal";
import { INotification } from "@/types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MarkAsReadApi } from "@/services/business";
import { INotificationResponse } from "@/types/services";
import Spinner from "@/components/ui/Spinner";
import "@/styles/misc.css";
import { useNotifications } from "@/lib/hooks/useNotifications";

dayjs.extend(relativeTime);

export const categoryIcons = [
  { code: 1, icon: "/icons/notif-debit.svg" },
  { code: 2, icon: "/icons/notif-credit.svg" },
  // { code: 3, icon: <SavingsIcon width={20} height={20} /> },
  // { code: 4, icon: <LeadershipIcon width={20} height={20} /> },
  { code: 5, icon: "/icons/notif-split.svg" },
  // { code: 6, icon: <BillRequestIcon /> },
  // { code: 7, icon: <LoanNotificationIcon /> }
];

const NotificationItem = ({
  notification_body,
  notification_title,
  read,
  notification_category,
  onMarkAsRead,
}: INotification & { onMarkAsRead: () => void }) => {
  const categoryIcon =
    categoryIcons.find(
      (icon) => icon.code === notification_category.notification_category_id
    )?.icon || "/icons/notif-general.svg";

  return (
    <div
      className={`pl-4 py-5 ${
        read ? "bg-transparent" : "bg-[#eaecff]/50"
      } rounded-[20px] justify-start items-start gap-3 inline-flex w-full`}
      onClick={onMarkAsRead}
    >
      <div className="w-10 h-10 relative">
        <Image
          src={categoryIcon}
          alt={notification_category.notification_category_name}
          width={40}
          height={40}
        />
        {!read && (
          <span className="w-2 h-2 bg-[#db180d] rounded-full absolute top-1 right-0" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h6 className="text-raiz-gray-950 text-[13px] font-bold  leading-[18.20px]">
          {notification_title}
        </h6>
        <p className="text-raiz-gray-950 text-[13px] font-normal  leading-tight">
          {truncateString(notification_body, 40)}
        </p>
      </div>
    </div>
  );
};

const Notifications = ({ close }: { close: () => void }) => {
  const [selectedNotification, setSelectedNotification] =
    useState<INotification | null>(null);
  const qc = useQueryClient();
  const limit = 10;
  const scrollDivRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useNotifications(limit);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => MarkAsReadApi(notificationId),
    onMutate: async (notificationId) => {
      // Optimistically update the cache before the API call
      await qc.cancelQueries({ queryKey: ["notifications"] });

      const previousData = qc.getQueryData<INotificationResponse[]>([
        "notifications",
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qc.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: INotificationResponse) => ({
            ...page,
            notifications: page.notifications.map((notif: INotification) =>
              notif.notification_id === notificationId
                ? { ...notif, read: true }
                : notif
            ),
          })),
        };
      });

      return { previousData }; // Return context for rollback on error
    },
    onError: (err, notificationId, context) => {
      // Rollback to previous data on error
      qc.setQueryData(["notifications"], context?.previousData);
    },
    onSettled: () => {
      // Optionally refetch to ensure consistency with the server
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.pages.flatMap((page) => page.notifications) || [];
  const groupedNotifications = groupByDate<INotification>(
    notifications,
    "created_at"
  );

  const handleNotificationClick = (notification: INotification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.notification_id);
    }
    setSelectedNotification(notification);
  };

  // Handle scroll event
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (bottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <>
      <div className="h-full overflow-hidden flex flex-col">
        <div className="sticky bg-raiz-gray-50 w-full h-[49px] flex items-center z-10">
          <div className="flex justify-between w-1/2 items-center">
            <button onClick={close}>
              <Image
                src={"/icons/close.svg"}
                alt="go back"
                width={16}
                height={16}
              />
            </button>
            <h5 className="text-center text-raiz-gray-950 text-base font-bold leading-tight">
              Inbox
            </h5>
          </div>
        </div>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div
            ref={scrollDivRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto no-scrollbar"
          >
            <div className="flex flex-col gap-[49px] mt-3 pb-[100px]">
              {Object.keys(groupedNotifications).length > 0 ? (
                <>
                  {Object.keys(groupedNotifications).map((dateLabel) => (
                    <div key={dateLabel}>
                      <h4 className="text-raiz-gray-950 text-base font-medium font-brSonoma leading-tight">
                        {dateLabel}
                      </h4>
                      <div className="flex flex-col gap-2 mt-2">
                        {groupedNotifications[dateLabel].map(
                          (notification, index) => (
                            <button
                              key={index}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              className="text-left w-full"
                              aria-label={`View notification: ${notification.notification_title}`}
                              role="button"
                            >
                              <NotificationItem
                                {...notification}
                                onMarkAsRead={() =>
                                  !notification.read &&
                                  markAsReadMutation.mutate(
                                    notification.notification_id
                                  )
                                }
                              />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}

                  {isFetchingNextPage && (
                    <p className="text-center text-raiz-gray-950 text-[13px] py-4">
                      Loading more...
                    </p>
                  )}

                  {!hasNextPage && notifications.length > 0 && (
                    <p className="text-center text-raiz-gray-950 text-[13px] py-4">
                      You&#39;re caught up!
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col justify-center h-full items-center">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path
                      d="M58.6669 24V42.6667C58.6669 47.0933 55.0935 50.6667 50.6669 50.6667H21.3335C19.2802 50.6667 17.4402 49.8933 16.0269 48.64L19.7335 45.3333H42.6669C47.0935 45.3333 50.6669 41.76 50.6669 37.3333V18.6667C50.6669 17.7333 50.5069 16.8267 50.1869 16H50.6669C55.0935 16 58.6669 19.5733 58.6669 24Z"
                      fill="#444B8C"
                    />
                    <path
                      d="M58.6667 37.4136V54.5602C58.6667 58.0269 54.5868 59.8402 52.0001 57.5469L41.2534 48.0002H53.3334V38.4536L58.6667 37.4136Z"
                      fill="#444B8C"
                    />
                    <path
                      opacity="0.35"
                      d="M42.6668 10.6665H13.3335C8.91483 10.6665 5.3335 14.2478 5.3335 18.6665V49.2372C5.3335 52.6878 9.41083 54.5198 11.9922 52.2265L19.7442 45.3332H42.6668C47.0855 45.3332 50.6668 41.7518 50.6668 37.3332V18.6665C50.6668 14.2478 47.0855 10.6665 42.6668 10.6665Z"
                      fill="#5633E3"
                    />
                    <path
                      d="M7.99985 58.6665C7.31719 58.6665 6.63452 58.4052 6.11452 57.8852C5.07185 56.8425 5.07185 55.1572 6.11452 54.1145L54.1145 6.11452C55.1572 5.07185 56.8425 5.07185 57.8852 6.11452C58.9279 7.15719 58.9279 8.84252 57.8852 9.88519L9.88519 57.8852C9.36519 58.4052 8.68252 58.6665 7.99985 58.6665Z"
                      fill="#1E1924"
                    />
                  </svg>
                  <h2 className="text-raiz-gray-950 text-lg font-bold mb-8 leading-snug">
                    You have no messages yet
                  </h2>
                  <p className="text-center text-raiz-gray-950 text-sm font-normal leading-tight">
                    If there were any new updates or important messages for you
                    they would appear here.
                  </p>
                  <p className="text-center text-raiz-gray-950 text-sm font-normal leading-tight mt-6">
                    Keep exploring and engaging with the app to stay connected
                    and receive timely notifcations
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {selectedNotification ? (
        <NotificationDetailModal
          notification={selectedNotification}
          close={() => setSelectedNotification(null)}
        />
      ) : null}
    </>
  );
};

export default Notifications;
