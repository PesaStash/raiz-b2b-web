"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import { ITransaction } from "@/types/transactions";

interface Props {
  transaction: ITransaction;
  isLast: boolean;
  onViewDetails: (transaction: ITransaction) => void;
}

const TransactionMoreOptions: React.FC<Props> = ({
  transaction,
  isLast,
  onViewDetails,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useOutsideClick(() => {
    setIsOpen(false);
  });

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleToggle}>
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
            isLast ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          <ul className="py-1">
            <li>
              <button
                onClick={() => {
                  onViewDetails(transaction);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                View Details
              </button>
            </li>
            {/* <li>
              <button
                onClick={() => {
                  alert("Downloading receipt...");
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Download Receipt
              </button>
            </li> */}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TransactionMoreOptions;
