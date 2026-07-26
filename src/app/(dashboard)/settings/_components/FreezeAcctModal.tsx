"use client";
import Button from "@/components/ui/Button";
import NumberKeypad from "@/components/ui/NumberKeyPad";
import Overlay from "@/components/ui/Overlay";
import { FreezeDebitApi, UnFreezeDebitApi } from "@/services/business";
import { ITransactionPinPayload } from "@/types/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "sonner";

interface Props {
  type: "enable" | "disable";
  close: () => void;
}

const FreezeAcctModal = ({ close, type }: Props) => {
  const [freezeStatus, setFreezeStatus] = useState(1);
  const [otpValue, setOtpValue] = useState<string>("");

  const qc = useQueryClient();

  const FreezeMutation = useMutation({
    mutationFn: (data: ITransactionPinPayload) => FreezeDebitApi(data),
    onSuccess: (response) => {
      toast.success(response?.message);
      close();
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const UnFreezeMutation = useMutation({
    mutationFn: (data: ITransactionPinPayload) => UnFreezeDebitApi(data),
    onSuccess: (response) => {
      toast.success(response?.message);
      close();
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const handleToggle = () => {
    if (freezeStatus === 1) {
      setFreezeStatus(2);
    } else {
      if (type === "disable") {
        FreezeMutation.mutate({ transaction_pin: otpValue });
      } else {
        UnFreezeMutation.mutate({ transaction_pin: otpValue });
      }
    }
  };

  return (
    <Overlay width="385px" close={close}>
      <div
        className={`flex flex-col ${
          freezeStatus === 1 ? "h-full" : "lg:h-[90%] xl:h-full"
        }  py-8 px-5  text-raiz-gray-950 overflow-y-scroll`}
      >
        <Image
          className="mx-auto mb-4"
          src="/icons/freeze.svg"
          alt="freeze"
          width={48}
          height={48}
        />
        <h2 className=" text-xl font-bold  text-center leading-normal">
          Confirm {type === "disable" ? "Freeze" : "Unfreeze"}
        </h2>
        <p className="text-center  text-[13px] font-normal leading-tight mb-5">
          {freezeStatus === 1
            ? type === "disable"
              ? "Are you certain you wish to disable your account?"
              : "Are you certain you wish unfreeze your account?"
            : "Enter your transactional PIN to unfreeze account"}
        </p>

        {freezeStatus === 2 && (
          <div className="mb-[30px]">
            <NumberKeypad otpValue={otpValue} setOtpValue={setOtpValue} />
          </div>
        )}
        <Button
          disabled={
            (freezeStatus === 2 && (!otpValue || otpValue.length !== 4)) ||
            (type === "disable"
              ? FreezeMutation.isPending
              : UnFreezeMutation.isPending)
          }
          onClick={handleToggle}
          className="!bg-[#229BF3] mb-[15px] hover:opacity-80"
          loading={
            type === "disable"
              ? FreezeMutation.isPending
              : UnFreezeMutation.isPending
          }
        >
          {type === "disable" ? "Freeze" : "Unfreeze"}
        </Button>
        <Button
          className="!bg-[#E0F1FD] text-raiz-gray-950 hover:opacity-90"
          onClick={close}
        >
          Cancel
        </Button>
      </div>
    </Overlay>
  );
};

export default FreezeAcctModal;
