"use client";

import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import InputField from "@/components/ui/InputField";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import { UpdateNotificationEmailApi } from "@/services/business";
import { INotificationEmail } from "@/types/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import z from "zod";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { markNotificationRecipientsFeatureUsed } from "@/utils/notificationRecipientsFeature";

interface Props {
  close: () => void;
  recipient: INotificationEmail;
}

const UpdateRecipientSchema = z.object({
  label: z.string().min(1, "Recipient name is required"),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "Email is required"),
  transactionsEnabled: z.boolean(),
});

const UpdateRecipientModal = ({ close, recipient }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const updateMutation = useMutation({
    mutationFn: (payload: {
      label: string;
      email: string;
      active: boolean;
    }) =>
      UpdateNotificationEmailApi(
        recipient.business_transaction_notification_email_id,
        payload,
      ),
    onSuccess: () => {
      markNotificationRecipientsFeatureUsed(user?.business_account_id);
      toast.success("Recipient updated successfully");
      queryClient.invalidateQueries({ queryKey: ["notification-emails"] });
      close();
    },
  });

  const formik = useFormik({
    initialValues: {
      label: recipient.label || "",
      email: recipient.email || "",
      transactionsEnabled: recipient.active === 1,
    },
    validationSchema: toFormikValidationSchema(UpdateRecipientSchema),
    onSubmit: (values) => {
      updateMutation.mutate({
        label: values.label.trim(),
        email: values.email.trim(),
        active: values.transactionsEnabled,
      });
    },
  });

  const fieldError = (name: "label" | "email") =>
    formik.touched[name] && formik.errors[name] ? "error" : null;

  const fieldErrorMessage = (name: "label" | "email") =>
    formik.touched[name] ? formik.errors[name] : undefined;

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col h-full p-6">
      <CenterModalHeader close={close} title="Update Recipient" />

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
          <p className="text-sm font-semibold text-raiz-gray-950 mb-3">
            Notification Settings
          </p>
          <div className="flex items-start gap-2">
            <Checkbox
              checked={formik.values.transactionsEnabled}
              onChange={(checked) =>
                formik.setFieldValue("transactionsEnabled", checked)
              }
            />
            <div>
              <p className="text-sm font-medium text-raiz-gray-900">
                Transactions
              </p>
              <p className="text-xs text-raiz-gray-500 mt-0.5">
                Uncheck to mute notifications for this recipient.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-8">
        <Button
          type="submit"
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          Update Recipient
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={close}
          disabled={updateMutation.isPending}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default UpdateRecipientModal;
