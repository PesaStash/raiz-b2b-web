"use client";

import React from "react";
import Image from "next/image";

export const InfoBannerIcon = ({
  variant = "info",
}: {
  variant?: "info" | "warning" | "danger";
}) => {
  if (variant === "info") {
    return (
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <g clipPath="url(#clip0_payout_info)">
          <rect width="48" height="48" rx="24" fill="#FCFCFD" />
          <path
            d="M4 0.333008H44C46.025 0.333008 47.667 1.97496 47.667 4V44C47.667 46.025 46.025 47.667 44 47.667H4C1.97496 47.667 0.333008 46.025 0.333008 44V4C0.333008 1.97496 1.97496 0.333008 4 0.333008Z"
            stroke="black"
            strokeOpacity="0.08"
            strokeWidth="0.666667"
          />
          <path
            opacity="0.35"
            d="M24.0001 37.3333C31.3639 37.3333 37.3334 31.3638 37.3334 24C37.3334 16.6362 31.3639 10.6667 24.0001 10.6667C16.6363 10.6667 10.6667 16.6362 10.6667 24C10.6667 31.3638 16.6363 37.3333 24.0001 37.3333Z"
            fill="#39A062"
          />
          <path
            d="M22.6667 30.6667V24C22.6667 23.264 23.2641 22.6667 24.0001 22.6667C24.7361 22.6667 25.3334 23.264 25.3334 24V30.6667C25.3334 31.4027 24.7361 32 24.0001 32C23.2641 32 22.6667 31.4027 22.6667 30.6667Z"
            fill="#39A062"
          />
          <path
            d="M24 20C25.1046 20 26 19.1046 26 18C26 16.8954 25.1046 16 24 16C22.8954 16 22 16.8954 22 18C22 19.1046 22.8954 20 24 20Z"
            fill="#39A062"
          />
        </g>
        <defs>
          <clipPath id="clip0_payout_info">
            <rect width="48" height="48" rx="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  }

  if (variant === "warning") {
    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M16.0004 29.3344C23.3648 29.3344 29.3348 23.3644 29.3348 16C29.3348 8.63566 23.3648 2.66565 16.0004 2.66565C8.63603 2.66565 2.66602 8.63566 2.66602 16C2.66602 23.3644 8.63603 29.3344 16.0004 29.3344Z"
          fill="#D97706"
        />
        <path
          d="M14.667 22.6666V16C14.667 15.264 15.2643 14.6666 16.0003 14.6666C16.7363 14.6666 17.3337 15.264 17.3337 16V22.6666C17.3337 23.4026 16.7363 24 16.0003 24C15.2643 24 14.667 23.4026 14.667 22.6666Z"
          fill="white"
        />
        <path
          d="M16 12C17.1046 12 18 11.1046 18 10C18 8.89543 17.1046 8 16 8C14.8954 8 14 8.89543 14 10C14 11.1046 14.8954 12 16 12Z"
          fill="white"
        />
      </svg>
    );
  }

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M16.0004 29.3344C23.3648 29.3344 29.3348 23.3644 29.3348 16C29.3348 8.63566 23.3648 2.66565 16.0004 2.66565C8.63603 2.66565 2.66602 8.63566 2.66602 16C2.66602 23.3644 8.63603 29.3344 16.0004 29.3344Z"
        fill="#DC180D"
      />
      <path
        d="M14.667 22.6666V16C14.667 15.264 15.2643 14.6666 16.0003 14.6666C16.7363 14.6666 17.3337 15.264 17.3337 16V22.6666C17.3337 23.4026 16.7363 24 16.0003 24C15.2643 24 14.667 23.4026 14.667 22.6666Z"
        fill="white"
      />
      <path
        d="M16 12C17.1046 12 18 11.1046 18 10C18 8.89543 17.1046 8 16 8C14.8954 8 14 8.89543 14 10C14 11.1046 14.8954 12 16 12Z"
        fill="white"
      />
    </svg>
  );
};

interface PayoutAlertBannerProps {
  title: string;
  description: string;
  tone?: "info" | "warning" | "danger";
  action?: React.ReactNode;
}

const toneClasses = {
  info: "bg-[#FFF3E666]",
  warning: "bg-[#FFF3E666]",
  danger: "bg-[#FFE6E666]",
};

export const PayoutAlertBanner = ({
  title,
  description,
  tone = "info",
  action,
}: PayoutAlertBannerProps) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 md:p-5 rounded-xl ${toneClasses[tone]}`}
  >
    <div className="flex items-start gap-4">
      <InfoBannerIcon variant={tone} />
      <div className="flex flex-col gap-0.5">
        <h4 className="text-raiz-gray-900 text-sm font-bold leading-tight">
          {title}
        </h4>
        <p className="text-raiz-gray-600 text-sm leading-tight">
          {description}
        </p>
      </div>
    </div>
    {action}
  </div>
);

interface PreviewRowProps {
  title: string;
  description: string;
}

export const PayoutPreviewRow = ({ title, description }: PreviewRowProps) => (
  <button
    type="button"
    disabled
    className="flex items-center justify-between w-full p-4 rounded-xl border border-raiz-gray-100 bg-white text-left opacity-80 cursor-default"
  >
    <div className="flex flex-col gap-1 pr-4">
      <span className="text-sm font-bold text-raiz-gray-950">{title}</span>
      <span className="text-xs text-raiz-gray-600 leading-tight">
        {description}
      </span>
    </div>
    <Image src="/icons/arrow-right.svg" alt="" width={20} height={20} />
  </button>
);
