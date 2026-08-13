"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Checkbox from "@/components/ui/Checkbox";
import Overlay from "@/components/ui/Overlay";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { LiaTimesSolid } from "react-icons/lia";
import { useUser } from "@/lib/hooks/useUser";
import {
  CreateGatewayWebhookApi,
  DeleteGatewayWebhookApi,
  FetchGatewayWebhooksApi,
  TestGatewayWebhookApi,
  UpdateGatewayWebhookApi,
} from "@/services/developers";
import { IGatewayWebhook } from "@/types/services";
import { PAYOUT_WEBHOOK_EVENTS } from "@/constants/ngnPayoutBlockers";
import { formatLastUpdated } from "@/utils/helpers";
import WebhookSecretModal from "./payout/WebhookSecretModal";
import PayoutLogsModal from "./payout/PayoutLogsModal";
import Skeleton from "react-loading-skeleton";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const RECOMMENDED_EVENTS: string[] = [
  "payout.created",
  "payout.completed",
  "payout.failed",
];

interface FormState {
  webhookUrl: string;
  events: string[];
  isActive: boolean;
}

const emptyForm = (): FormState => ({
  webhookUrl: "",
  events: [...RECOMMENDED_EVENTS],
  isActive: true,
});

const webhookToForm = (webhook: IGatewayWebhook): FormState => ({
  webhookUrl: webhook.webhook_url,
  events: webhook.events,
  isActive: webhook.is_active,
});

