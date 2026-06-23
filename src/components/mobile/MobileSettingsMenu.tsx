"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SettingsMenus } from "@/constants/SettingsMenuData";
import { useUser } from "@/lib/hooks/useUser";
import ProfileAvatarUpload from "@/app/(dashboard)/settings/_components/ProfileAvatarUpload";
import FreezeAcctModal from "@/app/(dashboard)/settings/_components/FreezeAcctModal";
import WalletTierModal from "@/app/(dashboard)/settings/_components/WalletTierModal";
import LogoutModal from "@/components/modals/LogoutModal";
import { toast } from "sonner";
import Image from "next/image";
import NotificationRecipientsNewBadge from "@/app/(dashboard)/settings/_components/NotificationRecipientsNewBadge";

const LogoutMenuIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
    <rect width="40" height="40" rx="20" fill="#FDDCDA" />
    <path
      opacity="0.35"
      d="M28 12V28C28 30.21 26.21 32 24 32H14C11.79 32 10 30.21 10 28V12C10 9.79 11.79 8 14 8H24C26.21 8 28 9.79 28 12Z"
      fill="#B3261E"
    />
    <path
      d="M25.3333 17.3333H18.6667C17.194 17.3333 16 18.5273 16 20C16 21.4727 17.194 22.6667 18.6667 22.6667H25.3333V17.3333Z"
      fill="#951F38"
    />
    <path
      d="M23.8853 25.2427C23.8853 26.2147 25.2853 26.6347 26.168 25.76L30.3947 21.568C31.1947 20.776 31.1947 19.5573 30.3947 18.7653L26.168 14.5733C25.2853 13.7013 23.8853 14.1227 23.8853 15.0933V25.2427Z"
      fill="#951F38"
    />
  </svg>
);

