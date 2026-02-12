import React from "react";
import TransactionStats from "./_components/TransactionStats";
import TransactionTable from "../_components/TransactionTable";

const TransactionsPage = () => {
  return (
    <section className="mt-10">
      <h2 className="text-zinc-900 text-2xl font-bold  leading-7 mb-8">
        Transactions
      </h2>
      <TransactionStats />
      <TransactionTable pagination={true} topRightOpts="opts" />
    </section>
  );
};

export default TransactionsPage;