const WebhookSettings = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const canEdit = user?.is_primary ?? false;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [savedForm, setSavedForm] = useState<FormState>(emptyForm);
  const [webhookSecret, setWebhookSecret] = useState<IGatewayWebhook | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const {
    data: webhooks = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["gateway-webhooks"],
    queryFn: FetchGatewayWebhooksApi,
  });

  const existingWebhook = webhooks[0] ?? null;

  useEffect(() => {
    if (!existingWebhook) {
      const next = emptyForm();
      setForm(next);
      setSavedForm(next);
      return;
    }
    const next = webhookToForm(existingWebhook);
    setForm(next);
    setSavedForm(next);
    // Sync when the selected webhook identity changes, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingWebhook?.id]);

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );

  const { mutate: saveWebhook, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const url = form.webhookUrl.trim();
      if (!url) throw new Error("Webhook URL is required");
      if (form.events.length === 0) {
        throw new Error("Select at least one event");
      }

      if (existingWebhook) {
        return UpdateGatewayWebhookApi(existingWebhook.id, {
          webhook_url: url,
          events: form.events,
          is_active: form.isActive,
        });
      }

      return CreateGatewayWebhookApi({
        webhook_url: url,
        events: form.events,
        secret: null,
      });
    },
    onSuccess: (response) => {
      toast.success(
        existingWebhook ? "Webhook updated" : "Webhook created",
      );
      queryClient.invalidateQueries({ queryKey: ["gateway-webhooks"] });
      const next = webhookToForm(response);
      setForm(next);
      setSavedForm(next);
      if (response.raw_secret) setWebhookSecret(response);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to save webhook");
    },
  });

  const { mutate: deleteWebhook, isPending: isDeleting } = useMutation({
    mutationFn: DeleteGatewayWebhookApi,
    onSuccess: () => {
      toast.success("Webhook deleted");
      queryClient.invalidateQueries({ queryKey: ["gateway-webhooks"] });
      setShowDeleteConfirm(false);
      const next = emptyForm();
      setForm(next);
      setSavedForm(next);
    },
    onError: () => toast.error("Unable to delete webhook"),
  });

  const { mutate: testWebhook, isPending: isTesting } = useMutation({
    mutationFn: async (webhookId: string) => {
      const response = await TestGatewayWebhookApi(webhookId, {
        event_type: "payout.created",
        payload: {
          gateway_payout_id: "00000000-0000-0000-0000-000000000000",
          status: "created",
          amount: 25000,
          currency: "NGN",
        },
      });
      if (!response?.success) {
        throw new Error(response?.message || "Unable to test webhook");
      }
      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message || "Webhook test queued.");
    },
    onError: (error: unknown) => {
      const axiosLike = error as {
        data?: { message?: string; detail?: string };
        message?: string;
      };
      toast.error(
        axiosLike.data?.message ||
          axiosLike.data?.detail ||
          (error instanceof Error ? error.message : null) ||
          axiosLike.message ||
          "Unable to test webhook",
      );
    },
  });

  const toggleEvent = (event: string) => {
    if (!canEdit) return;
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((item) => item !== event)
        : [...prev.events, event],
    }));
  };

  const handleSave = () => {
    if (!canEdit) {
      toast.error("Only the primary business user can manage this setting.");
      return;
    }
    saveWebhook();
  };

  const handleCancel = () => {
    setForm(savedForm);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton height={88} borderRadius={12} />
        <Skeleton height={420} borderRadius={20} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-[20px] border border-dashed border-raiz-gray-200 bg-white text-center">
        <p className="text-raiz-gray-600 mb-4">Unable to load webhook settings.</p>
        <Button width="fit" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#E4E0EA] bg-[#FCFCFD] p-6 md:p-8 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-bold text-raiz-gray-950">
            Webhook Configuration
          </h3>
          <p className="text-sm text-raiz-gray-700">
            Configure webhook endpoints to receive real-time notifications for
            payout events.
          </p>
        </div>
        {existingWebhook && (
          <ToggleSwitch
            checked={form.isActive}
            onChange={(checked) =>
              canEdit && setForm((prev) => ({ ...prev, isActive: checked }))
            }
            disabled={!canEdit}
            checkedColor="#4B0082"
          />
        )}
      </div>

      {!canEdit && (
        <p className="text-sm text-raiz-gray-600">
          Only the primary business user can update webhook settings.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-[#2C2435]">Callback URL</label>
        <InputField
          name="webhookUrl"
          placeholder="https://merchant.example.com/raiz/webhooks"
          value={form.webhookUrl}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, webhookUrl: event.target.value }))
          }
          disabled={!canEdit}
          className="!bg-[#F8F7FA] !border-[#E4E0EA]"
        />
        <p className="text-[13px] text-raiz-gray-600">
          We&apos;ll send POST requests to this URL for all selected events.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-[#2C2435]">Signing Secret</label>
        <div className="bg-[#F8F7FA] border border-[#E4E0EA] rounded-xl px-4 py-4">
          <p className="text-sm text-raiz-gray-900">
            {existingWebhook
              ? "Secret is shown only once after create."
              : "A signing secret will be shown once after you save."}
          </p>
        </div>
        <p className="text-[13px] text-raiz-gray-600">
          Use this secret to verify webhook signatures. Copy it when it appears —
          it cannot be retrieved later.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <h4 className="text-base font-bold text-raiz-gray-950">
            Select Events
          </h4>
          <p className="text-sm font-bold text-raiz-gray-700">Payout Events</p>
          <div className="flex flex-wrap gap-3">
            {PAYOUT_WEBHOOK_EVENTS.map((event) => {
              const checked = form.events.includes(event);
              return (
                <button
                  key={event}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => toggleEvent(event)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-[13px] transition-colors ${
                    checked
                      ? "bg-[#4B008214] border-[#4B0082] font-semibold text-raiz-gray-950"
                      : "bg-[#FCFCFD] border-[#D0C8D9] font-normal text-raiz-gray-700"
                  } ${canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => toggleEvent(event)}
                    bgStyle="bg-[#4B0082] border-[#4B0082]"
                    checkMarkColor="#FFFFFF"
                    className="pointer-events-none"
                  />
                  {event}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {existingWebhook && (
        <div className="flex flex-col gap-3">
          <h4 className="text-base font-bold text-raiz-gray-950">
            Delivery status
          </h4>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-raiz-gray-600">Last success</span>
              <span className="font-semibold text-raiz-gray-950">
                {existingWebhook.last_success_at
                  ? formatLastUpdated(existingWebhook.last_success_at)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-raiz-gray-600">Last failure</span>
              <span className="font-semibold text-raiz-gray-950">
                {existingWebhook.last_failure_at
                  ? formatLastUpdated(existingWebhook.last_failure_at)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-raiz-gray-600">Failure count</span>
              <span className="font-semibold text-raiz-gray-950">
                {existingWebhook.failure_count}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogs(true)}
            className="text-sm font-semibold text-[#7F56D9] hover:underline text-left w-fit"
          >
            View all in Developer Logs →
          </button>
        </div>
      )}

      {existingWebhook && (
        <div className="bg-[#F8F7FA] border border-[#E4E0EA] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-raiz-gray-950">Test Webhook</p>
            <p className="text-[13px] text-raiz-gray-600">
              Send a test event to verify your endpoint is receiving webhooks
              correctly.
            </p>
          </div>
          <Button
            width="fit"
            variant="tertiary"
            className="px-5 py-2.5 h-10 rounded-full shrink-0"
            loading={isTesting}
            onClick={() => testWebhook(existingWebhook.id)}
            disabled={!canEdit}
          >
            Send Test Event
          </Button>
        </div>
      )}

      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-center">
          {existingWebhook && (
            <Button
              width="fit"
              variant="tertiary"
              className="px-6 py-2.5 h-10 rounded-full text-[#DC180D] sm:mr-auto"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
            >
              Delete
            </Button>
          )}
          <Button
            variant="tertiary"
            width="fit"
            className="px-6 py-2.5 h-10 rounded-full"
            onClick={handleCancel}
            disabled={!hasChanges || isSaving}
          >
            Cancel
          </Button>
          <Button
            width="fit"
            className="px-6 py-2.5 h-10 rounded-full"
            onClick={handleSave}
            loading={isSaving}
            disabled={!hasChanges}
          >
            Save Settings
          </Button>
        </div>
      )}

      {webhookSecret && (
        <WebhookSecretModal
          webhook={webhookSecret}
          close={() => setWebhookSecret(null)}
        />
      )}

      {showLogs && <PayoutLogsModal close={() => setShowLogs(false)} />}

      {showDeleteConfirm && existingWebhook && (
        <Overlay
          width="400px"
          close={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div className="flex flex-col p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-raiz-gray-950 font-bold text-lg">
                Delete webhook
              </h4>
              <button
                onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <LiaTimesSolid size={20} />
              </button>
            </div>
            <p className="text-sm text-raiz-gray-600 mb-6">
              Delete the webhook for{" "}
              <span className="font-semibold">{existingWebhook.webhook_url}</span>
              ?
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                className="py-3 bg-red-600 hover:!bg-red-700 border-none"
                loading={isDeleting}
                onClick={() => deleteWebhook(existingWebhook.id)}
              >
                Delete
              </Button>
              <Button
                variant="tertiary"
                className="py-3"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};

export default WebhookSettings;
