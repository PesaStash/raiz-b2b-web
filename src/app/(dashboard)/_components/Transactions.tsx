"use client";
import React, { useEffect, useState } from "react";
import EmptyList from "@/components/ui/EmptyList";
import { useQuery } from "@tanstack/react-query";
import { FetchTransactionReportApi } from "@/services/transactions";
import { ITransactionParams } from "@/types/services";
// import { useUser } from "@/lib/hooks/useUser";
// import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import dayjs from "dayjs";
import { ITransaction } from "@/types/transactions";
import Skeleton from "react-loading-skeleton";
import Avatar from "@/components/ui/Avatar";
import { convertTime, getCurrencySymbol } from "@/utils/helpers";
import { AnimatePresence } from "motion/react";
import SideModalWrapper from "./SideModalWrapper";
import TxnHistory from "./transaction-history/TxnHistory";
import TxnReceipt from "./transaction-history/TxnReceipt";
import { usePathname } from "next/navigation";
import { IWallet } from "@/types/user";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";

interface Props {
  currentWallet: IWallet;
  maxHeight?: string;
}

const TransactionRow = ({
  transaction,
  showDetail,
}: {
  transaction: ITransaction;
  showDetail: (arg: ITransaction) => void;
}) => {
  const date = dayjs(convertTime(transaction?.transaction_date_time));
  const isToday = date.isSame(dayjs(), "day");
  return (
    <button
      onClick={() => showDetail(transaction)}
      className="flex items-center justify-between w-full"
    >
      <div className="flex gap-[14px]">
        <Avatar
          src={transaction?.third_party_profile_image_url}
          name={transaction?.third_party_name}
        />

        <div className="flex flex-col gap-1 text-left">
          <p className="text-raiz-gray-950 text-sm font-semibold">
            {transaction?.third_party_name}
          </p>
          <p className="opacity-50 text-raiz-gray-950 text-xs font-normal leading-[15px]">
            {isToday
              ? `Today, ${date.format("HH:mm")}`
              : date.format("DD MMM YYYY @ HH:mm")}
          </p>
        </div>
      </div>
      <span
        className={`${
          transaction?.transaction_type.transaction_type === "debit"
            ? "text-red-600"
            : "text-raiz-gray-900"
        }  text-sm font-semibold leading-tight`}
      >
        {getCurrencySymbol(transaction?.currency)}
        {transaction?.transaction_amount?.toLocaleString()}
      </span>
    </button>
  );
};

const Transactions = ({ currentWallet, maxHeight = "max-h-72" }: Props) => {
  // const { user } = useUser();
  const [openModal, setOpenModal] = useState<"history" | "detail" | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<ITransaction | null>(null);
  // const currentWallet = useCurrentWallet(user);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["transactions-report", { wallet_id: currentWallet?.wallet_id }],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, ITransactionParams];
      return FetchTransactionReportApi(params);
    },
    enabled: !!currentWallet?.wallet_id,
  });
  const pathName = usePathname();
  useEffect(() => {
    refetch();
  }, [pathName, refetch]);

  const showDetail = (txn: ITransaction) => {
    setOpenModal("detail");
    setSelectedTxn(txn);
  };
  const closeModal = () => setOpenModal(null);

  const transactions = data?.transaction_reports || [];
  return (
    <>
      <div className=" p-6 rounded-[20px] border border-raiz-gray-200 flex-col justify-start items-start gap-5 inline-flex w-full">
        <div className="w-full mb-5 flex justify-between items-center">
          <h6 className="text-gray-900 text-base font-semibold  leading-snug">
            Transactions
          </h6>
          <button
            onClick={() => setOpenModal("history")}
            className="flex items-center gap-2 "
          >
            <span className="text-primary2 text-sm font-bold  leading-[16.80px]">
              Go to Transactions
            </span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M6.7396 2.24122C6.55306 2.24126 6.37077 2.29695 6.21605 2.40117C6.06133 2.50538 5.94121 2.65338 5.87106 2.82624C5.80091 2.99909 5.78392 3.18894 5.82226 3.37151C5.8606 3.55407 5.95253 3.72105 6.08628 3.85108L11.2352 9L6.08628 14.1489C5.99913 14.2361 5.92999 14.3395 5.88282 14.4534C5.83565 14.5672 5.81136 14.6893 5.81136 14.8125C5.81135 14.9358 5.83562 15.0578 5.88278 15.1717C5.92994 15.2855 5.99907 15.389 6.08622 15.4761C6.17337 15.5633 6.27683 15.6324 6.39069 15.6796C6.50455 15.7267 6.62659 15.751 6.74984 15.751C6.87308 15.751 6.99512 15.7267 7.10898 15.6795C7.22284 15.6324 7.32629 15.5632 7.41343 15.4761L13.2259 9.66358C13.3132 9.57649 13.3824 9.47306 13.4296 9.35919C13.4768 9.24533 13.5011 9.12327 13.5011 9C13.5011 8.87674 13.4768 8.75468 13.4296 8.64081C13.3824 8.52695 13.3132 8.42352 13.2259 8.33643L7.41343 2.52393C7.32576 2.4341 7.22094 2.36279 7.10519 2.31423C6.98945 2.26566 6.86513 2.24083 6.7396 2.24122Z"
                fill="#443852"
              />
            </svg>
          </button>
        </div>
        <div
          className={`flex flex-col gap-3 w-full ${maxHeight} overflow-y-scroll no-scrollbar`}
        >
          {isLoading ? (
            <Skeleton count={4} className="mb-3" height={48} />
          ) : transactions?.length > 0 ? (
            transactions?.map((each, index) => (
              <TransactionRow
                key={index}
                transaction={each}
                showDetail={showDetail}
              />
            ))
          ) : (
            <EmptyList text="No transactions yet" />
          )}
        </div>
      </div>
      <AnimatePresence>
        {openModal === "history" ? (
          <CenterModalWrapper close={closeModal}>
            <TxnHistory close={closeModal} />
          </CenterModalWrapper>
        ) : openModal === "detail" ? (
          selectedTxn && (
            <CenterModalWrapper close={closeModal}>
              <TxnReceipt transaction={selectedTxn} close={closeModal} />
            </CenterModalWrapper>
          )
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Transactions;
