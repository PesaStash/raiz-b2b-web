"use client";

import React from "react";
import Button from "@/components/ui/Button";

interface Props {
  onBack?: () => void;
  continueLabel: string;
  continueType?: "button" | "submit";
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  backDisabled?: boolean;
}

const PayStepActions = ({
  onBack,
  continueLabel,
  continueType = "button",
  onContinue,
  continueDisabled,
  continueLoading,
  backDisabled,
}: Props) => {
  return (
    <div className="w-full flex flex-col-reverse md:flex-row items-stretch md:items-center gap-3 py-5">
      {onBack && (
        <Button
          type="button"
          variant="secondary"
          className="w-full md:flex-1 md:min-w-0"
          onClick={onBack}
          disabled={backDisabled || continueLoading}
        >
          Go back
        </Button>
      )}
      <Button
        type={continueType}
        className="w-full md:flex-1 md:min-w-0"
        onClick={onContinue}
        disabled={continueDisabled}
        loading={continueLoading}
      >
        {continueLabel}
      </Button>
    </div>
  );
};

export default PayStepActions;
