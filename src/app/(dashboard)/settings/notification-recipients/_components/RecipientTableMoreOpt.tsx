"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import { INotificationEmail } from "@/types/services";

interface Props {
  recipient: INotificationEmail;
  isLast: boolean;
  onEdit: (recipient: INotificationEmail) => void;
  onDelete: (recipient: INotificationEmail) => void;
}

const RecipientTableMoreOpt = ({
  isLast,
  recipient,
  onEdit,
  onDelete,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useOutsideClick(() => {
    setIsOpen(false);
  });

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="size-9 flex items-center justify-center rounded-lg hover:bg-raiz-gray-100 active:bg-raiz-gray-200"
        aria-label="Recipient options"
      >
        <Image src="/icons/more.svg" alt="" width={20} height={20} />
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 w-52 bg-white rounded-xl border border-raiz-gray-100 shadow-lg z-20 overflow-hidden ${
            isLast ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          <ul className="py-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  onEdit(recipient);
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-raiz-gray-900 hover:bg-raiz-gray-50 active:bg-raiz-gray-100"
              >
                <Image src="/icons/pen.svg" alt="" width={16} height={16} />
                Edit
              </button>
            </li>
            {/* <li>
              <button
                type="button"
                onClick={() => {
                  onDelete(recipient);
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100"
              >
                <Image src="/icons/trash.svg" alt="" width={16} height={16} />
                Delete Recipient
              </button>
            </li> */}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RecipientTableMoreOpt;
