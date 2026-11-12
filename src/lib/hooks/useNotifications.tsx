import { FetchNotificationsApi } from "@/services/business";
import { INotificationResponse } from "@/types/services";
import { useInfiniteQuery } from "@tanstack/react-query";

export const useNotifications = (limit: number = 15) => {
  return useInfiniteQuery<INotificationResponse>({
    queryKey: ["notifications"],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: ({ pageParam = 1 }) =>
      FetchNotificationsApi({ limit, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination_details.next_page;
    },
    initialPageParam: 1,
  });
};
