"use client";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import { AddNotificationEmailsApi } from "@/services/business";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import z from "zod";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { markNotificationRecipientsFeatureUsed } from "@/utils/notificationRecipientsFeature";

interface Props {
  close: () => void;
}

const AddRecipientSchema = z.object({
  label: z.string().min(1, "Recipient name is required"),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "Email is required"),
});

const AddRecipientModal = ({ close }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const addMutation = useMutation({
    mutationFn: AddNotificationEmailsApi,
    onSuccess: () => {
      markNotificationRecipientsFeatureUsed(user?.business_account_id);
      toast.success("Recipient added successfully");
      queryClient.invalidateQueries({ queryKey: ["notification-emails"] });
      close();
    },
  });

  const formik = useFormik({
    initialValues: {
      label: "",
      email: "",
    },
    validationSchema: toFormikValidationSchema(AddRecipientSchema),
    onSubmit: (values) => {
      addMutation.mutate({
        emails: [values.email.trim()],
        label: values.label.trim(),
      });
    },
  });

  const fieldError = (name: keyof typeof formik.values) =>
    formik.touched[name] && formik.errors[name] ? "error" : null;

  const fieldErrorMessage = (name: keyof typeof formik.values) =>
    formik.touched[name] ? formik.errors[name] : undefined;

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col h-full p-6">
      <CenterModalHeader close={close} title="Add Recipient" />

      <div className="flex flex-col gap-4 flex-1">
        <InputField
          label="Recipient Name"
          name="label"
          placeholder="Enter recipient name"
          value={formik.values.label}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          status={fieldError("label")}
          errorMessage={fieldErrorMessage("label")}
        />
        <InputField
          label="Email Address"
          name="email"
          type="email"
          placeholder="Enter email address"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          status={fieldError("email")}
          errorMessage={fieldErrorMessage("email")}
        />

        <div className="mt-2">
          <p className="text-sm font-semibold text-raiz-gray-950 mb-2">
            Notification Settings
          </p>
          <p className="text-sm text-raiz-gray-600">Transactions</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-8">
        <Button
          type="submit"
          loading={addMutation.isPending}
          disabled={addMutation.isPending}
          className="w-full"
        >
          Add Recipient
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={close}
          disabled={addMutation.isPending}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddRecipientModal;
