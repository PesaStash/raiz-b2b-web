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

export type RequestMoneyStepType =
  | "select-user"
  | "details"
  | "category"
  | "success"
  | "failed";

export const RequestMoney = ({ setStep }: RequestStepsProps) => {
  const [requestMoneyStep, setRequestMoneyStep] =
    useState<RequestMoneyStepType | null>("select-user");
  const [selectedUser, setSelectedUser] = useState<ISearchedUser | undefined>();
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [category, setCategory] = useState<ITransactionCategory | null>(null);
  const { user } = useUser();
  const currentWallet = useCurrentWallet(user);

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
    setStep("all");
  };

  const qc = useQueryClient();
  const RequestFundsMutation = useMutation({
    mutationFn: (data: IRequestFundsPayload) =>
      RequestFundsApi(currentWallet?.wallet_id || null, data),
    onSuccess: (response) => {
      qc.refetchQueries({ queryKey: ["sent-requests"] });
      toast.success(response?.message);
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
            goBack={() => setStep("all")}
            setSelectedUser={setSelectedUser}
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
            goNext={handleRequest}
            category={category}
            setCategory={setCategory}
            loading={RequestFundsMutation.isPending}
          />
        );
      case "success":
        return <RequestSucess close={endStep} />;
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
  return <div className="h-full p-[25px] xl:p-[30px]">{displayStep()}</div>;
};

export default RequestMoney;
