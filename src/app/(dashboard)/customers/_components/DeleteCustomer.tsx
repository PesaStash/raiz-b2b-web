"use client";
import Button from "@/components/ui/Button";
import { DeleteCustomerApi } from "@/services/invoice";
import { ICustomer } from "@/types/invoice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

const DeleteCustomer = ({
  close,
  customer,
}: {
  close: () => void;
  customer: ICustomer | null;
}) => {
  const qc = useQueryClient();
  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => DeleteCustomerApi(id),
    onSuccess: () => {
      close();
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const handleDelete = () => {
    if (customer) {
      deleteCustomerMutation.mutate(customer.customer_id);
    }
  };

  const displayName =
    customer?.business_name || customer?.full_name || "this customer";

  return (
    <div className="p-5 sm:p-6 bg-white rounded-2xl shadow-md w-full max-w-[400px] mx-auto text-center">
      <div className="size-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 9V14M12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3C16.971 3 21 7.029 21 12C21 16.971 16.971 21 12 21ZM12.01 17H11.99"
            stroke="#DC180D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-raiz-gray-950 mb-2">
        Delete Customer
      </h2>
      <p className="text-sm text-raiz-gray-600 mb-6">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-raiz-gray-900">{displayName}</span>?
        This action cannot be undone.
      </p>
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button
          type="button"
          onClick={close}
          disabled={deleteCustomerMutation.isPending}
          variant="secondary"
          className="w-full sm:flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          loading={deleteCustomerMutation.isPending}
          disabled={deleteCustomerMutation.isPending}
          className="w-full sm:flex-1 !bg-red-600 hover:!bg-red-700"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default DeleteCustomer;
