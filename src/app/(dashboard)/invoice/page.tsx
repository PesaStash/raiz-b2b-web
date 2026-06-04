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
    <section className="min-w-0 h-full bg-transparent md:bg-raiz-gray-50 p-0 md:p-6 rounded-none md:rounded-[20px]">
      <div className="flex justify-between items-center gap-3 mb-3 md:mb-8">
        <h2 className="hidden md:block text-zinc-900 text-2xl font-bold leading-7">
          Invoices
        </h2>
        <Link href="/invoice/create-new" className="ml-auto shrink-0">
          <Button
            className="!h-9 md:!h-10  px-3.5 w-[157px] whitespace-nowrap"
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
            <span className="ml-2 text-sm">New Invoice</span>
          </Button>
        </Link>
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
