"use client";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import DeveloperKeysTable from "./_components/DeveloperKeysTable";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import CreateKeysModal from "./_components/CreateKeysModal";

const DevelopersPage = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <section className=" p-6 rounded-[20px] h-full flex flex-col">
        <div className="flex justify-between items-center mb-8 shrink-0">
          <h2 className="text-raiz-gray-950 text-[23px] font-bold leading-7">
            API Keys
          </h2>
          <Button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 h-10 gap-2 rounded-full flex items-center w-[188px]"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M9.99996 1.66663C5.40829 1.66663 1.66663 5.40829 1.66663 9.99996C1.66663 14.5916 5.40829 18.3333 9.99996 18.3333C14.5916 18.3333 18.3333 14.5916 18.3333 9.99996C18.3333 5.40829 14.5916 1.66663 9.99996 1.66663ZM13.3333 10.625H10.625V13.3333C10.625 13.675 10.3416 13.9583 9.99996 13.9583C9.65829 13.9583 9.37496 13.675 9.37496 13.3333V10.625H6.66663C6.32496 10.625 6.04163 10.3416 6.04163 9.99996C6.04163 9.65829 6.32496 9.37496 6.66663 9.37496H9.37496V6.66663C9.37496 6.32496 9.65829 6.04163 9.99996 6.04163C10.3416 6.04163 10.625 6.32496 10.625 6.66663V9.37496H13.3333C13.675 9.37496 13.9583 9.65829 13.9583 9.99996C13.9583 10.3416 13.675 10.625 13.3333 10.625Z"
                  fill="#FDFDFD"
                />
              </svg>
            }
          >
            <span className="text-[15px] font-medium ml-4">
              Generate API Key
            </span>
          </Button>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl mb-2 bg-[#FFF3E666]">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_30719_14815)">
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
              <clipPath id="clip0_30719_14815">
                <rect width="48" height="48" rx="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <div className="flex flex-col gap-0.5 mt-0.5 ">
            <h4 className="text-raiz-gray-900 text-sm font-bold leading-tight">
              Manage Developer API keys
            </h4>
            <p className="text-raiz-gray-600 text-sm leading-tight">
              Revoke disables a key without removing it.
              {/* Delete permanently
              removes it and cannot be undone. */}
            </p>
          </div>
        </div>

        <DeveloperKeysTable onGenerateKey={() => setShowModal(true)} />
      </section>
      {showModal && (
        <CenterModalWrapper close={() => setShowModal(false)}>
          <CreateKeysModal close={() => setShowModal(false)} />
        </CenterModalWrapper>
      )}
    </>
  );
};

export default DevelopersPage;
