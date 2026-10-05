"use client";

import React, { useState } from "react";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import InputField from "@/components/ui/InputField";
import SelectField, { Option } from "@/components/ui/SelectField";
import Button from "@/components/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FetchDeveloperPermissionsApi,
  GenerateAPIKeys,
} from "@/services/developers";
import { toast } from "sonner";
import dayjs from "dayjs";
import NewAPIkeyModal from "./NewAPIkeyModal";
import { IDeveloperApiKey } from "@/types/services";
import { pushDataLayerEvent } from "@/utils/analytics/dataLayer";
import Skeleton from "react-loading-skeleton";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { canRequestScope, isProductionDeployment } from "@/lib/permissions";
import {
  TeamError,
  TeamIcon,
  ownerBadge,
  scopeSwitch,
  teamSurface,
} from "@/components/team/TeamUI";

interface Props {
  close: () => void;
  fullPage?: boolean;
}

const ENVIRONMENTS: Option[] = [
  { value: "production", label: "Live" },
  { value: "sandbox", label: "Test/Sandbox" },
];

const CreateKeysModal = ({ close, fullPage = false }: Props) => {
  const { role, canManageDeveloperTools } = usePermissions();
  const production = isProductionDeployment(
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV,
  );
  const restricted = role === "developer" && production;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<Option | null>(
    ENVIRONMENTS[0],
  );
  const [expiration, setExpiration] = useState<string>(
    dayjs().add(1, "year").format("YYYY-MM-DDTHH:mm"),
  );
  const [permissions, setPermissions] = useState<string[]>([]);
  const [showAPIDetailModal, setShowAPIDetailModal] = useState(false);
  const [APIKey, setAPIKey] = useState<IDeveloperApiKey | null>(null);

  const {
    data: permissionOptions = [],
    isLoading: isPermissionsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["developer-permissions"],
    queryFn: FetchDeveloperPermissionsApi,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: GenerateAPIKeys,
    onSuccess: (res, variables) => {
      toast.success("API key generated successfully");
      queryClient.invalidateQueries({ queryKey: ["developer-keys"] });
      setShowAPIDetailModal(true);
      setAPIKey(res);
      pushDataLayerEvent("api_key_generated", {
        key_environment:
          variables.environment === "production" ? "live" : "test",
      });
    },
  });

  const togglePermission = (id: string, checked: boolean) => {
    if (!canRequestScope(role, id, production)) return;
    if (checked) {
      setPermissions((prev) => [...prev, id]);
    } else {
      setPermissions((prev) => prev.filter((p) => p !== id));
    }
  };

  const handleContinue = () => {
    if (!canManageDeveloperTools || isPending) return;
    if (permissions.some((scope) => !canRequestScope(role, scope, production)))
      return toast.error("Your role cannot request these scopes.");
    if (!name.trim()) return toast.warning("Key Name is required");
    if (!environment) return toast.warning("Environment is required");
    if (!expiration) return toast.warning("Expiration is required");
    if (permissions.length === 0)
      return toast.warning("Please select at least one permission");

    const parsedExp = dayjs(expiration);
    if (!parsedExp.isValid()) return toast.warning("Invalid expiration date");
    if (parsedExp.isBefore(dayjs()))
      return toast.warning("Expiration must be in the future");

    mutate({
      name: name.trim(),
      environment: environment.value.toString(),
      permissions,
      expires_at: parsedExp.toISOString(),
    });
  };

  return (
    <>
      {!fullPage && <CenterModalHeader close={close} />}
      <section className={`${teamSurface} py-6`}>
        <div className="flex justify-between gap-4 mb-10">
          <div>
            <h1 className="text-[23px] font-bold">
              Create{" "}
              {environment?.value === "production" ? "production" : "sandbox"}{" "}
              API key
            </h1>
            <p className="text-[13px] text-raiz-gray-600 mt-1">
              Choose the least access this key needs. You can revoke it at any
              time.
            </p>
          </div>
          <span className={`${ownerBadge} capitalize self-start`}>{role}</span>
        </div>
        <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] gap-5 items-start">
          <div className="bg-white rounded-2xl p-[22px] flex flex-col gap-4">
            <span className="rounded-full bg-[#f6f1fc] p-3 self-start">
              <TeamIcon name="key" />
            </span>
            <label className="text-xs font-semibold">
              Key name
              <InputField
                name="keyName"
                placeholder="Production checkout"
                className="!bg-white !border-[#e4e0ea]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </label>
            <div>
              <label className="text-xs font-semibold">Environment</label>
              <SelectField
                options={ENVIRONMENTS}
                value={environment}
                onChange={setEnvironment}
                placeholder="Select environment"
              />
            </div>
            <label className="text-xs font-semibold">
              Expiration
              <InputField
                name="expiration"
                type="datetime-local"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                min={dayjs().format("YYYY-MM-DDTHH:mm")}
                disabled={isPending}
              />
            </label>
            {restricted && (
              <div className="bg-[#fffaeb] rounded-[10px] p-[14px] flex gap-2 text-xs">
                <TeamIcon name="restriction" />
                <div>
                  <strong className="text-[#b54708]">
                    Developer restriction
                  </strong>
                  <p className="mt-1 leading-relaxed">
                    Developers cannot add money-moving scopes to production
                    keys. Ask an owner or admin to create this key.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl p-[22px]">
            <h2 className="font-bold">API scopes</h2>
            <p className="text-[11px] text-raiz-gray-600 mb-3">
              {restricted
                ? "Read and Gateway tools are available. Money movement is disabled."
                : "Select the permissions this key needs."}
            </p>
            {isPermissionsLoading ? (
              <Skeleton count={5} height={64} />
            ) : isError ? (
              <TeamError retry={() => void refetch()}>
                Unable to load API scopes.
              </TeamError>
            ) : (
              permissionOptions.map((item) => {
                const disabled = !canRequestScope(role, item.key, production);
                const checked = !disabled && permissions.includes(item.key);
                return (
                  <label
                    key={item.key}
                    className={`border-t border-[#e4e0ea] py-3 flex items-center gap-3 ${disabled ? "text-[#8f829e]" : "cursor-pointer"}`}
                  >
                    <div className="flex-1">
                      <span className="text-xs font-bold">{item.label}</span>
                      {disabled && (
                        <span className="ml-2 text-[10px] bg-[#eeeaf2] rounded-full px-2 py-1">
                          Restricted
                        </span>
                      )}
                      <p className="text-[11px] mt-1 text-raiz-gray-600">
                        {item.description}
                      </p>
                      {disabled && (
                        <p className="text-[10px] mt-1">
                          Owner or admin required in production.
                        </p>
                      )}
                    </div>
                    {disabled && <TeamIcon name="scope-lock" />}
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label={item.label}
                      checked={checked}
                      disabled={disabled || isPending}
                      onChange={(e) =>
                        togglePermission(item.key, e.target.checked)
                      }
                      className={scopeSwitch}
                    />
                  </label>
                );
              })
            )}
            <div className="flex gap-3 mt-5">
              <Button
                onClick={close}
                disabled={isPending}
                className="!bg-[#f3eff7] !text-[#443852]"
              >
                Cancel
              </Button>
              <Button
                loading={isPending}
                disabled={
                  !canManageDeveloperTools ||
                  isPermissionsLoading ||
                  isError ||
                  !permissions.length ||
                  !name.trim()
                }
                onClick={handleContinue}
              >
                Create API key
              </Button>
            </div>
          </div>
        </div>
      </section>

      {showAPIDetailModal && APIKey && (
        <NewAPIkeyModal data={APIKey} close={close} />
      )}
    </>
  );
};

export default CreateKeysModal;
