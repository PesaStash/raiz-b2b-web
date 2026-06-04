import React from "react";
import BillsRequestsSummary from "./_components/BillsRequestsSummary";
import BillRequestsHistory from "./_components/BillRequestsHistory";

const BillRequestsPage = () => {
  return (
    <div className="flex flex-col gap-4 md:gap-6 min-w-0 px-0 md:px-0 pb-24 md:pb-0">
      <BillsRequestsSummary />
      <BillRequestsHistory />
    </div>
  );
};

export default BillRequestsPage;
