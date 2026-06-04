"use client";

import RouteSectionInfo from "../_components/RouteSectionInfo";
import ProfileForm from "../_components/ProfileForm";
import SettingsMobileBack from "../_components/SettingsMobileBack";
import ProfileAvatarUpload from "../_components/ProfileAvatarUpload";

const ProfileSettingsPage = () => {
  return (
    <section className="w-full min-w-0">
      <SettingsMobileBack />
      <div className="hidden lg:flex gap-10 items-start w-full">
        <RouteSectionInfo
          title="Your Profile"
          subtitle="Update account information"
          icon={
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect
                width="40"
                height="40"
                rx="20"
                fill="#EAECFF"
                fillOpacity="0.6"
              />
              <path
                opacity="0.65"
                d="M19.9999 20C22.3011 20 24.1666 18.1345 24.1666 15.8333C24.1666 13.5321 22.3011 11.6667 19.9999 11.6667C17.6987 11.6667 15.8333 13.5321 15.8333 15.8333C15.8333 18.1345 17.6987 20 19.9999 20Z"
                fill="#8A5E35"
              />
              <path
                d="M25 22.5H15C13.6192 22.5 12.5 23.6192 12.5 25C12.5 26.3808 13.6192 27.5 15 27.5H25C26.3808 27.5 27.5 26.3808 27.5 25C27.5 23.6192 26.3808 22.5 25 22.5Z"
                fill="#A03976"
              />
            </svg>
          }
        />
        <div className="flex-1 min-w-0 max-w-xl">
          <ProfileForm />
        </div>
      </div>
      <div className="lg:hidden bg-white rounded-2xl border border-raiz-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-raiz-gray-100">
          <ProfileAvatarUpload size="sm" />
          <div>
            <h1 className="text-lg font-bold text-raiz-gray-950">Your Profile</h1>
            <p className="text-sm text-raiz-gray-600">
              Update account information
            </p>
          </div>
        </div>
        <ProfileForm />
      </div>
    </section>
  );
};

export default ProfileSettingsPage;
