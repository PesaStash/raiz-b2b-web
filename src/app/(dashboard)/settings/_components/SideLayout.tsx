"use client";
import { usePermissions } from "@/lib/hooks/usePermissions";

import { SettingsMenus } from "@/constants/SettingsMenuData";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import LevelsModal from "../../_components/rewards/LevelsModal";
import RaizScoreModal from "./RaizScoreModal";
import FreezeAcctModal from "./FreezeAcctModal";
import RaizTagModal from "./RaizTagModal";
import WalletTierModal from "./WalletTierModal";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { FetchUserRewardsApi } from "@/services/user";
import { useUser } from "@/lib/hooks/useUser";
import dayjs from "dayjs";
import ProfileAvatarUpload from "./ProfileAvatarUpload";
import NotificationRecipientsNewBadge from "./NotificationRecipientsNewBadge";

const SideLayout = () => {
  const { canWriteBusiness } = usePermissions();
  const [showLevels, setShowLevels] = useState(false);
  const [showRaizScore, setShowRaizScore] = useState(false);
  const [showRaizTag, setShowRaizTag] = useState(false);
  const [showWalletTier, setShowWalletTier] = useState(false);
  const [navModal, setNavModal] = useState<string | null>(null);
  const pathName = usePathname();
  const { user } = useUser();
  const [freezeType, setFreezeType] = useState<"enable" | "disable">("disable");

  const closeLevelsModal = () => {
    setShowLevels(false);
    setShowRaizScore(true);
  };

  const { data: pointsData } = useQuery({
    queryKey: ["reward-points"],
    queryFn: FetchUserRewardsApi,
  });

  const handleFreezeClick = (action: string) => {
    if (!user?.has_transaction_pin) {
      toast.warning("You have to setup transaction pin first");
      return;
    }
    setNavModal(action);
    if (user?.business_account?.entity?.is_entity_frozen) {
      setFreezeType("enable");
    } else {
      setFreezeType("disable");
    }
  };

  useEffect(() => {
    const isFrozen = user?.business_account?.entity?.is_entity_frozen ?? false;
    setFreezeType(isFrozen ? "enable" : "disable");
  }, [user?.business_account?.entity]);

  return (
    <section className="w-full h-full py-5 pr-2 no-scrollbar">
      <div className="mb-10">
        <ProfileAvatarUpload size="md" />
        <div className="flex flex-col gap-1 mt-3">
          <p className="text-raiz-gray-950 text-lg font-semibold leading-snug">
            {`${user?.first_name || ""} ${user?.last_name || ""}`}
          </p>
          <p className="text-raiz-gray-950 text-sm font-normal leading-tight">
            Joined{" "}
            {dayjs(user?.business_account?.entity?.created_at).format(
              "MMM YYYY",
            )}
          </p>
          <div className="flex items-center gap-0.5">
            <button
              disabled={!canWriteBusiness}
              onClick={() => setShowRaizTag(true)}
              className="px-2 h-[22px] bg-opacity-30 bg-neutral-300 flex gap-0.5 justify-center items-center rounded-3xl"
            >
              <span className="text-raiz-gray-950 text-[13px] font-normal leading-[18.20px]">
                {user?.business_account?.username
                  ? `@${user?.business_account?.username}`
                  : "Set username"}
              </span>
            </button>
            {user?.business_account?.entity?.wallet_tier && (
              <button
                onClick={() => setShowWalletTier(true)}
                className="h-[22px] px-2 bg-[#EAECFF] rounded-3xl justify-center items-center gap-0.5 inline-flex"
              >
               <Image src="/icons/layers.svg" alt="wallet tier icon" width={14} height={14} />
                <span className="text-raiz-gray-950 text-[13px] font-normal leading-[18.20px]">
                  Tier {user.business_account.entity.wallet_tier.wallet_tier_code}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-5 mb-10">
        {SettingsMenus.filter(menu => canWriteBusiness || menu.type !== "button").map((menu, index) => {
          const isLink = menu.type !== "button";

          if (isLink) {
            return (
              <Link
                href={menu.link}
                key={index}
                className="flex gap-[15px] items-center group relative"
                target={menu.newTab ? "_blank" : ""}
              >
                {menu.icon()}
                <span
                  className={`${
                    pathName === menu.link
                      ? "text-raiz-gray-950"
                      : "text-raiz-gray-600"
                  } text-[15px] font-semibold leading-snug group-hover:underline`}
                >
                  {" "}
                  {menu.name}
                </span>
                 {menu.link === "/settings/notification-recipients" && (
                  <NotificationRecipientsNewBadge className="absolute right-0" />
                  )}
              </Link>
            );
          } else {
            if (menu.action === "freeze") {
              return (
                <button
                  key={index}
                  onClick={() => handleFreezeClick(menu.action)}
                >
                  <div className="flex gap-[15px] items-center group">
                    {menu.icon()}
                    <span className="text-raiz-gray-600 text-[15px] font-semibold text-left leading-snug group-hover:underline ">
                      {freezeType === "disable"
                        ? "Freeze Account"
                        : "Unfreeze Account"}
                    </span>
                  </div>
                </button>
              );
            }
            return (
              <button
                key={index}
                onClick={() => {
                  if (menu.action === "delete" && menu.email) {
                    const { to, subject, body } = menu.email;
                    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(
                      subject,
                    )}&body=${encodeURIComponent(body)}`;
                    window.location.href = mailtoLink;
                  } else {
                    setNavModal(menu.action);
                  }
                }}
              >
                <div className="flex gap-[15px] items-center  group">
                  {menu.icon()}
                  <span className="text-raiz-gray-600 text-[15px] font-semibold text-left leading-snug group-hover:underline ">
                    {menu.name}
                  </span>
                 
                </div>
              </button>
            );
          }
        })}
      </nav>
      <div className="pb-3">
        <Image
          width={40}
          height={40}
          src={"/icons/cbn.svg"}
          alt="CBN license"
        />
        <p className="text-raiz-gray-800 text-[13px] leading-tight mt-2">
          Funds are managed by Palmpay Inc, a CBN licensed institution
        </p>
        <p className="opacity-50 text-raiz-gray-800 text-[13px] leading-tight mt-6">
          Raiz v1.0.0
        </p>
      </div>
      {showLevels && <LevelsModal close={closeLevelsModal} />}
      {showRaizScore && (
        <RaizScoreModal
          close={() => setShowRaizScore(false)}
          setShowLevels={setShowLevels}
          score={pointsData?.point || 0}
        />
      )}
      {navModal === "freeze" && (
        <FreezeAcctModal close={() => setNavModal(null)} type={freezeType} />
      )}
      {showRaizTag && <RaizTagModal close={() => setShowRaizTag(false)} />}
      {showWalletTier && (
        <WalletTierModal
          close={() => setShowWalletTier(false)}
          tierName={
            user?.business_account?.entity?.wallet_tier?.wallet_tier_name
          }
          tierCode={
            user?.business_account?.entity?.wallet_tier?.wallet_tier_code
          }
        />
      )}
    </section>
  );
};

export default SideLayout;
