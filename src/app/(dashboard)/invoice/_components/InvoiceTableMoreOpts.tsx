"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import { IInvoice } from "@/types/invoice";
import { SlEye } from "react-icons/sl";

interface Props {
  invoice: IInvoice;
  isLast: boolean;
  onEdit: (invoice: IInvoice) => void;
  onDownloadPDF: (invoice: IInvoice) => void;
  onSendEmail?: (invoice: IInvoice) => void;
  onCopyLink: (invoice: IInvoice) => void;
  onView?: (invoice: IInvoice) => void;
  onMarkAsPaid?: (invoice: IInvoice) => void;
  from: "table" | "preview";
}

const InvoiceTableMoreOpts = ({
  invoice,
  isLast,
  onEdit,
  onDownloadPDF,
  onSendEmail,
  // onCopyLink,
  onMarkAsPaid,
  onView,
  from,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpward, setShowUpward] = useState(isLast);
  const dropdownRef = useOutsideClick(() => setIsOpen(false));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isFromTable = from === "table";

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = isFromTable ? 180 : 130; // More accurate height based on menu items

      // Check if there's enough space below (with 40px buffer)
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const shouldShowUp = spaceBelow < dropdownHeight + 40;

      setShowUpward(shouldShowUp);
    }
  }, [isOpen, isFromTable]);

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`flex items-center justify-center  rounded hover:bg-gray-100 transition ${
          isFromTable
            ? "w-6 h-6"
            : "rounded-2xl border border-gray-300 p-2 w-10 h-10"
        }`}
      >
        <Image
          className={`${isFromTable ? "" : "rotate-90"}`}
          src="/icons/more.svg"
          alt="more options"
          width={18}
          height={18}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 w-[200px] bg-white border border-gray-100 rounded-lg shadow-md z-50 ${
            showUpward ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          <ul className="py-1 text-sm text-[#443852] font-semibold">
            {isFromTable && (
              <li>
                <button
                  onClick={() => {
                    onView?.(invoice);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[#EAECFF99] transition"
                >
                  <SlEye size={16} className="text-[#6F5B86]" />
                  <span>View details</span>
                </button>
              </li>
            )}
            {invoice?.status === "draft" && (
              <li>
                <button
                  onClick={() => {
                    onEdit(invoice);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[#EAECFF99] transition"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8.84006 2.4L3.36673 8.19333C3.16006 8.41333 2.96006 8.84667 2.92006 9.14667L2.6734 11.3067C2.58673 12.0867 3.14673 12.62 3.92006 12.4867L6.06673 12.12C6.36673 12.0667 6.78673 11.8467 6.9934 11.62L12.4667 5.82667C13.4134 4.82667 13.8401 3.68667 12.3667 2.29334C10.9001 0.913336 9.78673 1.4 8.84006 2.4Z"
                      stroke="#6F5B86"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.92676 3.36664C8.21342 5.20664 9.70676 6.6133 11.5601 6.79997"
                      stroke="#6F5B86"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 14.6667H14"
                      stroke="#6F5B86"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Edit</span>
                </button>
              </li>
            )}
            <li>
              <button
                onClick={() => {
                  onDownloadPDF(invoice);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[#EAECFF99] transition"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12.0467 9.62L8.00004 13.6667L3.95337 9.62"
                    stroke="#6F5B86"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 2.33334V13.5533"
                    stroke="#6F5B86"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Download the PDF</span>
              </button>
            </li>
            {isFromTable && invoice?.status === "pending" && (
              <li>
                <button
                  onClick={() => {
                    onSendEmail?.(invoice);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[#EAECFF99] transition"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M11.3333 13.6667H4.66659C2.66659 13.6667 1.33325 12.6667 1.33325 10.3333V5.66668C1.33325 3.33334 2.66659 2.33334 4.66659 2.33334H11.3333C13.3333 2.33334 14.6666 3.33334 14.6666 5.66668V10.3333C14.6666 12.6667 13.3333 13.6667 11.3333 13.6667Z"
                      stroke="#6F5B86"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11.3334 6L9.24674 7.66667C8.56008 8.21333 7.43341 8.21333 6.74674 7.66667L4.66675 6"
                      stroke="#6F5B86"
                      strokeWidth="1.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Send Email</span>
                </button>
              </li>
            )}
            {isFromTable && invoice?.status === "awaiting_payment" && (
              <li>
                <button
                  onClick={() => {
                    onMarkAsPaid?.(invoice);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[#EAECFF99] transition"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 1.3335C4.32667 1.3335 1.33333 4.32683 1.33333 8.00016C1.33333 11.6735 4.32667 14.6668 8 14.6668C11.6733 14.6668 14.6667 11.6735 14.6667 8.00016C14.6667 4.32683 11.6733 1.3335 8 1.3335ZM11.1867 6.46683L7.40667 10.2468C7.31333 10.3402 7.18667 10.3935 7.05333 10.3935C6.92 10.3935 6.79333 10.3402 6.7 10.2468L4.81333 8.36016C4.62 8.16683 4.62 7.84683 4.81333 7.6535C5.00667 7.46016 5.32667 7.46016 5.52 7.6535L7.05333 9.18683L10.48 5.76016C10.6733 5.56683 10.9933 5.56683 11.1867 5.76016C11.38 5.9535 11.38 6.26683 11.1867 6.46683Z"
                      fill="#6F5B86"
                    />
                  </svg>
                  <span>Mark as Paid</span>
                </button>
              </li>
            )}
            {/* <li>
              <button
                onClick={() => {
                  onCopyLink(invoice);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-[#EAECFF99] transition"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M9.99341 11.6667H11.0001C13.0134 11.6667 14.6667 10.02 14.6667 8.00001C14.6667 5.98668 13.0201 4.33334 11.0001 4.33334H9.99341"
                    stroke="#6F5B86"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.99992 4.33334H4.99992C2.97992 4.33334 1.33325 5.98001 1.33325 8.00001C1.33325 10.0133 2.97992 11.6667 4.99992 11.6667H5.99992"
                    stroke="#6F5B86"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.33325 8H10.6666"
                    stroke="#6F5B86"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Copy Invoice Link</span>
              </button>
            </li> */}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InvoiceTableMoreOpts;
