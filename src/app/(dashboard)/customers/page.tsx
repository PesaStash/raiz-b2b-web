"use client";
import Button from "@/components/ui/Button";
import React, { useState } from "react";
import CustomersTable from "./_components/CustomersTable";
import { AnimatePresence } from "motion/react";
import AddNewCustomer from "./_components/AddNewCustomer";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";

const CustomerPage = () => {
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  return (
    <section className=" bg-transparent md:bg-raiz-gray-50 rounded-none md:rounded-[20px] min-w-0">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-3 mb-4 md:mb-8">
        <h2 className="hidden md:block text-zinc-900 text-xl md:text-2xl font-bold leading-7">
          Customers
        </h2>
        <Button
          onClick={() => setShowAddCustomer(true)}
          className="w-full sm:w-auto min-w-0 sm:min-w-[175px] h-11"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M9.99996 1.66663C5.40829 1.66663 1.66663 5.40829 1.66663 9.99996C1.66663 14.5916 5.40829 18.3333 9.99996 18.3333C14.5916 18.3333 18.3333 14.5916 18.3333 9.99996C18.3333 5.40829 14.5916 1.66663 9.99996 1.66663ZM13.3333 10.625H10.625V13.3333C10.625 13.675 10.3416 13.9583 9.99996 13.9583C9.65829 13.9583 9.37496 13.675 9.37496 13.3333V10.625H6.66663C6.32496 10.625 6.04163 10.3416 6.04163 9.99996C6.04163 9.65829 6.32496 9.37496 6.66663 9.37496H9.37496V6.66663C9.37496 6.32496 9.65829 6.04163 9.99996 6.04163C10.3416 6.04163 10.625 6.32496 10.625 6.66663V9.37496H13.3333C13.675 9.37496 13.9583 9.65829 13.9583 9.99996C13.9583 10.3416 13.675 10.625 13.3333 10.625Z"
                fill="#FDFDFD"
              />
            </svg>
          }
          iconPosition="left"
        >
          <span className="ml-2 sm:ml-4">Add Customer</span>
        </Button>
      </div>
      <CustomersTable />
      <AnimatePresence>
        {showAddCustomer ? (
          <CenterModalWrapper close={() => setShowAddCustomer(false)}>
            <AddNewCustomer close={() => setShowAddCustomer(false)} />
          </CenterModalWrapper>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default CustomerPage;
