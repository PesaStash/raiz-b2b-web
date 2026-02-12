"use client";
import React from "react";
import CryptoDashboardSummary from "./CryptoDashboardSummary";
import CryptoDeposit from "./CryptoDeposit";
// import Transactions from "../../Transactions";
import { useUser } from "@/lib/hooks/useUser";
import { findWalletByCurrency } from "@/utils/helpers";
import TransactionTable from "../../TransactionTable";

const CryptoDashboard = () => {
  const { user } = useUser();
  const SBCAcct = findWalletByCurrency(user, "SBC");
  return (
    <section>
      <CryptoDashboardSummary />
      <CryptoDeposit />
      <div className="w-full my-8">
        {SBCAcct && (
          // <Transactions currentWallet={SBCAcct} maxHeight="max-h-80" />
          <TransactionTable topRightOpts="link" />
        )}
      </div>
    </section>
  );
};

export default CryptoDashboard;
