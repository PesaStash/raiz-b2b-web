"use client";
import React, { useState } from "react";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import Image from "next/image";
import { ICustomer } from "@/types/invoice";

interface Props {
  customer: ICustomer;
  isLast: boolean;
  onViewDetails: (customer: ICustomer) => void;
  onEdit: (customer: ICustomer) => void;
  onDelete: (customer: ICustomer) => void;
}

const CustomerTableMoreOpt = ({
  isLast,
  customer,
  // onViewDetails,
  onDelete,
  onEdit,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useOutsideClick(() => {
    setIsOpen(false);
  });

  const handleToggle = () => setIsOpen(!isOpen);
  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="size-9 flex items-center justify-center rounded-lg hover:bg-raiz-gray-100 active:bg-raiz-gray-200"
        aria-label="Customer options"
      >
        <Image
          src="/icons/more.svg"
          alt=""
          width={20}
          height={20}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 w-48 bg-white rounded-xl border border-raiz-gray-100 shadow-lg z-20 overflow-hidden ${
            isLast ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          <ul className="py-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  onEdit(customer);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-3 text-sm font-medium text-raiz-gray-900 hover:bg-raiz-gray-50 active:bg-raiz-gray-100"
              >
                Edit Customer
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  onDelete(customer);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100"
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomerTableMoreOpt;
