"use client";

import React, { useEffect, useMemo, useState } from "react";
import { GuestAfricaPayinStep } from "@/store/GuestSend/guestSendSlice.types";

export type PayLocalUiStep = "amount" | "provider" | GuestAfricaPayinStep;

export type PayLocalStepperNodeId =
  | "verify"
  | "identity"
  | "amount"
  | "provider"
  | "details"
  | "confirm";

type StepperNode = {
  id: PayLocalStepperNodeId;
  label: string;
};

const ALL_NODES: StepperNode[] = [
  { id: "verify", label: "Verify" },
  { id: "identity", label: "Identity" },
  { id: "amount", label: "Amount" },
  { id: "provider", label: "Provider" },
  { id: "details", label: "Details" },
  { id: "confirm", label: "Confirm" },
];

const CONFIRM_STEPS: GuestAfricaPayinStep[] = [
  "summary",
  "instructions",
  "status",
  "receipt",
];

const POST_CONFIRM_STEPS: GuestAfricaPayinStep[] = [
  "instructions",
  "status",
  "receipt",
];

export const resolvePayLocalStepperNode = (
  localStep: PayLocalUiStep,
  africaStep: GuestAfricaPayinStep,
): PayLocalStepperNodeId => {
  if (
    localStep === "payer_email" ||
    localStep === "payer_verify" ||
    africaStep === "payer_email" ||
    africaStep === "payer_verify"
  ) {
    return "verify";
  }
  if (localStep === "payer_register" || africaStep === "payer_register") {
    return "identity";
  }
  if (localStep === "amount") return "amount";
  if (localStep === "provider") return "provider";
  if (localStep === "details" || africaStep === "details") return "details";
  if (
    CONFIRM_STEPS.includes(africaStep) ||
    CONFIRM_STEPS.includes(localStep as GuestAfricaPayinStep)
  ) {
    return "confirm";
  }
  return "verify";
};

interface Props {
  localStep: PayLocalUiStep;
  africaStep: GuestAfricaPayinStep;
  showIdentity: boolean;
  showProvider: boolean;
  onStepClick?: (step: PayLocalStepperNodeId) => void;
}

const CompletedMark = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M5.51 9.75H3.75C3.44 9.75 3.165 9.74 2.92 9.705C1.605 9.56 1.25 8.94 1.25 7.25V4.75C1.25 3.06 1.605 2.44 2.92 2.295C3.165 2.26 3.44 2.25 3.75 2.25H5.48"
      stroke="#FCFCFD"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.51 2.25H8.25C8.56 2.25 8.835 2.26 9.08 2.295C10.395 2.44 10.75 3.06 10.75 4.75V7.25C10.75 8.94 10.395 9.56 9.08 9.705C8.835 9.74 8.56 9.75 8.25 9.75H7.51"
      stroke="#FCFCFD"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 1V11"
      stroke="#FCFCFD"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 4.25V7.75"
      stroke="#FCFCFD"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PayLocalStepper = ({
  localStep,
  africaStep,
  showIdentity,
  showProvider,
  onStepClick,
}: Props) => {
  const activeId = resolvePayLocalStepperNode(localStep, africaStep);
  const isPostConfirm = POST_CONFIRM_STEPS.includes(africaStep);

  const nodes = useMemo(
    () =>
      ALL_NODES.filter((node) => {
        if (node.id === "identity") return showIdentity;
        if (node.id === "provider") return showProvider;
        return true;
      }),
    [showIdentity, showProvider],
  );

  const activeIndex = Math.max(
    0,
    nodes.findIndex((node) => node.id === activeId),
  );

  const [reachedIds, setReachedIds] = useState<Set<PayLocalStepperNodeId>>(
    () => new Set([activeId]),
  );

  useEffect(() => {
    setReachedIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      nodes.forEach((node, index) => {
        if (index <= activeIndex && !next.has(node.id)) {
          next.add(node.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [activeId, activeIndex, nodes]);

  return (
    <nav aria-label="Payment progress" className="w-full pb-2">
      <ol className="flex w-full items-center gap-2">
        {nodes.map((node, index) => {
          const isComplete = index < activeIndex;
          const isActive = index === activeIndex;
          const isLast = index === nodes.length - 1;
          const canNavigate =
            !!onStepClick &&
            !isPostConfirm &&
            !isActive &&
            reachedIds.has(node.id);
          const connectorClass = isComplete
            ? "bg-[#3C2875]"
            : isActive
              ? "bg-[#D9D2F0]"
              : "bg-[#E4E0EA]";

          return (
            <li
              key={node.id}
              className={`flex items-center gap-2 ${isLast ? "" : "flex-1"}`}
            >
              <button
                type="button"
                disabled={!canNavigate}
                onClick={() => {
                  if (!canNavigate) return;
                  onStepClick?.(node.id);
                }}
                className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
                  isComplete
                    ? "bg-[#3C2875]"
                    : isActive
                      ? "bg-[#EAECFF] text-[#3C2875]"
                      : "border border-[#E4E0EA] bg-[#FCFCFD] text-[#A89AB9]"
                } ${
                  canNavigate
                    ? "cursor-pointer hover:opacity-80"
                    : "cursor-default"
                } disabled:cursor-default`}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${node.label}${isComplete ? ", completed" : ""}${canNavigate ? ", go to step" : ""}`}
              >
                {isComplete ? <CompletedMark /> : index + 1}
              </button>
              {!isLast && (
                <div
                  className={`h-0.5 min-w-4 flex-1 rounded-full ${connectorClass}`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default PayLocalStepper;
