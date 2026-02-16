"use client";
import React from "react";
import Image from "next/image";
import { FetchUserRewardsActivitiesApi } from "@/services/user";
import { useInfiniteQuery } from "@tanstack/react-query";
import { IRewardActivityResponse } from "@/types/services";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import { convertField } from "@/utils/helpers";

const RewardsActivities = () => {
  const limit = 10;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    //   isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<IRewardActivityResponse>({
    queryKey: ["reward-activities"],
    queryFn: ({ pageParam = 1 }) =>
      FetchUserRewardsActivitiesApi({ limit, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.next_page;
    },
    initialPageParam: 1,
  });

  const activities = data?.pages.flatMap((page) => page.data) || [];
  return (
    <div className="mt-5">
      <div className="flex justify-between  items-center mb-4">
        <h5 className="text-raiz-gray-900 text-[15px] font-semibold  leading-[21px]">
          Activity
        </h5>
        <button className="">
          <Image src={"/icons/arrow-right.svg"} alt="" width={18} height={18} />
        </button>
      </div>
      {isLoading ? (
        <p className="text-raiz-gray-950 text-[13px] leading-tight">
          Loading...
        </p>
      ) : (
        <InfiniteScroll
          dataLength={activities.length} // Total number of items loaded
          next={fetchNextPage} // Function to call when more items should load
          hasMore={!!hasNextPage} // Whether there are more items to load
          loader={
            <p className="text-center text-raiz-gray-950 text-[13px]">
              Loading more...
            </p>
          }
          endMessage={
            activities.length > 0 && (
              <p className="text-center text-raiz-gray-950 text-[13px]">
                No more activities to show
              </p>
            )
          }
        >
          {activities.length > 0 ? (
            <div className="flex flex-col gap-6 ">
              {activities.map((each, index) => (
                <div key={index} className="flex justify-between ">
                  <div className="flex gap-2.5 items-center">
                    <Image
                      className="h-12 w-12 rounded-[48px]"
                      src={each?.promo_img_url || "/images/default-pfp.svg"}
                      alt="pfp"
                      width={48}
                      height={48}
                    />
                    <div className="">
                      <p className="text-raiz-gray-950 text-sm capitalize font-semibold">
                        {convertField(
                          each?.reward_activity_type?.reward_activity_type
                        )}
                      </p>
                      <p className="text-raiz-gray-950 text-xs opacity-50 leading-[15px]">
                        {dayjs(each.created_at).format("D MMM YYYY [@] h:mm A")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[#e5890c] text-sm font-semibold leading-tight">
                      {each.reward_activity_type.points_awarded}pt
                    </p>
                    <p className="text-[#19151e] text-xs font-normal leading-[18px]">
                      {each.total_points}pt
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-raiz-gray-950 text-[13px] leading-tight">
              No recent activities
            </p>
          )}
        </InfiniteScroll>
      )}
    </div>
  );
};

export default RewardsActivities;