type MenuRowProps = {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  external?: boolean;
  showDivider?: boolean;
};

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M9 6L15 12L9 18"
      stroke="#A89AB9"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MenuRow = ({
  href,
  onClick,
  icon,
  title,
  subtitle,
  badge,
  external,
  showDivider,
}: MenuRowProps) => {
  const inner = (
    <>
      <span className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-raiz-gray-50 overflow-hidden [&_svg]:scale-[0.85]">
        {icon}
      </span>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-raiz-gray-900">{title}</p>
        {subtitle && (
          <p className="text-xs text-raiz-gray-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {badge}
      {external ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M14 5H19V10M19 5L10 14M19 14V19H5V5H10"
            stroke="#A89AB9"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <ChevronRight />
      )}
    </>
  );

  const className = `flex items-center gap-3 px-4 py-3.5 w-full active:bg-raiz-gray-50/80 ${
    showDivider ? "border-t border-raiz-gray-100" : ""
  }`;

  if (href) {
    return (
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
};

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-raiz-gray-400 mb-2 px-1">
      {label}
    </p>
    <div className="bg-white rounded-2xl border border-raiz-gray-100 overflow-hidden shadow-sm">
      {children}
    </div>
  </div>
);

const MobileSettingsMenu = () => {
  const { user } = useUser();
  const [navModal, setNavModal] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWalletTier, setShowWalletTier] = useState(false);
  const [freezeType, setFreezeType] = useState<"enable" | "disable">("disable");

  const profileMenu = SettingsMenus[0];
  const loginMenu = SettingsMenus[1];
  const notificationMenu = SettingsMenus[2];
  const helpMenu = SettingsMenus[3];
  const aboutMenu = SettingsMenus[4];
  const legalMenu = SettingsMenus[5];
  const freezeMenu = SettingsMenus[6];
  const deleteMenu = SettingsMenus[7];

  useEffect(() => {
    const isFrozen = user?.business_account?.entity?.is_entity_frozen ?? false;
    setFreezeType(isFrozen ? "enable" : "disable");
  }, [user?.business_account?.entity?.is_entity_frozen]);

  const handleFreezeClick = () => {
    if (!user?.has_transaction_pin) {
      toast.warning("You have to setup transaction pin first");
      return;
    }
    setNavModal("freeze");
  };

  const handleDeleteClick = () => {
    if ("email" in deleteMenu && deleteMenu.email) {
      const { to, subject, body } = deleteMenu.email;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const profileSubtitle = [
    user?.business_account?.business_name,
    user?.business_account?.username
      ? `@${user.business_account.username}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="bg-white rounded-2xl border border-raiz-gray-100 p-4 shadow-sm flex items-center gap-4">
        <ProfileAvatarUpload size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-raiz-gray-950 truncate">
            {user?.business_account?.business_name}
          </p>
          {user?.business_account?.username && (
            <p className="text-sm text-raiz-gray-500 truncate">
              @{user.business_account.username}
            </p>
          )}
          <p className="text-xs text-raiz-gray-400 truncate mt-0.5">
            {user?.email}
          </p>
          {user?.business_account?.entity?.wallet_tier && (
            <button
              onClick={() => setShowWalletTier(true)}
              className="h-[22px] px-2 mt-1.5 bg-[#EAECFF] rounded-3xl justify-center items-center gap-0.5 inline-flex"
            >
              <Image src="/icons/layers.svg" alt="wallet tier icon" width={14} height={14} />
              <span className="text-raiz-gray-950 text-[13px] font-normal leading-[18.20px]">
                Tier {user.business_account.entity.wallet_tier.wallet_tier_code}
              </span>
            </button>
          )}
        </div>
      </div>

      <Section label="Account">
        <MenuRow
          href="/settings/profile"
          icon={profileMenu.icon()}
          title="Profile"
          subtitle={profileSubtitle || "Manage your account"}
        />
      </Section>

      <Section label="Security">
        <MenuRow
          href="/settings/login-security"
          icon={loginMenu.icon()}
          title="Login and Security"
          subtitle="Change password and transaction PIN"
        />
        <MenuRow
          href={notificationMenu.link}
          icon={notificationMenu.icon()}
          title="Notification Recipients"
          subtitle="Manage transaction notification emails"
          badge={<NotificationRecipientsNewBadge className="shrink-0 px-2 py-0.5 w-auto" />}
          showDivider
        />
        <MenuRow
          icon={freezeMenu.icon()}
          title={
            freezeType === "disable" ? "Freeze Account" : "Unfreeze Account"
          }
          subtitle="Temporarily block all debits"
          onClick={handleFreezeClick}
          showDivider
        />
      </Section>

      <Section label="Help & Support">
        <MenuRow
          href={helpMenu.link}
          icon={helpMenu.icon()}
          title="Help and Support"
          subtitle="FAQs, guides, and contact"
        />
        <MenuRow
          href={aboutMenu.link}
          icon={aboutMenu.icon()}
          title="About"
          subtitle="Learn more about Raiz"
          external
          showDivider
        />
        <MenuRow
          href={legalMenu.link}
          icon={legalMenu.icon()}
          title="Legal"
          subtitle="Privacy policy and terms"
          external
          showDivider
        />
      </Section>

      <Section label="Account actions">
        <MenuRow
          icon={deleteMenu.icon()}
          title="Delete Account"
          subtitle="Contact support to remove your account"
          onClick={handleDeleteClick}
        />
      </Section>

      <Section label="Session">
        <MenuRow
          icon={<LogoutMenuIcon />}
          title="Log out"
          subtitle="Sign out of your account on this device"
          onClick={() => setShowLogoutModal(true)}
        />
      </Section>

      {navModal === "freeze" && (
        <FreezeAcctModal close={() => setNavModal(null)} type={freezeType} />
      )}
      {showLogoutModal && (
        <LogoutModal close={() => setShowLogoutModal(false)} />
      )}
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
    </div>
  );
};

export default MobileSettingsMenu;
