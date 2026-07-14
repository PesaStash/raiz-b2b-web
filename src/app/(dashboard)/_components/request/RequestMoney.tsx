"use client";
import React, { useEffect, useState } from "react";
import { RequestStepsProps } from "./RequestHome";
import { ISearchedUser } from "@/types/user";
import Selectuser from "./single-request/Selectuser";
import RequestDetails from "./single-request/RequestDetails";
import ChooseCategory from "./single-request/ChooseCategory";
import { ITransactionCategory } from "@/types/transactions";
import RequestSucess from "./single-request/RequestSucess";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestFundsApi } from "@/services/transactions";
import { useUser } from "@/lib/hooks/useUser";
import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import { IRequestFundsPayload } from "@/types/services";
import { toast } from "sonner";
import RequestFailed from "./single-request/RequestFailed";
import RequestConfirmation from "./single-request/RequestConfirmation";
import { findWalletByCurrency } from "@/utils/helpers";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";

export type RequestMoneyStepType =
  | "select-user"
  | "details"
  | "category"
  | "confirmation"
  | "success"
  | "failed";

export const RequestMoney = ({ setStep, close }: RequestStepsProps) => {
  const [requestMoneyStep, setRequestMoneyStep] =
    useState<RequestMoneyStepType | null>("select-user");
  const [selectedUser, setSelectedUser] = useState<ISearchedUser | undefined>();
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [category, setCategory] = useState<ITransactionCategory | null>(null);
  const { user } = useUser();
  const { selectedCurrency } = useCurrencyStore();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const GBPAcct = findWalletByCurrency(user, "GBP");
  const EURAcct = findWalletByCurrency(user, "EUR");
  const SBCAcct = findWalletByCurrency(user, "SBC");
  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    } else if (selectedCurrency.name === "GBP") {
      return GBPAcct;
    } else if (selectedCurrency.name === "EUR") {
      return EURAcct;
    } else if (selectedCurrency.name === "SBC") {
      return SBCAcct;
    }
  };

  const currentWallet = getCurrentWallet();

  useEffect(() => {
    if (requestMoneyStep === "select-user" && selectedUser) {
      setRequestMoneyStep("details");
    }
  }, [requestMoneyStep, selectedUser]);

  // useEffect(() => {
  //   if (requestMoneyStep === "success") {
  //     close();
  //     setRequestMoneyStep("success");
  //   }
  // }, [requestMoneyStep]);

  const goBackToStep1 = () => {
    setSelectedUser(undefined);
    setRequestMoneyStep("select-user");
  };

  const endStep = () => {
    setRequestMoneyStep(null);
    setStep("home");
    close();
  };

  const qc = useQueryClient();
  const RequestFundsMutation = useMutation({
    mutationFn: (data: IRequestFundsPayload) =>
      RequestFundsApi(currentWallet?.wallet_id || null, data),
    onSuccess: (response) => {
      qc.refetchQueries({ queryKey: ["bill-requests-sent"] });
      qc.invalidateQueries({
        queryKey: ["p2p-beneficiaries-recents"],
        refetchType: "all",
      });
      qc.invalidateQueries({
        queryKey: ["p2p-beneficiaries-favorites"],
        refetchType: "all",
      });
      toast.success(response?.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = response as any;
      const requestId =
        res?.request_transfer_id ||
        res?.data?.request_transfer_id ||
        `request_${Date.now()}`;
      pushDataLayerEvent(
        "request_completed",
        {
          request_id: String(requestId),
          value: Number(amount) || 0,
          currency: selectedCurrency.name || "USD",
        },
        { dedupId: `request_completed:${requestId}` },
      );
      setRequestMoneyStep("success");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (response: any) => {
      setRequestMoneyStep("failed");
      console.log("response", response);
      toast.error(response?.data?.errors[0]);
    },
  });

  const handleRequest = () => {
    const payload: IRequestFundsPayload = {
      requestee_entity_id: selectedUser?.entity_id || null,
      transaction_amount: Number(amount),
      narration,
      transaction_category_id: category?.transaction_category_id || 0,
    };
    RequestFundsMutation.mutate(payload);
  };

  const displayStep = () => {
    switch (requestMoneyStep) {
      case "select-user":
        return (
          <Selectuser
            goBack={() => setStep("home")}
            setSelectedUser={setSelectedUser}
            currentWalletId={currentWallet?.wallet_id || ""}
          />
        );
      case "details":
        return (
          <RequestDetails
            goBack={goBackToStep1}
            selectedUser={selectedUser}
            amount={amount}
            setAmount={setAmount}
            narration={narration}
            setNarration={setNarration}
            goNext={() => setRequestMoneyStep("category")}
          />
        );
      case "category":
        return (
          <ChooseCategory
            goBack={() => setRequestMoneyStep("details")}
            goNext={() => setRequestMoneyStep("confirmation")}
            category={category}
            setCategory={setCategory}
          />
        );
      case "confirmation":
        return (
          <RequestConfirmation
            goBack={() => setRequestMoneyStep("category")}
            goNext={handleRequest}
            amount={amount}
            narration={narration}
            category={category}
            loading={RequestFundsMutation.isPending}
          />
        );
      case "success":
        return (
          <>
            <ChooseCategory
              goBack={() => setRequestMoneyStep("details")}
              goNext={() => setRequestMoneyStep("confirmation")}
              category={category}
              setCategory={setCategory}
            />
            <RequestSucess close={endStep} />
          </>
        );
      case "failed":
        return (
          <RequestFailed
            close={endStep}
            tryAgain={() => setRequestMoneyStep("details")}
          />
        );
      default:
        break;
    }
  };
  return <>{displayStep()}</>;
};

export default RequestMoney;
