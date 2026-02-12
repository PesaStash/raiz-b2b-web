"use client";
import EmptyList from "@/components/ui/EmptyList";
import { FetchBillRequestApi } from "@/services/transactions";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { IBillRequestParams, IP2pTransferResponse } from "@/types/services";
import { IBillRequest, PaymentStatusType } from "@/types/transactions";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import AcceptBill from "./bill-requests/AcceptBill";
import PayBill from "./bill-requests/PayBill";
import Avatar from "@/components/ui/Avatar";
import PaymentStatusModal from "@/components/modals/PaymentStatusModal";
import { convertTime, getCurrencySymbol } from "@/utils/helpers";
import RejectBill from "./bill-requests/RejectBill";
import RaizReceipt from "@/components/transactions/RaizReceipt";
import SideModalWrapper from "./SideModalWrapper";
import { usePathname } from "next/navigation";
import ReceivedRequests from "./bill-requests/ReceivedRequests";

type OpenModalType =
  | "accept"
  | "pay"
  | "status"
  | "reject"
  | "delete"
  | "delete-success"
  | "accept-sucsess"
  | "reject-success"
  | "receipt"
  | "list"
  | null;

const BillRow = ({
  request,
  setSelectedRequest,
  setOpenModal,
}: {
  request: IBillRequest;
  setSelectedRequest: (arg: IBillRequest) => void;
  setOpenModal: (arg: OpenModalType) => void;
}) => {
  const date = dayjs(convertTime(request?.created_at));
  const isToday = date.isSame(dayjs(), "day");

  const handleAccept = () => {
    setSelectedRequest(request);
    setOpenModal("accept");
  };

  const handleReject = () => {
    setSelectedRequest(request);
    setOpenModal("reject");
  };
  return (
    <div className="w-full max-w-[335px] px-[15px] py-[18px] bg-[#f3eee9] rounded-[20px] flex-col justify-center items-start gap-4 inline-flex">
      <div className=" flex items-center justify-between w-full">
        <div className="flex gap-2 ">
          <Avatar
            name={request?.third_party_account?.account_name}
            src={request?.third_party_account?.selfie_image}
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-raiz-gray-900 text-[13px] xl:text-sm font-semibold leading-tight">
              {request?.third_party_account?.account_name}
            </p>
            <p className="text-raiz-gray-800 text-[11px] xl:text-[13px] font-normal  leading-none">
              {isToday
                ? `Today, ${date.format("HH:mm")}`
                : date.format("DD MMM YYYY, HH:mm")}
            </p>
          </div>
        </div>
        <span className="text-raiz-gray-900 text-sm xl:text-base font-semibold ">
          {getCurrencySymbol(request?.currency)}
          {request?.transaction_amount?.toLocaleString()}
        </span>
      </div>
      <div className="flex w-full justify-between items-center gap-2">
        <button
          onClick={handleReject}
          className="w-1/2 h-10 px-5 py-2 bg-[#f1e0cb] rounded-3xl justify-center items-center gap-1.5 inline-flex"
        >
          <span className="text-raiz-gray-800 text-sm font-medium font-brSonoma leading-[16.80px]">
            Reject
          </span>
        </button>
        <button
          onClick={handleAccept}
          className="w-1/2 h-10 px-5 py-2 bg-[#3c2875] rounded-3xl justify-center items-center gap-1.5 inline-flex"
        >
          <svg
            className="w-6 h-4"
            width="17"
            height="16"
            viewBox="0 0 17 16"
            fill="none"
          >
            <path
              d="M11.2601 1.97336L5.24008 3.97336C1.19341 5.3267 1.19341 7.53336 5.24008 8.88003L7.02674 9.47336L7.62008 11.26C8.96674 15.3067 11.1801 15.3067 12.5267 11.26L14.5334 5.2467C15.4267 2.5467 13.9601 1.07336 11.2601 1.97336ZM11.4734 5.56003L8.94008 8.1067C8.84008 8.2067 8.71341 8.25336 8.58674 8.25336C8.46008 8.25336 8.33341 8.2067 8.23341 8.1067C8.04008 7.91336 8.04008 7.59336 8.23341 7.40003L10.7667 4.85336C10.9601 4.66003 11.2801 4.66003 11.4734 4.85336C11.6667 5.0467 11.6667 5.3667 11.4734 5.56003Z"
              fill="#F4F4F4"
            />
          </svg>

          <span className="text-secondary-white text-sm font-medium font-brSonoma leading-[16.80px]">
            Accept
          </span>
        </button>
      </div>
    </div>
  );
};

