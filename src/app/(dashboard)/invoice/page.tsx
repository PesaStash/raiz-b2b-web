"use client";
import Button from "@/components/ui/Button";
import React from "react";
import InvoicesTable from "./_components/InvoicesTable";
// import { AnimatePresence } from "motion/react";
// import SideModalWrapper from "../_components/SideModalWrapper";
// import InvoiceSettings from "./_components/InvoiceSettings";
import Link from "next/link";

const InvoicePage = () => {
  // const [showSettings, setShowSettings] = useState(false);
  return (
    <section className="mt-10 h-full">
      <div className="flex justify-between gap-7 items-center ">
        <h2 className="text-zinc-900 text-2xl font-bold  leading-7 mb-8">
          Invoices
        </h2>
        <div className="flex  gap-4 items-center mb-8">
          <Link href={"/invoice/create-new"}>
            <Button
              className="w-[157px]"
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M9.99996 1.66663C5.40829 1.66663 1.66663 5.40829 1.66663 9.99996C1.66663 14.5916 5.40829 18.3333 9.99996 18.3333C14.5916 18.3333 18.3333 14.5916 18.3333 9.99996C18.3333 5.40829 14.5916 1.66663 9.99996 1.66663ZM13.3333 10.625H10.625V13.3333C10.625 13.675 10.3416 13.9583 9.99996 13.9583C9.65829 13.9583 9.37496 13.675 9.37496 13.3333V10.625H6.66663C6.32496 10.625 6.04163 10.3416 6.04163 9.99996C6.04163 9.65829 6.32496 9.37496 6.66663 9.37496H9.37496V6.66663C9.37496 6.32496 9.65829 6.04163 9.99996 6.04163C10.3416 6.04163 10.625 6.32496 10.625 6.66663V9.37496H13.3333C13.675 9.37496 13.9583 9.65829 13.9583 9.99996C13.9583 10.3416 13.675 10.625 13.3333 10.625Z"
                    fill="#FDFDFD"
                  />
                </svg>
              }
              iconPosition="left"
            >
              <span className="ml-2">New Invoice</span>
            </Button>
          </Link>
          {/* <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 relative flex justify-center items-center bg-white rounded-2xl border border-gray-100 hover:border-gray-300"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9.10998V14.88C3 17 3 17 5 18.35L10.5 21.53C11.33 22.01 12.68 22.01 13.5 21.53L19 18.35C21 17 21 17 21 14.89V9.10998C21 6.99998 21 6.99999 19 5.64999L13.5 2.46999C12.68 1.98999 11.33 1.98999 10.5 2.46999L5 5.64999C3 6.99999 3 6.99998 3 9.10998Z"
                stroke="#0D6494"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="#0D6494"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button> */}
        </div>
      </div>
      <InvoicesTable />
      {/* <AnimatePresence>
        {showSettings ? (
          <SideModalWrapper close={() => setShowSettings(false)}>
            <InvoiceSettings close={() => setShowSettings(false)} />
          </SideModalWrapper>
        ) : null}
      </AnimatePresence> */}
    </section>
  );
};

export default InvoicePage;
