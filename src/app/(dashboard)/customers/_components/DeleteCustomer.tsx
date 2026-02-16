"use client"
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
    
    const qc = useQueryClient()
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

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-96 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Delete Customer
      </h2>
      <p className="text-gray-700 mb-4">
        Are you sure you want to delete {customer?.business_name || ""}?
      </p>
      <div className="flex justify-end gap-4 mt-6">
        <Button
                  onClick={close}
                  disabled={deleteCustomerMutation.isPending}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:bg-opacity-70 hover:bg-gray-400 transition-colors"
        >
          Cancel
        </Button>
        <Button
                  onClick={handleDelete}
                  loading={deleteCustomerMutation.isPending}
                  disabled={deleteCustomerMutation.isPending}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-opacity-70 transition-colors"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default DeleteCustomer;
