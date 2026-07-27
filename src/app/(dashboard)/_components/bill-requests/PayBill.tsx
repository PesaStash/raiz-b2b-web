"use client";
import NumberKeypad from "@/components/ui/NumberKeyPad";
import Overlay from "@/components/ui/Overlay";
import { useUser } from "@/lib/hooks/useUser";
import { AcceptRequestApi } from "@/services/transactions";
import { IP2pTransferResponse } from "@/types/services";
import { ICurrencyName } from "@/types/misc";
import { IBillRequest, PaymentStatusType } from "@/types/transactions";
import { findWalletByCurrency } from "@/utils/helpers";
import {
  getTransactionId,
  trackMoneyMovementSuccess,
  trackTransactionFailed,
} from "@/utils/analytics/dataLayer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

interface Props {
  close: () => void;
  goNext: () => void;
  setStatus: Dispatch<SetStateAction<PaymentStatusType>>;
  status: PaymentStatusType;
  request: IBillRequest;
  setPaymentError: Dispatch<SetStateAction<string>>;
  setTransactionDetail: Dispatch<SetStateAction<IP2pTransferResponse | null>>;
}

const PayBill = ({
  close,
  goNext,
  setStatus,
  request,
  setPaymentError,
  setTransactionDetail,
}: Props) => {
  const { user } = useUser();
  const currentWallet = findWalletByCurrency(
    user,
    request?.currency as ICurrencyName,
  );
  const [pin, setPin] = useState<string>("");

  const qc = useQueryClient();

  const AcceptBillMutation = useMutation({
    mutationFn: () =>
      AcceptRequestApi({
        transaction_pin: pin,
        params: {
          wallet_id: currentWallet?.wallet_id || "",
          request_id: request?.request_transfer_id,
        },
      }),
    onMutate: () => {
      setStatus("loading");
      goNext();
    },
    onSuccess: (response) => {
      setTransactionDetail(response);
      qc.refetchQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["bill-requests"] });
      qc.invalidateQueries({ queryKey: ["transactions-report"] });
      qc.invalidateQueries({ queryKey: ["p2p-beneficiaries-recents"] });
      qc.invalidateQueries({ queryKey: ["bill-requests-received"] });
      setStatus("success");
      const transactionId = getTransactionId(response);
      if (transactionId) {
        trackMoneyMovementSuccess({
          event: "bill_payment_completed",
          transactionId,
          value: Number(request?.transaction_amount) || 0,
          currency: request?.currency || "USD",
        });
      }
      goNext();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (response: any) => {
      setStatus("failed");
      setPaymentError(response?.data?.message);
      trackTransactionFailed({
        transactionType: "bill_payment",
        error: response,
        value: Number(request?.transaction_amount) || undefined,
        currency: request?.currency,
      });
    },
    onSettled: () => {
      goNext();
    },
  });

  useEffect(() => {
    if (pin.length === 4) {
      AcceptBillMutation.mutate();
    }
  }, [pin]);
  return (
    <Overlay width="385px" close={close}>
      <div
        className={`flex flex-col lg:h-[90%] xl:h-full
        }  py-8 px-5  text-raiz-gray-950 overflow-y-scroll`}
      >
        <h2 className=" text-xl font-bold  leading-normal">Enter Pin</h2>
        <div className="my-[30px]">
          <NumberKeypad otpValue={pin} setOtpValue={setPin} />
        </div>
      </div>
    </Overlay>
  );
};

export default PayBill;
