"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Image from "next/image";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SelectField, { Option } from "@/components/ui/SelectField";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import StatusBadge from "@/components/ui/StatusBadge";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import { useUser } from "@/lib/hooks/useUser";
import {
  useEligibleNgnPayoutWallets,
  getSelectedPayoutWallet,
  isWalletBlockedForPayouts,
} from "@/lib/hooks/useEligibleNgnPayoutWallets";
import {
  FetchGatewayWebhooksApi,
  FetchNgnPayoutSettingsApi,
  UpdateNgnPayoutSettingsApi,
} from "@/services/developers";
import {
  INgnPayoutSettings,
  IUpdateNgnPayoutSettingsPayload,
  NgnPayoutBlocker,
} from "@/types/services";
import { NGN_PAYOUT_BLOCKER_COPY } from "@/constants/ngnPayoutBlockers";
import { findWalletByCurrency, formatAmount, formatLastUpdated, getCurrencySymbol } from "@/utils/helpers";
import CreateNgnAcct from "@/app/(dashboard)/_components/createNgnAcct/CreateNgnAcct";
import AccountUpgrade from "@/app/(dashboard)/_components/AccountUpgrade";
import PayoutLogsModal from "./payout/PayoutLogsModal";
import EnablePayoutConfirmModal from "./payout/EnablePayoutConfirmModal";
import {
  PayoutAlertBanner,
  PayoutPreviewRow,
} from "./payout/PayoutUiParts";
import Skeleton from "react-loading-skeleton";
import { HiOutlineDocumentText } from "react-icons/hi2";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

interface Props {
  onManageApiKeys: () => void;
  onManageWebhooks: () => void;
}

interface FormState {
  enabled: boolean;
  sourceWalletId: string | null;
  perTransactionLimit: string;
  dailyLimit: string;
  manualApprovalEnabled: boolean;
  manualApprovalThreshold: string;
}

const sanitizeAmountInput = (value: string) => value.replace(/[^\d.]/g, "");

const formatLimitDisplay = (value: string) => {
  if (!value) return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return `${getCurrencySymbol("NGN")}${formatAmount(numeric)}`;
};

