"use client";

import React, { useMemo, useState } from "react";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import InputField from "@/components/ui/InputField";
import SelectField, { Option } from "@/components/ui/SelectField";
import Checkbox from "@/components/ui/Checkbox";
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

interface Props {
  close: () => void;
}

const ENVIRONMENTS: Option[] = [
  { value: "production", label: "Live" },
  { value: "sandbox", label: "Test/Sandbox" },
];

const CreateKeysModal = ({ close }: Props) => {
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

  const { data: permissionOptions = [], isLoading: isPermissionsLoading } =
    useQuery({
      queryKey: ["developer-permissions"],
      queryFn: FetchDeveloperPermissionsApi,
    });

  const groupedPermissions = useMemo(() => {
    return permissionOptions.reduce<Record<string, typeof permissionOptions>>(
      (groups, permission) => {
        const group = permission.group || "Other";
        if (!groups[group]) groups[group] = [];
        groups[group].push(permission);
        return groups;
      },
      {},
    );
  }, [permissionOptions]);

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
    if (checked) {
      setPermissions((prev) => [...prev, id]);
    } else {
      setPermissions((prev) => prev.filter((p) => p !== id));
    }
  };

  const handleContinue = () => {
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
      <CenterModalHeader close={close} />
      <div className="w-full xl:max-h-[85vh] lg:max-h-[80vh] flex flex-col font-brSonoma">
        <h2 className="mb-6 text-base md:text-xl font-bold text-raiz-gray-950">
          Generate new API key
        </h2>

        <div className="bg-raiz-gray-50 rounded-[20px] flex flex-col flex-1 overflow-y-auto no-scrollbar gap-6 p-1 sm:p-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-raiz-gray-950">
              Key Name
            </label>
            <InputField
              name="keyName"
              placeholder="Enter a name that describes how this key will be used"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 relative z-20">
            <label className="text-sm font-semibold text-raiz-gray-950">
              Environment
            </label>
            <SelectField
              options={ENVIRONMENTS}
              value={environment}
              onChange={setEnvironment}
              placeholder="Select environment"
            />
          </div>

          <div className="flex flex-col gap-2 relative z-10">
            <label className="text-sm font-semibold text-raiz-gray-950">
              Expiration
            </label>
            <InputField
              name="expiration"
              type="datetime-local"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              min={dayjs().format("YYYY-MM-DDTHH:mm")}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-raiz-gray-950">
              Permissions
            </label>
            {isPermissionsLoading ? (
              <Skeleton count={4} height={72} className="mb-2" />
            ) : (
              Object.entries(groupedPermissions).map(([group, items]) => (
                <div key={group} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-raiz-gray-500">
                    {group}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => {
                      const isChecked = permissions.includes(item.key);
                      return (
                        <div
                          key={item.key}
                          className={`flex items-start gap-3 p-4 rounded-xl transition-colors cursor-pointer hover:bg-raiz-gray-200 ${!isChecked ? "bg-raiz-gray-100" : "bg-[#EAECFF99]"}`}
                          onClick={() => togglePermission(item.key, !isChecked)}
                        >
                          <div className="mt-0.5">
                            <Checkbox
                              checked={isChecked}
                              onChange={(checked) =>
                                togglePermission(item.key, checked)
                              }
                            />
                          </div>
                          <div className="flex flex-col select-none">
                            <span className="text-[13px] font-semibold text-raiz-gray-950 leading-tight mb-1">
                              {item.label}
                            </span>
                            <span className="text-[13px] text-raiz-gray-600 leading-tight">
                              {item.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 pt-4">
          <Button loading={isPending} onClick={handleContinue} className="py-4">
            Continue
          </Button>
        </div>
      </div>

      {showAPIDetailModal && APIKey && (
        <NewAPIkeyModal data={APIKey} close={close} />
      )}
    </>
  );
};

export default CreateKeysModal;
