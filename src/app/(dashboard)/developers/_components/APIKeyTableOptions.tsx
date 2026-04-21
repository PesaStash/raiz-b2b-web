"use client";

import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import { IDeveloperApiKey } from "@/types/services";
import { useState } from "react";
import Image from "next/image";

interface Props {
  apiKey: IDeveloperApiKey;
  isLast: boolean;
  onViewLogs: (apiKey: IDeveloperApiKey) => void;
  onRevoke: (apiKey: IDeveloperApiKey) => void;
  onDelete: (apiKey: IDeveloperApiKey) => void;
}

const APIKeyTableOptions = ({
  apiKey,
  isLast,
  onViewLogs,
  onRevoke,
  onDelete,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useOutsideClick(() => {
    setIsOpen(false);
  });

  const handleToggle = () => setIsOpen(!isOpen);
  return (
    <div className="relative" ref={dropdownRef}>
      <button className="size-5" onClick={handleToggle}>
        <Image
          src="/icons/more.svg"
          alt="more options"
          width={20}
          height={20}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 w-48 bg-white rounded-md shadow-lg z-10 ${
            isLast ? "bottom-full mb-2" : "!-mb-10"
          }`}
        >
          <ul className="py-1">
            <li>
              <button
                onClick={() => {
                  onViewLogs(apiKey);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                View Logs
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onRevoke(apiKey);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Revoke API Key
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default APIKeyTableOptions;