const formatWholeNaira = (value: string | number) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric <= 0) return "";
  return `${getCurrencySymbol("NGN")}${formatAmount(numeric, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};



const toApiAmount = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  if (Number.isNaN(numeric) || numeric <= 0) return null;
  return numeric.toFixed(2);
};

const settingsToForm = (settings: INgnPayoutSettings): FormState => ({
  enabled: settings.enabled,
  sourceWalletId: settings.source_wallet_id,
  perTransactionLimit: settings.per_transaction_limit_ngn
    ? String(settings.per_transaction_limit_ngn)
    : "",
  dailyLimit: settings.daily_limit_ngn ? String(settings.daily_limit_ngn) : "",
  manualApprovalEnabled: settings.manual_approval_enabled,
  manualApprovalThreshold: settings.manual_approval_threshold_ngn
    ? String(settings.manual_approval_threshold_ngn)
    : "",
});

const extractPayoutError = (error: unknown): string => {
  const axiosError = error as AxiosError<{
    detail?: string | { message?: string; blockers?: NgnPayoutBlocker[] };
  }>;
  const detail = axiosError.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const blockers = detail.blockers?.map(
      (blocker) => NGN_PAYOUT_BLOCKER_COPY[blocker] ?? blocker,
    );
    if (blockers?.length) return `${detail.message ?? "Unable to save settings."} ${blockers.join(" ")}`;
    return detail.message ?? "Unable to save settings.";
  }
  return "Unable to save settings.";
};

const NgnPayoutSettings = ({ onManageApiKeys, onManageWebhooks }: Props) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const isPrimary = user?.is_primary ?? false;
  const eligibleWallets = useEligibleNgnPayoutWallets(user);

  const [form, setForm] = useState<FormState | null>(null);
  const [savedForm, setSavedForm] = useState<FormState | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [thresholdFocused, setThresholdFocused] = useState(false);

  const {
    data: settings,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["ngn-payout-settings"],
    queryFn: FetchNgnPayoutSettingsApi,
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ["gateway-webhooks"],
    queryFn: FetchGatewayWebhooksApi,
  });

  useEffect(() => {
    if (settings) {
      const nextForm = settingsToForm(settings);
      if (
        !nextForm.sourceWalletId &&
        eligibleWallets.length === 1
      ) {
        nextForm.sourceWalletId = eligibleWallets[0].wallet_id;
      }
      setForm(nextForm);
      setSavedForm(settingsToForm(settings));
      if (!settings.enabled || !settings.can_enable) {
        setShowFullForm(true);
      }
    }
  }, [settings, eligibleWallets]);

  const selectedWallet = useMemo(
    () => getSelectedPayoutWallet(user, form?.sourceWalletId),
    [user, form?.sourceWalletId],
  );

  const walletOptions = useMemo<Option[]>(
    () =>
      eligibleWallets.map((wallet) => ({
        value: wallet.wallet_id,
        label: `${wallet.wallet_name || "NGN Wallet"} · ${wallet.account_number}`,
      })),
    [eligibleWallets],
  );

  const selectedWalletOption = useMemo(
    () =>
      walletOptions.find((option) => option.value === form?.sourceWalletId) ??
      null,
    [walletOptions, form?.sourceWalletId],
  );

  const hasChanges = useMemo(() => {
    if (!form || !savedForm) return false;
    return JSON.stringify(form) !== JSON.stringify(savedForm);
  }, [form, savedForm]);

  const blockers = settings?.blockers ?? [];
  const hasKybBlocker = blockers.includes("kyb_incomplete");
  const hasWalletBlocker = blockers.includes("missing_completed_ngn_wallet");
  const ngnWallet = findWalletByCurrency(user, "NGN");
  const showMissingWalletState =
    (!ngnWallet || hasWalletBlocker || eligibleWallets.length === 0) &&
    !settings?.enabled &&
    !hasKybBlocker;
  const isDrift = !!settings?.enabled && settings.can_enable === false;
  const isBlockedWallet =
    !!settings?.enabled &&
    (hasWalletBlocker ||
      blockers.includes("source_wallet_not_completed_or_usable") ||
      isWalletBlockedForPayouts(selectedWallet, settings?.source_wallet_status));

  const canEdit = isPrimary;
  const canToggleEnable =
    canEdit &&
    (settings?.can_enable || settings?.enabled) &&
    !isBlockedWallet &&
    !showMissingWalletState;

  const showCompactActiveView =
    !!settings?.enabled &&
    settings.can_enable &&
    !showFullForm &&
    !hasChanges &&
    !isBlockedWallet &&
    !showMissingWalletState;

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (payload: IUpdateNgnPayoutSettingsPayload) =>
      UpdateNgnPayoutSettingsApi(payload),
    onSuccess: (response) => {
      toast.success("Payout settings saved");
      queryClient.setQueryData(["ngn-payout-settings"], response);
      const nextForm = settingsToForm(response);
      setForm(nextForm);
      setSavedForm(nextForm);
      setShowEnableConfirm(false);
      if (response.enabled && response.can_enable) {
        setShowFullForm(false);
      }
    },
    onError: (error) => {
      toast.error(extractPayoutError(error));
    },
  });

  const buildPatchPayload = (
    forceEnable = false,
  ): IUpdateNgnPayoutSettingsPayload | null => {
    if (!form || !savedForm) return null;
    const payload: IUpdateNgnPayoutSettingsPayload = {};

    if (forceEnable) {
      payload.enabled = true;
    } else if (form.enabled !== savedForm.enabled) {
      payload.enabled = form.enabled;
    }
    if (form.sourceWalletId !== savedForm.sourceWalletId) {
      payload.source_wallet_id = form.sourceWalletId;
    }
    if (forceEnable || form.perTransactionLimit !== savedForm.perTransactionLimit) {
      payload.per_transaction_limit_ngn = toApiAmount(form.perTransactionLimit);
    }
    if (forceEnable || form.dailyLimit !== savedForm.dailyLimit) {
      payload.daily_limit_ngn = toApiAmount(form.dailyLimit);
    }
    if (form.manualApprovalEnabled !== savedForm.manualApprovalEnabled) {
      payload.manual_approval_enabled = form.manualApprovalEnabled;
    }
    if (form.manualApprovalThreshold !== savedForm.manualApprovalThreshold) {
      payload.manual_approval_threshold_ngn = form.manualApprovalEnabled
        ? toApiAmount(form.manualApprovalThreshold)
        : null;
    }

    return Object.keys(payload).length > 0 ? payload : null;
  };

  const validateForm = (): string | null => {
    if (!form) return "Settings unavailable";

    const perTransactionLimit = Number(form.perTransactionLimit);
    const dailyLimit = Number(form.dailyLimit);

    if (!form.perTransactionLimit.trim()) {
      return NGN_PAYOUT_BLOCKER_COPY.missing_per_transaction_limit;
    }
    if (Number.isNaN(perTransactionLimit) || perTransactionLimit <= 0) {
      return "Per-transaction limit must be greater than zero.";
    }
    if (!form.dailyLimit.trim()) {
      return NGN_PAYOUT_BLOCKER_COPY.missing_daily_limit;
    }
    if (Number.isNaN(dailyLimit) || dailyLimit <= 0) {
      return "Daily limit must be greater than zero.";
    }
    if (perTransactionLimit > dailyLimit) {
      return NGN_PAYOUT_BLOCKER_COPY.per_transaction_limit_exceeds_daily_limit;
    }
    if (form.manualApprovalEnabled) {
      if (!form.manualApprovalThreshold) {
        return NGN_PAYOUT_BLOCKER_COPY.missing_manual_approval_threshold;
      }
      if (Number(form.manualApprovalThreshold) < perTransactionLimit) {
        return "Manual approval threshold must be greater than or equal to the per-transaction limit.";
      }
    }
    return null;
  };

  const handleSave = () => {
    if (!canEdit) {
      toast.error("Only the primary business user can manage this setting.");
      return;
    }
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const pendingEnable = !settings?.enabled;
    const payload = buildPatchPayload(pendingEnable);
    if (!payload) {
      toast.info("No changes to save.");
      return;
    }
    if (pendingEnable) {
      setShowEnableConfirm(true);
      return;
    }
    saveSettings(payload);
  };

  const handleConfirmEnable = () => {
    const payload = buildPatchPayload(true);
    if (!payload) {
      setShowEnableConfirm(false);
      toast.info("No changes to save.");
      return;
    }
    saveSettings(payload);
  };

  const handleCancel = () => {
    if (savedForm) setForm(savedForm);
    setShowFullForm(false);
  };

  const handleEnableToggle = (enabled: boolean) => {
    if (!canEdit) {
      toast.error("Only the primary business user can manage this setting.");
      return;
    }
    if (enabled && !settings?.can_enable) {
      toast.error("Complete the required setup before enabling payouts.");
      return;
    }
    setForm((prev) => (prev ? { ...prev, enabled } : prev));
    if (enabled) setShowFullForm(true);
  };

  if (isLoading || !form || !settings) {
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
        <p className="text-raiz-gray-600 mb-4">
          Unable to load NGN payout settings.
        </p>
        <Button width="fit" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const primaryWebhook = webhooks[0];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {!settings.enabled &&
        !settings.can_enable &&
        !showMissingWalletState &&
        !hasKybBlocker && (
          <PayoutAlertBanner
            title="Setup Virtual Payouts"
            description="NGN virtual payouts are not enabled. Configure your payout settings and enable when ready."
          />
        )}

      {hasKybBlocker && (
        <PayoutAlertBanner
          title="Verification Required"
          description="Complete NGN business verification before enabling payouts."
          action={
            <Button
              width="fit"
              className="px-5 py-2.5 h-10 rounded-full whitespace-nowrap"
              onClick={() => setShowVerification(true)}
            >
              Complete Verification
            </Button>
          }
        />
      )}

      {showMissingWalletState && (
        <PayoutAlertBanner
        tone="warning"
          title="NGN Wallet Required"
          description="Create and activate an NGN wallet before enabling payouts."
        />
      )}

      {isDrift && (
        <PayoutAlertBanner
          tone="danger"
          title="Payout configuration needs attention"
          description="Payouts are enabled but the current configuration is no longer valid. Resolve the issues below to keep automated payouts running."
        />
      )}

      {isBlockedWallet && (
        <PayoutAlertBanner
          tone="danger"
          title="Payouts temporarily blocked, your source wallet is frozen."
          description="Automated NGN payouts are suspended. Complete unresolved requests or contact help."
          action={
            <Button
              variant="tertiary"
              width="fit"
              className="px-5 py-2.5 h-10 rounded-full border border-[#DC180D] text-[#DC180D] whitespace-nowrap"
              onClick={() => window.open("mailto:support@raiz.co", "_blank")}
            >
              Contact Support
            </Button>
          }
        />
      )}

      <div className="p-4 md:p-8 bg-[#FCFCFD] rounded-[20px] border border-raiz-gray-100 flex flex-col gap-6 ">
        {settings.enabled && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6 rounded-2xl bg-[#F8F7FA]">
            <div
              className={`flex flex-col gap-1.5 max-w-[680px] ${
                showMissingWalletState ? "text-[#A89AB9]" : ""
              }`}
            >
              <h3
                className={`text-base font-bold ${
                  showMissingWalletState
                    ? "text-[#A89AB9]"
                    : "text-raiz-gray-950"
                }`}
              >
                NGN Virtual Payouts
              </h3>
              <p
                className={`text-[13px] ${
                  showMissingWalletState
                    ? "text-[#A89AB9]"
                    : "text-raiz-gray-600"
                }`}
              >
                {showMissingWalletState
                  ? "Allow API-driven NGN payout requests for your business. (Verification completed, wallet required)"
                  : "Allow API-driven NGN payout requests for your business. Merchant payout requests happen on Gateway using the API keys you generate."}
              </p>
            </div>
            <ToggleSwitch
              checked={form.enabled}
              onChange={handleEnableToggle}
              disabled={!canToggleEnable}
              checkedColor="#4B0082"
            />
          </div>
        )}

        {!isPrimary && !showMissingWalletState && (
          <p className="text-sm text-raiz-gray-600">
            Only the primary business user can update payout settings.
          </p>
        )}

        {showMissingWalletState ? (
          <div className="rounded-2xl border border-[#E4E0EA] bg-[#FCFCFD] p-5 md:p-6 flex flex-col gap-5">
            <h4 className="text-base font-bold text-raiz-gray-950">
              NGN Wallet Setup
            </h4>

            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E4E0EA]">
              <div className="flex items-center gap-3 min-w-0">
                <HiOutlineDocumentText
                  className="size-5 shrink-0 text-[#443852]"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-[#443852]">
                  {ngnWallet
                    ? "NGN wallet is not completed"
                    : "No NGN wallet found"}
                </p>
              </div>
              <StatusBadge label="Setup Required" tone="outline" />
            </div>

            <p className="text-sm text-[#443852] leading-5">
              You need a completed NGN virtual account to fund payouts. Create
              one from your accounts page.
            </p>

            {canEdit && (
              <div className="pt-3">
                <Button
                  width="fit"
                  className="px-6 py-3 h-auto rounded-full"
                  onClick={() => setShowCreateWallet(true)}
                >
                  Create NGN Wallet →
                </Button>
              </div>
            )}
          </div>
        ) : (
          // blockers.length > 0 && (
          //   <div className="rounded-xl border border-raiz-gray-100 bg-white p-4">
          //     <p className="text-sm font-bold text-raiz-gray-950 mb-2">
          //       Setup requirements
          //     </p>
          //     <ul className="flex flex-col gap-2">
          //       {blockers.map((blocker) => (
          //         <li
          //           key={blocker}
          //           className="text-sm text-raiz-gray-600 flex items-start gap-2"
          //         >
          //           <span className="mt-1.5 size-1.5 rounded-full bg-[#F2A735] shrink-0" />
          //           {NGN_PAYOUT_BLOCKER_COPY[blocker] ?? blocker}
          //         </li>
          //       ))}
          //     </ul>
          //   </div>
          // )
          null
        )}

        {showCompactActiveView && (
          <>
            <div className="rounded-2xl border border-raiz-gray-100 bg-white p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-bold text-raiz-gray-950">
                  System Status
                </h4>
                {settings.updated_at && (
                  <span className="text-xs text-raiz-gray-500">
                    Last updated: {formatLastUpdated(settings.updated_at)}
                  </span>
                )}
              </div>

              <div className="rounded-xl bg-[#F8F7FA] p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-[#3C2875] text-white flex items-center justify-center font-bold">
                    N
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[15px] font-bold text-raiz-gray-950">
                        {selectedWallet?.wallet_name || "Raiz NGN Wallet"}
                      </p>
                      <StatusBadge label="Active" tone="success" />
                    </div>
                    <p className="text-[13px] text-raiz-gray-600">
                      Account Number: {selectedWallet?.account_number || "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-raiz-gray-500">Available Balance</p>
                  <p className="text-lg font-bold text-raiz-gray-950">
                    {getCurrencySymbol("NGN")}
                    {formatAmount(selectedWallet?.account_balance ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-raiz-gray-500">Transaction Limits</p>
                  <p className="text-sm  text-raiz-gray-950">
                    {formatLimitDisplay(form.perTransactionLimit) || "—"} / txn ·{" "}
                    {formatLimitDisplay(form.dailyLimit) || "—"} daily
                  </p>
                </div>
                <div>
                  <p className="text-xs text-raiz-gray-500">Approvals</p>
                  <p className="text-sm  text-raiz-gray-950">
                    {form.manualApprovalEnabled
                      ? `Required above ${formatLimitDisplay(form.manualApprovalThreshold)}`
                      : "Not required"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onManageWebhooks}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <p className="text-xs text-raiz-gray-500">Webhook Status</p>
                  <p className="text-sm  text-raiz-gray-950">
                    {primaryWebhook?.is_active ? "Active" : "Not configured"}
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "Configure Payouts",
                  icon: "/icons/empty-wallet.svg",
                  action: () => setShowFullForm(true),
                },
                {
                  title: "View Payout Logs",
                  icon: "/icons/more-2.svg",
                  action: () => setShowLogs(true),
                },
                {
                  title: "Manage API Keys",
                  icon: "/icons/key.svg",
                  action: onManageApiKeys,
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  className="flex items-center justify-between gap-3 p-5 rounded-xl border border-[#E4E0EA] bg-[#FCFCFD] hover:border-[#7F56D9] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center size-[38px] rounded-[10px] bg-[#EAECFF] shrink-0">
                      <Image
                        src={item.icon}
                        alt=""
                        width={18}
                        height={18}
                        className="size-[18px]"
                      />
                    </span>
                    <p className="text-[15px] font-bold text-raiz-gray-950">
                      {item.title}
                    </p>
                  </div>
                  <Image
                    src="/icons/arrow-right.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="size-[18px] shrink-0"
                  />
                </button>
              ))}
            </div>
          </>
        )}

        {/* {!showCompactActiveView &&
          !showMissingWalletState &&
          !settings.enabled &&
          !settings.can_enable &&
          !hasKybBlocker &&
          !hasWalletBlocker && (
          <div className="flex flex-col gap-3">
            <PayoutPreviewRow
              title="Source Wallet"
              description="Link and choose the virtual wallet that funds all outgoing automated payouts."
            />
            <PayoutPreviewRow
              title="Payout Limits"
              description="Set up per-transaction and daily NGN ceilings for your business."
            />
            <PayoutPreviewRow
              title="Manual Approval"
              description="Configure manual security thresholds that require high-tier team review."
            />
            <PayoutPreviewRow
              title="Allowed Destinations"
              description="Restrict NGN payouts to approved Nigerian bank accounts."
            />
            <PayoutPreviewRow
              title="Webhooks"
              description="Receive instant API callbacks for created, failed, and reversed payouts."
            />
          </div>
        )} */}

        {!showCompactActiveView &&
          !showMissingWalletState &&
          (settings.can_enable || settings.enabled || showFullForm) && (
          <div className="flex flex-col gap-3">
            <section className="rounded-2xl bg-[#FCFCFD] p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-raiz-gray-950 capitalize">
                Source Wallet
              </h4>
              {eligibleWallets.length > 1 && (
                <SelectField
                  options={walletOptions}
                  value={selectedWalletOption}
                  onChange={(option) =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            sourceWalletId: option?.value?.toString() ?? null,
                          }
                        : prev,
                    )
                  }
                  placeholder="Select source wallet"
                  disabled={!canEdit}
                />
              )}
              {selectedWallet ? (
                <div className="rounded-xl bg-[#F8F7FA] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0px_1px_2px_rgba(16,24,40,0.05)]">
                  <div className="flex items-center gap-4 min-w-0">
                    <Image
                      src="/icons/ngn.svg"
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 shrink-0"
                    />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] font-bold text-raiz-gray-950">
                          {selectedWallet.wallet_name || "Raiz NGN Wallet"}
                        </p>
                        <StatusBadge
                          label={
                            isWalletBlockedForPayouts(
                              selectedWallet,
                              settings.source_wallet_status,
                            )
                              ? "Blocked"
                              : "Active"
                          }
                          tone={
                            isWalletBlockedForPayouts(
                              selectedWallet,
                              settings.source_wallet_status,
                            )
                              ? "danger"
                              : "success"
                          }
                        />
                      </div>
                      <p className="text-[13px] text-raiz-gray-700">
                        Account Number: {selectedWallet.account_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 md:items-end shrink-0">
                    <p className="text-xs text-raiz-gray-600">
                      Available Balance
                    </p>
                    <p className="text-[18px] font-bold text-raiz-gray-950">
                      {isWalletBlockedForPayouts(
                        selectedWallet,
                        settings.source_wallet_status,
                      )
                        ? "Frozen"
                        : `${getCurrencySymbol("NGN")}${formatAmount(selectedWallet.account_balance)}`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-raiz-gray-600">
                  No completed usable NGN wallet is available.
                </p>
              )}
            </section>

            <section className="rounded-2xl bg-[#FCFCFD] p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-raiz-gray-950 capitalize">
                Payout Limits
              </h4>

              <div className="bg-[#F8F7FA] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] font-semibold text-raiz-gray-700">
                    Business Tier ceiling
                  </p>
                  <p className="text-[13px] text-[#A89AB9]">
                    Your current limits are within the allowed business tier
                    ceiling.
                  </p>
                </div>
                {user?.business_account?.entity?.wallet_tier && (
                  <div className="flex flex-wrap gap-5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-raiz-gray-600">
                        Per transaction
                      </span>
                      <span className="text-sm font-bold text-raiz-gray-950">
                        {formatWholeNaira(
                          user.business_account.entity.wallet_tier.naira_limit,
                        ) || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-raiz-gray-600">
                        Monthly
                      </span>
                      <span className="text-sm font-bold text-raiz-gray-950">
                        {formatWholeNaira(
                          user.business_account.entity.wallet_tier
                            .monthly_naira_limit,
                        ) || "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-[#E4E0EA] rounded-xl p-4 flex flex-col gap-2.5">
                  <label className="text-[13px] font-semibold text-raiz-gray-700">
                    Per-Transaction Limit
                  </label>
                  <InputField
                    name="perTransactionLimit"
                    value={formatWholeNaira(form.perTransactionLimit)}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              perTransactionLimit: sanitizeAmountInput(
                                event.target.value,
                              ),
                            }
                          : prev,
                      )
                    }
                    placeholder="₦500,000"
                    disabled={!canEdit}
                    className="!h-11 !bg-[#F3F1F6] !border-transparent"
                  />
                </div>
                <div className="bg-white border border-[#E4E0EA] rounded-xl p-4 flex flex-col gap-2.5">
                  <label className="text-[13px] font-semibold text-raiz-gray-700">
                    Daily Limit
                  </label>
                  <InputField
                    name="dailyLimit"
                    value={formatWholeNaira(form.dailyLimit)}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              dailyLimit: sanitizeAmountInput(
                                event.target.value,
                              ),
                            }
                          : prev,
                      )
                    }
                    placeholder="₦2,000,000"
                    disabled={!canEdit}
                    className="!h-11 !bg-[#F3F1F6] !border-transparent"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-[#FCFCFD] p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-raiz-gray-950 capitalize">
                Manual Approval Settings
              </h4>
              <div className="rounded-xl bg-[#F8F7FA] p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <p className="text-[15px] font-bold text-raiz-gray-950">
                    Require manual approval for large payouts
                  </p>
                  <p className="text-[13px] text-[#A89AB9]">
                    Require approval for payouts above{" "}
                    {formatLimitDisplay(form.manualApprovalThreshold) ||
                      "the configured threshold"}
                    . Primary business users can approve pending payouts.
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <InputField
                    name="manualApprovalThreshold"
                    value={
                      thresholdFocused
                        ? form.manualApprovalThreshold
                        : formatLimitDisplay(form.manualApprovalThreshold)
                    }
                    onFocus={() => setThresholdFocused(true)}
                    onBlur={() => setThresholdFocused(false)}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              manualApprovalThreshold: sanitizeAmountInput(
                                event.target.value,
                              ),
                            }
                          : prev,
                      )
                    }
                    placeholder="₦250,000.00"
                    disabled={!canEdit || !form.manualApprovalEnabled}
                    className="!h-[34px] !w-[140px] !bg-[#F3F1F6] !border-transparent !text-sm !text-[#A89AB9] !py-0"
                  />
                  <ToggleSwitch
                    checked={form.manualApprovalEnabled}
                    onChange={(checked) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, manualApprovalEnabled: checked }
                          : prev,
                      )
                    }
                    disabled={!canEdit}
                    checkedColor="#4B0082"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-[#FCFCFD] p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-raiz-gray-950 capitalize">
                Allowed Destinations
              </h4>
              <div className="rounded-xl bg-[#F8F7FA] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex items-center justify-center size-6 rounded-full bg-[#E2F0D9] shrink-0">
                    <Image
                      src="/icons/check-green.svg"
                      alt=""
                      width={14}
                      height={14}
                      className="size-3.5"
                    />
                  </span>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-sm font-semibold text-raiz-gray-950">
                      Nigerian Bank Accounts (NGN Local)
                    </p>
                    <p className="text-[13px] text-[#A89AB9]">
                      Recognized Raiz/PalmPay accounts may process faster.
                    </p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-[#E2F0D9] text-[11px] font-bold text-[#39A062] whitespace-nowrap shrink-0">
                  Enabled
                </span>
              </div>
            </section>

            {canEdit && (
              <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-0 z-30 -mx-4 md:-mx-8 mt-2 bg-[#FCFCFD]/95 backdrop-blur-sm border-t border-raiz-gray-100 px-4 md:px-8 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  variant="tertiary"
                  width="fit"
                  className="px-6 py-2.5 h-10 rounded-full"
                  onClick={handleCancel}
                  disabled={isSaving || (!hasChanges && !settings.enabled)}
                >
                  Cancel
                </Button>
                <Button
                  width="fit"
                  className="px-6 py-2.5 h-10 rounded-full"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={
                    (!hasChanges && settings.enabled) || !!validateForm()
                  }
                >
                  {settings.enabled ? "Save Settings" : "Enable Payouts"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateWallet && (
        <CenterModalWrapper close={() => setShowCreateWallet(false)}>
          <CreateNgnAcct
            close={() => {
              setShowCreateWallet(false);
              queryClient.invalidateQueries({ queryKey: ["user"] });
              queryClient.invalidateQueries({
                queryKey: ["ngn-payout-settings"],
              });
            }}
          />
        </CenterModalWrapper>
      )}

      {showVerification && (
        <CenterModalWrapper close={() => setShowVerification(false)}>
          <div className="max-h-[85vh] overflow-y-auto">
            <AccountUpgrade />
          </div>
        </CenterModalWrapper>
      )}

      {showLogs && <PayoutLogsModal close={() => setShowLogs(false)} />}

      {showEnableConfirm && form && (
        <EnablePayoutConfirmModal
          close={() => !isSaving && setShowEnableConfirm(false)}
          onConfirm={handleConfirmEnable}
          isSaving={isSaving}
          sourceWallet={selectedWallet?.wallet_name || "Raiz NGN Wallet"}
          perTransactionLimit={
            formatLimitDisplay(form.perTransactionLimit) || "—"
          }
          dailyLimit={formatLimitDisplay(form.dailyLimit) || "—"}
          manualApproval={
            form.manualApprovalEnabled
              ? `Above ${formatLimitDisplay(form.manualApprovalThreshold)}`
              : "Not required"
          }
        />
      )}

    </div>
  );
};

export default NgnPayoutSettings;
