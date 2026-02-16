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
                  onDelete(customer);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Delete
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onEdit(customer);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Customer
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomerTableMoreOpt;
