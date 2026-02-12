import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Overlay from "@/components/ui/Overlay";
import { RejectRequestApi } from "@/services/transactions";
import { IBillRequest } from "@/types/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { toast } from "sonner";

interface Props {
  close: () => void;
  request: IBillRequest;
}

const RejectBill = ({ close, request }: Props) => {
  const user = request?.third_party_account;
  const [reason, setReason] = useState("");
  const qc = useQueryClient();
  const DeclineRquestMutation = useMutation({
    mutationFn: () => RejectRequestApi(request?.request_transfer_id, reason),
    onSuccess: (response) => {
      toast.success(response?.message);
      qc.invalidateQueries({ queryKey: ["bill-requests"] });
    },
    onSettled: () => {
      close();
    },
  });
  return (
    <Overlay close={close} width="400px">
      <div className="flex flex-col justify-center items-center h-full py-8 px-5 w-full">
        <h3 className="text-zinc-900 text-xl text-left w-full font-bold leading-normal mb-5">
          Reject Bill
        </h3>
        <Avatar name={user?.account_name} src={user?.selfie_image} />
        <p className="text-zinc-900 text-sm text-center my-4 leading-tight">
          Can we know the reason you want to delete this bill request?
        </p>
        <div className="w-full">
          <InputField
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full"
            placeholder="Enter your reason"
          />
        </div>
        <div className="flex flex-col gap-3 mt-5 w-full">
          <Button
            disabled={DeclineRquestMutation.isPending || !reason}
            loading={DeclineRquestMutation.isPending}
            onClick={DeclineRquestMutation.mutate}
            className="bg-pink-600 "
          >
            Reject
          </Button>
          <Button onClick={close} className="bg-zinc-200 text-zinc-900 ">
            Cancel
          </Button>
        </div>
      </div>
    </Overlay>
  );
};

export default RejectBill;
