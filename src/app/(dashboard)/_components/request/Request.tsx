"use client";
import { withBusinessWrite } from "@/components/team/BusinessWrite";
import React, { useState } from "react";
import RequestHome from "./RequestHome";
import AllRequests from "./AllRequests";
import RequestMoney from "./RequestMoney";
import { IBillRequest } from "@/types/transactions";
import RequestInfo from "./RequestInfo";

export type RequestStep = "home" | "all" | "requests" | "single-request";

interface Props {
  close: () => void;
}

const Request = ({ close }: Props) => {
  const [step, setStep] = useState<RequestStep>("home");
  const [selectedRequest, setSelectedRequest] = useState<IBillRequest | null>(
    null
  );

  const displayScreen = () => {
    switch (step) {
      case "home":
        return <RequestHome close={close} setStep={setStep} />;
      case "all":
        return (
          <AllRequests
            setStep={setStep}
            close={close}
            setSelectedRequest={setSelectedRequest}
          />
        );
      case "requests":
        return <RequestMoney setStep={setStep} close={close} />;
      case "single-request":
        return (
          selectedRequest && (
            <RequestInfo
              setStep={setStep}
              close={close}
              request={selectedRequest}
            />
          )
        );
      default:
        break;
    }
  };
  return <>{displayScreen()}</>;
};

export default withBusinessWrite(Request);
