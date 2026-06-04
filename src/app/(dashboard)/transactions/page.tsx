import React from "react";
import TransactionStats from "./_components/TransactionStats";
import TransactionTable from "../_components/TransactionTable";

const TransactionsPage = () => {
  return (
    <section className="mt-0 md:mt-10 min-w-0">
      <h2 className="hidden md:block text-zinc-900 text-xl md:text-2xl font-bold leading-7 mb-6 md:mb-8">
        Transactions
      </h2>
      <TransactionStats />
      <TransactionTable pagination={true} topRightOpts="opts" />
    </section>
  );
};

export default TransactionsPage;
