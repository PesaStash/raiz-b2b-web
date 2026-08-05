"use client";
import React from "react";
import Overlay from "../ui/Overlay";
import Button from "../ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogoutApi } from "@/services/auth";
import { useRouter } from "next/navigation";
import { GetItemFromCookie, RemoveItemFromCookie } from "@/utils/CookiesFunc";
import { useUser } from "@/lib/hooks/useUser";
import {
  clearUsdOnboardingCase,
  clearUsdOnboardingSessionState,
  USD_ONBOARDING_QUERY_KEY,
} from "@/lib/hooks/useUsdOnboarding";
import { clearUserDataSessionFlag, pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import { getAnalyticsUserId } from "@/utils/analytics/userProps";

const LogoutModal = ({ close }: { close: () => void }) => {
  const router = useRouter();
  const { clearUser, user } = useUser();
  const qc = useQueryClient();
  const token = GetItemFromCookie("access_token") ?? "";
  const logoutMutation = useMutation({
    mutationFn: () => LogoutApi(token),
    onSuccess: () => {
      pushDataLayerEvent("logout", {
        user_id: getAnalyticsUserId(user) || undefined,
      });
      clearUserDataSessionFlag();
      clearUsdOnboardingSessionState();
      const entityId = user?.business_account?.entity_id;
      if (entityId) {
        clearUsdOnboardingCase(entityId);
        qc.removeQueries({ queryKey: [...USD_ONBOARDING_QUERY_KEY, entityId] });
      }
      RemoveItemFromCookie("accessToken");
      qc.clear();
      clearUser();
      router.push("/login");
      close();
    },
  });
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  return (
    <Overlay width="375px" close={close} className="!z-[110]">
      <div className="flex flex-col justify-center items-center  h-full py-8 px-5  text-center ">
        <svg width="49" height="48" viewBox="0 0 49 48" fill="none">
          <path
            opacity="0.35"
            d="M40.5 10V38C40.5 41.314 37.814 44 34.5 44H14.5C11.186 44 8.5 41.314 8.5 38V10C8.5 6.686 11.186 4 14.5 4H34.5C37.814 4 40.5 6.686 40.5 10Z"
            fill="#B3261E"
          />
          <path
            d="M36.5 20H22.5C20.29 20 18.5 21.79 18.5 24C18.5 26.21 20.29 28 22.5 28H36.5V20Z"
            fill="#951F38"
          />
          <path
            d="M33.658 32.2622C33.658 33.8042 35.518 34.5802 36.614 33.4942L44.4 25.7822C45.39 24.8002 45.39 23.2002 44.4 22.2182L36.614 14.5062C35.518 13.4222 33.658 14.1982 33.658 15.7382V32.2622Z"
            fill="#951F38"
          />
        </svg>

        <h4 className="text-raiz-gray-950   text-xl font-bold  leading-relaxed">
          Confirming Your Logout
        </h4>
        <p className="text-raiz-gray-700 text-[13px] font-normal leading-tight mb-5">
          Are you certain you wish to log out?
        </p>
        <div className="flex flex-col gap-[15px] w-full">
          <Button
            loading={logoutMutation.isPending}
            className="!bg-[#db180d] hover:opacity-80 text-[#F9F9F9]"
            onClick={handleLogout}
          >
            Log Out
          </Button>
          <Button
            disabled={logoutMutation.isPending}
            className="!bg-[#FDDCDA] hover:opacity-80 text-raiz-gray-950"
            onClick={close}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

export default LogoutModal;