const BillRequests = () => {
  const [openModal, setOpenModal] = useState<OpenModalType>(null);
  const { selectedCurrency } = useCurrencyStore();
  const [selectedRequest, setSelectedRequest] = useState<IBillRequest | null>(
    null
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType>(null);
  const [paymentError, setPaymentError] = useState("");
  const [transactionDetail, setTransactionDetail] =
    useState<IP2pTransferResponse | null>(null);
  const pathname = usePathname();
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "bill-requests",
      { currency: selectedCurrency.name, status_id: 2 },
    ],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, IBillRequestParams];
      return FetchBillRequestApi(params);
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const closePopModal = () => setOpenModal(null);
  const openPayModal = () => setOpenModal("pay");
  const openAcceptModal = () => setOpenModal("accept");
  const openRejectModal = () => setOpenModal("reject");

  const billRequests = data?.data || [];

  useEffect(() => {
    refetch();
  }, [pathname, refetch]);
  const displayPopModal = () => {
    switch (openModal) {
      case "accept": {
        return (
          selectedRequest && (
            <AcceptBill
              close={closePopModal}
              request={selectedRequest}
              openPayModal={openPayModal}
            />
          )
        );
      }
      case "pay": {
        return (
          selectedRequest && (
            <PayBill
              close={closePopModal}
              goNext={() => setOpenModal("status")}
              status={paymentStatus}
              setStatus={setPaymentStatus}
              request={selectedRequest}
              setPaymentError={setPaymentError}
              setTransactionDetail={setTransactionDetail}
            />
          )
        );
      }
      case "status": {
        return (
          selectedRequest && (
            <PaymentStatusModal
              status={paymentStatus}
              amount={selectedRequest?.transaction_amount || 0}
              currency={selectedRequest?.currency || ""}
              user={selectedRequest?.third_party_account}
              close={closePopModal}
              error={paymentError}
              tryAgain={() => setOpenModal("accept")}
              viewReceipt={() => setOpenModal("receipt")}
              type="p2p"
            />
          )
        );
      }
      case "reject": {
        return (
          selectedRequest && (
            <RejectBill request={selectedRequest} close={closePopModal} />
          )
        );
      }
      case "receipt":
        return (
          transactionDetail && (
            <SideModalWrapper close={() => {}}>
              <RaizReceipt close={closePopModal} data={transactionDetail} />
            </SideModalWrapper>
          )
        );
      case "list":
        return (
          <ReceivedRequests
            close={closePopModal}
            setSelectedRequest={setSelectedRequest}
            openAccept={openAcceptModal}
            openReject={openRejectModal}
          />
        );
      default:
        break;
    }
  };

  return (
    <div className="w-full my-8">
      <div className="flex items-center justify-between w-full mb-5">
        <h6 className="text-raiz-gray-900 text-base font-semibold  leading-snug">
          Bill Request
        </h6>
        <button onClick={() => setOpenModal("list")}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M6.7396 2.24122C6.55306 2.24126 6.37077 2.29695 6.21605 2.40117C6.06133 2.50538 5.94121 2.65338 5.87106 2.82624C5.80091 2.99909 5.78392 3.18894 5.82226 3.37151C5.8606 3.55407 5.95253 3.72105 6.08628 3.85108L11.2352 9L6.08628 14.1489C5.99913 14.2361 5.92999 14.3395 5.88282 14.4534C5.83565 14.5672 5.81136 14.6893 5.81136 14.8125C5.81135 14.9358 5.83562 15.0578 5.88278 15.1717C5.92994 15.2855 5.99907 15.389 6.08622 15.4761C6.17337 15.5633 6.27683 15.6324 6.39069 15.6796C6.50455 15.7267 6.62659 15.751 6.74984 15.751C6.87308 15.751 6.99512 15.7267 7.10898 15.6795C7.22284 15.6324 7.32629 15.5632 7.41343 15.4761L13.2259 9.66358C13.3132 9.57649 13.3824 9.47306 13.4296 9.35919C13.4768 9.24533 13.5011 9.12327 13.5011 9C13.5011 8.87674 13.4768 8.75468 13.4296 8.64081C13.3824 8.52695 13.3132 8.42352 13.2259 8.33643L7.41343 2.52393C7.32576 2.4341 7.22094 2.36279 7.10519 2.31423C6.98945 2.26566 6.86513 2.24083 6.7396 2.24122Z"
              fill="#443852"
            />
          </svg>
        </button>
      </div>
      <section className="flex gap-4 w-full max-h-[568px] overflow-x-scroll">
        {isLoading ? (
          <div className="w-full px-[15px] py-[18px] rounded-[20px] flex-col justify-center items-start gap-4 inline-flex">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                <Skeleton circle width={38} height={38} />
                <div className="flex flex-col gap-0.5">
                  <Skeleton width={120} height={14} />
                  <Skeleton width={100} height={12} />
                </div>
              </div>
              <Skeleton width={80} height={18} />
            </div>

            <div className="flex w-full justify-between items-center gap-2">
              <Skeleton width="50%" height={40} borderRadius={9999} />
              <Skeleton width="50%" height={40} borderRadius={9999} />
            </div>
          </div>
        ) : billRequests?.length > 0 ? (
          billRequests.map((request, index) => (
            <BillRow
              key={index}
              request={request}
              setSelectedRequest={setSelectedRequest}
              setOpenModal={setOpenModal}
            />
          ))
        ) : (
          <EmptyList text="No bill request yet" />
        )}
      </section>
      {displayPopModal()}
    </div>
  );
};

export default BillRequests;
