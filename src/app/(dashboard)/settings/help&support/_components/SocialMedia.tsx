import Image from "next/image";
import React from "react";
import { PartChildProps } from "./HelpSupportNav";
import Link from "next/link";

const SocialMedia = ({ setPart }: PartChildProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mt-3 md:mt-0">
        <button onClick={() => setPart(0)}>
          <Image
            src="/icons/arrow-left.svg"
            alt="arrow-left"
            width={18}
            height={18}
            className="size-3 md:size-[18px]"
          />
        </button>
        <span className="text-raiz-gray-950 text-sm md:text-base font-bold leading-tight">
          Social Media
        </span>
        <div />
      </div>
      <div className="mt-5 flex flex-col gap-5">
        <Link
          target="_blank"
          href={
            "https://web.facebook.com/people/Raiz-Digital-Services-Company/61557956021410/"
          }
          className="flex items-center justify-between"
        >
          <div className="flex gap-[15px] items-center">
            <div className="w-10 h-10 rounded-full bg-[#F3F1F6] flex m-auto justify-center">
              <Image
                src="/icons/facebook.svg"
                alt="facebook"
                width={24}
                height={24}
              />
            </div>

            <span className="text-raiz-gray-950 text-[15px] font-semibold leading-snug tracking-tight">
              Facebook
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M14 5H19V10M19 5L10 14M19 14V19H5V5H10"
            stroke="#A89AB9"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        </Link>
        <Link
          target="_blank"
          href={"https://www.instagram.com/raizdigitalcompany/"}
          className="flex items-center justify-between"
        >
          <div className="flex gap-[15px] items-center">
            <div className="w-10 h-10 rounded-full bg-[#F3F1F6] flex m-auto justify-center">
              <Image
                src="/icons/instagram.svg"
                alt="instagram"
                width={24}
                height={24}
              />
            </div>

            <span className="text-raiz-gray-950 text-[15px] font-semibold leading-snug tracking-tight">
              Instagram
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M14 5H19V10M19 5L10 14M19 14V19H5V5H10"
            stroke="#A89AB9"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        </Link>
        <Link
          target="_blank"
          href={"https://www.raiz.app/"}
          className="flex items-center justify-between"
        >
          <div className="flex gap-[15px] items-center">
            <div className="w-10 h-10 rounded-full bg-[#F3F1F6] flex m-auto justify-center">
              <Image
                src="/icons/website.svg"
                alt="website"
                width={24}
                height={24}
              />
            </div>

            <span className="text-raiz-gray-950 text-[15px] font-semibold leading-snug tracking-tight">
              Website
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M14 5H19V10M19 5L10 14M19 14V19H5V5H10"
            stroke="#A89AB9"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        </Link>
      </div>
    </div>
  );
};

export default SocialMedia;
