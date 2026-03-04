import React from "react";
import BillsRequestsSummary from "./_components/BillsRequestsSummary";
import BillRequestsHistory from "./_components/BillRequestsHistory";

const BillRequestsPage = () => {
  return (
    <>
      <BillsRequestsSummary />
      <BillRequestsHistory />
    </>
  );
};

export default BillRequestsPage;
